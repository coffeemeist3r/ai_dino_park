import { test, expect } from '@playwright/test';

type W = Record<string, unknown>;

import { boot } from './helpers';

// Grateful to the one who cleared your name (BACKLOG-243): a recovered sufferer, meeting the dino
// carrying its first-hand all-clear (`saw <sufferer> came through it fine`, BACKLOG-234/235), warms
// to it — the giving side of relief, the symmetric twin of the sympathy visit (217).

test('the recovered sufferer warms to whoever carried its all-clear — a 💛 beat at the meeting', async ({ page }) => {
  await boot(page);

  // converse runs over dinos[0] (a) and dinos[1] (b). Let b be the clearer that holds a's all-clear,
  // so a is the recovered sufferer that thanks b.
  const [a, b] = await page.evaluate(() => ((window as W).__dinoNames as () => string[])());
  await page.evaluate(
    ([clearer, sufferer]) => ((window as W).__rememberRelief as (n: string, s: string) => void)(clearer, sufferer),
    [b, a],
  );

  const bondBefore = await page.evaluate(
    ([x, y]) => ((window as W).__bond as (p: string, q: string) => number)(x, y),
    [a, b],
  );

  await page.evaluate(() => ((window as W).__forceConverse as () => Promise<unknown>)());

  // The sufferer files a first-hand "<clearer> cleared my name" memory…
  const memory = await page.evaluate(() => ((window as W).__memory as () => Record<string, string[]>)());
  expect(memory[a].some((e) => e.includes('cleared my name') && e.includes(b))).toBe(true);

  // …a 💛 line names both dinos in the log…
  const events = await page.evaluate(() => ((window as W).__events as () => string[])());
  expect(events.some((e) => e.includes('💛') && e.includes(a) && e.includes(b))).toBe(true);

  // …and the bond between them ticked up.
  const bondAfter = await page.evaluate(
    ([x, y]) => ((window as W).__bond as (p: string, q: string) => number)(x, y),
    [a, b],
  );
  expect(bondAfter).toBeGreaterThan(bondBefore);
});

test('control: a dino that merely HEARD the all-clear is not the clearer — no gratitude', async ({ page }) => {
  await boot(page);

  const [corrector, sufferer, third] = await page.evaluate(() =>
    ((window as W).__dinoNames as () => string[])(),
  );
  // The corrector cleared the sufferer's name (first-hand relief), then spread the all-clear to a
  // third dino the real way: the third now carries only the 1-hop RUMOR, not a first-hand memory.
  await page.evaluate(
    ([c, s]) => ((window as W).__rememberRelief as (n: string, x: string) => void)(c, s),
    [corrector, sufferer],
  );
  await page.evaluate(
    ([c, t]) => ((window as W).__spreadReliefWord as (a: string, b: string) => string | null)(c, t),
    [corrector, third],
  );

  const bondBefore = await page.evaluate(
    ([x, y]) => ((window as W).__bond as (p: string, q: string) => number)(x, y),
    [sufferer, third],
  );

  // The recovered sufferer meets the third dino: it only heard the rumor, so it cleared nothing.
  const thanks = await page.evaluate(
    ([s, t]) => ((window as W).__clearedName as (a: string, b: string) => unknown)(s, t),
    [sufferer, third],
  );
  expect(thanks).toBeNull();

  const memory = await page.evaluate(() => ((window as W).__memory as () => Record<string, string[]>)());
  expect((memory[sufferer] ?? []).some((e) => e.includes('cleared my name'))).toBe(false);

  const bondAfter = await page.evaluate(
    ([x, y]) => ((window as W).__bond as (p: string, q: string) => number)(x, y),
    [sufferer, third],
  );
  expect(bondAfter).toBe(bondBefore);
});
