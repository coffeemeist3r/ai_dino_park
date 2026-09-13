/**
 * BACKLOG-070 — the dish turned down.
 *
 * Three properties matter more than the individual cases, and they are the last three blocks here: a
 * favorite is never refused by anyone; hunger always wins; and a refuser and a gobbler can never be the
 * same dino, which is what lets `checkFeeding` run the refusal branch ahead of the contest without a
 * special case tying the two together.
 */

import { describe, it, expect } from 'vitest';
import { GOBBLE_HUNGER, PICKY_AGREE, PICKY_HUNGER, gobblesFood, refusedMemory, refusesFood } from './feeding';
import { PRICKLY_MAX } from '../ai/brain';
import { FOODS, favoriteFood, foodReaction } from './foods';
import { SEASONS, type Season } from './seasons';
import { seededPersonality } from '../ai/personality';
import { ROSTER } from '../entities/roster';

const ROSTER_TRAITS = ROSTER.map((r) => ({ name: r.name, traits: seededPersonality(r.name) }));

describe('the prickly cutoff is pinned, not guessed', () => {
  it('is the same value the rest of the park calls prickly', () => {
    // Declared in feeding.ts rather than imported from brain.ts (which pulls in WebLLMBrain and may not
    // cross the CHARTER's hard boundary into a pure world module). This is the thing that keeps the two
    // honest: move either and this reddens.
    expect(PICKY_AGREE).toBe(PRICKLY_MAX);
  });

  it('shares the gobbler hunger bar, which is what makes the two poles disjoint', () => {
    expect(PICKY_HUNGER).toBe(GOBBLE_HUNGER);
  });
});

describe('refusesFood (BACKLOG-070)', () => {
  it('a prickly, unhungry dino turns down a food that is not its favorite', () => {
    expect(refusesFood(0.1, false, 0)).toBe(true);
  });

  it('a warm dino eats anything', () => {
    expect(refusesFood(0.9, false, 0)).toBe(false);
    expect(refusesFood(PICKY_AGREE + 0.01, false, 0)).toBe(false);
  });

  it('is inclusive at the cutoff — a dino exactly at PICKY_AGREE is prickly', () => {
    expect(refusesFood(PICKY_AGREE, false, 0)).toBe(true);
  });

  it('a hungry dino eats what it is given, however prickly', () => {
    expect(refusesFood(0, false, PICKY_HUNGER)).toBe(false);
    expect(refusesFood(0, false, 1)).toBe(false);
  });

  it('names the dish it walked away from', () => {
    expect(refusedMemory('leafy greens')).toContain('leafy greens');
  });
});

describe('the three properties', () => {
  it('a favorite is never refused — whole founding roster, every food, every season', () => {
    for (const { name, traits } of ROSTER_TRAITS) {
      for (const season of SEASONS as ReadonlyArray<Season>) {
        const fav = favoriteFood(traits, season);
        for (const food of FOODS) {
          const { favorite } = foodReaction(food, traits, season);
          if (!favorite) continue;
          expect(food.id, `${name}/${season}`).toBe(fav.id);
          for (const hunger of [0, 0.25, 0.5, 1]) {
            expect(refusesFood(traits.agreeableness, true, hunger), `${name}/${season}/${food.id}`).toBe(false);
          }
        }
      }
    }
  });

  it('nobody is picky at or above the hunger bar', () => {
    for (let a = 0; a <= 1.0001; a += 0.05) {
      for (const hunger of [PICKY_HUNGER, 0.75, 1]) {
        expect(refusesFood(a, false, hunger), `a=${a.toFixed(2)} h=${hunger}`).toBe(false);
      }
    }
  });

  it('a gobbler is never a refuser — the two poles cannot claim the same dino', () => {
    for (let a = 0; a <= 1.0001; a += 0.05) {
      for (let h = 0; h <= 1.0001; h += 0.05) {
        if (!gobblesFood(h, a)) continue;
        expect(refusesFood(a, false, h), `a=${a.toFixed(2)} h=${h.toFixed(2)}`).toBe(false);
      }
    }
  });
});

describe('the founding bowl can actually show this (the reachability half)', () => {
  it('holds at least one dino prickly enough to refuse on the first frame', () => {
    const refusers = ROSTER_TRAITS.filter((r) => refusesFood(r.traits.agreeableness, false, 0));
    expect(refusers.length, 'nobody in the founding roster would ever turn a dish down').toBeGreaterThan(0);
  });

  it('also holds at least one dino that will eat anything, so the piece still gets eaten', () => {
    const eaters = ROSTER_TRAITS.filter((r) => !refusesFood(r.traits.agreeableness, false, 0));
    expect(eaters.length).toBeGreaterThan(0);
  });
});
