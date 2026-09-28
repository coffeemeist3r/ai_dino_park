import { test, expect } from '@playwright/test';
import { boot, foundingState } from './helpers';

type W = Record<string, any>;
const founded = (page: import('@playwright/test').Page) =>
  expect.poll(() => page.evaluate(() => (window as W).__bestFriends().Rex ?? null)).toBe('Sunny');
const page_ = (text: string, name: string) => {
  const lines = text.split('\n');
  const i = lines.findIndex((l) => l.replace('▸', '').startsWith(`${name}  (`));
  return lines.slice(i, i + 4).join('\n');
};

test('the book names every closest friend on frame one, and the one dino with none', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await founded(page);
  const text: string = await page.evaluate(() => (window as W).__bookText());
  expect(page_(text, 'Rex')).toContain('🤝 close to Sunny');
  expect(page_(text, 'Twitch')).toContain('🤝 no friend yet');
  const want: Record<string, string> = {
    Sunny: 'Rex', Mossback: 'Glade', Glade: 'Mossback', Bramble: 'Pip', Pip: 'Bramble',
    Thornback: 'Mossback', Murk: 'Glade', Ember: 'Sunny',
  };
  for (const [name, friend] of Object.entries(want)) expect(page_(text, name)).toMatch(new RegExp(`🤝 .* ${friend}$`, 'm'));
  expect(((await page.evaluate(() => (window as W).__events())) as string[]).some((l) => l.startsWith('💞'))).toBe(false);
});

test('a friend overtaken by more than a nudge makes the ticker', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await founded(page);
  await page.evaluate(() => (window as W).__pauseAmbient?.());
  // Inside the margin: Rex at 26 against Glade's 24 changes nothing.
  await page.evaluate(() => (window as W).__bondPair('Mossback', 'Rex', 14));
  await page.evaluate(() => (window as W).__stepWorld());
  expect((await page.evaluate(() => (window as W).__bestFriends())).Mossback).toBe('Glade');
  expect(((await page.evaluate(() => (window as W).__events())) as string[]).some((l) => l.startsWith('💞 Mossback'))).toBe(false);
  // Past it: Rex at 40.
  await page.evaluate(() => (window as W).__bondPair('Mossback', 'Rex', 14));
  await page.evaluate(() => (window as W).__stepWorld());
  const events: string[] = await page.evaluate(() => (window as W).__events());
  expect(events).toContain('💞 Mossback has grown closer to Rex than to Glade');
  const text: string = await page.evaluate(() => (window as W).__bookText());
  expect(page_(text, 'Mossback')).toContain('🤝 close to Rex');
});
