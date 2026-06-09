import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

// BACKLOG-155 — selectable keeper. The roster + affinity-fit are pure (keepers.ts), so the ability
// is observable headless even without WebGPU. The starting cast is the fixed roster (entities/roster.ts).

type W = Record<string, unknown>;
const NAMES = ['Rex', 'Mossback', 'Sunny', 'Twitch', 'Glade'];
const KEEPER_IDS = ['aether', 'vanta', 'lumen'];

const keeper = (p: Page) => p.evaluate(() => ((window as W).__keeper as () => string)());
const pickerOpen = (p: Page) => p.evaluate(() => ((window as W).__keeperPickerOpen as () => boolean)());
const pickKeeper = (p: Page, id: string) =>
  p.evaluate((x) => ((window as W).__pickKeeper as (i: string) => string)(x), id);
const fpoints = (p: Page) =>
  p.evaluate(() => ((window as W).__friendshipPoints as () => Record<string, number>)());
const greet = (p: Page, name: string) =>
  p.evaluate((n) => ((window as W).__greet as (x: string) => number)(n), name);

test('boot is clean and the default observer (AETHER-1) is selected', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  expect(await keeper(page)).toBe('aether');
  expect(await pickerOpen(page)).toBe(false);
  expect(await page.evaluate(() => ((window as W).__keepers as () => unknown[])())).toHaveLength(3);
  expect(errors).toEqual([]);
});

test('K opens the picker and a digit key chooses an observer', async ({ page }) => {
  await boot(page);
  await page.locator('canvas').focus();

  await page.keyboard.press('KeyK');
  await expect.poll(() => pickerOpen(page)).toBe(true);

  await page.keyboard.press('Digit2'); // → the second observer, VANTA-9
  await expect.poll(() => pickerOpen(page)).toBe(false);
  expect(await keeper(page)).toBe('vanta');
});

test('the chosen observer persists across a reload and into the exported save', async ({ page }) => {
  await boot(page);

  await pickKeeper(page, 'lumen');
  expect(await keeper(page)).toBe('lumen');
  await page.evaluate(() => ((window as W).__saveNow as () => Promise<unknown>)());

  await page.reload();
  await boot(page);

  expect(await keeper(page)).toBe('lumen');
  const exported = JSON.parse(await page.evaluate(() => ((window as W).__exportSave as () => string)()));
  expect(exported.keeperId).toBe('lumen');
});

test('the observer you are changes how fast a dino warms to you (bonus = delta difference)', async ({ page }) => {
  await boot(page);

  // Find a dino + two observers that bonus it differently: one gives 0, one gives > 0.
  const found = await page.evaluate(
    ({ names, ids }) => {
      const pick = (window as W).__pickKeeper as (i: string) => string;
      const bonus = (window as W).__keeperBonus as (n: string) => number;
      for (const name of names) {
        const map: Record<string, number> = {};
        for (const id of ids) {
          pick(id);
          map[id] = bonus(name);
        }
        const zero = ids.find((id) => map[id] === 0);
        const pos = ids.find((id) => map[id] > 0);
        if (zero && pos) return { name, zero, pos, bonus: map[pos] };
      }
      return null;
    },
    { names: NAMES, ids: KEEPER_IDS },
  );
  expect(found).not.toBeNull();
  const { name, zero, pos, bonus } = found!;
  expect(bonus).toBeGreaterThan(0);

  // Base greet gain under the non-fitting observer (bonus 0).
  await pickKeeper(page, zero);
  const before0 = (await fpoints(page))[name] ?? 0;
  await greet(page, name);
  const base = ((await fpoints(page))[name] ?? 0) - before0;

  // Greet gain under the fitting observer — the same base plus the keeper bonus.
  await pickKeeper(page, pos);
  const before1 = (await fpoints(page))[name] ?? 0;
  await greet(page, name);
  const boosted = ((await fpoints(page))[name] ?? 0) - before1;

  expect(boosted - base).toBe(bonus);
});
