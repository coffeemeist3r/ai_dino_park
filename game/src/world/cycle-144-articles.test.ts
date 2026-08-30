/**
 * BACKLOG-499 — the ground with two articles.
 *
 * Four of six display names carry their own article, and the park's templates prepended another, so every
 * governance beat read "the The Grove's council calls it" on the first step of a fresh save. The other half
 * of the same defect: the templates that *dodged* it by dropping the article left a capitalised "The"
 * mid-sentence, and two source files carried a comment warning the next author about the trap rather than
 * fixing it. `theZone` is the one answer; the grep guard at the bottom is what stops a ninth site
 * hand-rolling a tenth.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { BOWL_ID, GROVE_ID, ZONES, bareZone, theZone } from './zones';
import { billCallLine } from './governance';
import { turnoverLine } from './term';
import { storesFedLine, storesFedMemory, courierMemory, haulLine, haulMemory } from './foodstore';
import { discontentLine } from './discontent';
import { settleMemory, settleEvent, hollowedLine } from './frontier';
import { providerAside } from '../ai/brain';
import { providerWordLine } from './providerword';
import { pioneerLine, pioneerEvent } from './pioneer';

const NAMES = ZONES.map((z) => z.name);
const ARTICLED = NAMES.filter((n) => n.startsWith('The '));
const BARE = 'Pocket Cretaceous';

describe('theZone / bareZone (BACKLOG-499)', () => {
  it('never doubles an article, for any shipping ground', () => {
    for (const n of NAMES) {
      expect(theZone(n)).not.toContain('the The');
      expect(theZone(n)).not.toContain('the the');
    }
  });

  it('always supplies exactly one lowercase article', () => {
    for (const n of NAMES) expect(theZone(n).startsWith('the ')).toBe(true);
  });

  it('lowers an owned article and supplies one to a name without', () => {
    expect(theZone('The Grove')).toBe('the Grove');
    expect(theZone(BARE)).toBe('the Pocket Cretaceous');
  });

  it('bareZone strips an owned article and leaves a bare name alone', () => {
    for (const n of ARTICLED) expect(bareZone(n).startsWith('The ')).toBe(false);
    expect(bareZone(BARE)).toBe(BARE);
  });

  it('is idempotent both ways — applying the seam to its own output changes nothing', () => {
    for (const n of NAMES) {
      expect(theZone(theZone(n))).toBe(theZone(n));
      expect(bareZone(bareZone(n))).toBe(bareZone(n));
    }
  });

  it('leaves the display names themselves untouched — a heading is a name, not a sentence', () => {
    expect(ZONES.map((z) => z.name)).toContain('The Grove');
  });
});

describe('every line that names a ground, in both branches (BACKLOG-499)', () => {
  const both = (build: (zoneName: string) => string) => [build('The Grove'), build(BARE)] as const;

  const lines: Array<[string, (z: string) => string]> = [
    ['billCallLine', billCallLine],
    ['turnoverLine (seated)', (z) => turnoverLine(z, ['Bramble'])],
    ['turnoverLine (empty)', (z) => turnoverLine(z, [])],
    ['storesFedLine', (z) => storesFedLine(z, 'Sunny', '🥩')],
    ['storesFedMemory', storesFedMemory],
    ['courierMemory', (z) => courierMemory(z, '🥩')],
    ['haulLine', (z) => haulLine('Sunny', z)],
    ['haulMemory', haulMemory],
    ['discontentLine', discontentLine],
    ['settleMemory', settleMemory],
    ['settleEvent', (z) => settleEvent('Sunny', z)],
    ['hollowedLine', (z) => hollowedLine(z, 'Murk')],
    ['providerAside (prickly)', (z) => providerAside('Bramble', z, { agreeableness: 0.05, curiosity: 0.5, energy: 0.5, sociability: 0.5, bravery: 0.5 })],
    ['providerAside (effusive)', (z) => providerAside('Bramble', z, { agreeableness: 0.95, curiosity: 0.5, energy: 0.5, sociability: 0.5, bravery: 0.5 })],
    ['providerAside (even)', (z) => providerAside('Bramble', z)],
    ['providerWordLine', (z) => providerWordLine('Rex', 'Bramble', z)],
  ];

  for (const [label, build] of lines) {
    it(`${label} says it once, in lowercase, on both kinds of name`, () => {
      const [articled, bare] = both(build);
      expect(articled).toContain('the Grove');
      expect(articled).not.toContain('The Grove');
      expect(articled).not.toContain('the The');
      expect(bare).toContain('the Pocket Cretaceous');
    });
  }
});

describe('the id-keyed builders (BACKLOG-499)', () => {
  // `pioneerLine`/`pioneerEvent` take a zone *id*, so they cannot be driven by the table above — but they
  // are two of the lines a fresh save shows first, since BACKLOG-512 puts a founding standing in the book
  // on frame one. Both branches: an article-carrying ground and the one that owns none.
  it('name the ground once, in lowercase, for both kinds of name', () => {
    expect(pioneerLine(GROVE_ID, 'crossed')).toBe('first across into the Grove');
    expect(pioneerLine(GROVE_ID, 'born')).toBe('has been in the Grove since the first morning');
    expect(pioneerLine(BOWL_ID, 'crossed')).toBe('first across into the Pocket Cretaceous');
    expect(pioneerLine(BOWL_ID, 'born')).toBe('has been in the Pocket Cretaceous since the first morning');
    expect(pioneerEvent(GROVE_ID, 'Bramble')).toContain('the Grove');
    expect(pioneerEvent(GROVE_ID, 'Bramble')).not.toContain('The Grove');
    expect(pioneerEvent(BOWL_ID, 'Sunny')).toContain('the Pocket Cretaceous');
  });
});

/**
 * The guard. Matches the interpolation forms the tree actually uses for a ground rather than any `the ${`,
 * which would false-positive on food and crop labels ("the ${labelOf(food)} came in thick").
 */
describe('no source file prepends a bare article to a ground (BACKLOG-499)', () => {
  const SRC = join(__dirname, '..');
  const OFFENDER = /\bthe \$\{(?:[A-Za-z_.]*[Zz]one(?:Name|By(?:Id)?\([^)]*\))?[A-Za-z_.]*|z\.name)\}/;

  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((entry) => {
      const p = join(dir, entry);
      if (statSync(p).isDirectory()) return walk(p);
      return p.endsWith('.ts') && !p.endsWith('.test.ts') ? [p] : [];
    });

  it('finds no hand-rolled article anywhere under game/src', () => {
    const offenders: string[] = [];
    for (const file of walk(SRC)) {
      readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        if (OFFENDER.test(line)) offenders.push(`${file}:${i + 1}: ${line.trim()}`);
      });
    }
    expect(
      offenders,
      `A ground is named inside a sentence without going through theZone() (game/src/world/zones.ts).\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  it('and the guard would actually catch one', () => {
    expect(OFFENDER.test('return `the ${zoneName} turns to gathering`;')).toBe(true);
    expect(OFFENDER.test('return `the ${z.name}’s council`;')).toBe(true);
    expect(OFFENDER.test('return `the ${zoneById(id).name} edge`;')).toBe(true);
    expect(OFFENDER.test('return `the ${labelOf(food)} came in thick`;')).toBe(false);
  });
});
