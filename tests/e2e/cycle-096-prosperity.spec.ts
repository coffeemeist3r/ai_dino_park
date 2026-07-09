import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Zone prosperity index (BACKLOG-428) — each zone's live stockpile + built structures + resident heads +
 * crops harvested fold into one score and a coarse tier (quiet/growing/thriving), shown as a badge on the
 * map lens (425). Milestone 2's closing structure arc. Driven headless via the pile/harvest/lens hooks.
 */

type W = Record<string, any>;

const prosperity = (p: Page, zone: string) => p.evaluate((z) => (window as W).__zoneProsperity(z), zone);
const zoneMap = (p: Page) => p.evaluate(() => (window as W).__zoneMap() as { id: string; tier: string }[]);

test('a zone reads a prosperity tier that climbs as its stockpile grows, and the map lens carries it', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // The grove starts empty of dinos, piles, and structures → nothing to read → 'quiet'.
  const start = await prosperity(page, 'grove');
  expect(start.score).toBe(0);
  expect(start.tier).toBe('quiet');

  // Bank a middling pile → the score crosses into 'growing'.
  await page.evaluate(() => (window as W).__setZonePile('grove', { branch: 8 }));
  expect((await prosperity(page, 'grove')).tier).toBe('growing');

  // A well-stocked pile → 'thriving'.
  await page.evaluate(() => (window as W).__setZonePile('grove', { branch: 8, stone: 8 }));
  expect((await prosperity(page, 'grove')).tier).toBe('thriving');

  // The map-lens model carries each zone's tier, and every entry has one.
  const model = await zoneMap(page);
  expect(model.find((e) => e.id === 'grove')?.tier).toBe('thriving');
  expect(model.every((e) => ['quiet', 'growing', 'thriving'].includes(e.tier))).toBe(true);

  // Open the map lens itself — drawing the badge row must not error.
  for (let i = 0; i < 6 && (await page.evaluate(() => (window as W).__lens())) !== 'map'; i++) {
    await page.evaluate(() => (window as W).__cycleLens());
  }
  expect(await page.evaluate(() => (window as W).__lens())).toBe('map');

  expect(errors).toEqual([]);
});

test('harvesting a zone plot feeds its farming term into the prosperity read', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  expect((await prosperity(page, 'grove')).signals.harvested).toBe(0);

  // Plant, ripen (crops advance over realtime-clock days), and harvest the grove plot.
  const planted = await page.evaluate(() => (window as W).__plantPlot('grove'));
  await page.evaluate((d) => (window as W).__setClock(d + 2, 8, 0), planted.plantedDay);
  await page.evaluate(() => (window as W).__stepWorld());
  await page.evaluate(() => (window as W).__harvestPlot('grove'));

  // The zone's harvest term ticked up (the per-zone counter, distinct from the global tally).
  expect((await prosperity(page, 'grove')).signals.harvested).toBe(1);

  expect(errors).toEqual([]);
});
