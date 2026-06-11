import { describe, it, expect } from 'vitest';
import { makeBrain, cannedReply, replyPrefix } from '../../game/src/ai/brain';
import {
  WebLLMBrain,
  buildMessages,
  cleanReply,
  relationshipLabel,
  type ChatEngine,
} from '../../game/src/ai/webllmBrain';

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
  it('buildMessages forbids assistant behavior and includes identity + flavor + a one-shot example', () => {
    const msgs = buildMessages(ctx, { kind: 'player_greet' });
    expect(msgs.length).toBeGreaterThanOrEqual(4);
    expect(msgs[0].role).toBe('system');
    expect(msgs[0].content).toMatch(/never a chatbot|never a .*helper|real animal/i);
    expect(msgs[0].content).toContain('Rex');
    expect(msgs[0].content).toContain('triceratops');
    expect(msgs[0].content).toContain('curious'); // roster flavor reaches the prompt
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

describe('reply source + prefix', () => {
  it('cannedReply is tagged canned; replyPrefix marks llm only', () => {
    expect(cannedReply(ctx).source).toBe('canned');
    expect(replyPrefix('llm')).toBe('🧠 ');
    expect(replyPrefix('canned')).toBe('');
    expect(replyPrefix(undefined)).toBe('');
  });

  it('a ready model reply is tagged llm; a not-ready reply is canned', async () => {
    const ready = new WebLLMBrain();
    await ready.init(() => Promise.resolve(fake('I am basking on a warm rock.')));
    const r = await ready.respond(ctx, { kind: 'player_greet' });
    expect(r.source).toBe('llm');
    expect(ready.lastReplySource()).toBe('llm');

    const loading = new WebLLMBrain();
    void loading.init(() => new Promise<never>(() => {}));
    const c = await loading.respond(ctx, { kind: 'player_greet' });
    expect(c.source).toBe('canned');
    expect(loading.lastReplySource()).toBe('canned');
  });
});

describe('dialogue context (BACKLOG-051)', () => {
  it('relationshipLabel scales with affection', () => {
    expect(relationshipLabel(0)).toMatch(/stranger/);
    expect(relationshipLabel(2)).toMatch(/acquaintance/);
    expect(relationshipLabel(5)).toMatch(/good friend/);
    expect(relationshipLabel(9)).toMatch(/dear friend/);
  });

  it('buildMessages weaves in time-of-day and relationship, and varies with affection', () => {
    const night = buildMessages({ ...ctx, timeOfDay: 'night', affection: 10 }, { kind: 'player_greet' })[0].content;
    expect(night).toContain('night');
    expect(night).toMatch(/dear friend/);
    const stranger = buildMessages({ ...ctx, timeOfDay: 'night', affection: 0 }, { kind: 'player_greet' })[0].content;
    expect(stranger).toMatch(/stranger/);
    expect(night).not.toBe(stranger);
  });
});

describe('cleanReply', () => {
  it('strips wrapping quotes', () => {
    expect(cleanReply('"Hello there!"')).toBe('Hello there!');
  });

  it('drops assistant-voice entirely', () => {
    expect(cleanReply('Sure! How can I assist you today?')).not.toMatch(/assist|\bai\b/i);
  });

  it('keeps up to two sentences', () => {
    expect(cleanReply('I love this sunny rock. It is warm and nice.')).toBe('I love this sunny rock. It is warm and nice.');
  });

  it('truncates to the first two in-character sentences', () => {
    expect(cleanReply('One thing. Two thing. Three thing.')).toBe('One thing. Two thing.');
  });

  it('leaves a clean in-character line unchanged', () => {
    expect(cleanReply('Hi, I am Rex.')).toBe('Hi, I am Rex.');
  });

  it('drops a token-capped dangling fragment when a complete sentence precedes it', () => {
    expect(cleanReply('My rock is the warmest rock. And when I sit on it I sometimes j')).toBe(
      'My rock is the warmest rock.',
    );
  });

  it('a lone unfinished thought trails off instead of cutting mid-word', () => {
    expect(cleanReply('I am basically nothing unless someone talks to me and even then I')).toBe(
      'I am basically nothing unless someone talks to me and even then I…',
    );
  });

  it('over-long replies cut at a word boundary with an ellipsis, never mid-word', () => {
    const long = `${'word '.repeat(50)}ending.`; // ~256 chars
    const out = cleanReply(long, 1);
    expect(out.length).toBeLessThanOrEqual(200);
    expect(out.endsWith('…')).toBe(true);
    expect(out).not.toMatch(/\swor…$/); // no mid-word stump
  });

  it('drops a Qwen3+ thinking block, empty or populated (BACKLOG-102)', () => {
    // enable_thinking:false makes WebLLM prepend an empty block to the response.
    expect(cleanReply('<think>\n\n</think>\n\nOh, you brought snacks!')).toBe('Oh, you brought snacks!');
    expect(cleanReply('<think>The visitor seems friendly. I should mention rocks.</think>My rock is warmer than you.')).toBe(
      'My rock is warmer than you.',
    );
  });
});
