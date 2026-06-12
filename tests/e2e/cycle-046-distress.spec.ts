import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Distress call (BACKLOG-194). The cry's synthesis math and the who-cries pick
 * are pinned by unit tests (distress.test.ts); these prove the seams: one cry
 * per tap, the cold morning finds a voice, the comforter turns toward the
 * caller's live tile, and mute never gates the social beat.
 */

type W = Window & Record<string, any>;

/** Cycle-043 staging: bond a pair past the den bar, set a night clock (restore semantics). */
async function stageNight(
  page: import('@playwright/test').Page,
  pair: [string, string],
  clock: [number, number, number],
) {
  await page.evaluate(
    ({ pair: [a, b], clock: [day, hour, minute] }) => {
      const w = window as W;
      w.__bondPair(a, b, 12);
      w.__setClock(day, hour, minute);
    },
    { pair, clock },
  );
}

test('one tap, one cry — the most frightened bolter calls out', async ({ page }) => {
  await boot(page);

  const result = await page.evaluate(() => {
    const w = window as W;
    const positions = w.__dinoPositions() as Array<{ name: string; x: number; y: number }>;
    // Tap each dino's own spot until somebody bolts; that tap must produce exactly one cry.
    for (const pos of positions) {
      const reactions = w.__tapGlass(pos.x, pos.y) as Array<{ name: string; reaction: string }>;
      const bolters = reactions.filter((r) => r.reaction === 'bolt').map((r) => r.name);
      if (bolters.length > 0) {
        return { bolters, cry: w.__lastDistress() };
      }
    }
    return { bolters: [] as string[], cry: w.__lastDistress() };
  });

  expect(result.bolters.length).toBeGreaterThan(0); // the cast has its timid souls
  expect(result.cry).not.toBeNull();
  expect(result.cry.trigger).toBe('startle');
  expect(result.bolters).toContain(result.cry.name);
  expect(result.cry.params.pitchHz).toBeGreaterThan(120); // the distress register, present
  expect(result.cry.params.notes).toBe(2);
});

test('a tap nobody bolts from raises no cry', async ({ page }) => {
  await boot(page);

  const result = await page.evaluate(() => {
    const w = window as W;
    const positions = w.__dinoPositions() as Array<{ name: string; x: number; y: number }>;
    // Pick the corner farthest from every dino so the whole cast is out of startle range.
    const corners = [
      { x: 8, y: 8 },
      { x: 632, y: 8 },
      { x: 8, y: 472 },
      { x: 632, y: 472 },
    ];
    let best = corners[0];
    let bestMin = -1;
    for (const c of corners) {
      const min = Math.min(...positions.map((p) => Math.hypot(p.x - c.x, p.y - c.y)));
      if (min > bestMin) {
        bestMin = min;
        best = c;
      }
    }
    const reactions = w.__tapGlass(best.x, best.y) as Array<{ name: string; reaction: string }>;
    return { reactions: reactions.map((r) => r.reaction), cry: w.__lastDistress() };
  });

  // The farthest corner left everyone unmoved — and so nobody cried.
  expect(result.reactions.every((r) => r === 'ignore')).toBe(true);
  expect(result.cry).toBeNull();
});

test('the closest friend hears the cry, remembers it, and walks toward the caller', async ({ page }) => {
  await boot(page);

  const staged = await page.evaluate(() => {
    const w = window as W;
    w.__bondPair('Twitch', 'Glade', 12); // over the comfort floor — Glade is the friend
    const cry = w.__cryDistress('Twitch');
    const responder = w.__distressResponder();
    const mem = (w.__memory() as Record<string, string[]>)['Glade'] ?? [];
    return { cry, responder, heard: mem.some((m) => m.includes('heard Twitch cry out')) };
  });

  expect(staged.cry).toMatchObject({ name: 'Twitch', trigger: 'startle' });
  expect(staged.responder).toMatchObject({ name: 'Glade', caller: 'Twitch' });
  expect(staged.responder.steps).toBeGreaterThanOrEqual(4);
  expect(staged.heard).toBe(true);

  // One world step: Glade's override aims at Twitch's live tile, so unless they were
  // already adjacent, the gap closes by exactly the dominant-axis step.
  const walked = await page.evaluate(() => {
    const w = window as W;
    const before = Object.fromEntries(
      (w.__dinoPositions() as Array<{ name: string; x: number; y: number }>).map((p) => [p.name, p]),
    );
    const after = Object.fromEntries(
      (w.__stepWorld() as Array<{ name: string; x: number; y: number }>).map((p) => [p.name, p]),
    );
    const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
      Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    return {
      wasAdjacent: dist(before['Glade'], before['Twitch']) <= 32 * 1.01,
      d0: dist(before['Glade'], after['Twitch']),
      d1: dist(after['Glade'], after['Twitch']),
    };
  });
  if (!walked.wasAdjacent) expect(walked.d1).toBeLessThan(walked.d0);

  // The walk always resolves: arrival or an exhausted budget clears the responder.
  await page.evaluate(() => {
    const w = window as W;
    for (let i = 0; i < 8; i++) w.__stepWorld();
  });
  expect(await page.evaluate(() => (window as W).__distressResponder())).toBeNull();
});

test('a friendless cry hangs unanswered', async ({ page }) => {
  await boot(page);

  const result = await page.evaluate(() => {
    const w = window as W;
    const cry = w.__cryDistress('Twitch'); // fresh boot: every bond under the floor
    return { cry, responder: w.__distressResponder() };
  });

  expect(result.cry).toMatchObject({ name: 'Twitch', trigger: 'startle' });
  expect(result.responder).toBeNull();
});

test('the winter cold morning finds a voice; a summer morning stays silent', async ({ page }) => {
  await boot(page);

  // Winter (cycle-043 staging): Rex & Mossback warm in the den, the loners shiver.
  await stageNight(page, ['Rex', 'Mossback'], [22, 20, 0]);
  await page.evaluate(() => {
    const w = window as W;
    for (let i = 0; i < 2; i++) w.__stepWorld();
    w.__setClock(22, 8, 0);
    w.__stepWorld(); // the window's closing edge — shivers + one cold cry
  });

  const winter = await page.evaluate(() => {
    const w = window as W;
    return { cold: w.__coldSleepers() as string[], cry: w.__lastDistress() };
  });
  expect(winter.cold.length).toBeGreaterThan(0);
  expect(winter.cry).not.toBeNull();
  expect(winter.cry.trigger).toBe('cold');
  expect(winter.cold).toContain(winter.cry.name); // the cry came from inside the cold

  // Summer: the window never opens, the morning passes, nobody cries.
  await page.reload();
  await boot(page);
  await stageNight(page, ['Rex', 'Mossback'], [10, 22, 0]);
  await page.evaluate(() => {
    const w = window as W;
    for (let i = 0; i < 2; i++) w.__stepWorld();
    w.__setClock(10, 8, 0);
    w.__stepWorld();
  });
  expect(await page.evaluate(() => (window as W).__lastDistress())).toBeNull();
});

test('mute silences the playback, never the bowl — the friend still comes', async ({ page }) => {
  await boot(page);
  await page.locator('canvas').focus();
  await page.keyboard.press('KeyM');
  expect(await page.evaluate(() => (window as W).__soundMuted())).toBe(true);

  const result = await page.evaluate(() => {
    const w = window as W;
    w.__bondPair('Twitch', 'Glade', 12);
    const cry = w.__cryDistress('Twitch');
    const mem = (w.__memory() as Record<string, string[]>)['Glade'] ?? [];
    return {
      cry,
      responder: w.__distressResponder(),
      heard: mem.some((m) => m.includes('heard Twitch cry out')),
      sound: w.__lastSound(),
    };
  });

  expect(result.cry).toMatchObject({ name: 'Twitch', trigger: 'startle' }); // diegetic record
  expect(result.responder).toMatchObject({ name: 'Glade' }); // the social beat fired
  expect(result.heard).toBe(true);
  expect(result.sound).toBeNull(); // no playback intent on a muted device
});
