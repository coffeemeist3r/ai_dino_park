import { describe, it, expect } from 'vitest';
import {
  comforter,
  comfortLine,
  comfortMemory,
  COMFORT_BOND,
  COMFORT_BOND_FLOOR,
} from '../../game/src/world/comfort';
import { strengthen } from '../../game/src/social/bonds';
import type { Bonds } from '../../game/src/social/bonds';

const NAMES = ['Rex', 'Mossback', 'Sunny', 'Twitch', 'Glade'];

describe('comfort (BACKLOG-130)', () => {
  it('picks the sulker’s highest-bond peer above the floor, never the sulker itself', () => {
    let bonds: Bonds = {};
    bonds = strengthen(bonds, 'Sunny', 'Twitch', 20); // closest
    bonds = strengthen(bonds, 'Sunny', 'Rex', 10);
    expect(comforter('Sunny', bonds, NAMES)).toBe('Twitch');
  });

  it('returns null when every peer is below the floor', () => {
    let bonds: Bonds = {};
    bonds = strengthen(bonds, 'Sunny', 'Twitch', COMFORT_BOND_FLOOR - 1);
    bonds = strengthen(bonds, 'Sunny', 'Rex', COMFORT_BOND_FLOOR - 2);
    expect(comforter('Sunny', bonds, NAMES)).toBeNull();
  });

  it('a peer exactly at the floor still qualifies', () => {
    let bonds: Bonds = {};
    bonds = strengthen(bonds, 'Sunny', 'Glade', COMFORT_BOND_FLOOR);
    expect(comforter('Sunny', bonds, NAMES)).toBe('Glade');
  });

  it('breaks bond ties to the lexicographically-smallest name', () => {
    let bonds: Bonds = {};
    bonds = strengthen(bonds, 'Sunny', 'Glade', 15);
    bonds = strengthen(bonds, 'Sunny', 'Twitch', 15);
    expect(comforter('Sunny', bonds, NAMES)).toBe('Glade'); // Glade < Twitch
  });

  it('the comfort line names both dinos and shows the 🫂', () => {
    const line = comfortLine('Twitch', 'Sunny');
    expect(line).toContain('Twitch');
    expect(line).toContain('Sunny');
    expect(line).toContain('🫂');
  });

  it('the comfort memory names the comforter and is truthy', () => {
    const m = comfortMemory('Twitch');
    expect(m).toContain('Twitch');
    expect(m).toBeTruthy();
  });

  it('the reward currency and floor are positive', () => {
    expect(COMFORT_BOND).toBeGreaterThan(0);
    expect(COMFORT_BOND_FLOOR).toBeGreaterThan(0);
  });
});
