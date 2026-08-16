import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Self-soothing tic (BACKLOG-412) — a dino that came away from a contested drop with nothing takes up its
 * signature ritual (405) sooner than a contented one, and the ritual it forms files a memory that names why.
 *
 * The sting is asserted off the **production** path: `__forceContest` runs the very `resolveContest` branch
 * `checkFeeding` reaches, so what is proved is the game's own decision and not a re-derivation in the spec.
 * The onset itself is driven the way 410's spec drives it (`soloStep`: the lone dino fed and pinned, everyone
 * else parked in a far corner), so no stray meet can perturb the streak.
 */

type W = Record<string, any>;

const names = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const tic = (p: Page, n: string) => p.evaluate((nn) => (window as W).__tic(nn), n);
const stings = (p: Page) => p.evaluate(() => (window as W).__sting() as Record<string, number | null>);
const memoryOf = (p: Page, n: string) =>
  p.evaluate((nn) => ((window as W).__memory()[nn] ?? []).join(' | ') as string, n);

const soloStep = (p: Page, alone: string, others: string[]) =>
  p.evaluate(
    ({ alone, others }) => {
      const w = window as W;
      w.__setNeed(alone, 'hunger', 0);
      w.__setNeed(alone, 'thirst', 0);
      w.__placeDino(alone, 10, 7);
      others.forEach((n: string, i: number) => w.__placeDino(n, 1 + i, 1));
      w.__stepWorld();
    },
    { alone, others },
  );

/**
 * Quiet the dino down to one variable. No curiosity to chase and a non-solitary intent, so 393 can't
 * shorten the onset — and a real bond with a zone-mate, which does two jobs: it keeps the dino off the
 * loner's mope roll (135, which outranks the tic and would make the onset step nondeterministic), and it
 * makes `strange` false so 410's homesick shortener is out of the picture too. What is left is the sting.
 */
const isolate = (p: Page, n: string, friend: string) =>
  p.evaluate(
    ({ n, friend }) => {
      const w = window as W;
      w.__setTrait(n, 'curiosity', 0);
      w.__setIntent(n, 'restless');
      w.__bondPair(n, friend, 50);
    },
    { n, friend },
  );

test('a contented dino is not stung, and keeps the full stretch (control)', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const roster = await names(page);
  const alone = roster[0];
  const others = roster.slice(1);
  await isolate(page, alone, roster[1]);

  // Nobody has contested anything: the whole feature is inert on a fresh park.
  expect(Object.values(await stings(page)).every((s) => s === null)).toBe(true);

  // Well past the stung threshold (6) and the homesick one (12), an unstung dino has still not ticced.
  for (let i = 0; i < 15; i++) await soloStep(page, alone, others);
  expect((await tic(page, alone)).invented).toBe(false);

  expect(errors).toEqual([]);
});

test('the dino that slinks off from a drop it lost takes up its ritual early, and says why', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const roster = await names(page);
  const [winner, loser] = roster;
  const others = roster.filter((n) => n !== loser);
  await isolate(page, loser, roster[2]);

  // A real drop, then the production contest: a bold winner holds and the gobbler slinks off (390/394).
  await page.evaluate(
    ({ winner, loser }) => {
      const w = window as W;
      w.__setTrait(winner, 'bravery', 1);
      w.__dropFood();
      w.__forceContest(winner, loser);
    },
    { winner, loser },
  );

  expect(await memoryOf(page, loser)).toContain("wouldn't budge"); // the 394 beat actually fired
  expect((await stings(page))[loser]).toBe(0); // ...and the sting was taken from that event

  // Six solitary steps — the stung threshold, less than half the plain 20 and half the homesick 12.
  for (let i = 0; i < 5; i++) await soloStep(page, loser, others);
  expect((await tic(page, loser)).invented).toBe(false);

  await soloStep(page, loser, others);
  const t = await tic(page, loser);
  expect(t.invented).toBe(true);
  expect(t.solo).toBeLessThan(12);

  // The ritual it fell into is the self-soothing one, not the plain "alone a long while" note.
  const mem = await memoryOf(page, loser);
  expect(mem).toContain('it went badly at the hatch');
  expect(mem).toContain(t.tic.label);
  expect(mem).not.toContain('alone a long while');

  expect(errors).toEqual([]);
});

test('the winner that cedes is stung too — the sting follows who came away empty, not who lost face', async ({ page }) => {
  await boot(page);

  const roster = await names(page);
  const [winner, gobbler] = roster;

  await page.evaluate(
    ({ winner, gobbler }) => {
      const w = window as W;
      w.__setTrait(winner, 'bravery', 0); // it will not hold: the gobbler shoulders past (387)
      w.__dropFood();
      w.__forceContest(winner, gobbler);
    },
    { winner, gobbler },
  );

  const s = await stings(page);
  expect(s[winner]).toBe(0); // the ceding winner ate nothing
  expect(s[gobbler]).toBeNull(); // the one that ate is not sore about it
});

test('the sting fades — a dino left long enough is back to the full stretch', async ({ page }) => {
  await boot(page);

  const roster = await names(page);
  const alone = roster[0];
  const others = roster.slice(1);
  await isolate(page, alone, roster[1]);

  await page.evaluate((n) => (window as W).__sting(n), alone);
  expect((await stings(page))[alone]).toBe(0);

  // STING_FADES_AFTER_STEPS is 24; drive past it with the dino in company so no tic forms meanwhile.
  for (let i = 0; i < 26; i++) {
    await page.evaluate(
      ({ alone, others }) => {
        const w = window as W;
        w.__setNeed(alone, 'hunger', 0);
        w.__placeDino(alone, 5, 5);
        others.forEach((n: string) => w.__placeDino(n, 5, 6)); // company: the solitary streak never starts
        w.__stepWorld();
      },
      { alone, others },
    );
  }

  expect((await stings(page))[alone]).toBeGreaterThanOrEqual(24);
  expect((await tic(page, alone)).invented).toBe(false);

  // ...and now that it has faded, six solitary steps are no longer enough.
  for (let i = 0; i < 6; i++) await soloStep(page, alone, others);
  expect((await tic(page, alone)).invented).toBe(false);
});
