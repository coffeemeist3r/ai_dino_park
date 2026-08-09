import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Traces of your pacing (BACKLOG-424). A dino's private ritual scuffs the ground; another dino that wanders
 * across the mark while it's fresh reads it and files a faint, unnamed memory — once. Nobody watches anybody:
 * the finder learns only that *someone* was here.
 */

type W = Record<string, any>;

const roster = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const memory = (p: Page, n: string) =>
  p.evaluate((nn) => ((window as W).__memory() as Record<string, string[]>)[nn] ?? [], n);
const traceLines = (mem: string[]) => mem.filter((m) => m.includes('someone had been pacing'));

test('a dino that walks onto a fresh scuff reads it, once, and never its own', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const [pacer, finder] = await roster(page);

  // The pacer leaves a mark where it stands; nobody else is on that tile yet.
  await page.evaluate(
    ({ pacer }) => {
      const w = window as W;
      w.__placeDino(pacer, 6, 6);
      w.__leaveTrace(pacer);
    },
    { pacer },
  );
  expect(await page.evaluate(() => ((window as W).__traces() as unknown[]).length)).toBe(1);

  // The pacer standing on its own mark files nothing.
  await page.evaluate(() => (window as W).__noticeTraces());
  expect(traceLines(await memory(page, pacer))).toHaveLength(0);

  // The finder wanders onto it and reads the ground.
  await page.evaluate(({ finder }) => (window as W).__placeDino(finder, 6, 6), { finder });
  await page.evaluate(() => (window as W).__noticeTraces());
  const first = traceLines(await memory(page, finder));
  expect(first).toHaveLength(1);
  expect(first[0]).toContain('someone');
  for (const name of await roster(page)) expect(first[0]).not.toContain(name);

  // Standing there is not a discovery of its own — a second pass files nothing more.
  await page.evaluate(() => (window as W).__noticeTraces());
  expect(traceLines(await memory(page, finder))).toHaveLength(1);

  expect(errors).toEqual([]);
});
