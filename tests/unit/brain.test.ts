import { describe, it, expect } from 'vitest';
import { makeBrain } from '../../game/src/ai/brain';
import { WebLLMBrain, buildMessages, type ChatEngine } from '../../game/src/ai/webllmBrain';

describe('NPCBrain', () => {
  it('stub brain returns a non-empty reply', async () => {
    const brain = makeBrain('stub');
    const reply = await brain.respond(
      { name: 'Rex', species: 'triceratops', personality: 'curious' },
      { kind: 'player_greet' },
    );
    expect(reply.text.length).toBeGreaterThan(0);
  });

  it('makeBrain("webllm") returns a brain and does not throw', () => {
    const brain = makeBrain('webllm');
    expect(typeof brain.respond).toBe('function');
  });
});

const ctx = { name: 'Rex', species: 'triceratops', personality: 'curious, bold' };

describe('WebLLMBrain', () => {
  it('buildMessages puts identity + personality in system and the observation in user', () => {
    const msgs = buildMessages(ctx, { kind: 'player_greet' });
    expect(msgs).toHaveLength(2);
    expect(msgs[0].role).toBe('system');
    expect(msgs[0].content).toContain('Rex');
    expect(msgs[0].content).toContain('triceratops');
    expect(msgs[0].content).toContain('curious');
    expect(msgs[1].role).toBe('user');
    expect(msgs[1].content.length).toBeGreaterThan(0);
  });

  it('falls back to a non-empty reply while the model is still loading', async () => {
    const brain = new WebLLMBrain();
    // Inject a loader that never resolves so status stays "loading" and the real
    // web-llm import is never triggered in Node; respond must still answer instantly.
    void brain.init(() => new Promise<never>(() => {}));
    expect(brain.status()).toBe('loading');
    const reply = await brain.respond(ctx, { kind: 'player_greet' });
    expect(reply.text.length).toBeGreaterThan(0);
  });

  it('enters fallback status when the loader fails, and still replies', async () => {
    const brain = new WebLLMBrain();
    await brain.init(() => Promise.reject(new Error('no WebGPU')));
    expect(brain.status()).toBe('fallback');
    const reply = await brain.respond(ctx, { kind: 'player_greet' });
    expect(reply.text.length).toBeGreaterThan(0);
  });

  it('uses the engine when ready and trims the reply to 200 chars', async () => {
    const long = 'x'.repeat(500);
    const fakeEngine: ChatEngine = {
      chat: { completions: { create: async () => ({ choices: [{ message: { content: long } }] }) } },
    };
    const brain = new WebLLMBrain();
    await brain.init(() => Promise.resolve(fakeEngine));
    expect(brain.status()).toBe('ready');
    const reply = await brain.respond(ctx, { kind: 'player_greet' });
    expect(reply.text.length).toBe(200);
  });
});
