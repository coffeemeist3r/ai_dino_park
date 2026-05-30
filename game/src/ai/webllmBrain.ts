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

import { cannedReply, moodFromTraits, type NPCBrain, type NPCContext, type Observation, type Reply } from './brain';
import { describePersonality } from './personality';

export type BrainStatus = 'idle' | 'loading' | 'ready' | 'fallback';

/** Minimal OpenAI-style shape we use from MLCEngine — avoids leaking web-llm types outward. */
export interface ChatEngine {
  chat: {
    completions: {
      create(req: {
        messages: { role: string; content: string }[];
        max_tokens?: number;
        temperature?: number;
      }): Promise<{ choices: { message: { content: string | null } }[] }>;
    };
  };
}

export type EngineLoader = () => Promise<ChatEngine>;

const MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';
const MAX_REPLY = 200;

const OBSERVATION_PROMPT: Record<Observation['kind'], string> = {
  player_approach: 'A human visitor walks toward you. React in one short line.',
  player_greet: 'A human visitor walks up and greets you. What do you say back?',
  world_event: 'Something just happened nearby. React in one short line.',
  npc_meet: 'Another dinosaur wanders over. Greet them in one short line.',
};

/** Pure: build the chat messages from context + observation. No web-llm import. */
export function buildMessages(ctx: NPCContext, obs: Observation): { role: string; content: string }[] {
  const persona = ctx.traits ? describePersonality(ctx.traits) : ctx.personality;
  const system =
    `You are ${ctx.name}, a ${ctx.species} dinosaur living in a peaceful prehistoric park. ` +
    `You are NOT an AI assistant. You never offer help or services and you never ask how you can assist. ` +
    `You are a real creature with feelings; your personality is: ${persona}. ` +
    `Speak only as ${ctx.name}, in first person, as one short spoken sentence. No narration, no quotation marks, no helpfulness.`;
  // One-shot example anchors the small model to in-character speech (style, not content).
  const exampleUser = OBSERVATION_PROMPT.player_greet;
  const exampleReply = 'Oh! A visitor — mind the ferns, they are my favourite snack.';
  const user = OBSERVATION_PROMPT[obs.kind] + (obs.detail ? ` (${obs.detail})` : '');
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

/** Strip assistant boilerplate + quotes from a model reply; return the first in-character sentence (≤200). */
export function cleanReply(raw: string): string {
  let s = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  s = s.replace(WRAP_QUOTES, '');
  s = s.replace(LEADING_FILLER, '').trim();
  const sentences = s.match(/[^.!?]+[.!?]?/g) ?? [s];
  for (const sentence of sentences) {
    const t = sentence.trim();
    if (!t || ASSISTANT_TELL.test(t)) continue;
    return t.replace(WRAP_QUOTES, '').slice(0, MAX_REPLY).trim();
  }
  return ''; // all assistant-speak → caller falls back to the canned line
}

async function defaultLoader(): Promise<ChatEngine> {
  // Dynamic import keeps web-llm out of the entry bundle and out of Node tests.
  const webllm = await import('@mlc-ai/web-llm');
  return (await webllm.CreateMLCEngine(MODEL_ID)) as unknown as ChatEngine;
}

export class WebLLMBrain implements NPCBrain {
  private _status: BrainStatus = 'idle';
  private engine: ChatEngine | null = null;
  private initStarted = false;

  status(): BrainStatus {
    return this._status;
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
      console.error('[webllm] model load failed; using canned fallback', err);
      this._status = 'fallback';
    }
  }

  async respond(ctx: NPCContext, obs: Observation): Promise<Reply> {
    if (this._status === 'ready' && this.engine) {
      try {
        return await this.generate(this.engine, ctx, obs);
      } catch (err) {
        console.error('[webllm] generation failed; using canned fallback', err);
        return cannedReply(ctx);
      }
    }
    // Not ready yet: kick off loading once, and answer instantly from the fallback meanwhile.
    if (this._status === 'idle') void this.init();
    return cannedReply(ctx);
  }

  private async generate(engine: ChatEngine, ctx: NPCContext, obs: Observation): Promise<Reply> {
    const res = await engine.chat.completions.create({
      messages: buildMessages(ctx, obs),
      max_tokens: 60,
      temperature: 0.7,
    });
    const cleaned = cleanReply(res.choices[0]?.message?.content ?? '');
    // Empty after cleaning means it was all assistant-speak — fall back rather than show it.
    if (!cleaned) return cannedReply(ctx);
    return { text: cleaned, mood: moodFromTraits(ctx.traits) };
  }
}
