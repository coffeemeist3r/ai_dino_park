import { describe, it, expect } from 'vitest';

import {
  TIC_ASIDE,
  ticAside,
  bashfulOpener,
  fondOpener,
  type TicKind,
} from '../../game/src/world/tic';
import { buildMessages } from '../../game/src/ai/webllmBrain';
import type { NPCContext, Observation } from '../../game/src/ai/brain';

const KINDS: TicKind[] = ['pace', 'circle', 'fuss'];

describe('tic-flavored voice — the deterministic aside (BACKLOG-423)', () => {
  it('has a non-empty aside for every ritual kind', () => {
    for (const k of KINDS) expect(ticAside(k).length).toBeGreaterThan(0);
  });

  it('says something different for each ritual', () => {
    // The whole point of the item: catching a pacer and catching a fusser stop being byte-identical.
    expect(new Set(KINDS.map(ticAside)).size).toBe(3);
  });

  it('names the physical business of stopping each ritual', () => {
    expect(ticAside('pace')).toContain('feet');
    expect(ticAside('circle')).toContain('turn');
    expect(ticAside('fuss')).toContain('picks at it');
  });

  it('exposes the table and the accessor as the same thing', () => {
    for (const k of KINDS) expect(ticAside(k)).toBe(TIC_ASIDE[k]);
  });

  it('composes as <opener> <aside> <reply> with no double spaces', () => {
    const line = [bashfulOpener(), ticAside('pace'), 'Hello there.'].filter(Boolean).join(' ');
    expect(line.startsWith(bashfulOpener())).toBe(true);
    expect(line).toContain(ticAside('pace'));
    expect(line.endsWith('Hello there.')).toBe(true);
    expect(line).not.toContain('  ');
  });

  it('drops cleanly to <opener> <reply> when there is no aside', () => {
    // The non-caught path (a glad-of-company opener, or none at all) must be untouched by this cycle.
    expect([bashfulOpener(), null, 'Hi.'].filter(Boolean).join(' ')).toBe(`${bashfulOpener()} Hi.`);
    expect([null, null, 'Hi.'].filter(Boolean).join(' ')).toBe('Hi.');
  });
});

describe('the 408/413 openers are frozen (BACKLOG-423 adds beside them, never edits them)', () => {
  it('bashfulOpener is byte-identical', () => {
    expect(bashfulOpener()).toBe("*caught mid-fidget* Oh—! You... um. Didn't see you there. Hello.");
  });

  it('fondOpener is byte-identical', () => {
    expect(fondOpener()).toBe(
      "*looks up, delighted* Oh, it's you! You caught me at my little ritual — I don't mind, not with you here.",
    );
  });
});

describe('the prompt half — enrichment only (BACKLOG-423)', () => {
  const base: NPCContext = { name: 'Rex', species: 'triceratops', personality: 'curious' };
  const obs: Observation = { kind: 'player_greet' };
  const systemOf = (ctx: NPCContext) => buildMessages(ctx, obs)[0].content;

  it('changes nothing when the dino was not interrupted', () => {
    // An absent field must produce the prompt this park was already sending — including when the key is
    // present but undefined, which is what the scene passes on an ordinary greet.
    expect(systemOf({ ...base, interrupted: undefined })).toBe(systemOf(base));
  });

  it('tells the model what it walked in on when the dino was caught', () => {
    const s = systemOf({ ...base, interrupted: { kind: 'pace', label: 'pace a little path' } });
    expect(s).toContain('pace a little path');
    expect(s).toContain('walked in on');
  });

  it('carries the label, not the kind — the model gets the words, not the enum', () => {
    const s = systemOf({ ...base, interrupted: { kind: 'fuss', label: 'fuss over one spot' } });
    expect(s).toContain('fuss over one spot');
  });
});
