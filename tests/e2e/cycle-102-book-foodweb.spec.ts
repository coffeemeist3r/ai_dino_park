import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Predator/prey in the book (BACKLOG-443). The collection book reads each dino's food-web standing out of
 * the memory the hunt already files: a carnivore's catches (437's `you brought down a meal`), a herbivore's
 * escapes (367's `you slipped <hunter>'s hunt`). A dino with no food-web history shows no line.
 */

type W = Record<string, any>;

const remember = (p: import('@playwright/test').Page, name: string, event: string) =>
  p.evaluate(({ name, event }) => (window as W).__remember(name, event), { name, event });

test('the book reads a carnivore its catches and a herbivore its escapes', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // Twitch (compsognathus) is the bowl's carnivore; Rex (triceratops) grazes.
  await remember(page, 'Twitch', 'you brought down a meal');
  await remember(page, 'Twitch', 'you brought down a meal');
  await remember(page, 'Rex', `you slipped Twitch's hunt`);

  const rows = await page.evaluate(() => (window as W).__bookRows() as Array<{ name: string; foodweb?: string }>);
  const byName = Object.fromEntries(rows.map((r) => [r.name, r]));

  expect(byName.Twitch.foodweb).toBe('🦖 brought down 2 meals');
  expect(byName.Rex.foodweb).toBe('💨 slipped 1 hunt');
  // Glade has no food-web history → no line.
  expect(byName.Glade.foodweb).toBeUndefined();

  // and it actually renders in the book text
  const text = await page.evaluate(() => (window as W).__bookText() as string);
  expect(text).toContain('🦖 brought down 2 meals');
  expect(text).toContain('💨 slipped 1 hunt');

  expect(errors).toEqual([]);
});
