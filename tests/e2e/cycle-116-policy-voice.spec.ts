import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Fed first, or left short (BACKLOG-469) — a hungry dino voices its ground's spend policy (463). The pure
 * wording + composition are unit-covered (cycle-116-policy-voice.test.ts); this proves the integration seam:
 * a hungry resident on a policy'd ground carries the policy phrase in its greeting, and a non-hungry one on
 * the same ground does not.
 */
type W = Record<string, any>;

const spendPriority = (p: Page, zone: string) =>
  p.evaluate((z) => (window as W).__spendPriority(z) as 'feed' | 'bank' | null, zone);
const roles = (p: Page) => p.evaluate(() => (window as W).__roles() as Record<string, string>);
const dinoNames = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));

async function harvestBowl(page: Page) {
  const planted = await page.evaluate(() => (window as W).__plantPlot('bowl'));
  await page.evaluate((d) => (window as W).__setClock(d + 2, 8, 0), planted.plantedDay);
  await page.evaluate(() => (window as W).__stepWorld());
  await page.evaluate(() => (window as W).__harvestPlot('bowl'));
}

async function onlyResident(page: Page, keep: string) {
  for (const n of await dinoNames(page)) {
    if (n !== keep) await page.evaluate((nn) => (window as W).__migrate(nn, 'grove'), n);
  }
}

// The policy phrase the aside carries, by stance (feed → grateful, bank → grumble). Any temperament variant
// of a stance contains its marker.
const POLICY_RE = { feed: /feeds its own/i, bank: /go short|granary|walls go up/i };

test('a hungry dino voices its ground policy; a fed one stays quiet on it', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  await onlyResident(page, 'Rex');
  await harvestBowl(page);
  await harvestBowl(page);
  await harvestBowl(page);
  expect((await roles(page)).Rex).toBe('provider');

  const policy = await spendPriority(page, 'bowl');
  expect(policy === 'feed' || policy === 'bank').toBe(true);
  const re = POLICY_RE[policy as 'feed' | 'bank'];

  // Hungry → the policy slips into the greeting.
  await page.evaluate(() => (window as W).__setNeed('Rex', 'hunger', 0.8));
  const hungryLine = (await page.evaluate(() => (window as W).__pickTone('Rex', 0))) as string;
  expect(hungryLine).toMatch(re);

  // Fed → the policy stays quiet (a flavour beat, not an every-greet tic).
  await page.evaluate(() => (window as W).__setNeed('Rex', 'hunger', 0));
  const fedLine = (await page.evaluate(() => (window as W).__pickTone('Rex', 0))) as string;
  expect(fedLine).not.toMatch(POLICY_RE.feed);
  expect(fedLine).not.toMatch(POLICY_RE.bank);

  expect(errors).toEqual([]);
});
