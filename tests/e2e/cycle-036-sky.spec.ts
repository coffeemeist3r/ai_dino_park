import { test, expect } from '@playwright/test';
import { boot } from './helpers';

// The sky-event logic is pure, so it runs headless without WebGPU. These specs drive it through
// the dev hooks: force a clear night, trigger the spectacle, pump the world, watch the cast gather.

type W = Record<string, unknown>;

const advance = (page: import('@playwright/test').Page, n: number) =>
  page.evaluate((m) => ((window as W).__advanceMinutes as (x: number) => { hour: number }) (m), n);
const triggerSky = (page: import('@playwright/test').Page, id?: string) =>
  page.evaluate((i) => ((window as W).__triggerSky as (x?: string) => string | null)(i), id);
const skyEvent = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ((window as W).__skyEvent as () => string | null)());
const skyGazers = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ((window as W).__skyGazers as () => string[])());
const stepWorld = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ((window as W).__stepWorld as () => unknown)());
const dinoCount = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ((window as W).__dinoCount as () => number)());
const memory = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ((window as W).__memory as () => Record<string, string[]>)());
const exportSave = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ((window as W).__exportSave as () => string)());
const openMenu = (page: import('@playwright/test').Page, name: string) =>
  page.evaluate((n) => ((window as W).__openToneMenu as (x: string) => string)(n), name);

/** From the default day-1 08:00 boot, run the clock forward to a clear night hour (22:00). */
async function toNight(page: import('@playwright/test').Page) {
  const t = await advance(page, 14 * 60); // 08:00 → 22:00
  expect(t.hour).toBe(22);
}

const METEOR_MEMORY = 'the whole sky rained falling stars, and we all watched it together';

test('triggering a clear-night sky event activates the shimmer (boot is clean)', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  expect(await skyEvent(page)).toBeNull(); // nothing at boot (daytime)
  await toNight(page);

  expect(await triggerSky(page, 'meteors')).toBe('meteors');
  expect(await skyEvent(page)).toBe('meteors');
  expect(errors).toEqual([]);
});

test('the whole cast gathers and files one shared memory that persists in the save', async ({ page }) => {
  await boot(page);
  await toNight(page);
  await triggerSky(page, 'meteors');

  // Pump the world; dinos drift toward the shared gather tile each step (clock does not advance,
  // so no new rolls interfere and the event stays up).
  for (let i = 0; i < 25; i++) await stepWorld(page);

  const count = await dinoCount(page);
  expect((await skyGazers(page)).length).toBe(count); // everyone gathered

  // Every gazer filed the same shared memory line…
  const mem = await memory(page);
  expect(mem.Rex ?? []).toContain(METEOR_MEMORY);

  // …and it persists into the exported save. (Save format is v2 since BACKLOG-040 added the
  // version + migration hook; this feature itself is still additive memory only.)
  const save = JSON.parse(await exportSave(page));
  expect(save.version).toBe(2);
  expect(save.memory.Rex ?? []).toContain(METEOR_MEMORY);
});

test('the spectacle ends when night passes into day, and the cast resumes ordinary life', async ({ page }) => {
  await boot(page);
  await toNight(page);
  await triggerSky(page, 'aurora');
  expect(await skyEvent(page)).toBe('aurora');

  // Run the clock on into the next day; crossing dawn ends the event and no new one starts in daylight.
  const t = await advance(page, 10 * 60); // 22:00 → 08:00 next day
  expect(t.hour).toBe(8);
  await stepWorld(page);

  expect(await skyEvent(page)).toBeNull();
});

test('the tone-greet menu still works during/after a sky cycle (no regression)', async ({ page }) => {
  await boot(page);
  await toNight(page);
  await triggerSky(page, 'meteors');

  const header = await openMenu(page, 'Rex');
  expect(header).toContain('[1] Warm');
  expect(header).toContain('[3] Honest');
});
