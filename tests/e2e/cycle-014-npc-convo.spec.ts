import { test, expect } from '@playwright/test';

import { boot } from './helpers';

test('forcing a conversation yields a spoken line from a dino', async ({ page }) => {
  await boot(page);
  const convo = await page.evaluate(() =>
    ((window as Record<string, unknown>).__forceConverse as () => Promise<{ speaker: string; text: string } | null>)(),
  );
  expect(convo).not.toBeNull();
  expect(typeof convo!.speaker).toBe('string');
  expect(convo!.text.length).toBeGreaterThan(0);
});

test('wandering dinos cluster and meet (attraction)', async ({ page }) => {
  await boot(page);
  const meetCount = await page.evaluate(() => {
    const step = (window as Record<string, unknown>).__stepWorld as () => unknown;
    const meetings = (window as Record<string, unknown>).__meetings as () => Record<string, number>;
    for (let i = 0; i < 60; i++) step();
    return Object.keys(meetings()).length;
  });
  // With ~45% attraction over 60 steps, at least one pair should have met.
  expect(meetCount).toBeGreaterThanOrEqual(1);
});
