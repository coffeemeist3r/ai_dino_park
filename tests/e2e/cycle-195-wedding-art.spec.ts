import { test, expect } from '@playwright/test';
import { boot, foundingState } from './helpers';

type W = Record<string, any>;

/** BACKLOG-626: the wedding mark renders as the baked rig, not the 💍 fallback. */
test('the wedding mark is drawn (BACKLOG-626)', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await page.evaluate(() => { const w = window as W; w.__setClock(1, 14, 0); w.__court('Rex', 'Sunny'); w.__setClock(1, 15, 0); w.__holdWedding(); });
  expect(await page.evaluate(() => (window as W).__weddingMark())).toMatchObject({ drawn: true, visible: true });
});
