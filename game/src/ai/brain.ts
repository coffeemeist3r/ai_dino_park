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
}

export interface Observation {
  kind: 'player_approach' | 'player_greet' | 'world_event' | 'npc_meet';
  detail?: string;
}

export interface Reply {
  text: string;
  mood?: 'happy' | 'neutral' | 'wary' | 'excited';
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

/** Canned reply used by the stub brain and as the WebLLM brain's fallback (while loading or on error). */
export function cannedReply(ctx: NPCContext): Reply {
  const idx = Math.floor(Math.random() * cannedGreetings.length);
  const text = cannedGreetings[idx].replace('the park', `the park, ${ctx.name} here`).slice(0, 200);
  return { text, mood: moodFromTraits(ctx.traits) };
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
