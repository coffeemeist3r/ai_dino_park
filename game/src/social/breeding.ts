/**
 * Egg phase (BACKLOG-042) — when two high-bond dinos share a sleeping huddle on
 * a clear night, an egg may appear by the den and, after a few in-game days,
 * hatch into a brand-new dino whose traits are blended from the two parents.
 *
 * Pure TypeScript (no Phaser): all the decisions and the trait math run in Node
 * for tests. The Phaser glue (sprites, spawning the new Dino) lives in WorldScene.
 */

import type { Personality } from '../ai/personality';
import { AXES, describePersonality } from '../ai/personality';
import { pairKey } from './meetings';

export const EGG_HATCH_DAYS = 3; // in-game days from laid → hatched
export const EGG_BOND_THRESHOLD = 60; // strongest pair bond (0–100) needed to lay
export const MAX_POPULATION = 12; // hard cap so the park can't runaway-breed

/** A clutch laid by a bonded pair, waiting to hatch. */
export interface Egg {
  id: string; // stable: pair + lay day
  parentA: string;
  parentB: string;
  layedDay: number;
  hatchDay: number;
  tileX: number;
  tileY: number;
}

/** A dino born in-world (not from the static ROSTER) — persisted so it survives reload. */
export interface BornDino {
  name: string;
  species: string;
  personality: string; // rendered phrase fed to the brain prompt
  traits: Personality;
  color: number;
  tileX: number;
  tileY: number;
  parents: [string, string]; // lineage, surfaced in the collection book
}

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

/**
 * Blend two parents' traits: per-axis average plus a small deterministic jitter
 * (±0.1) so siblings aren't identical. `rand` returns 0..1; default 0.5 → no jitter
 * (pure average), which keeps the math testable.
 */
export function blendTraits(a: Personality, b: Personality, rand: () => number = () => 0.5): Personality {
  const out = {} as Personality;
  for (const axis of AXES) {
    const avg = (a[axis.key] + b[axis.key]) / 2;
    out[axis.key] = clamp01(avg + (rand() - 0.5) * 0.2);
  }
  return out;
}

/** Average two packed 0xRRGGBB colors channel-wise. */
export function blendColor(a: number, b: number): number {
  const mix = (shift: number): number => {
    const ca = (a >> shift) & 0xff;
    const cb = (b >> shift) & 0xff;
    return (ca + cb) >> 1;
  };
  return (mix(16) << 16) | (mix(8) << 8) | mix(0);
}

/**
 * Name the hatchling from its parents: prefix of one + suffix of the other.
 * Deterministic given the parent order; the caller dedupes against live names.
 */
export function childName(a: string, b: string): string {
  const head = a.slice(0, Math.min(a.length, Math.ceil(a.length / 2) + 1));
  const tail = b.slice(Math.floor(b.length / 2)).toLowerCase();
  const name = head + tail;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function eggId(a: string, b: string, day: number): string {
  return `${pairKey(a, b)}@${day}`;
}

export interface LayOpts {
  bond: number; // strongest bond between the pair
  population: number; // current live dino count
  isClearNight: boolean;
  bothHuddling: boolean;
  hasEggForPair: boolean; // a clutch from this pair is already waiting
}

/** Decide whether a bonded, huddling pair lays an egg this moment. */
export function shouldLay(o: LayOpts): boolean {
  return (
    o.isClearNight &&
    o.bothHuddling &&
    !o.hasEggForPair &&
    o.bond >= EGG_BOND_THRESHOLD &&
    o.population < MAX_POPULATION
  );
}

export function makeEgg(a: string, b: string, day: number, tile: { tileX: number; tileY: number }): Egg {
  return {
    id: eggId(a, b, day),
    parentA: a,
    parentB: b,
    layedDay: day,
    hatchDay: day + EGG_HATCH_DAYS,
    tileX: tile.tileX,
    tileY: tile.tileY,
  };
}

export function isHatched(egg: Egg, day: number): boolean {
  return day >= egg.hatchDay;
}

export interface HatchParents {
  traitsA: Personality;
  traitsB: Personality;
  speciesA: string;
  speciesB: string;
  colorA: number;
  colorB: number;
}

/**
 * Produce the new dino an egg hatches into. `name` is supplied by the caller
 * (already deduped). Species is inherited from one parent (rand < 0.5 → A), color
 * is blended, traits are blended, and the personality phrase is rendered from the
 * blended traits so the brain prompt reflects the mix.
 */
export function hatch(egg: Egg, p: HatchParents, name: string, rand: () => number = () => 0.5): BornDino {
  const traits = blendTraits(p.traitsA, p.traitsB, rand);
  return {
    name,
    species: rand() < 0.5 ? p.speciesA : p.speciesB,
    personality: `young, ${describePersonality(traits)}, child of ${egg.parentA} and ${egg.parentB}`,
    traits,
    color: blendColor(p.colorA, p.colorB),
    tileX: egg.tileX,
    tileY: egg.tileY,
    parents: [egg.parentA, egg.parentB],
  };
}
