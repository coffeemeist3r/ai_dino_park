import { test, expect } from '@playwright/test';
import { boot } from './helpers';

type W = Record<string, any>;

/**
 * BACKLOG-524 — the night shift.
 *
 * The first test is the CHARTER v7 bar and nothing else: a fresh save opens at 08:00 and two grounds — the
 * Fernreach and the Ridge — each hold exactly one resident, both night-owls, both asleep. Until tonight
 * those grounds produced anyway, because `residentZones()` asked who *lived* somewhere and never who was
 * awake. If this spec ever needs the clock moved to see the difference, the feature is dormant on a
 * shipping save and the item has failed its own criterion.
 *
 * The second test is the other half of the bar: 13:00 is five real minutes away at ACTIVE_SCALE, well
 * inside the ten-minute window, and it is the hour the two sleeping grounds go back to work.
 */
test.describe('BACKLOG-524 — a ground works the hours its cast keeps', () => {
  test('reads on frame one: two grounds have a resident and nobody awake', async ({ page }) => {
    await boot(page);

    expect(await page.evaluate(() => (window as W).__clockNow().hour)).toBe(8);

    const waking: Record<string, number> = await page.evaluate(() => (window as W).__wakingHeads());
    // Membership is unchanged — every ground still has its residents, and the map still says so.
    expect(waking.fernreach).toBe(0);
    expect(waking.ridge).toBe(0);
    expect(waking.bowl).toBe(4);
    expect(waking.grove).toBe(1);
    expect(waking.hollow).toBe(1);

    const resting: string[] = await page.evaluate(() => (window as W).__resting());
    expect(resting).toContain('Thornback'); // the Fernreach's only resident
    expect(resting).toContain('Ember'); // the Ridge's only resident
  });

  test('a sleeping ground does not produce, however long you stand on it', async ({ page }) => {
    await boot(page);
    // Force the spawn roll far more often than the ambient cadence ever would, so a ground that *could*
    // produce certainly would have. The two asleep grounds still hold nothing.
    const held = await page.evaluate(() => {
      const w = window as W;
      for (let i = 0; i < 200; i++) w.__spawnRoll?.();
      return w.__zoneResources();
    });
    expect(held.fernreach ?? null).toBe(null);
    expect(held.ridge ?? null).toBe(null);
  });

  test('and both are back at work by 13:00 — five real minutes into the ten-minute window', async ({
    page,
  }) => {
    await boot(page);
    await page.evaluate(() => (window as W).__advanceMinutes(5 * 60)); // 08:00 → 13:00

    const waking: Record<string, number> = await page.evaluate(() => (window as W).__wakingHeads());
    expect(waking.fernreach).toBe(1);
    expect(waking.ridge).toBe(1);

    const held = await page.evaluate(() => {
      const w = window as W;
      for (let i = 0; i < 200; i++) w.__spawnRoll?.();
      return w.__zoneResources();
    });
    expect(held.fernreach).not.toBe(null);
    expect(held.ridge).not.toBe(null);
  });

  test('the Grove has a watcher on frame one, and it sounds once', async ({ page }) => {
    await boot(page);

    // Bramble is a day-dino and Pip is an owl, so at eight in the morning the Grove is one pair of open
    // eyes over a sleeping neighbour. Not owl-exclusive on purpose: at three in the morning it is Pip's.
    expect(await page.evaluate(() => (window as W).__watchers())).toEqual(['Bramble']);

    const first: string[] = await page.evaluate(() => (window as W).__checkWatch());
    expect(first).toEqual(['Bramble']);

    // Deduped against its own recall ring, exactly as the last-one-standing beat is: a moment, not a tic.
    const second: string[] = await page.evaluate(() => (window as W).__checkWatch());
    expect(second).toEqual([]);

    const memories: string[] = await page.evaluate(
      () => ((window as W).__memory() as Record<string, string[]>).Bramble ?? [],
    );
    expect(memories.some((m) => m.includes('kept the watch'))).toBe(true);
  });
});
