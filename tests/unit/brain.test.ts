import { describe, it, expect } from 'vitest';
import { makeBrain } from '../../game/src/ai/brain';
import { WebLLMBrain, buildMessages, cleanReply, type ChatEngine } from '../../game/src/ai/webllmBrain';

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
  it('buildMessages forbids assistant behavior and includes identity + a one-shot example', () => {
    const msgs = buildMessages(ctx, { kind: 'player_greet' });
    expect(msgs.length).toBeGreaterThanOrEqual(4);
    expect(msgs[0].role).toBe('system');
    expect(msgs[0].content).toMatch(/not an ai|never offer help|never ask how you can assist/i);
    expect(msgs[0].content).toContain('Rex');
    expect(msgs[0].content).toContain('triceratops');
    expect(msgs[0].content).toContain('curious');
    // one-shot: example user + example assistant before the real user
    expect(msgs[1].role).toBe('user');
    expect(msgs[2].role).toBe('assistant');
    expect(msgs[msgs.length - 1].role).toBe('user');
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
    const fakeEngine = fake(long);
    const brain = new WebLLMBrain();
    await brain.init(() => Promise.resolve(fakeEngine));
    expect(brain.status()).toBe('ready');
    const reply = await brain.respond(ctx, { kind: 'player_greet' });
    expect(reply.text.length).toBe(200);
  });

  it('cleans assistant-speak out of a ready reply, falling back when nothing in-character remains', async () => {
    const brain = new WebLLMBrain();
    await brain.init(() => Promise.resolve(fake('"Sure! How can I assist you today? I am an AI."')));
    const reply = await brain.respond(ctx, { kind: 'player_greet' });
    expect(reply.text).not.toMatch(/["“”]/); // no wrapping double-quotes (apostrophes are fine)
    expect(reply.text).not.toMatch(/assist|\bai\b/i); // no assistant-voice
    expect(reply.text.length).toBeGreaterThan(0); // fell back to a canned dino line
  });
});

function fake(content: string): ChatEngine {
  return { chat: { completions: { create: async () => ({ choices: [{ message: { content } }] }) } } };
}

describe('cleanReply', () => {
  it('strips wrapping quotes', () => {
    expect(cleanReply('"Hello there!"')).toBe('Hello there!');
  });

  it('drops assistant-voice entirely', () => {
    expect(cleanReply('Sure! How can I assist you today?')).not.toMatch(/assist|\bai\b/i);
  });

  it('keeps only the first sentence', () => {
    expect(cleanReply('I love this sunny rock. It is warm and nice.')).toBe('I love this sunny rock.');
  });

  it('leaves a clean in-character line unchanged', () => {
    expect(cleanReply('Hi, I am Rex.')).toBe('Hi, I am Rex.');
  });
});
