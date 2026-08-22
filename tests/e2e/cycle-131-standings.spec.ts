import { test, expect, type Page } from '@playwright/test';
import { boot, emptyGrounds } from './helpers';

/**
 * One place the standings are derived (BACKLOG-482). A behaviour-preserving fold: the same dinos hold the
 * same standings, the book and the lens print the same strings, and `__councils` — which four specs
 * depend on — answers exactly what it answered before. The new `__standings` is the folded read behind it.
 */

type W = Record<string, any>;

interface Standing {
  zone: string;
  kind: 'pioneer' | 'provider' | 'council';
  holders: string[];
}

const standings = (p: Page) => p.evaluate(() => (window as W).__standings() as Standing[]);
const councils = (p: Page) => p.evaluate(() => (window as W).__councils() as Record<string, string[]>);
const mapText = (p: Page) => p.evaluate(() => ((window as W).__zoneMapText() as string[]).join(' | '));
const bookText = (p: Page) => p.evaluate(() => (window as W).__bookText() as string);
const roster = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));

test('a fresh park seats nobody and prints no standing line', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);
  await emptyGrounds(page); // BACKLOG-492: the founding Grove now seats a council; this spec's subject is not the founding state

  // Nothing has been banked and nothing has been crossed into, so the whole read is inert.
  expect(await standings(page)).toEqual([]);
  expect(Object.values(await councils(page)).every((s) => s.length === 0)).toBe(true);
  expect(await mapText(page)).not.toContain('👥');
  expect(await bookText(page)).not.toContain('👥 one of');

  expect(errors).toEqual([]);
});

test('banking seats a council, and every consumer reads the same seat', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);
  await emptyGrounds(page); // BACKLOG-492: the founding Grove now seats a council; this spec's subject is not the founding state

  const [first] = await roster(page);
  // Past PROVIDER_BANKS (3) so this exercises the provider standing as well as the council seat.
  await page.evaluate((n) => (window as W).__creditBank(n, 4), first);
  const zone = await page.evaluate((n) => (window as W).__homeZone(n) as string, first);

  // The folded read and the hook four other specs use agree, name for name.
  const all = await standings(page);
  const seat = all.find((s) => s.kind === 'council' && s.zone === zone);
  expect(seat!.holders).toEqual([first]);
  expect((await councils(page))[zone]).toEqual([first]);

  // ...and the strings the player actually sees are the pre-fold strings.
  expect(await mapText(page)).toContain('👥1');
  expect(await bookText(page)).toContain('👥 one of');
  expect(await page.evaluate((z) => (window as W).__zoneProvider(z), zone)).toBe(first);

  expect(errors).toEqual([]);
});
