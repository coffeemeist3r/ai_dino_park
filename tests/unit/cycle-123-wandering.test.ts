import { describe, it, expect } from 'vitest';
import { wanderBookLine, wanderStanding, reachOf, originOf, crossingsOf } from '../../game/src/world/wandering';
import { bookLines } from '../../game/src/ui/lenses';
import { deserialize, SAVE_VERSION } from '../../game/src/world/saveGame';
import { BOWL_ID, GROVE_ID, HOLLOW_ID, zoneById } from '../../game/src/world/zones';

/**
 * BACKLOG-361 — homebody or wanderer: the integration edges the pure module can't own (the dossier line and
 * the save round-trip). The standing's own rules live in `game/src/world/wandering.test.ts`.
 */
describe('BACKLOG-361 — the book line', () => {
  const row = (wander?: string) => ({ name: 'Mossback', species: 'stegosaurus', hearts: 1, wander });

  it('shows the standing in the dossier', () => {
    const out = bookLines([row('a wanderer — 7 crossings, 3 grounds out')] as never).join('\n');
    expect(out).toContain('a wanderer — 7 crossings, 3 grounds out');
  });

  it('shows nothing for a row that carries no standing (older BookRow literals stay valid)', () => {
    const out = bookLines([row(undefined)] as never).join('\n');
    expect(out).not.toContain('homebody');
    expect(out).not.toContain('wanderer');
  });

  // The read the scene builds, end to end: seenZones + a crossing count → one line.
  const lineFor = (seen: string[] | undefined, crossings: Record<string, number>, name: string) => {
    const origin = originOf(seen) ?? BOWL_ID;
    const n = crossingsOf(crossings, name);
    const reach = reachOf(seen, origin);
    return wanderBookLine(wanderStanding(n, reach), n, reach, zoneById(origin).name);
  };

  it('reads a founder that has never left as a homebody of its own ground', () => {
    expect(lineFor([BOWL_ID], {}, 'Rex')).toBe('a homebody — never left Pocket Cretaceous');
  });

  it('reads a dino that has only shuttled next door as a rambler', () => {
    expect(lineFor([BOWL_ID, GROVE_ID], { Rex: 4 }, 'Rex')).toBe('a rambler — 4 crossings, 1 ground out');
  });

  it('reads a dino that has stood at the far end of the chain as a wanderer', () => {
    expect(lineFor([BOWL_ID, GROVE_ID, HOLLOW_ID], { Rex: 5 }, 'Rex')).toBe('a wanderer — 5 crossings, 3 grounds out');
  });

  it('lets a dino that has moved a lot and gone nowhere stay a rambler', () => {
    // the whole reason the standing takes two dimensions instead of one
    expect(lineFor([BOWL_ID, GROVE_ID], { Rex: 20 }, 'Rex')).toContain('rambler');
  });
});

describe('BACKLOG-361 — the save', () => {
  const base = {
    version: SAVE_VERSION,
    time: { day: 1, hour: 8, minute: 0 },
    player: { x: 1, y: 2 },
  } as Record<string, unknown>;

  it('round-trips crossings, and an older save loads clean without it', () => {
    expect(deserialize(JSON.stringify(base))?.crossings).toBeUndefined();
    const withIt = deserialize(JSON.stringify({ ...base, crossings: { Mossback: 3 } }));
    expect(withIt?.crossings).toEqual({ Mossback: 3 });
  });

  it('rejects a malformed crossings rather than loading a broken world', () => {
    expect(deserialize(JSON.stringify({ ...base, crossings: { Mossback: -1 } }))).toBeNull();
    expect(deserialize(JSON.stringify({ ...base, crossings: { Mossback: 'lots' } }))).toBeNull();
    expect(deserialize(JSON.stringify({ ...base, crossings: 7 }))).toBeNull();
  });

  it('does not bump the save version — the field is additive', () => {
    expect(deserialize(JSON.stringify({ ...base, crossings: { Mossback: 3 } }))?.version).toBe(SAVE_VERSION);
  });

  it('back-fills nothing — a save that never counted reads every dino a homebody', () => {
    const loaded = deserialize(JSON.stringify({ ...base, seenZones: { Rex: [BOWL_ID, GROVE_ID] } }));
    expect(loaded?.crossings).toBeUndefined();
    expect(wanderStanding(crossingsOf(loaded?.crossings ?? {}, 'Rex'), 1)).toBe('homebody');
  });
});
