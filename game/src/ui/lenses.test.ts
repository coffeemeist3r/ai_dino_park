import { describe, it, expect } from 'vitest';
import { zoneMapModel, zoneWant, bookLines, type BookRow } from './lenses';
import { zoneChain, zoneById, BOWL_ID, GROVE_ID, FERNREACH_ID } from '../world/zones';
import { cropOf } from '../world/plot';

describe('per-zone harvest on the map lens (BACKLOG-433)', () => {
  const chain = zoneChain();
  const pops = { [BOWL_ID]: 3, [GROVE_ID]: 1, [FERNREACH_ID]: 1 };

  it('reads each zone its own harvest tally from the harvests map', () => {
    const model = zoneMapModel(chain, pops, BOWL_ID, {}, { [BOWL_ID]: 2, [GROVE_ID]: 1 });
    const byId = Object.fromEntries(model.map((e) => [e.id, e.harvested]));
    expect(byId[BOWL_ID]).toBe(2);
    expect(byId[GROVE_ID]).toBe(1);
    expect(byId[FERNREACH_ID]).toBe(0); // absent from the map → 0, not blended
  });

  it('defaults harvested to 0 for older callers that omit the harvests arg', () => {
    const model = zoneMapModel(chain, pops, BOWL_ID); // 3-arg, cycle-96 shape
    expect(model.every((e) => e.harvested === 0)).toBe(true);
    // and the 4-arg (tiers only) shape stays valid too
    const withTiers = zoneMapModel(chain, pops, BOWL_ID, {});
    expect(withTiers.every((e) => e.harvested === 0)).toBe(true);
  });
});

describe('banked food on the map lens (BACKLOG-446)', () => {
  const chain = zoneChain();
  const pops = { [BOWL_ID]: 3, [GROVE_ID]: 1, [FERNREACH_ID]: 1 };

  it('reads each zone its banked-food glyph line from the foodPiles map', () => {
    const model = zoneMapModel(chain, pops, BOWL_ID, {}, {}, { [BOWL_ID]: { berries: 2 }, [GROVE_ID]: { greens: 1 } });
    const byId = Object.fromEntries(model.map((e) => [e.id, e.banked]));
    expect(byId[BOWL_ID]).toBe('🍓 2');
    expect(byId[GROVE_ID]).toBe('🌿 1');
    expect(byId[FERNREACH_ID]).toBe(''); // absent → empty, no banked line shows
  });

  it('defaults banked to "" for older callers that omit the foodPiles arg', () => {
    expect(zoneMapModel(chain, pops, BOWL_ID).every((e) => e.banked === '')).toBe(true);
  });

  // BACKLOG-468: the spend column is the ninth argument — every pre-468 call shape must survive it.
  it('defaults spend to null for callers that omit the spends arg', () => {
    expect(zoneMapModel(chain, pops, BOWL_ID, {}, {}, {}, [], {}).every((e) => e.spend === null)).toBe(true);
  });
});

describe('a zone wants what it can\'t grow (BACKLOG-438)', () => {
  it('has no want until a neighbour has actually grown a surplus', () => {
    expect(zoneWant(BOWL_ID, {})).toBeNull();
    expect(zoneWant(GROVE_ID, { [BOWL_ID]: 0, [FERNREACH_ID]: 0 })).toBeNull();
  });

  it("requests the neighbour's crop once it has a surplus", () => {
    const want = zoneWant(BOWL_ID, { [GROVE_ID]: 2 }); // the bowl grows berries; the grove grows greens
    expect(want).not.toBeNull();
    expect(want!.from).toBe(GROVE_ID);
    expect(want!.food).toBe(cropOf(GROVE_ID).food);
    expect(want!.glyph).toBe(cropOf(GROVE_ID).ripe);
    expect(want!.fromName).toBe(zoneById(GROVE_ID).name);
  });

  it('leans toward the more productive neighbour (the grove borders both bowl and Fernreach)', () => {
    expect(zoneWant(GROVE_ID, { [BOWL_ID]: 2, [FERNREACH_ID]: 5 })!.from).toBe(FERNREACH_ID);
    expect(zoneWant(GROVE_ID, { [BOWL_ID]: 5, [FERNREACH_ID]: 2 })!.from).toBe(BOWL_ID);
  });

  it('breaks a tie by neighbour link order (deterministic strict >)', () => {
    // grove link order is bowl (west) before fernreach (east) — the first wins an equal harvest.
    expect(zoneWant(GROVE_ID, { [BOWL_ID]: 3, [FERNREACH_ID]: 3 })!.from).toBe(BOWL_ID);
  });

  it('is attached per entry by zoneMapModel, and null on the back-compat 3-arg call', () => {
    const chain = zoneChain();
    const pops = { [BOWL_ID]: 1, [GROVE_ID]: 1, [FERNREACH_ID]: 1 };
    const model = zoneMapModel(chain, pops, BOWL_ID, {}, { [GROVE_ID]: 2 });
    expect(model.find((e) => e.id === BOWL_ID)!.want!.from).toBe(GROVE_ID);
    expect(model.find((e) => e.id === FERNREACH_ID)!.want!.from).toBe(GROVE_ID);
    expect(zoneMapModel(chain, pops, BOWL_ID).every((e) => e.want === null)).toBe(true);
  });
});

describe('food-web standing in the book (BACKLOG-443)', () => {
  const base: BookRow = { name: 'Twitch', species: 'compsognathus', hearts: 3, topBond: 10, role: 'wanderer', rumorsHeard: 0 };

  it('renders the food-web line when set', () => {
    const lines = bookLines([{ ...base, foodweb: '🦖 brought down 2 meals' }]);
    expect(lines.some((l) => l.includes('🦖 brought down 2 meals'))).toBe(true);
  });

  it('omits the line when unset (a dino with no food-web history)', () => {
    const lines = bookLines([{ ...base }]);
    expect(lines.some((l) => l.includes('brought down') || l.includes('slipped'))).toBe(false);
  });
});

describe('the manner at the hatch in the book (BACKLOG-402)', () => {
  const base: BookRow = { name: 'Twitch', species: 'compsognathus', hearts: 3, topBond: 10, role: 'wanderer', rumorsHeard: 0 };

  it('renders the manner line when set', () => {
    const lines = bookLines([{ ...base, manner: '🍽️ at the hatch: unbowed — holds its ground and keeps its food' }]);
    expect(lines.some((l) => l.includes('at the hatch: unbowed'))).toBe(true);
  });

  it('omits the line for a dino that has never contested a drop', () => {
    expect(bookLines([{ ...base }]).some((l) => l.includes('at the hatch'))).toBe(false);
  });

  it('leaves a row without a manner byte-identical to the pre-402 render', () => {
    expect(bookLines([{ ...base, foodweb: '💨 slipped 1 hunt' }])).toEqual([
      '— Collection Book —',
      'Twitch  (compsognathus)  [wanderer]',
      '  ♥♥♥·······  bond:10',
      '  💨 slipped 1 hunt',
    ]);
  });
});

describe('the council on the map lens and in the book (BACKLOG-479)', () => {
  const chain = zoneChain();
  const pops = { [BOWL_ID]: 3, [GROVE_ID]: 1, [FERNREACH_ID]: 1 };

  it('reads each ground its own seated council', () => {
    const model = zoneMapModel(chain, pops, BOWL_ID, {}, {}, {}, [], {}, {}, {}, {}, {
      [BOWL_ID]: ['Rex', 'Sunny'],
    });
    expect(model.find((e) => e.id === BOWL_ID)!.council).toEqual(['Rex', 'Sunny']);
    expect(model.find((e) => e.id === GROVE_ID)!.council).toEqual([]);
  });

  it('seats nobody for callers built before 479 — a fresh park has no councils', () => {
    expect(zoneMapModel(chain, pops, BOWL_ID).every((e) => e.council.length === 0)).toBe(true);
  });

  it('renders the seat line in the book only when the dino holds one', () => {
    const base: BookRow = { name: 'Rex', species: 'tyrannosaurus', hearts: 1, topBond: 0, role: 'wanderer', rumorsHeard: 0 };
    // BACKLOG-482: the seat arrives via the folded `standings` list now; the rendered line is unchanged.
    expect(bookLines([{ ...base, standings: ["👥 one of The Grove's 2 voices"] }]).some((l) => l.includes('👥'))).toBe(
      true,
    );
    expect(bookLines([{ ...base }]).some((l) => l.includes('👥'))).toBe(false);
  });
});

describe('the dream line (BACKLOG-307)', () => {
  const row: BookRow = { name: 'Rex', species: 'triceratops', hearts: 0, topBond: 0, role: 'wanderer', rumorsHeard: 0 };

  it('renders directly under the hours when present', () => {
    const lines = bookLines([{ ...row, hours: 'keeps late hours', dream: '💭 dreams of thunder' }]);
    const hours = lines.findIndex((l) => l.includes('keeps late hours'));
    const dream = lines.findIndex((l) => l.includes('dreams of thunder'));
    expect(hours).toBeGreaterThan(-1);
    expect(dream).toBe(hours + 1);
  });

  it('shows no line at all when the dino has no dream', () => {
    expect(bookLines([{ ...row }]).some((l) => l.includes('dreams of'))).toBe(false);
  });
});

