import { test, expect } from '@playwright/test';
import { boot } from './helpers';

type W = Record<string, any>;

/**
 * BACKLOG-110 / -279 — the hour gets into the voice.
 *
 * `__greetLine` is the **deterministic** line: the stub brain's reply, which is what a device with no model
 * download actually hears, and which had never once known what time it was. The first two tests are the
 * CHARTER v7 bar and touch no clock — a fresh save opens at 08:00 with four Bowl dinos three hours into a
 * day that started at five and Rex five hours from the end of a sleep that started at five. Same hour,
 * opposite standing, and until tonight the two said exactly the same thing.
 */
test.describe('BACKLOG-110/-279 — a greeting that knows the hour', () => {
  test('reads on frame one: a waking dino says it is only just up', async ({ page }) => {
    await boot(page);
    expect(await page.evaluate(() => (window as W).__clockNow().hour)).toBe(8);

    const line: string = await page.evaluate(() => (window as W).__greetLine('Sunny'));
    expect(line).toMatch(/just got up|only just up|barely had my eyes open/);
  });

  test('...and the dino asleep beside it says something else entirely', async ({ page }) => {
    await boot(page);

    // Rex is the Bowl's owl and it is eight in the morning: greeting it is waking it.
    expect(await page.evaluate(() => (window as W).__resting())).toContain('Rex');
    const rex: string = await page.evaluate(() => (window as W).__greetLine('Rex'));
    expect(rex).toMatch(/asleep|I was under|caught me/);

    const sunny: string = await page.evaluate(() => (window as W).__greetLine('Sunny'));
    expect(rex).not.toBe(sunny);
  });

  test('the same dino, later: mid-day it says nothing about the hour, at night it says it keeps its own', async ({
    page,
  }) => {
    await boot(page);

    // 17:00 — Rex has been up four hours, mid-span, park lit. The tell goes quiet, which is what keeps it
    // a tell and not a tic on every single greeting.
    await page.evaluate(() => (window as W).__advanceMinutes(9 * 60));
    const midday: string = await page.evaluate(() => (window as W).__greetLine('Rex'));
    expect(midday).not.toMatch(/asleep|only just up|quiet out here|everyone else is asleep/);

    // 23:00 — the park is dark and the owl is the one still up.
    await page.evaluate(() => (window as W).__advanceMinutes(6 * 60));
    const night: string = await page.evaluate(() => (window as W).__greetLine('Rex'));
    expect(night).toMatch(/quiet out here|everyone else is asleep|Nobody's ever up/);
    expect(night).not.toBe(midday);
  });

  test('the enrichment path is told the same fact', async ({ page }) => {
    await boot(page);
    const prompt: string = await page.evaluate(() => (window as W).__greetPrompt('Rex'));
    expect(prompt).toContain('You were fast asleep until this moment');
  });
});
