import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Edge indicators (BACKLOG-398). Every linked edge of the current zone shows a small label naming
 * the neighbour, read from the adjacency table, and the labels re-render on a zone change — the
 * three-zone chain is finally legible before you walk off an edge.
 */

type W = Record<string, any>;
const labels = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as W).__edgeLabels() as string[]);

test('the bowl labels its east edge with the grove — and nothing else', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  expect(await labels(page)).toEqual(['The Grove ▸']);
  expect(errors).toEqual([]);
});

test('labels re-render on zone changes — grove shows both neighbours, Fernreach one', async ({ page }) => {
  await boot(page);

  await page.evaluate(() => (window as W).__setZone('grove'));
  expect((await labels(page)).sort()).toEqual(['The Fernreach ▸', '◂ Pocket Cretaceous']);

  await page.evaluate(() => (window as W).__setZone('fernreach'));
  expect(await labels(page)).toEqual(['◂ The Grove']);

  await page.evaluate(() => (window as W).__setZone('bowl'));
  expect(await labels(page)).toEqual(['The Grove ▸']);
});

test('a real keeper crossing relabels the edges (BACKLOG-398 rides the same redraw)', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    (window as W).__setPlayer(630, 240);
    (window as W).__tryCross();
  });
  expect(await page.evaluate(() => (window as W).__zone())).toBe('grove');
  expect((await labels(page)).sort()).toEqual(['The Fernreach ▸', '◂ Pocket Cretaceous']);
});
