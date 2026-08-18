import { describe, it, expect } from 'vitest';
import { TIC_BY_AXIS, ticBookLine, ECHO_FROM_UNKNOWN, signatureTic } from '../../game/src/world/tic';
import { bookLines, type BookRow } from '../../game/src/ui/lenses';
import type { Personality } from '../../game/src/ai/personality';
import { deserialize, SAVE_VERSION } from '../../game/src/world/saveGame';

/**
 * The ritual in the book (BACKLOG-409). Two things are pinned here and they are the whole item:
 *
 * 1. The line takes the **base** tic, never `echoedTic`'s reworded label — a borrowed ritual says so once,
 *    with a name, instead of twice with a name and a vagueness.
 * 2. The book renders the line only when a row *carries* one. The earning happens in the sim (a ritual that
 *    actually formed); `bookLines` must never be tempted to derive it, so the absent case is asserted as
 *    hard as the present one.
 */

const OWN = TIC_BY_AXIS.energy; // 🐾 paces a fixed little path

describe('ticBookLine (BACKLOG-409)', () => {
  it('renders a dino its own ritual: glyph, the word ritual, and the label', () => {
    expect(ticBookLine(OWN)).toBe('🐾 ritual: paces a fixed little path');
  });

  it('names the friend a borrowed ritual was caught off', () => {
    expect(ticBookLine(OWN, 'Thornback')).toBe('🐾 ritual: paces a fixed little path — caught off Thornback');
  });

  it('falls back to the vaguer form when the park knows the ritual is borrowed but not from whom', () => {
    expect(ticBookLine(OWN, ECHO_FROM_UNKNOWN)).toBe(
      '🐾 ritual: paces a fixed little path — picked up from a friend',
    );
  });

  it('treats null and an omitted source identically — no dangling separator', () => {
    expect(ticBookLine(OWN, null)).toBe(ticBookLine(OWN));
    expect(ticBookLine(OWN, '')).toBe(ticBookLine(OWN));
  });

  it('carries whichever axis the ritual actually came from, glyph included', () => {
    for (const axis of Object.keys(TIC_BY_AXIS) as Array<keyof Personality>) {
      const t = TIC_BY_AXIS[axis];
      expect(ticBookLine(t)).toBe(`${t.glyph} ritual: ${t.label}`);
    }
  });

  it('reads the born ritual for a dino performing its own (the signatureTic path the scene takes)', () => {
    const p: Personality = { curiosity: 0.5, sociability: 0.5, energy: 0.95, agreeableness: 0.5, bravery: 0.5 };
    expect(ticBookLine(signatureTic(p))).toBe('🐾 ritual: paces a fixed little path');
  });
});

describe('the ritual line in the collection book (BACKLOG-409)', () => {
  const base: BookRow = {
    name: 'Twitch',
    species: 'compsognathus',
    hearts: 3,
    topBond: 10,
    role: 'wanderer',
    rumorsHeard: 0,
    quirk: 'flicks its tail',
  };

  it('shows nothing at all for a dino whose ritual has never formed', () => {
    const out = bookLines([base]);
    expect(out.some((l) => l.includes('ritual:'))).toBe(false);
  });

  it('shows the ritual on the line directly under the idle quirk', () => {
    const out = bookLines([{ ...base, tic: ticBookLine(OWN) }]);
    const quirkAt = out.findIndex((l) => l.includes('flicks its tail'));
    expect(quirkAt).toBeGreaterThan(0);
    expect(out[quirkAt + 1]).toBe('  🐾 ritual: paces a fixed little path');
  });

  it('keeps the day lines below it — no existing line moves', () => {
    const out = bookLines([{ ...base, tic: ticBookLine(OWN), intent: 'sulk by the pond', plans: 'forage → rest' }]);
    const ritualAt = out.findIndex((l) => l.includes('ritual:'));
    expect(out[ritualAt + 1]).toContain('today:');
    expect(out[ritualAt + 2]).toContain('plans:');
  });

  it('carries the borrowed provenance straight through to the rendered book', () => {
    const out = bookLines([{ ...base, tic: ticBookLine(OWN, 'Thornback') }]);
    expect(out).toContain('  🐾 ritual: paces a fixed little path — caught off Thornback');
  });
});

describe('BACKLOG-409 — the save', () => {
  const base = {
    version: SAVE_VERSION,
    time: { day: 1, hour: 8, minute: 0 },
    player: { x: 1, y: 2 },
  } as Record<string, unknown>;

  it('round-trips the formed set and the echo sources, and an older save loads clean without them', () => {
    const old = deserialize(JSON.stringify(base));
    expect(old?.ticsFormed).toBeUndefined();
    expect(old?.ticEchoFrom).toBeUndefined();
    const withIt = deserialize(
      JSON.stringify({ ...base, ticsFormed: ['Rex', 'Twitch'], ticEchoFrom: { Twitch: 'Rex' } }),
    );
    expect(withIt?.ticsFormed).toEqual(['Rex', 'Twitch']);
    expect(withIt?.ticEchoFrom).toEqual({ Twitch: 'Rex' });
  });

  it('rejects a malformed formed set or echo source rather than loading a broken world', () => {
    expect(deserialize(JSON.stringify({ ...base, ticsFormed: 'Rex' }))).toBeNull();
    expect(deserialize(JSON.stringify({ ...base, ticsFormed: [3] }))).toBeNull();
    expect(deserialize(JSON.stringify({ ...base, ticEchoFrom: ['Rex'] }))).toBeNull();
    expect(deserialize(JSON.stringify({ ...base, ticEchoFrom: { Twitch: 3 } }))).toBeNull();
  });

  it('does not bump the save version — both fields are additive', () => {
    expect(deserialize(JSON.stringify({ ...base, ticsFormed: ['Rex'] }))?.version).toBe(SAVE_VERSION);
  });
});
