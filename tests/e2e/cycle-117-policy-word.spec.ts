import { test, expect, type Page } from '@playwright/test';
import { boot, emptyGrounds } from './helpers';

/**
 * BACKLOG-497 fixture note: the founding park now seats a two-voice council in the bowl, so the ground the
 * player spawns on carries a spend policy from the first frame. Nothing in this file is *about* the founding
 * state, so each spec asks for the pre-governance fixture by name — `emptyGrounds`, the `gatherToBowl`
 * precedent — rather than asserting the absence of a system that now ships.
 */

/**
 * Word of how the ground decides (BACKLOG-470) — the spend policy (463) travels the gossip spine the way
 * word of the provider (453) does. The pure mechanics (line wording, the two gates, the 1-hop mark) are
 * unit-covered in cycle-117-policy-word.test.ts; this proves the integration seam: silent on a ground with
 * no policy, and once a provider stands and sets one, the word passes to a listener.
 */

type W = Record<string, any>;

const spendPriority = (p: Page, zone: string) =>
  p.evaluate((z) => (window as W).__spendPriority(z) as 'feed' | 'bank' | null, zone);
const spreadPolicyWord = (p: Page, a: string, b: string) =>
  p.evaluate(([x, y]) => (window as W).__spreadPolicyWord(x, y) as string | null, [a, b]);
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

test('a ground with no policy says nothing; once it has one, the word travels', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);
  await emptyGrounds(page); // BACKLOG-497: this spec's subject is not the founding council (see header)

  const names = await dinoNames(page);
  const [speaker, listener] = names;
  expect(listener).toBeTruthy();

  // Young park: no provider, so the bowl has decided nothing — and a ground that decided nothing is silent.
  expect(await spendPriority(page, 'bowl')).toBeNull();
  expect(await spreadPolicyWord(page, speaker, listener)).toBeNull();

  // Crown a provider: it sets the table, and now the ground has something to be known for.
  await onlyResident(page, speaker);
  await harvestBowl(page);
  await harvestBowl(page);
  await harvestBowl(page);
  expect((await roles(page))[speaker]).toBe('provider');
  const policy = await spendPriority(page, 'bowl');
  expect(policy === 'feed' || policy === 'bank').toBe(true);

  const word = await spreadPolicyWord(page, speaker, listener);
  expect(word).toContain('told me:'); // heard, not witnessed — it can't re-spread
  expect(word).toContain('Pocket Cretaceous'); // the ground it's about, named
  expect(word).toContain(policy === 'feed' ? 'feeds its own first' : 'banks against the winter');

  expect(errors).toEqual([]);
});
