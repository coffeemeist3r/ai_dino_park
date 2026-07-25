import { describe, it, expect } from 'vitest';
import {
  plentyWelcomeLine,
  plentyWelcomeEvent,
  plentyWelcomeMemory,
  plentyWelcomedMemory,
  PLENTY_WELCOME_BOND,
} from './plentywelcome';
import { homecomingLine } from './belonging';

describe('plentywelcome (BACKLOG-459)', () => {
  it('the wry welcome line is sardonic and distinct from 452 welcome-home', () => {
    const line = plentyWelcomeLine();
    expect(line).toContain('😏');
    expect(line).not.toBe(homecomingLine()); // not the 🏡 homecoming beat
    expect(line).not.toContain('🏡');
  });

  it('the event names both the resident and the migrant', () => {
    const e = plentyWelcomeEvent('Sunny', 'Rex');
    expect(e).toContain('Sunny');
    expect(e).toContain('Rex');
  });

  it("the resident's trace names the migrant and zone with no double article", () => {
    const m = plentyWelcomeMemory('Rex', 'The Grove');
    expect(m).toContain('Rex');
    expect(m).toContain('The Grove');
    expect(m).not.toContain('the The Grove');
  });

  it("the migrant's trace names the zone with no double article", () => {
    const m = plentyWelcomedMemory('The Grove');
    expect(m).toContain('The Grove');
    expect(m).not.toContain('the The Grove');
  });

  it('the welcome bond is a small positive nudge', () => {
    expect(PLENTY_WELCOME_BOND).toBeGreaterThan(0);
    expect(PLENTY_WELCOME_BOND).toBeLessThanOrEqual(3); // gentler than a shared meal
  });
});
