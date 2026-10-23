import { test, expect } from '@playwright/test';
import { boot, foundingState } from './helpers';

type W = Record<string, any>;

/** BACKLOG-623: a pair's nest renders as the baked rig, not the 🪺 fallback. */
test('the nest is drawn (BACKLOG-623)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await page.evaluate(() => { (window as W).__setClock(1, 9, 0); (window as W).__court('Mossback', 'Glade'); });
  const nests = await page.evaluate(() => (window as W).__nests() as Array<{ drawn: boolean; visible: boolean }>);
  expect(nests).toEqual([expect.objectContaining({ drawn: true, visible: true })]);
});
