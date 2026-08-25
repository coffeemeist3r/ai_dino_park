import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Every ground has somebody on it (BACKLOG-500). CHARTER v7 said so in the constitution and the roster it
 * shipped with left the Hollow and the Ridge on zero. This is the shipping park answering for the sentence.
 */

type W = Record<string, any>;

const ZONES = ['bowl', 'grove', 'fernreach', 'hollow', 'ridge'];

const names = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const homeZone = (p: Page, n: string) => p.evaluate((nn) => (window as W).__homeZone(nn) as string, n);

test('a fresh park boots with a resident on every ground', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const roster = await names(page);
  expect(roster).toHaveLength(10);

  const occupied = new Set<string>();
  for (const n of roster) occupied.add(await homeZone(page, n));

  for (const z of ZONES) expect([z, occupied.has(z)]).toEqual([z, true]);

  // The bowl is still five — the roster grew rather than rebalanced, because four systems are tuned there.
  const bowl = [];
  for (const n of roster) if ((await homeZone(page, n)) === 'bowl') bowl.push(n);
  expect(bowl).toHaveLength(5);

  expect(errors).toEqual([]);
});
