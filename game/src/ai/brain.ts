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

export interface NPCContext {
  name: string;
  species: string;
  personality: string;
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
}

const cannedGreetings = [
  "Oh, hello! I haven't seen you around the park before.",
  "*sniffs the air* You smell like the human cave. Welcome.",
  "Hi! Did you bring snacks? I love snacks.",
  "Don't step on my favorite rock, please. That one. Yes, that one.",
];

class StubBrain implements NPCBrain {
  async respond(ctx: NPCContext, _obs: Observation): Promise<Reply> {
    const idx = Math.floor(Math.random() * cannedGreetings.length);
    const text = cannedGreetings[idx]
      .replace('the park', `the park, ${ctx.name} here`)
      .slice(0, 200);
    return { text, mood: 'neutral' };
  }
}

export type BrainKind = 'stub' | 'webllm';

export function makeBrain(kind: BrainKind): NPCBrain {
  switch (kind) {
    case 'stub':
      return new StubBrain();
    case 'webllm':
      throw new Error('WebLLM brain not implemented yet — BACKLOG-005');
  }
}
