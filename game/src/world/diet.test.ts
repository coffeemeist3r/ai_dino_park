import { describe, it, expect } from 'vitest';
import { dietOf, isCarnivore, isHerbivore, eats, SPECIES_DIET } from './diet';
import { FOODS } from './foods';
import { ROSTER } from '../entities/roster';

describe('diet split (BACKLOG-435)', () => {
  it('is species-correct for the roster: the compsognathus hunts, nothing else does', () => {
    const diets = Object.fromEntries(ROSTER.map((d) => [d.name, dietOf(d.species, d.name)]));
    expect(diets).toEqual({
      Rex: 'herbivore', // triceratops
      Mossback: 'herbivore', // stegosaurus
      Sunny: 'herbivore', // brontosaurus
      Twitch: 'carnivore', // compsognathus
      Glade: 'herbivore', // parasaurolophus (the backlog's "Glade" guess was wrong)
      Bramble: 'herbivore', // stegosaurus — CHARTER v7, the grove
      Pip: 'carnivore', // compsognathus — CHARTER v7, the grove's own small predator
      Thornback: 'herbivore', // triceratops — CHARTER v7, the Fernreach
    });
    // The rule is the species, not the headcount: every compsognathus hunts and only a compsognathus does.
    // (Was `toHaveLength(1)` when the park had one ground and one comp; v7 gave the grove a second.)
    const hunters = ROSTER.filter((d) => isCarnivore(d.species, d.name)).map((d) => d.name);
    expect(hunters).toEqual(ROSTER.filter((d) => d.species === 'compsognathus').map((d) => d.name));
    expect(hunters.length).toBeGreaterThan(0);
  });

  it('is case-insensitive on species', () => {
    expect(dietOf('Compsognathus')).toBe('carnivore');
    expect(dietOf('TRICERATOPS')).toBe('herbivore');
  });

  it('resolves an unknown species deterministically and herbivore-biased', () => {
    const a = dietOf('velociraptor', 'Zip');
    const b = dietOf('velociraptor', 'Zip');
    expect(a).toBe(b); // same input → same diet, forever
    // the fallback biases herbivore: a spread of unknown species stays predator-sparse
    const sample = ['aa', 'bb', 'cc', 'dd', 'ee', 'ff', 'gg', 'hh', 'ii', 'jj'];
    const carn = sample.filter((s) => isCarnivore(s, s)).length;
    expect(carn).toBeLessThan(sample.length / 2);
  });

  it('isHerbivore is the complement of isCarnivore', () => {
    for (const sp of [...Object.keys(SPECIES_DIET), 'unknownus']) {
      expect(isHerbivore(sp)).toBe(!isCarnivore(sp));
    }
  });

  it('eats: carnivores eat meat, herbivores eat plants — and not the reverse', () => {
    expect(eats('carnivore', 'meat')).toBe(true);
    expect(eats('carnivore', 'plant')).toBe(false);
    expect(eats('herbivore', 'plant')).toBe(true);
    expect(eats('herbivore', 'meat')).toBe(false);
  });

  it('every food carries a kind, and meat/fish are meat while greens/berries/roots are plant', () => {
    const byId = Object.fromEntries(FOODS.map((f) => [f.id, f.kind]));
    expect(byId).toMatchObject({
      meat: 'meat',
      fish: 'meat',
      greens: 'plant',
      berries: 'plant',
      roots: 'plant',
    });
    for (const f of FOODS) expect(['plant', 'meat']).toContain(f.kind);
  });
});
