import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The gate that was written for one door (BACKLOG-489) — the reachable half.
 *
 * A freshness gate keyed by *ground* cannot tell "this ground has never spoken" from "this authority has
 * never spoken". On a fresh save the Grove ships a derelict landmark (488), so its bill speaks first and
 * records `gather` under the ground's name. From that moment the Grove's **council** is inaudible: when the
 * ruin is mended and the ground goes back to deciding for itself, the value has not changed, so the old gate
 * said nothing at all — the player watched an emergency end and was never told the emergency was over.
 *
 * With the gate keyed by cause, the council has never spoken and is heard.
 */

type W = Record<string, any>;

const ticker = (p: Page) => p.evaluate(() => (window as W).__ticker() as string[]);
const step = (p: Page) => p.evaluate(() => (window as W).__stepWorld());
const setZone = (p: Page, z: string) => p.evaluate((zz) => (window as W).__setZone(zz), z);
const stepMend = (p: Page) => p.evaluate(() => (window as W).__stepMend());
const derelict = (p: Page) =>
  p.evaluate(() => ((window as W).__landmarks('grove') as { derelict: boolean }[]).filter((l) => l.derelict).length);

const councilLines = (lines: string[]) => lines.filter((l) => l.includes('Grove') && l.includes("council calls it"));
const billLines = (lines: string[]) => lines.filter((l) => l.includes('Grove') && l.includes('walls are coming down'));

test('the bill still speaks first on a fresh save (485, unchanged)', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);
  await step(page);

  const lines = await ticker(page);
  expect(billLines(lines).length).toBe(1);

  expect(errors).toEqual([]);
});

test('THE ITEM — when the ruin is mended, the ground says who is deciding now', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);
  await step(page);

  await setZone(page, 'grove'); // the errand resolves where the player is watching (the 488 spec's own driver)
  expect(await derelict(page)).toBe(1);
  // Nothing from the council yet: while the ruin stands, `calledWork` overrides the ground's own vote and
  // the bill is the only authority the gate has heard from.
  expect(councilLines(await ticker(page)).length).toBe(0);

  // 488's own errand, driven through the production path — a resident walks to the ruin and patches it.
  for (let i = 0; i < 400 && (await derelict(page)) > 0; i++) await stepMend(page);
  expect(await derelict(page)).toBe(0);

  await step(page);
  const after = councilLines(await ticker(page));
  // Pre-489 this was silent, and the exact reason is visible in the line itself: the council calls
  // `gather` — "fills its stores first" — which is the very value the bill had already recorded under the
  // ground's name, so the old gate's `last !== call` test was false and nothing was said. The council is a
  // different authority that had never been heard, and now it is.
  expect(after).toEqual(["🗳️ the The Grove's council calls it: fills its stores first"]);

  // ...and only once. A second step with nothing changed announces nothing.
  await step(page);
  expect(councilLines(await ticker(page)).length).toBe(after.length);

  expect(errors).toEqual([]);
});
