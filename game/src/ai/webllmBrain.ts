/**
 * WebLLM-backed NPC brain — Qwen2.5-0.5B running in the browser via WebGPU.
 *
 * This is the ONLY file allowed to import @mlc-ai/web-llm — the NPCBrain
 * boundary (CHARTER §Stack) keeps inference swappable for native mobile.
 *
 * Behavior is progressive + safe: the model loads lazily on first respond()
 * and only in the browser (dynamic import, code-split). Until it's ready —
 * or if WebGPU/the model are unavailable — respond() returns the canned
 * fallback immediately. respond() never throws and never blocks the dialog.
 */

import { cannedReply, moodFromTraits, PRICKLY_MAX, EFFUSIVE_MIN, type NPCBrain, type NPCContext, type Observation, type Reply } from './brain';
import { describePersonality } from './personality';
import { currentModel } from './deviceProbe';
import { INTENT_KINDS, type IntentDraft, type IntentKind } from './intent';
import { PARK_LORE } from './persona';

/**
 * Parse a raw model reply into an intent draft (BACKLOG-393): the first closed-set kind word found
 * (case-insensitive) wins; the note is whatever follows it, stripped of leading punctuation. No
 * kind word → null, and the caller keeps the procedural intent. Pure, unit-pinned.
 */
export function parseIntentDraft(raw: string): IntentDraft | null {
  const text = raw.trim();
  if (!text) return null;
  const lower = text.toLowerCase();
  let kind: IntentKind | null = null;
  let at = -1;
  for (const k of INTENT_KINDS) {
    const i = lower.indexOf(k);
    if (i !== -1 && (at === -1 || i < at)) {
      kind = k;
      at = i;
    }
  }
  if (!kind) return null;
  const note = text
    .slice(at + kind.length)
    .replace(/^[\s—–\-:,.]+/, '')
    .split('\n')[0]
    .trim();
  return { kind, note };
}

/** Describe the player's standing with the dino from their friendship hearts. */
export function relationshipLabel(affection?: number): string {
  const a = affection ?? 0;
  if (a >= 7) return 'a dear friend you adore';
  if (a >= 3) return 'a good friend';
  if (a >= 1) return 'an acquaintance';
  return 'a stranger you just met';
}

export type BrainStatus = 'idle' | 'loading' | 'ready' | 'fallback';

/** Minimal OpenAI-style shape we use from MLCEngine — avoids leaking web-llm types outward. */
export interface ChatEngine {
  chat: {
    completions: {
      create(req: {
        messages: { role: string; content: string }[];
        max_tokens?: number;
        temperature?: number;
        /** WebLLM extension: enable_thinking=false suppresses Qwen3+ thinking tokens. */
        extra_body?: { enable_thinking?: boolean | null };
      }): Promise<{ choices: { message: { content: string | null } }[] }>;
    };
  };
}

export type EngineLoader = () => Promise<ChatEngine>;

const MAX_REPLY = 200;

const OBSERVATION_PROMPT: Record<Observation['kind'], string> = {
  player_approach: 'A human visitor walks toward you. React in one short line.',
  player_greet: 'A human visitor walks up and greets you. What do you say back?',
  world_event: 'Something just happened nearby. React in one short line.',
  npc_meet: 'Another dinosaur wanders over. Greet them in one short line.',
};

/** Pure: build the chat messages from context + observation. No web-llm import. */
export function buildMessages(ctx: NPCContext, obs: Observation): { role: string; content: string }[] {
  // Use BOTH the hand-written roster flavor and the seeded trait adjectives — the
  // flavor ("loves rocks", "quick to bolt") is what makes a dino sound like itself.
  const adjectives = ctx.traits ? describePersonality(ctx.traits) : '';
  const character = [ctx.personality, adjectives].filter(Boolean).join('; ');
  const when = ctx.timeOfDay ? `It is ${ctx.timeOfDay}. ` : '';
  const mood = moodFromTraits(ctx.traits) ?? 'neutral';
  const rel = relationshipLabel(ctx.affection);
  const lately = ctx.recentMemory?.length ? `Lately: ${ctx.recentMemory.slice(-3).join('; ')}. ` : '';
  // BACKLOG-247: a just-cleared dino is grateful and wants to name who set its record straight.
  // Temperament colours how: a prickly dino grumbles it (BACKLOG-253), a warm one gushes (BACKLOG-261),
  // an even-tempered one says it plain.
  const manner =
    ctx.traits && ctx.traits.agreeableness < PRICKLY_MAX
      ? `You'd never gush about it — say your thanks gruffly, almost grudgingly. `
      : ctx.traits && ctx.traits.agreeableness > EFFUSIVE_MIN
        ? `You can't thank them enough — gush about it, warm and effusive. `
        : '';
  const grateful = ctx.gratitude
    ? `You're grateful: ${ctx.gratitude} cleared your name around the park after a rough spell, and you want to say so. ${manner}`
    : '';
  // BACKLOG-271: a neglected dino (rock-bottom friendship, nothing to be grateful for) opens wistfully —
  // the affection-pole counterpart of the gratitude register. Never fires when there's gratitude to give.
  const wistful =
    !ctx.gratitude && ctx.affection !== undefined && ctx.affection <= 1
      ? `The keeper almost never visits you and you barely know them — greet them wistfully, hoping to be noticed, unsure they even remember you. `
      : '';
  // BACKLOG-272: a close dino opens warmly — the warm pole of the wistful greeting. Mutually exclusive
  // with `wistful` (≤1 vs ≥8 hearts can't overlap).
  const fond =
    !ctx.gratitude && ctx.affection !== undefined && ctx.affection >= 8
      ? `This keeper is a dear, familiar friend — greet them warmly and gladly, like someone you've missed. ` +
        // BACKLOG-276: deep friendship earns the keeper's name — a fond dino greets the observer by designation.
        (ctx.keeperName ? `Greet them by name — call them ${ctx.keeperName}. ` : '')
      : '';
  // BACKLOG-368: a dino over the need threshold is hungry — let it colour the line (the canned fallback
  // already carries the deterministic tell, so behavior never depends on the model reaching this).
  const hungry = ctx.hungry ? `You are hungry right now — let it slip into whatever you say. ` : '';
  // Positive-led: vivid character first, one light anti-assistant clause, room for color.
  const system =
    `You are ${ctx.name}, a ${ctx.species} dinosaur with big feelings and strong opinions, living in a lively prehistoric park. ` +
    `You are a real animal, never a chatbot or helper. ` +
    `Who you are: ${character}. ` +
    `${when}You feel ${mood}, and the visitor is ${rel}. ` +
    `${lately}${grateful}${wistful}${fond}${hungry}` +
    `Answer in your own voice — one or two vivid, specific sentences about what you notice, want, or feel. ` +
    `First person, present tense, no narration and no quotation marks.`;
  // One-shot example anchors the small model to lively in-character speech (style, not content).
  const exampleUser = 'A human visitor walks up and greets you. What do you say?';
  const exampleReply = 'Oh, you again! Did you bring me a shiny rock, or just those slow human feet?';
  const greetLine =
    obs.kind === 'player_greet'
      ? `${rel.replace(/^a /, 'A ').replace(/^an /, 'An ')} walks up and greets you. What do you say?`
      : OBSERVATION_PROMPT[obs.kind];
  const user = greetLine + (obs.detail ? ` (${obs.detail})` : '');
  return [
    { role: 'system', content: system },
    { role: 'user', content: exampleUser },
    { role: 'assistant', content: exampleReply },
    { role: 'user', content: user },
  ];
}

const WRAP_QUOTES = /^["'“”‘’\s]+|["'“”‘’\s]+$/g;
// Throat-clearing fillers an instruct model tacks on the front (only as a leading word).
const LEADING_FILLER = /^(sure|of course|certainly|absolutely|well|okay|ok)[,!.]?\s+/i;
// Assistant-voice tells — any sentence containing these is dropped, never shown.
const ASSISTANT_TELL =
  /\b(as an ai|i'?m an ai|i am an ai|how (can|may) i (assist|help)|here to (assist|help)|assist you today|happy to help|how can i help you)\b/i;

// Qwen3+ thinking block. enable_thinking:false makes WebLLM prepend an EMPTY one
// to the response; a model may also emit a populated one — drop either entirely.
const THINK_BLOCK = /^\s*<think>[\s\S]*?<\/think>\s*/i;

/** Strip assistant boilerplate + quotes; return up to the first two in-character sentences (≤200). */
export function cleanReply(raw: string, maxSentences = 2): string {
  let s = (raw ?? '').replace(THINK_BLOCK, '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  s = s.replace(WRAP_QUOTES, '');
  s = s.replace(LEADING_FILLER, '').trim();
  const sentences = s.match(/[^.!?]+[.!?]?/g) ?? [s];
  const kept: string[] = [];
  for (const sentence of sentences) {
    const t = sentence.trim().replace(WRAP_QUOTES, '').trim();
    if (!t || ASSISTANT_TELL.test(t)) continue; // skip assistant-voice sentences, keep the rest
    kept.push(t);
    if (kept.length >= maxSentences) break;
  }
  // The token cap can stop generation mid-sentence, leaving a dangling fragment
  // ("…it sometimes j"). With a complete sentence already in hand, drop the stump;
  // a lone fragment is kept below but marked as trailing off.
  if (kept.length > 1 && !/[.!?]$/.test(kept[kept.length - 1])) kept.pop();
  let out = kept.join(' ').trim();
  if (out.length > MAX_REPLY) {
    // Cut at a word boundary, never mid-word.
    const head = out.slice(0, MAX_REPLY - 1);
    const space = head.lastIndexOf(' ');
    out = (space > 40 ? head.slice(0, space) : head).trimEnd() + '…';
  } else if (out && !/[.!?…]$/.test(out)) {
    out += '…'; // an unfinished thought reads as the dino trailing off, not a glitch
  }
  return out; // '' if nothing survived → caller falls back
}

/**
 * Pure: the persona-authoring prompt (BACKLOG-103) — park lore + who the dino is, asking for a
 * short first-person self (backstory scrap, a want, a fear, a speech quirk). No web-llm import.
 */
export function buildPersonaMessages(ctx: NPCContext): { role: string; content: string }[] {
  const adjectives = ctx.traits ? describePersonality(ctx.traits) : '';
  const character = [ctx.personality, adjectives].filter(Boolean).join('; ');
  return [
    {
      role: 'system',
      content:
        `${PARK_LORE} ` +
        `You write the inner self of one dinosaur living there. Write 2 or 3 short sentences: ` +
        `a scrap of its backstory, one thing it wants, one thing it fears, and a small speech quirk. ` +
        `Plain prose in third person, no lists, no headings, no names of real products or people.`,
    },
    {
      role: 'user',
      content: `${ctx.name} the ${ctx.species}. Known character: ${character}.`,
    },
  ];
}

/** Model download/load progress 0..1 while status is 'loading' (for the brain HUD). */
let loadProgressValue = 0;
export function loadProgress(): number {
  return loadProgressValue;
}

/**
 * Cache management (operator, 2026-06-11): phone storage is small, so the keeper
 * can see and delete the cached weights. Dynamic imports keep web-llm out of the
 * entry bundle and out of Node tests; both helpers never throw.
 */
export async function hasCachedModel(): Promise<boolean> {
  try {
    const model = await currentModel();
    const webllm = await import('@mlc-ai/web-llm');
    return await webllm.hasModelInCache(model.id);
  } catch {
    return false;
  }
}

/** Delete this device's model from browser cache storage. True = gone (or never there). */
export async function deleteCachedModel(): Promise<boolean> {
  try {
    const model = await currentModel();
    const webllm = await import('@mlc-ai/web-llm');
    await webllm.deleteModelAllInfoInCache(model.id);
    return true;
  } catch (err) {
    console.error('[webllm] cache delete failed', err);
    return false;
  }
}

async function defaultLoader(): Promise<ChatEngine> {
  // No WebGPU → no point spawning a worker that can't run the model; fail fast to the fallback.
  if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
    throw new Error('WebGPU unavailable');
  }
  // Pick a model sized to the device (cycle 16; coarse devices clamped to tiny — governor).
  const model = await currentModel();
  (globalThis as unknown as { __modelLabel?: string }).__modelLabel = model.label;
  // Dynamic import keeps web-llm out of the entry bundle and out of Node tests.
  const webllm = await import('@mlc-ai/web-llm');
  // Run the engine in a dedicated worker so model load + inference don't block the render loop.
  const worker = new Worker(new URL('./webllm.worker.ts', import.meta.url), { type: 'module' });
  loadProgressValue = 0;
  return (await webllm.CreateWebWorkerMLCEngine(worker, model.id, {
    // A GB-class pull must not look like a frozen 🧠 — surface fetch progress to the HUD.
    initProgressCallback: (p: { progress?: number }) => {
      if (typeof p.progress === 'number') loadProgressValue = p.progress;
    },
  })) as unknown as ChatEngine;
}

export class WebLLMBrain implements NPCBrain {
  private _status: BrainStatus = 'idle';
  private engine: ChatEngine | null = null;
  private initStarted = false;
  private _lastSource: 'llm' | 'canned' | null = null;

  status(): BrainStatus {
    return this._status;
  }

  lastReplySource(): 'llm' | 'canned' | null {
    return this._lastSource;
  }

  /** Load the engine. Accepts an injectable loader for tests; defaults to the real WebLLM import. */
  async init(loader: EngineLoader = defaultLoader): Promise<void> {
    if (this.initStarted) return;
    this.initStarted = true;
    this._status = 'loading';
    try {
      this.engine = await loader();
      this._status = 'ready';
    } catch (err) {
      // No silent failures (CHARTER §Quality bar) — the game keeps working on the fallback path.
      // A missing/incompatible GPU is an expected environment limit (headless CI, GPU-less phone),
      // not a load failure: warn rather than error so it doesn't trip "error-free boot" e2e checks.
      const noGpu = /webgpu|compatible gpu/i.test(String(err));
      (noGpu ? console.warn : console.error)('[webllm] model load failed; using canned fallback', err);
      this._status = 'fallback';
    }
  }

  async respond(ctx: NPCContext, obs: Observation): Promise<Reply> {
    if (this._status === 'ready' && this.engine) {
      try {
        const reply = await this.generate(this.engine, ctx, obs);
        this._lastSource = reply.source ?? 'llm';
        return reply;
      } catch (err) {
        console.error('[webllm] generation failed; using canned fallback', err);
        this._lastSource = 'canned';
        return cannedReply(ctx);
      }
    }
    // Not ready yet: kick off loading once, and answer instantly from the fallback meanwhile.
    if (this._status === 'idle') void this.init();
    this._lastSource = 'canned';
    return cannedReply(ctx);
  }

  /**
   * Brain-biased intent (BACKLOG-393): ask the model for a one-word lean on the dino's day plus a
   * short in-voice note. Cheap (few tokens), strictly parsed against the closed kind set, and any
   * failure — not ready, throw, unparseable — returns null so the caller keeps the deterministic
   * procedural intent. Never kicks off a model load: an intent is ambience, not worth a download.
   */
  async intend(ctx: NPCContext): Promise<IntentDraft | null> {
    if (this._status !== 'ready' || !this.engine) return null;
    try {
      const res = await this.engine.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              `You choose how a dinosaur feels about its day. Reply with exactly one of: ` +
              `social, solitary, forage, restless — then a dash and a short note (under 8 words) in its voice.`,
          },
          {
            role: 'user',
            content: `${ctx.name} the ${ctx.species}. Personality: ${ctx.personality}.`,
          },
        ],
        max_tokens: 40,
        temperature: 0.9,
        extra_body: { enable_thinking: false },
      });
      return parseIntentDraft(res.choices[0]?.message?.content ?? '');
    } catch (err) {
      console.warn('[webllm] intent authoring failed; keeping procedural intent', err);
      return null;
    }
  }

  /**
   * Persona authoring (BACKLOG-103): one short self written from park lore. Only when the engine is
   * already ready — a persona is ambience, never worth triggering a model download. Any failure
   * (not ready, throw, nothing survives cleaning) returns null and the caller keeps the
   * deterministic procedural persona. Fired once per dino ever (the caller's generate-once cache).
   */
  async author(ctx: NPCContext): Promise<string | null> {
    if (this._status !== 'ready' || !this.engine) return null;
    try {
      const res = await this.engine.chat.completions.create({
        messages: buildPersonaMessages(ctx),
        max_tokens: 120,
        temperature: 0.9,
        extra_body: { enable_thinking: false },
      });
      return cleanReply(res.choices[0]?.message?.content ?? '', 3) || null;
    } catch (err) {
      console.warn('[webllm] persona authoring failed; keeping procedural persona', err);
      return null;
    }
  }

  private async generate(engine: ChatEngine, ctx: NPCContext, obs: Observation): Promise<Reply> {
    const res = await engine.chat.completions.create({
      messages: buildMessages(ctx, obs),
      max_tokens: 100,
      temperature: 0.9,
      // Qwen3.5 thinks by default; dialog is chitchat, so spend no tokens on it.
      // Thinking mode is reserved for big decisions once the action layer (104) lands.
      extra_body: { enable_thinking: false },
    });
    const cleaned = cleanReply(res.choices[0]?.message?.content ?? '');
    // Empty after cleaning means it was all assistant-speak — fall back rather than show it.
    if (!cleaned) return cannedReply(ctx);
    return { text: cleaned, mood: moodFromTraits(ctx.traits), source: 'llm' };
  }
}
