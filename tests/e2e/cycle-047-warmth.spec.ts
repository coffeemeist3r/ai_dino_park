import { test, expect } from '@playwright/test';
import { boot, settle } from './helpers';

/**
 * Keeper's warmth (BACKLOG-184). The warm math (warmGain = greetGain + WARM_BONUS,
 * WARM_BONUS === REPAIR_BONUS) is pinned by unit tests; these prove the seams: the
 * funk appears with the cold morning, a greet / a tone / a meal mends it, and an
 * unmended funk thaws silently at dusk.
 */

type W = Window & Record<string, any>;

/** Cycle-043 staging: bond a pair past the den bar, set a night clock, cross into morning. */
async function stageColdMorning(page: import('@playwright/test').Page, day = 22) {
  await page.evaluate((d) => {
    const w = window as W;
    w.__bondPair('Rex', 'Mossback', 12);
    w.__setClock(d, 20, 0);
    w.__stepWorld();
    w.__stepWorld();
    w.__setClock(d, 8, 0);
    w.__stepWorld(); // the window's closing edge — shivers, the cry, and now the funk
  }, day);
}

test('the cold morning leaves a funk; a summer morning leaves none', async ({ page }) => {
  await boot(page);
  await stageColdMorning(page);

  const winter = await page.evaluate(() => {
    const w = window as W;
    return { cold: w.__coldSleepers() as string[], pending: w.__coldPending() as string[] };
  });
  expect(winter.cold.length).toBeGreaterThan(0);
  expect([...winter.pending].sort()).toEqual([...winter.cold].sort());

  await page.reload();
  await boot(page);
  await page.evaluate(() => {
    const w = window as W;
    w.__bondPair('Rex', 'Mossback', 12);
    w.__setClock(10, 22, 0); // summer: the window never opens
    w.__stepWorld();
    w.__setClock(10, 8, 0);
    w.__stepWorld();
  });
  expect(await page.evaluate(() => (window as W).__coldPending())).toEqual([]);
});

test('a greet mends the funk: outsized gain, warm memory, one-shot', async ({ page }) => {
  await boot(page);
  await stageColdMorning(page);

  const result = await page.evaluate(() => {
    const w = window as W;
    const name = (w.__coldPending() as string[])[0];
    const before = (w.__friendship() as Record<string, number>)[name] ?? 0;
    w.__greet(name); // the warming greet
    const afterWarm = (w.__friendship() as Record<string, number>)[name] ?? 0;
    w.__greet(name); // a now-normal greet on the same dino, same traits — the control
    const afterPlain = (w.__friendship() as Record<string, number>)[name] ?? 0;
    return {
      name,
      warmDelta: afterWarm - before,
      plainDelta: afterPlain - afterWarm,
      stillPending: (w.__coldPending() as string[]).includes(name),
      warmed: ((w.__memory() as Record<string, string[]>)[name] ?? []).some((m) =>
        m.includes('the keeper warmed me'),
      ),
    };
  });

  expect(result.warmDelta).toBeGreaterThan(result.plainDelta); // the mend outweighs the hello
  expect(result.stillPending).toBe(false);
  expect(result.warmed).toBe(true);
});

test('the tone path mends too', async ({ page }) => {
  await boot(page);
  await stageColdMorning(page);
  // BACKLOG-109: the funk is staged at the window's closing edge (08:00, which 179 owns), but what follows
  // needs the funked dinos actually up and moving — and 08:00 is inside the night-owls' rest window now.
  // 16:00 is the stretch every chronotype is awake in every season. Named here rather than assumed.
  await page.evaluate(() => (window as W).__setClock(22, 16, 0));

  const name = await page.evaluate(() => {
    const w = window as W;
    const n = (w.__coldPending() as string[])[0];
    w.__warpTo(n);
    return n;
  });

  await page.locator('canvas').focus();
  await page.keyboard.press('KeyE'); // tone menu on the nearest (warped-to) dino
  // BACKLOG-515: the menu opens on Phaser's update step, so a Digit1 dispatched in the same frame picks
  // against a menu that is not there — and the warming branch never runs at all.
  await settle(page);
  await page.keyboard.press('Digit1'); // warm tone pick → recordTone → the warming branch
  await settle(page);

  const result = await page.evaluate((n) => {
    const w = window as W;
    return {
      stillPending: (w.__coldPending() as string[]).includes(n),
      warmed: ((w.__memory() as Record<string, string[]>)[n] ?? []).some((m) =>
        m.includes('the keeper warmed me'),
      ),
    };
  }, name);

  expect(result.stillPending).toBe(false);
  expect(result.warmed).toBe(true);
});

test('a meal mends: the eater gains food + bonus and the funk clears', async ({ page }) => {
  await boot(page);
  await stageColdMorning(page);
  // BACKLOG-109: the funk is staged at the window's closing edge (08:00, which 179 owns), but what follows
  // needs the funked dinos up and moving — and 08:00 is inside the night-owls' rest window now. 16:00 is
  // the stretch every chronotype is awake in every season. Named here rather than assumed.
  await page.evaluate(() => (window as W).__setClock(22, 16, 0));

  const result = await page.evaluate(() => {
    const w = window as W;
    const pending = w.__coldPending() as string[];
    const eater = pending[0];
    const before = { ...(w.__friendship() as Record<string, number>) };

    // BACKLOG-109: this used to drop food near a funked dino and re-roll up to six times, hoping that dino
    // won the scramble. That was a race resolved by the seeded stream, and cycle 146 shifted the stream —
    // a sleeping dino consumes no wander rolls, so every draw after it moves. The claim this spec makes is
    // "the dino that eats is mended", not "this dino wins a scramble", so it now names its eater through
    // the deterministic `__eat` hook 375 added for exactly this. (BACKLOG-456's catalogue, one more entry.)
    const target = (w.__dinoPositions() as Array<{ name: string; x: number; y: number }>).find(
      (p) => p.name === eater,
    )!;
    w.__dropFood(Math.floor(target.x / 32), 'meat');
    w.__eat(eater);
    w.__stepWorld();

    const mem = w.__memory() as Record<string, string[]>;
    return {
      eater,
      warmed: (mem[eater] ?? []).some((m: string) => m.includes('the keeper warmed me')),
      delta: ((w.__friendship() as Record<string, number>)[eater] ?? 0) - (before[eater] ?? 0),
      stillPending: (w.__coldPending() as string[]).includes(eater),
    };
  });

  expect(result.warmed).toBe(true);
  expect(result.delta).toBeGreaterThanOrEqual(11); // FEED_GAIN 5 (min) + WARM_BONUS 6
  expect(result.stillPending).toBe(false);
});

test('dusk thaws an unmended funk silently — no warm memory appears', async ({ page }) => {
  await boot(page);
  await stageColdMorning(page);

  expect((await page.evaluate(() => (window as W).__coldPending())) as string[]).not.toEqual([]);

  await page.evaluate(() => {
    const w = window as W;
    w.__setClock(22, 19, 30); // winter dusk — the next night's window opens
    w.__stepWorld();
  });

  const result = await page.evaluate(() => {
    const w = window as W;
    const mem = w.__memory() as Record<string, string[]>;
    const anyWarm = Object.values(mem).some((events) =>
      events.some((m) => m.includes('the keeper warmed me')),
    );
    return { pending: w.__coldPending() as string[], anyWarm };
  });

  expect(result.pending).toEqual([]);
  expect(result.anyWarm).toBe(false);
});
