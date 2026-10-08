import { describe, it, expect } from 'vitest';
import { answerSeek, answerEffect, type WelcomeKind } from './welcome';
import { toneEcho } from '../social/tones';
import { type Personality } from './personality';

const t = (o: Partial<Personality>): Personality => ({ curiosity: 0.5, sociability: 0.5, energy: 0.5, agreeableness: 0.5, bravery: 0.5, ...o });

describe('BACKLOG-592 an answer moves the mind', () => {
  it('every answer but a cold one turns the answerer toward the newcomer, with its own reason', () => {
    const kinds: WelcomeKind[] = ['bristle', 'missed', 'company', 'curious', 'cold'];
    expect(kinds.map(answerSeek)).toEqual(['rival', 'yesterday', 'friend', 'stranger', null]);
  });

  it('the answer is written into the graphs', () => {
    expect(answerEffect('missed')).toEqual({ bond: 4, grudge: 0, meet: false });
    expect(answerEffect('company').bond).toBe(4);
    expect(answerEffect('curious')).toEqual({ bond: 2, grudge: 0, meet: true });
    expect(answerEffect('bristle')).toEqual({ bond: 0, grudge: 3, meet: false });
    expect(answerEffect('cold')).toEqual({ bond: 0, grudge: 0, meet: false });
  });
});

describe('BACKLOG-148 the last tone in the next reply', () => {
  const bold = t({ bravery: 0.9, energy: 0.9, agreeableness: 0.2 });
  const meek = t({ bravery: 0.1, energy: 0.2, agreeableness: 0.9 });

  it('says nothing with no last tone, or when the dino did not care', () => {
    expect(toneEcho(undefined, 'tease', bold)).toBeNull();
    expect(toneEcho('tease', 'tease', t({}))).toBeNull(); // a middling dino is neutral about teasing
  });

  it('the same last tone is fond on one dino and sour on the next', () => {
    expect(toneEcho('tease', 'tease', bold)).toBe('Ribbing me again? Good.');
    expect(toneEcho('tease', 'tease', meek)).toBe('Teasing again. Wonderful.');
  });

  it('a change of tone is noticed — wistfully by the fond, gladly by the sour', () => {
    expect(toneEcho('tease', 'warm', bold)).toBe('Not teasing today, then?');
    expect(toneEcho('tease', 'warm', meek)).toBe("That's better than last time.");
    expect(toneEcho('warm', 'warm', meek)).toBe('Warm again — I like that.');
  });
});
