import { describe, it, expect } from 'vitest';
import { makeBrain } from '../../game/src/ai/brain';

describe('NPCBrain', () => {
  it('stub brain returns a non-empty reply', async () => {
    const brain = makeBrain('stub');
    const reply = await brain.respond(
      { name: 'Rex', species: 'triceratops', personality: 'curious' },
      { kind: 'player_greet' },
    );
    expect(reply.text.length).toBeGreaterThan(0);
  });

  it('webllm brain throws until BACKLOG-005 lands', () => {
    expect(() => makeBrain('webllm')).toThrow(/BACKLOG-005/);
  });
});
