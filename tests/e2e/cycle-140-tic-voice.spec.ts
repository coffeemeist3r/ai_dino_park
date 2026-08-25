import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The ritual colours the voice (BACKLOG-423). A dino caught mid-ritual (408/413/420) now says the physical
 * business of stopping what it was doing, and that clause differs by which of the three rituals it was at —
 * with no model loaded, which is the half that makes this reachable on every device (CHARTER v7).
 *
 * The aside strings are pinned here on purpose: they are what a player actually reads.
 */

type W = Record<string, any>;

const ASIDE: Record<string, string> = {
  pace: 'feet still going a moment after the rest of it stops',
  circle: 'finishes the turn it was in the middle of before it looks up',
  fuss: 'sets the thing down, then picks at it once more anyway',
};

const names = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
const inventTic = (p: Page, n: string) => p.evaluate((nn) => (window as W).__inventTic(nn), n);
const ticKind = (p: Page, n: string) =>
  p.evaluate((nn) => ((window as W).__tic(nn) as { tic: { kind: string } }).tic.kind, n);
const greet = (p: Page, n: string) =>
  p.evaluate((nn) => (window as W).__pickTone(nn, 'warm') as Promise<string>, n);

test('a caught dino sounds like the ritual it was interrupted at', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const roster = await names(page);

  // One dino per ritual kind the founding cast happens to hold — the tic is name-seeded off the dino's
  // most-pronounced trait, so which kinds appear is a fact about the roster, not something to force.
  const byKind = new Map<string, string>();
  for (const n of roster) {
    const kind = await ticKind(page, n);
    if (!byKind.has(kind)) byKind.set(kind, n);
  }
  expect(byKind.size).toBeGreaterThanOrEqual(2); // the whole point is that they differ

  for (const [kind, name] of byKind) {
    expect(await inventTic(page, name)).toBe(true);
    const line = await greet(page, name);

    // Its own ritual's aside is there...
    expect(line).toContain(ASIDE[kind]);
    // ...and no other ritual's is.
    for (const [other, text] of Object.entries(ASIDE)) {
      if (other !== kind) expect(line).not.toContain(text);
    }
    // The frozen 408/413/420 opener still leads the line — the aside is added, never a replacement.
    expect(line).toMatch(/caught mid-fidget|looks up, delighted|again\?|Go on, then|little ritual/);
  }

  expect(errors).toEqual([]);
});

test('a dino that is not mid-ritual gets no aside at all', async ({ page }) => {
  await boot(page);
  const roster = await names(page);
  const line = await greet(page, roster[1]);
  for (const text of Object.values(ASIDE)) expect(line).not.toContain(text);
});
