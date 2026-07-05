import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Persona-shaped daily plan (BACKLOG-012). Every dino has a full four-phase plan with no model
 * (the seeded procedural floor — headless, no WebGPU); the active intent the world tick consults
 * tracks the current day-phase; and the day's shape is player-visible in the collection book.
 */

type W = Record<string, any>;
const KINDS = ['social', 'solitary', 'forage', 'restless'];
// One representative hour inside each day-phase (dawn 5-8, day 8-17, dusk 17-21, night else).
const PHASE_HOUR: Record<string, number> = { dawn: 6, day: 12, dusk: 19, night: 23 };

test('every dino carries a full four-phase plan with no model present', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const plans = await page.evaluate(() => {
    const w = window as W;
    return (w.__visibleDinos() as string[]).map((n) => ({ name: n, plan: w.__plan(n) }));
  });
  expect(plans.length).toBeGreaterThan(0);
  for (const { plan } of plans) {
    expect(plan).not.toBeNull();
    for (const phase of ['dawn', 'day', 'dusk', 'night']) {
      expect(KINDS).toContain(plan[phase]);
    }
  }
  expect(errors).toEqual([]);
});

test('the active intent the world tick consults tracks the current day-phase', async ({ page }) => {
  await boot(page);

  const result = await page.evaluate((phaseHour) => {
    const w = window as W;
    const name = (w.__visibleDinos() as string[])[0];
    const plan = w.__plan(name);
    const rows: { phase: string; active: string; planned: string }[] = [];
    for (const phase of Object.keys(phaseHour)) {
      w.__setClock(2, (phaseHour as any)[phase], 0);
      rows.push({ phase, active: w.__intent(name).kind, planned: plan[phase] });
    }
    return rows;
  }, PHASE_HOUR);

  // For every phase the active lean equals that phase's plan entry — the day's shape drives behaviour.
  for (const { active, planned } of result) expect(active).toBe(planned);
});

test('the lean is not flat across the day (the day has a shape)', async ({ page }) => {
  await boot(page);

  const flat = await page.evaluate((phaseHour) => {
    const w = window as W;
    // A cast-wide vector of active kinds per phase; if the day were flat, all four vectors would match.
    const vectors: string[] = [];
    for (const phase of Object.keys(phaseHour)) {
      w.__setClock(3, (phaseHour as any)[phase], 0);
      const kinds = (w.__visibleDinos() as string[]).map((n) => w.__intent(n).kind).join(',');
      vectors.push(kinds);
    }
    return new Set(vectors).size === 1; // true only if every phase produced the identical cast vector
  }, PHASE_HOUR);

  expect(flat).toBe(false);
});

test('the collection book shows the day\'s shape ("plans: …")', async ({ page }) => {
  await boot(page);
  const book = await page.evaluate(() => {
    const w = window as W;
    for (const n of w.__visibleDinos() as string[]) w.__intent(n);
    return w.__bookText() as string;
  });
  expect(book).toContain('plans: ');
  expect(book).toContain(' → '); // the shape joins its phases with an arrow
});
