import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Brain-biased intent (BACKLOG-393). Every dino has a valid intent for the day without any model
 * (the seeded procedural floor — this run is headless, no WebGPU), an intent can be forced for
 * behavior tests, and the day's lean is player-visible in the collection book ("today: …").
 */

type W = Record<string, any>;
const KINDS = ['social', 'solitary', 'forage', 'restless'];

test('every dino carries a closed-set intent with no model present', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const intents = await page.evaluate(() => {
    const w = window as W;
    return (w.__visibleDinos() as string[]).map((n) => ({ name: n, intent: w.__intent(n) }));
  });
  expect(intents.length).toBeGreaterThan(0);
  for (const { intent } of intents) {
    expect(intent).not.toBeNull();
    expect(KINDS).toContain(intent.kind);
    expect(intent.note.length).toBeGreaterThan(0);
  }
  expect(errors).toEqual([]);
});

test('an intent is deterministic for the day and forcible for tests', async ({ page }) => {
  await boot(page);

  const twice = await page.evaluate(() => {
    const w = window as W;
    const name = (w.__visibleDinos() as string[])[0];
    return { a: w.__intent(name), b: w.__intent(name) };
  });
  expect(twice.a).toEqual(twice.b); // cached + seeded: same day, same intent

  const forced = await page.evaluate(() => {
    const w = window as W;
    const name = (w.__visibleDinos() as string[])[0];
    w.__setIntent(name, 'solitary');
    return w.__intent(name);
  });
  expect(forced.kind).toBe('solitary');
});

test('the collection book shows the day\'s intent ("today: …")', async ({ page }) => {
  await boot(page);
  // touch one intent so the book has something to show, then read the rendered book text
  const book = await page.evaluate(() => {
    const w = window as W;
    for (const n of w.__visibleDinos() as string[]) w.__intent(n);
    return w.__bookText() as string;
  });
  expect(book).toContain('today: ');
});
