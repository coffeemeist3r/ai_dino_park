import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

/**
 * Milestone 27, cycle 181. BACKLOG-148: the last tone is in the next reply. BACKLOG-592: an answer moves the mind.
 * Both on the as-shipped founding state.
 */

type W = Record<string, any>;

async function crossBack(page: Page, name: string): Promise<string> {
  await page.evaluate((n) => (window as W).__migrate(n, 'grove'), name);
  await page.evaluate((n) => (window as W).__startMigrationTo(n, 'bowl'), name);
  for (let i = 0; i < 60; i++) {
    await page.evaluate(() => (window as W).__stepWorld());
    if (!(await page.evaluate(() => (window as W).__migrating() as string[])).includes(name)) break;
  }
  return (await page.evaluate(() => (window as W).__ticker() as string[])).join(' | ');
}

const pickTone = (page: Page, name: string, id: string) =>
  page.evaluate(({ name, id }) => (window as W).__pickTone(name, id) as Promise<string>, { name, id });

const ECHOES = /Ribbing me again\? Good\.|Teasing again\. Wonderful\./;

test('the second greet opens with what the dino made of the first — and two dinos make different things of it', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  const names = (await page.evaluate(() => (window as W).__dinoNames?.() ?? [])) as string[];
  const cast = names.length ? names : ['Rex', 'Mossback', 'Sunny', 'Twitch', 'Glade', 'Bramble', 'Pip', 'Ember'];
  const seen = new Set<string>();
  for (const n of cast) {
    const first = await pickTone(page, n, 'tease');
    expect(first).not.toMatch(ECHOES);
    const second = await pickTone(page, n, 'tease');
    const m = second.match(ECHOES);
    if (m) seen.add(m[0]);
  }
  expect(seen.size).toBe(2);
});

test('Rex is glad Sunny came back — and goes looking for her, a little closer for it', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  const before = (await page.evaluate(() => (window as W).__bond('Rex', 'Sunny'))) as number;
  const ticker = await crossBack(page, 'Sunny');
  expect(ticker).toContain('Rex glad it came');
  expect(ticker).toContain('👀 Rex goes looking for Sunny — for more of yesterday.');
  expect(await page.evaluate(() => (window as W).__seeking('Rex'))).toEqual({ name: 'Sunny', why: 'yesterday', arrived: false });
  expect(await page.evaluate(() => (window as W).__bond('Rex', 'Sunny'))).toBeGreaterThan(before); // +4, net of the ambient drift over the walk
});

test('Twitch bristles at Mossback — the feud warms, and Twitch is spoiling for it', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  const grudge = async () =>
    Object.entries((await page.evaluate(() => (window as W).__grudges())) as Record<string, number>).find(
      ([k]) => k.includes('Mossback') && k.includes('Twitch'),
    )?.[1] ?? 0;
  const before = await grudge();
  const ticker = await crossBack(page, 'Mossback');
  expect(ticker).toContain('Twitch bristles');
  expect(await grudge()).toBeGreaterThan(before);
  expect((await page.evaluate(() => (window as W).__seeking('Twitch'))).name).toBe('Mossback');
  expect(ticker).toContain('👀 Twitch goes looking for Mossback — spoiling for it.');
});
