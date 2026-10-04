import { describe, it, expect } from 'vitest';
import {
  regretsShove,
  regretMemory,
  sorryMemory,
  heardSorryMemory,
  owedApology,
  regretLine,
  sorryLine,
  apologyText,
  ADMIRE_BAR,
  REGRET_ART_KEY,
  peckingRead,
  dispositionToward,
  cowedBy,
  peckingLine,
} from './pecking';
import { hatchPattern, snatchedMemory, stoodMemory } from './feeding';
import { heldMemory, backedMemory } from '../social/standoff';
import { worldPlacedProps } from './reachability';

describe('BACKLOG-391 guilty gobbler', () => {
  it('a shove past a friend is regretted; past one below the bar it is not', () => {
    expect(regretsShove(ADMIRE_BAR)).toBe(true);
    expect(regretsShove(30)).toBe(true);
    expect(regretsShove(ADMIRE_BAR - 1)).toBe(false);
    expect(regretsShove(0)).toBe(false);
  });

  it('the regret is not a pecking beat — the shove still reads as a won grab', () => {
    const ring = [snatchedMemory('Sunny'), regretMemory('Sunny')];
    expect(peckingRead(ring, 'Sunny')).toEqual({ score: 1, beats: 1 });
    for (const m of [regretMemory('Sunny'), sorryMemory('Sunny'), heardSorryMemory('Rex')]) {
      expect(peckingRead([m], 'Sunny').beats + peckingRead([m], 'Rex').beats).toBe(0);
    }
  });

  it('the apology is owed while the regret is on the ring, and only to that friend', () => {
    expect(owedApology([regretMemory('Sunny')], 'Sunny')).toBe(true);
    expect(owedApology([regretMemory('Sunny')], 'Glade')).toBe(false);
    expect(owedApology([sorryMemory('Sunny')], 'Sunny')).toBe(false);
    expect(owedApology([], 'Sunny')).toBe(false);
  });

  it('says what happened', () => {
    expect(regretLine('Rex', 'Sunny')).toBe('😓 Rex felt bad about shoving past Sunny');
    expect(sorryLine('Rex', 'Sunny')).toBe('🙇 Rex said sorry to Sunny');
    expect(apologyText('Sunny')).toBe('Sorry about the hatch, Sunny. I was starving.');
  });

  it('the mark is placed by the world', () => {
    expect(worldPlacedProps().has(REGRET_ART_KEY)).toBe(true);
  });
});

describe('BACKLOG-577 standoffs count at the hatch', () => {
  it('the standoff builders round-trip through hatchPattern', () => {
    for (const b of [heldMemory, backedMemory]) expect(hatchPattern(b).exec(b('Twitch'))?.[1]).toBe('Twitch');
  });

  it('one standoff is not a history; two are', () => {
    expect(dispositionToward([heldMemory('Twitch')], 'Twitch')).toBeNull();
    expect(dispositionToward([heldMemory('Twitch'), heldMemory('Twitch')], 'Twitch')).toBe('confident');
    expect(dispositionToward([backedMemory('Mossback'), backedMemory('Mossback')], 'Mossback')).toBe('wary');
  });

  it('a stare-down weighs half a stand', () => {
    expect(peckingRead([stoodMemory('Rex'), heldMemory('Rex')], 'Rex')).toEqual({ score: 3, beats: 2 });
    expect(cowedBy([backedMemory('Mossback')], 'Mossback')).toBe(false);
    expect(cowedBy([backedMemory('Mossback'), backedMemory('Mossback')], 'Mossback')).toBe(true);
  });

  it('the book names the standoff rival', () => {
    const names = ['Mossback', 'Twitch'];
    expect(peckingLine([heldMemory('Twitch'), heldMemory('Twitch')], names)).toBe('👊 pecking order: faced down Twitch');
    expect(peckingLine([backedMemory('Mossback'), backedMemory('Mossback')], names)).toBe(
      '👊 pecking order: wary of Mossback',
    );
  });
});
