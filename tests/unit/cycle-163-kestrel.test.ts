import { describe, it, expect } from 'vitest';
import {
  KEEPERS,
  NICKNAME_MIN,
  designationOf,
  nicknameOf,
  keeperAddress,
  keeperFit,
  keeperBonus,
} from '../../game/src/keeper/keepers';
import { inspector } from '../../game/src/keeper/firstContact';
import { canScan } from '../../game/src/keeper/scan';
import { menuChips } from '../../game/src/input/touch';
import type { Personality } from '../../game/src/ai/personality';

/**
 * BACKLOG-212 — the roster's fourth seat, and the first watcher that is not a machine.
 *
 * Two things are under test and they are different in kind. The roster entry is data, and what matters
 * about it is that it *inverts* the one mechanic the roster has: the three robots all carry positive
 * appeals, so a solitary, cautious dino had no observer in the game that liked it. The chip row is
 * geometry, and what matters about it is that a fourth option is reachable on touch at all — the picker
 * has always rendered every KEEPERS row, so before this cycle a fourth entry was listed on screen and
 * selectable by neither keyboard nor thumb.
 */

const KES = 3;

/** Solitary and cautious — the temperament the three machines all pass over. */
const quiet: Personality = { curiosity: 0.1, sociability: 0.1, energy: 0.5, agreeableness: 0.5, bravery: 0.5 };
/** Social and curious — well served by the existing roster. */
const bright: Personality = { curiosity: 0.9, sociability: 0.9, energy: 0.5, agreeableness: 0.5, bravery: 0.5 };

describe('the fourth watcher', () => {
  it('appends without disturbing the three that were there', () => {
    expect(KEEPERS.length).toBe(4);
    expect(KEEPERS[KES].id).toBe('kestrel');
    expect(KEEPERS.slice(0, 3).map((k) => k.id)).toEqual(['aether', 'vanta', 'lumen']);
  });

  it('parses through the existing address helpers with no special case', () => {
    expect(designationOf(KEEPERS[KES])).toBe('Kestrel of the Ninth Quiet');
    expect(nicknameOf(KEEPERS[KES])).toBe('Kes');
    expect(keeperAddress(KEEPERS[KES], NICKNAME_MIN)).toBe('Kes');
    expect(keeperAddress(KEEPERS[KES], NICKNAME_MIN - 1)).toBe('Kestrel of the Ninth Quiet');
  });
});

describe('the negative-weight appeal', () => {
  it('inverts keeperFit without keeperFit changing', () => {
    expect(keeperFit(KEEPERS[KES], quiet)).toBeGreaterThan(0);
    expect(keeperFit(KEEPERS[KES], bright)).toBeLessThan(0);
  });

  it('still only ever helps — a bad fit is 0, never a penalty', () => {
    expect(keeperBonus(KEEPERS[KES], quiet)).toBe(2);
    expect(keeperBonus(KEEPERS[KES], bright)).toBe(0);
  });

  it('likes a dino no robot likes — the archetype is a real read, not a re-skin', () => {
    expect(keeperBonus(KEEPERS[KES], quiet)).toBe(2);
    for (const robot of KEEPERS.slice(0, 3)) expect(keeperBonus(robot, quiet)).toBe(0);
  });
});

describe('what falls out of the roster for free', () => {
  it('inverts who crosses the bowl to size up the new watcher', () => {
    const cast = [
      { name: 'Hush', traits: quiet },
      { name: 'Rex', traits: bright },
    ];
    expect(inspector(KEEPERS[KES], cast)).toBe('Hush');
    expect(inspector(KEEPERS[0], cast)).not.toBe('Hush');
  });

  it('carries no scanner — that is still the cataloguing unit alone', () => {
    expect(canScan(KEEPERS[KES])).toBe(false);
  });
});

describe('the chip row grows with the roster', () => {
  it('draws one numbered chip per option and none when no menu is open', () => {
    expect(menuChips(800, 600, 4).map((c) => c.id)).toEqual([
      'back',
      'pick1',
      'pick2',
      'pick3',
      'pick4',
      'close',
    ]);
    expect(menuChips(800, 600, 3).map((c) => c.id)).not.toContain('pick4');
    expect(menuChips(800, 600, 0).map((c) => c.id)).toEqual(['back', 'close']);
  });

  it('still fits the phone at its widest', () => {
    // 6 chips x 48 + 5 gaps x 10 = 338 inside 375. The gutter is thin; if this ever fails, shrink the
    // gap rather than the 48x36 touch target.
    for (const c of menuChips(375, 812, KEEPERS.length)) {
      expect(c.x - c.w / 2).toBeGreaterThanOrEqual(0);
      expect(c.x + c.w / 2).toBeLessThanOrEqual(375);
    }
  });
});
