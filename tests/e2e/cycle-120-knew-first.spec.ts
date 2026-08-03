import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The one who knew first (BACKLOG-364) — Milestone 10's second lore arc. The pure halves are unit-covered;
 * these prove the integration: that the running park records where each dino has actually been, and that a
 * dino which has been somewhere its friend hasn't keeps the telling as its own standing.
 */

type W = Record<string, any>;

const events = (p: Page) => p.evaluate(() => (window as W).__events() as string[]);
const seen = (p: Page) => p.evaluate(() => (window as W).__seenZones() as Record<string, string[]>);

test('every dino starts knowing exactly the ground it lives on', async ({ page }) => {
  await boot(page);
  const map = await seen(page);
  expect(Object.keys(map).length).toBeGreaterThan(1);
  for (const zones of Object.values(map)) expect(zones).toEqual(['bowl']);
});

test('crossing a ground adds it to what a dino has seen, and coming home keeps it', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__migrate('Twitch', 'grove'));
  await page.evaluate(() => (window as W).__migrate('Twitch', 'bowl'));
  expect((await seen(page)).Twitch).toEqual(['bowl', 'grove']);
});

test('showing a friend a ground it has never seen leaves the teller the standing', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__migrate('Twitch', 'hollow'));
  await page.evaluate(() => (window as W).__migrate('Twitch', 'bowl'));

  expect(await page.evaluate(() => (window as W).__teach('Twitch', 'Sunny') as boolean)).toBe(true);
  const log = (await events(page)).join('\n');
  expect(log).toMatch(/🚩 Twitch tells Sunny about The Hollow — they'd never been/);

  const book = await page.evaluate(() => (window as W).__bookText() as string);
  expect(book).toContain('showed 1 other the way to The Hollow');

  // Told once is told: the same pair with nothing new between them teaches nothing.
  expect(await page.evaluate(() => (window as W).__teach('Twitch', 'Sunny') as boolean)).toBe(false);
  const tellings = (await events(page)).filter((e) => e.includes('tells Sunny about The Hollow'));
  expect(tellings).toHaveLength(1);
});

test('a dino with nothing new to show says nothing', async ({ page }) => {
  await boot(page);
  // Both have only ever seen the bowl.
  expect(await page.evaluate(() => (window as W).__teach('Sunny', 'Twitch') as boolean)).toBe(false);
  expect(await page.evaluate(() => (window as W).__teach('Sunny', 'Sunny') as boolean)).toBe(false);
});
