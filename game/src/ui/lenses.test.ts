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
