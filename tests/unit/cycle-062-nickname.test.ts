import { describe, it, expect } from 'vitest';
import {
  KEEPERS,
  designationOf,
  nicknameOf,
  keeperAddress,
  NICKNAME_MIN,
  type Keeper,
} from '../../game/src/keeper/keepers';

/**
 * Earned the nickname (BACKLOG-278). At the very top of the friendship scale a dino drops the keeper's
 * designation for its nickname ("There you are, Aki!"); below the cap it still uses the designation
 * (cycle-61 / BACKLOG-276 behavior). The escalation lives in keeper space; the greeting register just
 * renders whatever string keeperAddress returns.
 */

describe('nicknameOf (BACKLOG-278)', () => {
  it('returns the quoted nickname for every keeper', () => {
    expect(nicknameOf(KEEPERS[0])).toBe('Aki');
    expect(nicknameOf(KEEPERS[1])).toBe('Vix');
    expect(nicknameOf(KEEPERS[2])).toBe('Lux');
  });
  it('falls back to the designation when the name has no quoted part', () => {
    const plain: Keeper = { ...KEEPERS[0], name: 'NOMAD-7' };
    expect(nicknameOf(plain)).toBe(designationOf(plain));
    expect(nicknameOf(plain)).toBe('NOMAD-7');
  });
});

describe('keeperAddress escalates with hearts (BACKLOG-276 → 278)', () => {
  it('uses the nickname at the heart cap (NICKNAME_MIN)', () => {
    expect(keeperAddress(KEEPERS[0], NICKNAME_MIN)).toBe('Aki');
    expect(keeperAddress(KEEPERS[1], 10)).toBe('Vix');
  });
  it('uses the designation just below the cap (8–9 hearts → cycle-276 behavior)', () => {
    expect(keeperAddress(KEEPERS[0], 9)).toBe('AETHER-1');
    expect(keeperAddress(KEEPERS[0], 8)).toBe('AETHER-1');
  });
});
