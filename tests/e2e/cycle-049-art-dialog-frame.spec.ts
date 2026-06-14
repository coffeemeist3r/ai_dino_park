import { test, expect } from '@playwright/test';

type W = Record<string, unknown>;

import { boot } from './helpers';

test('the Gen3 pixel dialog frame bakes and the message box still pages', async ({ page }) => {
  await boot(page);

  // The 9-slice frame texture baked on scene create (BACKLOG-036).
  expect(await page.evaluate(() => ((window as W).__dialogFrameBaked as () => boolean)())).toBe(true);

  // The box still works exactly as before — the keeper picker (K) is reliably multi-page.
  await page.keyboard.press('KeyK');
  const info = await page.evaluate(() =>
    ((window as W).__dialogPage as () => { page: number; pages: number; text: string })(),
  );
  expect(info.pages).toBeGreaterThan(1);
  expect(info.page).toBe(0);
  expect(typeof info.text).toBe('string');

  // Paging still turns under the new frame.
  await page.keyboard.press('KeyE');
  expect(await page.evaluate(() => ((window as W).__dialogPage as () => { page: number })().page)).toBe(1);
});
