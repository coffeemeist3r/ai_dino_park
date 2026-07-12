/**
 * Diet split (BACKLOG-435) — the roster finally has a predator/prey read.
 *
 * For ninety-nine cycles every dino ate anything the keeper dropped and nothing hunted anything: the food
 * web (367) had no ground to stand on. This gives each dino a **diet** keyed off its species (paleobiology,
 * not personality) and tags each food a `plant` or `meat` kind, so "who eats what" — and, in 367, "who
 * stalks whom" — has a deterministic answer.
 *
 * Pure TypeScript (no Phaser, no WebLLM): Node-testable. **Data only this cycle** — `eats` is a read the
 * hunt (367) consults for *who hunts*; it is deliberately NOT wired into the feeding loop, so an herbivore
 * still eats a meat drop from the hatch exactly as before (the meat-only feeding rule is a later beat).
 */

export type Diet = 'carnivore' | 'herbivore';
export type FoodKind = 'plant' | 'meat';

/**
 * Species → diet by paleobiology. The starting roster's only theropod, the compsognathus (Twitch), is the
 * bowl's sole carnivore; the big four (triceratops/stegosaurus/brontosaurus/parasaurolophus) graze. A
 * species absent here falls back to a deterministic name+species hash, biased toward herbivore so bred /
 * future dinos mostly graze — the bowl stays predator-sparse by construction.
 */
export const SPECIES_DIET: Readonly<Record<string, Diet>> = {
  triceratops: 'herbivore',
  stegosaurus: 'herbivore',
  brontosaurus: 'herbivore',
  parasaurolophus: 'herbivore',
  compsognathus: 'carnivore',
};

/** FNV-1a over a string — a small, stable, dependency-free hash for the diet fallback. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * A dino's diet. Known species resolve by the table; an unknown species resolves deterministically from a
 * `species:name` hash, landing carnivore only ~1 in 5 (herbivore-biased) so the bowl doesn't fill with
 * predators. Same input → same diet, forever (no save field needed).
 */
export function dietOf(species: string, name = ''): Diet {
  const known = SPECIES_DIET[species.toLowerCase()];
  if (known) return known;
  return hash(`${species.toLowerCase()}:${name.toLowerCase()}`) % 5 === 0 ? 'carnivore' : 'herbivore';
}

export function isCarnivore(species: string, name = ''): boolean {
  return dietOf(species, name) === 'carnivore';
}

export function isHerbivore(species: string, name = ''): boolean {
  return dietOf(species, name) === 'herbivore';
}

/** Does a diet eat a food of this kind? Carnivores eat meat, herbivores eat plants — a pure read (365). */
export function eats(diet: Diet, kind: FoodKind): boolean {
  return (diet === 'carnivore') === (kind === 'meat');
}
