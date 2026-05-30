import { test, expect } from '@playwright/test';

type W = Record<string, unknown>;

async function boot(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 10_000 });
}

test('a dino retells a first-hand memory to another as a rumor', async ({ page }) => {
  await boot(page);

  // Give Rex a first-hand memory (a greet writes one), then have Rex gossip to Sunny.
  const rumor = await page.evaluate(() => {
    ((window as W).__greet as (n: string) => unknown)('Rex');
    return ((window as W).__spreadGossip as (a: string, b: string) => string | null)('Rex', 'Sunny');
  });
  expect(rumor).toContain('told me:');

  const memory = await page.evaluate(() => ((window as W).__memory as () => Record<string, string[]>)());
  expect(memory.Sunny.some((m) => m.includes('Rex told me:'))).toBe(true);

  // A rumor cannot be re-gossiped onward (1 hop) — Sunny has nothing first-hand from Rex's news.
  const second = await page.evaluate(() =>
    ((window as W).__spreadGossip as (a: string, b: string) => string | null)('Sunny', 'Glade'),
  );
  expect(second).toBeNull();
});

test('news propagates through the park as dinos mingle', async ({ page }) => {
  await boot(page);

  const spread = await page.evaluate(() => {
    // seed every dino with a first-hand event, then let them mill and converse
    ((window as W).__dinoNames as () => string[])().forEach((n) =>
      ((window as W).__greet as (x: string) => unknown)(n),
    );
    const step = (window as W).__stepWorld as () => unknown;
    const converse = (window as W).__forceConverse as () => Promise<unknown>;
    return (async () => {
      for (let i = 0; i < 40; i++) {
        step();
        await converse();
      }
      const mem = ((window as W).__memory as () => Record<string, string[]>)();
      return Object.values(mem).filter((evs) => evs.some((e) => e.includes('told me:'))).length;
    })();
  });

  expect(spread).toBeGreaterThan(0); // at least one dino has heard a rumor
});
