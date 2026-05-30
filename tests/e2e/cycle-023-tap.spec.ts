import { test, expect } from '@playwright/test';

type W = Record<string, unknown>;

test('tapping the glass on a dino startles it and lands in its memory', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto('/');
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 10_000 });

  const result = await page.evaluate(() => {
    const pos = ((window as W).__dinoPositions as () => Array<{ name: string; x: number; y: number }>)();
    const target = pos[0];
    const reactions = ((window as W).__tapGlass as (x: number, y: number) => Array<{ name: string; reaction: string }>)(
      target.x,
      target.y,
    );
    const mem = ((window as W).__memory as () => Record<string, string[]>)();
    return {
      name: target.name,
      mine: reactions.find((r) => r.name === target.name)?.reaction,
      all: reactions.map((r) => r.reaction),
      remembered: (mem[target.name] ?? []).some((m) => m.includes('the glass shook')),
    };
  });

  // tapped right on the dino → in range → it reacts (never ignores)
  expect(['bolt', 'investigate']).toContain(result.mine);
  // every reaction is a valid kind
  for (const r of result.all) expect(['bolt', 'investigate', 'ignore']).toContain(r);
  // the scare is now a memory (so it can ripple into gossip)
  expect(result.remembered).toBe(true);
  expect(errors).toEqual([]);
});

test('a far-off dino ignores a tap across the bowl', async ({ page }) => {
  await page.goto('/');
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 10_000 });

  const sawIgnore = await page.evaluate(() => {
    // tap the extreme corner; with five dinos spread out, at least one is out of range
    const reactions = ((window as W).__tapGlass as (x: number, y: number) => Array<{ name: string; reaction: string }>)(
      8,
      8,
    );
    return reactions.some((r) => r.reaction === 'ignore');
  });
  expect(sawIgnore).toBe(true);
});
