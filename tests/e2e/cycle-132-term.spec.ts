import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The seat has a term (BACKLOG-484) — the council (479) stops being re-derived on every read. It is held
 * between in-game day boundaries, so a ground that banks a unit mid-term does *not* reseat under the vote
 * (481), and a membership change lands one 🗳️ beat when the term actually turns over.
 *
 * Everything is asserted through the production reads (`__councils`, `__councilVotes`) — the same calls the
 * lens, the book and `workPriorityFor` go through — so a held seating that failed to reach the vote would
 * fail here.
 */

type W = Record<string, any>;

const roster = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const councils = (p: Page) => p.evaluate(() => (window as W).__councils() as Record<string, string[]>);
const seating = (p: Page) => p.evaluate(() => (window as W).__seating() as { seats: Record<string, string[]> | null; day: number });
const term = (p: Page) => p.evaluate(() => (window as W).__forceTerm());
const votes = (p: Page, z: string) => p.evaluate((zz) => (window as W).__councilVotes(zz), z);
const ticker = (p: Page) => p.evaluate(() => ((window as W).__ticker() as string[]).join(' | '));
const step = (p: Page) => p.evaluate(() => (window as W).__stepWorld());
const bank = (p: Page, n: string, k: number) => p.evaluate(([nn, kk]) => (window as W).__creditBank(nn, kk), [n, k]);
const zoneOfDino = (p: Page, n: string) => p.evaluate((nn) => (window as W).__homeZone(nn) as string, n);

/** Six residents on one ground seat the full three (479's one-per-two-heads rule). The park ships with
 *  five, so the sixth is hatched — the same path the game grows on. Mirrors cycle-129's `seatThree`. */
async function seatThree(page: Page): Promise<{ zone: string; here: string[] }> {
  const names = await roster(page);
  await page.evaluate(([a, b]) => (window as W).__layEgg(a, b), [names[0], names[1]]);
  await page.evaluate(() => (window as W).__forceHatch());
  const grown = await roster(page);
  const zone = await zoneOfDino(page, grown[0]);
  const here: string[] = [];
  for (const n of grown) if ((await zoneOfDino(page, n)) === zone) here.push(n);
  expect(here.length).toBeGreaterThanOrEqual(6);
  await bank(page, here[0], 6);
  await bank(page, here[1], 4);
  await bank(page, here[2], 2);
  return { zone, here };
}

test('a park that has held no term reads live — boot is exactly the pre-484 park', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  expect((await seating(page)).seats).toBeNull(); // no term held yet
  expect(Object.values(await councils(page)).every((s) => s.length === 0)).toBe(true);

  // Banking seats a ground *immediately*, with no term held — the live fallthrough, unchanged behaviour.
  const { zone, here } = await seatThree(page);
  expect((await councils(page))[zone]).toEqual(here.slice(0, 3));
  expect((await votes(page, zone)).seats).toEqual(here.slice(0, 3));

  expect(errors).toEqual([]);
});

test('the seats hold through the term — a mid-term banker does not take a seat', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const { zone, here } = await seatThree(page);
  const seated = here.slice(0, 3);
  await term(page); // the first seating: held, and silent
  expect((await seating(page)).seats![zone]).toEqual(seated);
  expect(await ticker(page)).not.toContain("council turns over");

  // A fourth dino out-banks every seat. Before 484 this reseated the ground on the very next read.
  await bank(page, here[3], 20);
  await step(page);

  expect((await councils(page))[zone]).toEqual(seated); // the seats did not move...
  expect((await votes(page, zone)).seats).toEqual(seated); // ...and the vote is held to the same three
  expect(await ticker(page)).not.toContain('council turns over');

  expect(errors).toEqual([]);
});

test('the term moves them, once, and names the ground', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const { zone, here } = await seatThree(page);
  await term(page);
  await bank(page, here[3], 20);
  await term(page); // the day turns: the electorate is re-derived

  const seats = (await councils(page))[zone];
  expect(seats[0]).toBe(here[3]); // the new top banker takes the ground
  expect(seats).toContain(here[0]);

  const log = await ticker(page);
  expect(log).toContain('council turns over');
  expect(log.split('council turns over').length - 1).toBe(1); // exactly one beat

  // A term that changes nothing says nothing.
  await term(page);
  expect((await ticker(page)).split('council turns over').length - 1).toBe(1);

  expect(errors).toEqual([]);
});

test('the held seating survives a reload, and the seats do not silently re-derive', async ({ page }) => {
  await boot(page);

  const { zone, here } = await seatThree(page);
  await term(page);
  const seated = (await seating(page)).seats![zone];
  await page.evaluate(() => (window as W).__saveNow());

  await boot(page);
  const after = await seating(page);
  expect(after.seats![zone]).toEqual(seated);
  expect((await councils(page))[zone]).toEqual(seated);

  // A restore arms the term day, so the first live hour after it holds no election against a day it
  // never watched — the seats stay put until a genuine boundary.
  await bank(page, here[3], 20);
  await step(page);
  expect((await councils(page))[zone]).toEqual(seated);
});
