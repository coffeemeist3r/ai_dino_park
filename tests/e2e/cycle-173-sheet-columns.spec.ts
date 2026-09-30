import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState, settle } from './helpers';

/**
 * BACKLOG-552 — the More sheet grows a second column.
 *
 * Ten rows was the geometric ceiling, and every keeper verb since cycle 160 shipped keyboard-only because of
 * it. The four that had no seat — read the room, the plot, the book cursor, help — are now a tap away.
 */

type W = Window & Record<string, any>;

async function toPage(page: Page, lx: number, ly: number): Promise<{ x: number; y: number }> {
  const box = (await page.locator('canvas').boundingBox())!;
  return { x: box.x + (lx / 640) * box.width, y: box.y + (ly / 480) * box.height };
}

async function tapSheetRow(page: Page, id: string): Promise<void> {
  const layout = await page.evaluate(() => (window as W).__touchLayout());
  if (!(await page.evaluate(() => (window as W).__sheetOpen?.() ?? false))) {
    const more = layout.buttons.find((b: any) => b.id === 'more');
    const at = await toPage(page, more.x, more.y);
    await page.mouse.click(at.x, at.y);
  }
  const row = layout.sheet.find((r: any) => r.id === id);
  expect(row, `sheet row ${id}`).toBeDefined();
  const at = await toPage(page, row.x, row.y);
  await page.mouse.click(at.x, at.y);
}

async function bootTouch(page: Page): Promise<void> {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await page.evaluate(() => (window as W).__setTouch(true));
}

test('read the room is a tap away on the phone (BACKLOG-552)', async ({ page }) => {
  await bootTouch(page);
  // The default observer is AETHER-1, the one who reads a room.
  expect(await page.evaluate(() => (window as W).__keeper())).toBe('aether');
  await tapSheetRow(page, 'room');
  expect(await page.evaluate(() => (window as W).__roomOpen())).toBe(true);
});

test('help is a tap away on the phone (BACKLOG-552)', async ({ page }) => {
  await bootTouch(page);
  await tapSheetRow(page, 'help');
  expect(await page.evaluate(() => (window as W).__helpOpen())).toBe(true);
});

test('the book cursor steps from the sheet (BACKLOG-552)', async ({ page }) => {
  await bootTouch(page);
  await page.locator('canvas').focus();
  for (let i = 0; i < 8 && (await page.evaluate(() => (window as W).__lens())) !== 'book'; i++) {
    await page.keyboard.press('KeyV');
    await settle(page);
  }
  const sel = (t: string) => t.split('\n').find((l) => l.startsWith('▸'));
  const before = sel(await page.evaluate(() => (window as W).__bookText()));
  await tapSheetRow(page, 'book');
  await settle(page);
  const after = sel(await page.evaluate(() => (window as W).__bookText()));
  expect(after).toBeDefined();
  expect(after).not.toBe(before);
});
