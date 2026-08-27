import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The ritual's mark, laid on the ground (BACKLOG-507).
 *
 * 496 drew the worn ground four cycles ago and nothing in the park ever blitted it; 421 has been
 * persisting the exact tile it belongs on for just as long. These specs are about the meeting: a dino
 * falls into its ritual and the grass under it changes, the mark travels when the habit does, and a
 * `fuss` ritual — the one kind deliberately left undrawn — leaves the ground exactly as it found it.
 *
 * CHARTER v7: the claim under test is what a player *sees*, so every assertion reads `__wornMarks`, which
 * reports the sprites actually on screen rather than the model's opinion of them.
 */

type W = Record<string, any>;

interface Mark {
  name: string;
  tileX: number;
  tileY: number;
  visible: boolean;
}

const marks = (p: Page) => p.evaluate(() => (window as W).__wornMarks() as Mark[]);
const dinos = (p: Page) =>
  p.evaluate(() => (window as W).__dinoPositions() as { name: string }[]);
const place = (p: Page, n: string, x: number, y: number) =>
  p.evaluate(([nn, xx, yy]) => (window as W).__placeDino(nn, xx, yy), [n, x, y] as const);
const inventTic = (p: Page, n: string) => p.evaluate((nn) => (window as W).__inventTic(nn), n);
const resetTic = (p: Page, n: string) => p.evaluate((nn) => (window as W).__resetTic(nn), n);
const ticOf = (p: Page, n: string) =>
  p.evaluate((nn) => (window as W).__tic(nn) as { tic: { kind: string } } | null, n);

const hauntOf = (p: Page, n: string) =>
  p.evaluate(
    (nn) => (window as W).__ticHaunt(nn) as { haunt: { tileX: number; tileY: number; drifts: number } | null },
    n,
  );

const markFor = (all: Mark[], name: string) => all.find((m) => m.name === name);

/** The first dino in the cast whose performed ritual is one of the drawn kinds (pace / circle). Two of the
 *  five personality axes map to the undrawn `fuss`, so the cast reliably contains both. */
async function findByKind(page: Page, want: (kind: string) => boolean): Promise<string | null> {
  for (const d of await dinos(page)) {
    const t = await ticOf(page, d.name);
    if (t && want(t.tic.kind)) return d.name;
  }
  return null;
}

test('a ritual wears the ground under it, and the ground was bare before', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const who = await findByKind(page, (k) => k === 'pace' || k === 'circle');
  expect(who, 'the cast should contain at least one drawn ritual').not.toBeNull();

  expect(markFor(await marks(page), who!)).toBeUndefined(); // bare grass

  await place(page, who!, 9, 6);
  await inventTic(page, who!);

  const laid = markFor(await marks(page), who!);
  expect(laid).toBeDefined();
  expect(laid).toMatchObject({ tileX: 9, tileY: 6, visible: true });

  expect(errors).toEqual([]);
});

test('the mark belongs to the habit, not to the stretch — it outlives being interrupted', async ({ page }) => {
  await boot(page);

  const who = await findByKind(page, (k) => k === 'pace' || k === 'circle');
  await place(page, who!, 8, 5);
  await inventTic(page, who!);
  expect(markFor(await marks(page), who!)).toMatchObject({ tileX: 8, tileY: 5 });

  // Company or a need ends the stretch. Worn grass does not un-wear because somebody walked over.
  await resetTic(page, who!);
  expect(markFor(await marks(page), who!)).toMatchObject({ tileX: 8, tileY: 5 });
});

test('the mark travels with the little path rather than piling up', async ({ page }) => {
  await boot(page);

  const who = await findByKind(page, (k) => k === 'pace' || k === 'circle');
  await place(page, who!, 9, 6);
  await inventTic(page, who!);
  const first = markFor(await marks(page), who!)!;

  await resetTic(page, who!);
  await place(page, who!, 10, 6);
  await inventTic(page, who!);

  const all = await marks(page);
  const mine = all.filter((m) => m.name === who);
  expect(mine).toHaveLength(1); // moved, never accumulated
  const drifted = (await hauntOf(page, who!)).haunt!;
  expect(mine[0]).toMatchObject({ tileX: drifted.tileX, tileY: drifted.tileY });
  expect({ x: mine[0].tileX, y: mine[0].tileY }).not.toEqual({ x: first.tileX, y: first.tileY });
});

test('a fuss ritual leaves the ground exactly as it found it — the per-kind fallback', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const fusser = await findByKind(page, (k) => k === 'fuss');
  expect(fusser, 'two of five axes map to fuss — the cast should contain one').not.toBeNull();

  await place(page, fusser!, 6, 9);
  await inventTic(page, fusser!);

  // The haunt is laid all the same — the ritual happened. There is simply no rig for it, so nothing draws.
  expect((await hauntOf(page, fusser!)).haunt).toMatchObject({ tileX: 6, tileY: 9 });
  expect(markFor(await marks(page), fusser!)).toBeUndefined();
  expect(errors).toEqual([]);
});
