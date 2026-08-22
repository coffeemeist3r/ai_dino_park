import { test, expect, type Page } from '@playwright/test';
import { boot, gatherToBowl } from './helpers';

/**
 * Warmed by the catch (BACKLOG-422). 420's three registers climbed and then changed nothing — close the
 * dialog and the save file was identical. Now the register is the price: pleased 2, teasing 3, resigned 4,
 * one full climb per solitary stretch, four climbs per lifetime, the lifetime half in the save.
 *
 * Everything goes through the real `__pickTone` greet path, exactly as the 420 spec does.
 */

type W = Record<string, any>;

const names = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const setHearts = (p: Page, n: string, h: number) =>
  p.evaluate(([nn, hh]) => (window as W).__setHearts(nn, hh), [n, h] as const);
const inventTic = (p: Page, n: string) => p.evaluate((nn) => (window as W).__inventTic(nn), n);
const greet = (p: Page, n: string) => p.evaluate((nn) => (window as W).__pickTone(nn, 'warm') as Promise<string>, n);
const points = (p: Page, n: string) =>
  p.evaluate((nn) => ((window as W).__friendshipPoints() as Record<string, number>)[nn] ?? 0, n);
const warmth = (p: Page, n: string) =>
  p.evaluate((nn) => (window as W).__catchWarmth(nn) as { stretch: number; life: number }, n);
const ticker = (p: Page) => p.evaluate(() => (window as W).__ticker() as string[]);
const dismiss = (p: Page) => p.keyboard.press('X').catch(() => undefined);

async function greetAgain(page: Page, name: string): Promise<string> {
  await dismiss(page);
  await inventTic(page, name);
  return greet(page, name);
}

test('the climb is the price — 2, then 3, then 4, then nothing', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);
  await gatherToBowl(page);

  const [fond] = await names(page);
  // Above the fond floor and well below the lifetime ceiling, so every catch this stretch is paid in full.
  await setHearts(page, fond, 8);
  await inventTic(page, fond);

  const ledger: number[] = [];
  let last = 0;
  const startPoints = await points(page, fond);
  for (let i = 0; i < 4; i++) {
    if (i === 0) await greet(page, fond);
    else await greetAgain(page, fond);
    const now = (await warmth(page, fond)).stretch;
    ledger.push(now - last);
    last = now;
  }
  // Criteria 2/3: the register's own price each time, and the fourth catch pays nothing. Measured on the
  // warmth ledger rather than on raw points, because the greet path applies its own tone gain (142) in the
  // same call and a points delta would be asserting over two features at once.
  expect(ledger).toEqual([2, 3, 4, 0]);
  expect(await warmth(page, fond)).toEqual({ stretch: 9, life: 9 });
  // Criterion 6: and the warmth does reach the actual bond — points rose by at least the climb.
  expect((await points(page, fond)) - startPoints).toBeGreaterThanOrEqual(9);

  expect(errors).toEqual([]);
});

test('a stranger is found for free — the flatness is the tell, in points too', async ({ page }) => {
  await boot(page);
  await gatherToBowl(page);

  const stranger = (await names(page))[1];
  await setHearts(page, stranger, 0);
  await inventTic(page, stranger);

  const before = await points(page, stranger);
  await greet(page, stranger);
  await greetAgain(page, stranger);
  await greetAgain(page, stranger);
  // Criterion 1 in-game: the bashful reading is worth nothing however often you find it. The greet path's
  // own tone gain (142) is a separate thing and is not what this asserts — the warmth ledger is.
  expect(await warmth(page, stranger)).toEqual({ stretch: 0, life: 0 });
  expect(await points(page, stranger)).toBeGreaterThanOrEqual(before);
});

test('a new stretch refills the budget; the lifetime ceiling does not', async ({ page }) => {
  await boot(page);
  await gatherToBowl(page);

  const [fond] = await names(page);
  await setHearts(page, fond, 8);
  await inventTic(page, fond);
  await greet(page, fond);
  expect((await warmth(page, fond)).stretch).toBe(2);

  // Criterion 6: the stretch ends (company, or a need) and the per-stretch budget goes with it — while the
  // lifetime tally, which is the thing that stops the warmth being farmable, does not.
  await page.evaluate((n) => (window as W).__resetTic?.(n), fond);
  const after = await warmth(page, fond);
  expect(after.stretch).toBe(0);
  expect(after.life).toBe(2);
});

test('the warming lands one beat per stretch', async ({ page }) => {
  await boot(page);
  await gatherToBowl(page);

  const [fond] = await names(page);
  await setHearts(page, fond, 8);
  await inventTic(page, fond);

  const beats = async () => (await ticker(page)).filter((l) => l.includes(fond) && l.includes('being found')).length;

  await greet(page, fond);
  await greetAgain(page, fond);
  await greetAgain(page, fond);
  // Criterion 8: three paid catches, one line. The stretch is the unit the feature is denominated in, so
  // it is the unit the ticker reports in — not one line per greet.
  expect(await beats()).toBe(1);

  // A fresh stretch is a fresh beat.
  await page.evaluate((n) => (window as W).__resetTic?.(n), fond);
  await dismiss(page);
  await inventTic(page, fond);
  await greet(page, fond);
  expect(await beats()).toBe(2);
});
