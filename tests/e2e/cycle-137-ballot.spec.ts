import { test, expect, type Page } from '@playwright/test';
import { boot, emptyGrounds } from './helpers';

/**
 * A vote that answers to a history (BACKLOG-492), and the founding council that makes it reachable.
 *
 * Two claims, and the second one is the CHARTER v7 half. (1) A seat's ballot is shaded by what that seat
 * has lived on the ground it sits for — bounded, so a decided temperament never turns. (2) A brand-new
 * save now *seats a council at all*: before this cycle `zoneCouncil` had nobody to seat on any ground,
 * because nobody had banked, and seven cycles of governance were invisible from boot.
 *
 * Everything here reads the production path (`__councilVotes` calls the same `spendPriorityFor` the
 * pantry hook does); nothing re-implements the shading.
 */

type W = Record<string, any>;

const councils = (p: Page) => p.evaluate(() => (window as W).__councils() as Record<string, string[]>);
const votes = (p: Page, zone: string) => p.evaluate((z) => (window as W).__councilVotes(z), zone);
const spend = (p: Page, zone: string) => p.evaluate((z) => (window as W).__spendPriority(z), zone);
const setNeed = (p: Page, n: string, v: number) =>
  p.evaluate(([nn, vv]) => (window as W).__setNeed(nn, 'hunger', vv), [n, v] as const);
const ticker = (p: Page) => p.evaluate(() => (window as W).__ticker() as string[]);
const step = (p: Page) => p.evaluate(() => (window as W).__stepWorld());

test('the founding park seats a council — one Grove seat, and it is Pip', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // Criterion 7. This is the reachability claim itself: before 492 every ground read `[]` here on a fresh
  // save, so the lens showed the unset badge and no vote in the park could be observed at boot.
  const seated = await councils(page);
  expect(seated.grove).toEqual(['Pip']);

  const v = await votes(page, 'grove');
  expect(v.seats).toEqual(['Pip']);
  expect(v.spendTieBreak).toBeNull(); // neither Grove dino reaches PROVIDER_BANKS — a genuine single ballot

  expect(errors).toEqual([]);
});

test('the founding seat votes its life, not only its birth', async ({ page }) => {
  await boot(page);

  // Criterion 8. Pip's name-seeded agreeableness is 0.522 — feed, unlived. It holds 2 of the Grove's 3
  // banked units, and that stake carries its ballot across the line: the founding Grove banks.
  expect(await spend(page, 'grove')).toBe('bank');
  expect((await votes(page, 'grove')).spendVotes).toEqual(['bank']);
});

test('a hungry seat turns its ground back to feeding, and the ticker says so', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // Criterion 9 — the beat a player can actually watch. `checkCouncilCall` seeds silently on the first
  // record, so step once to seed 'bank', then let Pip get hungry and step again for the turn.
  await step(page);
  expect(await spend(page, 'grove')).toBe('bank');

  await setNeed(page, 'Pip', 0.9);
  expect(await spend(page, 'grove')).toBe('feed');

  await step(page);
  const lines = await ticker(page);
  expect(lines.some((l) => l.includes('Grove') && l.includes('feeds its own first'))).toBe(true);

  expect(errors).toEqual([]);
});

test('a decided temperament is unturnable, and a council-less ground is untouched', async ({ page }) => {
  await boot(page);

  // The bound, through the production path: Bramble is 0.870 warm. Seat it alongside Pip (a third Grove
  // banker would need a third resident, so credit Bramble past Pip instead) and starve it — it still feeds.
  await page.evaluate(() => (window as W).__creditBank('Bramble', 5));
  await setNeed(page, 'Bramble', 0);
  expect((await councils(page)).grove).toEqual(['Bramble']);
  expect(await spend(page, 'grove')).toBe('feed');
  await page.evaluate(() => (window as W).__setNeed('Bramble', 'hunger', 1));
  expect(await spend(page, 'grove')).toBe('feed'); // hunger only ever pushes toward feed anyway...
  // ...so the sharper half of the bound is the other direction: a warm seat holding the whole pile still feeds.
  expect((await votes(page, 'grove')).spendVotes).toEqual(['feed']);

  // Criterion 10: strip the founding state and the Grove seats nobody again — the pre-492 park exactly.
  await emptyGrounds(page);
  expect((await councils(page)).grove ?? []).toEqual([]);
});
