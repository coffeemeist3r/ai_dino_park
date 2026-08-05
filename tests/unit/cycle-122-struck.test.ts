import { describe, it, expect } from 'vitest';
import { isStruck, keepsakeGlyph, struckBookLine, STRUCK_ROLLS } from '../../game/src/world/struck';
import { bookLines } from '../../game/src/ui/lenses';
import { deserialize, SAVE_VERSION } from '../../game/src/world/saveGame';

/**
 * BACKLOG-347 — still full of the place it left: the integration edges the pure module can't own (the
 * dossier line and the save round-trip). The beat's own rules live in `game/src/world/struck.test.ts`.
 */
describe('BACKLOG-347 — the book line', () => {
  const row = (struck?: string) => ({ name: 'Mossback', species: 'stegosaurus', hearts: 1, struck });

  it('reads "just back from <Zone>" while the window is open', () => {
    const out = bookLines([row(struckBookLine('The Hollow'))] as never).join('\n');
    expect(out).toContain('just back from The Hollow');
  });

  it('shows nothing once the window has closed', () => {
    const out = bookLines([row(undefined)] as never).join('\n');
    expect(out).not.toContain('just back from');
  });

  it('is built from live state, so it lapses exactly when isStruck does', () => {
    const line = (rolls: number) =>
      isStruck(rolls, 'hollow') ? struckBookLine('The Hollow') : undefined;
    expect(line(0)).toBe('just back from The Hollow');
    expect(line(STRUCK_ROLLS - 1)).toBe('just back from The Hollow');
    expect(line(STRUCK_ROLLS)).toBeUndefined();
  });

  it('names the ground it came from, not the one it stands in', () => {
    // the glyph and the name both key on the *source* ground — the generalization the item is about
    expect(keepsakeGlyph('hollow')).not.toBe(keepsakeGlyph('bowl'));
  });
});

describe('BACKLOG-347 — the save', () => {
  const base = {
    version: SAVE_VERSION,
    time: { day: 1, hour: 8, minute: 0 },
    player: { x: 1, y: 2 },
  } as Record<string, unknown>;

  it('round-trips cameFrom, and an older save loads clean without it', () => {
    expect(deserialize(JSON.stringify(base))?.cameFrom).toBeUndefined();
    const withIt = deserialize(JSON.stringify({ ...base, cameFrom: { Mossback: 'grove' } }));
    expect(withIt?.cameFrom).toEqual({ Mossback: 'grove' });
  });

  it('rejects a malformed cameFrom rather than loading a broken world', () => {
    expect(deserialize(JSON.stringify({ ...base, cameFrom: { Mossback: 3 } }))).toBeNull();
    expect(deserialize(JSON.stringify({ ...base, cameFrom: { Mossback: ['grove'] } }))).toBeNull();
    expect(deserialize(JSON.stringify({ ...base, cameFrom: 'grove' }))).toBeNull();
  });

  it('does not bump the save version — the field is additive', () => {
    expect(deserialize(JSON.stringify({ ...base, cameFrom: { Mossback: 'grove' } }))?.version).toBe(SAVE_VERSION);
  });
});
