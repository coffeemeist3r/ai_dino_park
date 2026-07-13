import { describe, it, expect, vi } from 'vitest';
import { makeBrain, cannedReply, replyPrefix, rattledAside } from '../../game/src/ai/brain';
import type { Personality } from '../../game/src/ai/personality';
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

  it('treats a missing GPU as a warning, not a console error (keeps "error-free boot" e2e green)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    await new WebLLMBrain().init(() => Promise.reject(new Error('Unable to find a compatible GPU')));
    expect(warn).toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    warn.mockRestore();
    error.mockRestore();
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

describe('rattled after the chase (BACKLOG-440)', () => {
  const traits = (agreeableness: number): Personality => ({
    bravery: 0.5,
    energy: 0.5,
    curiosity: 0.5,
    sociability: 0.5,
    agreeableness,
  });

  it('names the chaser and shades by temperament, each aside leading with a space', () => {
    const prickly = rattledAside('Twitch', traits(0.1));
    const warm = rattledAside('Twitch', traits(0.9));
    const plain = rattledAside('Twitch', traits(0.5));
    for (const s of [prickly, warm, plain]) {
      expect(s).toContain('Twitch');
      expect(s.startsWith(' ')).toBe(true);
    }
    expect(prickly).not.toBe(warm);
    expect(plain).not.toBe(prickly);
    expect(plain).not.toBe(warm);
    expect(rattledAside('Twitch')).toContain('Twitch'); // no traits → plain line
  });

  it('appends the aside onto the base greeting when ctx.rattled is set', () => {
    const base = cannedReply({ name: 'Rex', species: 'triceratops', personality: 'x', affection: 10 });
    const rattled = cannedReply({
      name: 'Rex',
      species: 'triceratops',
      personality: 'x',
      affection: 10,
      rattled: 'Twitch',
    });
    expect(rattled.text.startsWith(base.text)).toBe(true);
    expect(rattled.text).toContain('Twitch');
    expect(rattled.text.length).toBeGreaterThan(base.text.length);
  });

  it('composes with the hunger tell — both asides present when both flags set', () => {
    const both = cannedReply({
      name: 'Rex',
      species: 'triceratops',
      personality: 'x',
      affection: 10,
      hungry: true,
      rattled: 'Twitch',
    });
    expect(both.text).toContain('Twitch');
    expect(both.text.toLowerCase()).toMatch(/hungr|eat|bite/);
    expect(both.text.length).toBeLessThanOrEqual(280);
  });

  it('is byte-identical to the old reply when ctx.rattled is unset (back-compat)', () => {
    const args = { name: 'Rex', species: 'triceratops', personality: 'x', affection: 10 } as const;
    expect(cannedReply({ ...args }).text).toBe(cannedReply({ ...args, rattled: undefined }).text);
  });

  it('colours the webllm prompt when rattled, naming the chaser', () => {
    const msg = buildMessages(
      { ...ctx, rattled: 'Twitch' },
      { kind: 'player_greet' },
    )[0].content;
    expect(msg).toContain('Twitch');
    const calm = buildMessages(ctx, { kind: 'player_greet' })[0].content;
    expect(calm).not.toContain('Twitch');
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
