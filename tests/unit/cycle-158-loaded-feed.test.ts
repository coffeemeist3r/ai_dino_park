import { describe, it, expect } from 'vitest';
import {
  FOODS,
  FEED_AUTO,
  FEED_AUTO_LABEL,
  feedChoices,
  cycleFeed,
  feedChoiceIndex,
} from '../../game/src/world/foods';
import { feedLine, HELP_ROWS, helpLines } from '../../game/src/ui/controlsHelp';

/**
 * BACKLOG-067 — the loaded feed.
 *
 * The assertion that earns its keep is the derivation one: `feedChoices()` is `FOODS` plus a slot, in
 * `FOODS` order, so the next crop food joins the selector without anybody remembering to add it. Three
 * crop foods have been added to `FOODS` since cycle 61 and a hand-copied list would have missed all three.
 */
describe('feedChoices', () => {
  it('opens with the random handful — the as-shipped drop, and the default', () => {
    expect(feedChoices()[0]).toEqual({ id: FEED_AUTO, label: FEED_AUTO_LABEL });
  });

  it('is FOODS plus that one slot, in FOODS order', () => {
    const choices = feedChoices();
    expect(choices).toHaveLength(FOODS.length + 1);
    expect(choices.slice(1).map((c) => c.id)).toEqual(FOODS.map((f) => f.id));
  });

  it('every food label carries its own emoji, so the HUD reads as food and not as a word list', () => {
    for (const [i, food] of FOODS.entries()) {
      expect(feedChoices()[i + 1].label).toContain(food.emoji);
      expect(feedChoices()[i + 1].label).toContain(food.label);
    }
  });
});

describe('cycleFeed', () => {
  it('steps forward', () => {
    expect(cycleFeed(0, 1)).toBe(1);
  });

  it('wraps backwards off the front to the last food', () => {
    expect(cycleFeed(0, -1)).toBe(FOODS.length);
  });

  it('wraps forwards off the end to the random handful', () => {
    expect(cycleFeed(FOODS.length, 1)).toBe(0);
  });
});

describe('feedChoiceIndex', () => {
  it('finds a known food', () => {
    expect(feedChoices()[feedChoiceIndex('meat')].id).toBe('meat');
  });

  it('an absent field is the random handful — the pre-158 save', () => {
    expect(feedChoiceIndex(undefined)).toBe(0);
  });

  it('an id this build has never heard of loads as the random handful rather than refusing', () => {
    expect(feedChoiceIndex('kelp')).toBe(0);
  });
});

describe('the HUD and help rows', () => {
  it('the feed line names the food and no keys', () => {
    expect(feedLine('🍖 hunk of meat')).toBe('Feed: 🍖 hunk of meat');
    expect(feedLine('🍖 hunk of meat')).not.toMatch(/switch|drop|,|\./);
  });

  it('the help panel teaches the binding, and still fits its column', () => {
    expect(HELP_ROWS.some((r) => r.keys === ', .' && r.action === 'switch loaded feed')).toBe(true);
    for (const line of helpLines()) expect(line.length).toBeLessThan(40);
  });
});
