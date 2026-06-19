/**
 * NPCBrain — hard boundary between the game and whatever inference backend powers NPCs.
 *
 * Implementations MUST conform to this interface. The game must NOT import WebLLM
 * (or any concrete inference backend) outside this folder. This is what lets us swap
 * to a native Capacitor LLM plugin on mobile without touching scene code.
 *
 * Charter §Stack — "The NPCBrain interface is a hard boundary. WebLLM-specific code
 * must not leak past it."
 */

import type { Personality } from './personality';
import { WebLLMBrain } from './webllmBrain';

export interface NPCContext {
  name: string;
  species: string;
  personality: string;
  traits?: Personality;
  recentMemory?: string[];
  /** Time-of-day phase (dawn/day/dusk/night) for prompt flavor. */
  timeOfDay?: string;
  /** Player friendship level with this dino, 0–10 hearts. */
  affection?: number;
  /** If set, the name of whoever just cleared this dino's name — surfaces as spoken gratitude (BACKLOG-247). */
  gratitude?: string;
}

export interface Observation {
  kind: 'player_approach' | 'player_greet' | 'world_event' | 'npc_meet';
  detail?: string;
}

export interface Reply {
  text: string;
  mood?: 'happy' | 'neutral' | 'wary' | 'excited';
  /** Where the line came from — the model, or the canned safety net. */
  source?: 'llm' | 'canned';
}

/** Dialog marker so the player can tell a model-written line from the fallback. */
export function replyPrefix(source?: Reply['source']): string {
  return source === 'llm' ? '🧠 ' : '';
}

export interface NPCBrain {
  respond(ctx: NPCContext, obs: Observation): Promise<Reply>;
  /** Optional lifecycle status for backends that load asynchronously (e.g. WebLLM). */
  status?(): string;
}

const cannedGreetings = [
  "Oh, hello! I haven't seen you around the park before.",
  "*sniffs the air* You smell like the human cave. Welcome.",
  "Hi! Did you bring snacks? I love snacks.",
  "Don't step on my favorite rock, please. That one. Yes, that one.",
];

/** Mood reflects personality so traits are observable in the dialog. */
export function moodFromTraits(t: NPCContext['traits']): Reply['mood'] {
  if (!t) return 'neutral';
  if (t.bravery <= 0.2) return 'wary';
  if (t.sociability >= 0.8 && t.agreeableness >= 0.7) return 'happy';
  if (t.energy >= 0.65 && t.curiosity >= 0.6) return 'excited';
  return 'neutral';
}

/**
 * The agreeableness ceiling below which a dino reads as "prickly" — pinned to the `low`-pole cutoff
 * `describePersonality` uses in `personality.ts`, so "prickly" means the same thing everywhere.
 */
export const PRICKLY_MAX = 0.4;

/**
 * The agreeableness floor above which a dino reads as "warm" — pinned to the `high`-pole cutoff
 * `describePersonality` uses in `personality.ts` (`> 0.6`), the warm mirror of `PRICKLY_MAX`.
 */
export const EFFUSIVE_MIN = 0.6;

/**
 * A just-cleared dino's spoken thanks, naming who set its record straight (BACKLOG-247). Temperament
 * colours it: a prickly dino (`agreeableness < PRICKLY_MAX`) grumbles it (BACKLOG-253), a warm one
 * (`agreeableness > EFFUSIVE_MIN`) gushes (BACKLOG-261), and an even-tempered one says it plain. No
 * traits → the plain line (back-compat default).
 */
export function thanksLine(clearer: string, traits?: Personality): string {
  if (traits && traits.agreeableness < PRICKLY_MAX) {
    return `…yeah. thanks, I guess. ${clearer} set the record straight.`;
  }
  if (traits && traits.agreeableness > EFFUSIVE_MIN) {
    return `${clearer} told the whole park I was alright — best friend a dino could ask for, I'll never forget it!`;
  }
  return `${clearer} told everyone I was alright — I owe them one.`;
}

/** Canned reply used by the stub brain and as the WebLLM brain's fallback (while loading or on error). */
export function cannedReply(ctx: NPCContext): Reply {
  // A just-cleared dino leads with gratitude, naming its clearer (BACKLOG-247) — the deterministic
  // half of "thanks in the voice"; the LLM path colours the same fact via buildMessages.
  if (ctx.gratitude) {
    return { text: thanksLine(ctx.gratitude, ctx.traits), mood: 'happy', source: 'canned' };
  }
  const idx = Math.floor(Math.random() * cannedGreetings.length);
  const text = cannedGreetings[idx].replace('the park', `the park, ${ctx.name} here`).slice(0, 200);
  return { text, mood: moodFromTraits(ctx.traits), source: 'canned' };
}

class StubBrain implements NPCBrain {
  async respond(ctx: NPCContext, _obs: Observation): Promise<Reply> {
    return cannedReply(ctx);
  }
}

export type BrainKind = 'stub' | 'webllm';

export function makeBrain(kind: BrainKind): NPCBrain {
  switch (kind) {
    case 'stub':
      return new StubBrain();
    case 'webllm':
      // brain↔webllmBrain is a cyclic import, but the refs are only touched at call time
      // (here / inside respond), never at module-eval, so ESM resolves it safely.
      return new WebLLMBrain();
  }
}
