import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Hunger you can hear (BACKLOG-368). A dino over its hunger threshold (need-drive 371) lets the want slip
 * into its greeting — a temperament-shaded aside on whatever register it was already in. Headless has no
 * WebGPU, so the reply is the canned fallback (the deterministic half of the tell). Hunger-specific: a
 * thirsty-but-not-hungry dino stays quiet about it.
 */

type W = Record<string, any>;
const HUNGER_TELL = /starving|spare a bite|could eat/; // any of the three temperament variants
const WISTFUL = 'came to see'; // Rex is a fresh 0-heart founder → wistful register

const pickTone = (p: Page, name: string, id: string) =>
  p.evaluate(({ name, id }) => (window as W).__pickTone(name, id) as Promise<void>, { name, id });
const dialogText = (p: Page) => p.evaluate(() => ((window as W).__dialogPage() as { text: string }).text);
const setNeed = (p: Page, name: string, which: string, v: number) =>
  p.evaluate(({ name, which, v }) => (window as W).__setNeed(name, which, v), { name, which, v });

test('a hungry dino lets the want slip into its greeting', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  await setNeed(page, 'Rex', 'hunger', 0.8);
  expect(await page.evaluate(() => (window as W).__pressingNeed('Rex'))).toBe('hunger');

  await pickTone(page, 'Rex', 'honest');
  await page.waitForTimeout(150);
  const reply = await dialogText(page);
  expect(reply).toMatch(HUNGER_TELL); // the hunger tell
  expect(reply).toContain(WISTFUL); // composed onto the wistful register, not replacing it
  expect(errors).toEqual([]);
});

test('a sated dino greets without the hunger tell', async ({ page }) => {
  await boot(page);
  expect(await page.evaluate(() => (window as W).__pressingNeed('Rex'))).toBeNull(); // fresh = sated
  await pickTone(page, 'Rex', 'honest');
  await page.waitForTimeout(150);
  const reply = await dialogText(page);
  expect(reply).not.toMatch(HUNGER_TELL);
  expect(reply).toContain(WISTFUL);
});

test('a thirsty-but-not-hungry dino keeps quiet about it (hunger-specific)', async ({ page }) => {
  await boot(page);
  await setNeed(page, 'Rex', 'thirst', 0.9); // pressing need is thirst, not hunger
  expect(await page.evaluate(() => (window as W).__pressingNeed('Rex'))).toBe('thirst');
  await pickTone(page, 'Rex', 'honest');
  await page.waitForTimeout(150);
  expect(await dialogText(page)).not.toMatch(HUNGER_TELL);
});
