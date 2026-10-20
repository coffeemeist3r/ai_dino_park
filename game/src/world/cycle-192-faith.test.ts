import { describe, expect, it } from 'vitest';
import {
  SHRINE_BELIEVERS,
  WORD_BOND,
  canRaiseShrine,
  faithBookLine,
  hearWord,
  isFaith,
  raiseShrine,
  shrineTicker,
  wordTicker,
  creedById,
  type Faith,
} from './faith';
import { foundingBonds, foundingGrudges } from './founding';

// The founding faith as cycle 191 preaches it at noon on day one.
const founding = (): Faith => ({
  creed: 'song',
  preacher: 'Glade',
  zone: 'bowl',
  tileX: 6,
  tileY: 4,
  day: 1,
  believers: ['Mossback', 'Sunny', 'Murk'],
  scoffers: { Twitch: 'Mossback' },
});

describe('the word travels (BACKLOG-615)', () => {
  const bonds = foundingBonds();
  const grudges = foundingGrudges();

  it('the owls hear it from the friends who were awake', () => {
    expect(hearWord(founding(), 'Sunny', 'Rex', bonds, grudges)).toBe('believe'); // 30
    expect(hearWord(founding(), 'Mossback', 'Rex', bonds, grudges)).toBe('believe'); // 12, the bar
    expect(hearWord(founding(), 'Sunny', 'Ember', bonds, grudges)).toBe('believe'); // 18
    expect(hearWord(founding(), 'Mossback', 'Thornback', bonds, grudges)).toBe('believe'); // 16
    expect(hearWord(founding(), 'Sunny', 'Pip', bonds, grudges)).toBeNull(); // strangers
  });

  it('the bar is the bond, not a coin', () => {
    expect(WORD_BOND).toBe(12);
    expect(hearWord(founding(), 'Sunny', 'Bramble', { 'Bramble|Sunny': 11.9 }, {})).toBeNull();
    expect(hearWord(founding(), 'Sunny', 'Bramble', { 'Bramble|Sunny': 12 }, {})).toBe('believe');
  });

  it('a grudge against the carrier scoffs, whatever the bond', () => {
    expect(hearWord(founding(), 'Sunny', 'Rex', { 'Rex|Sunny': 30 }, { 'Rex|Sunny': 40 })).toBe('scoff');
  });

  it('only the flock carries it, and only to a dino with no part yet', () => {
    expect(hearWord(founding(), 'Rex', 'Sunny', bonds, grudges)).toBeNull(); // Rex is no believer
    expect(hearWord(founding(), 'Mossback', 'Twitch', bonds, grudges)).toBeNull(); // already scoffs
    expect(hearWord(founding(), 'Glade', 'Mossback', bonds, grudges)).toBeNull(); // already believes
    expect(hearWord(founding(), 'Glade', 'Glade', bonds, grudges)).toBeNull();
    expect(hearWord(null, 'Sunny', 'Rex', bonds, grudges)).toBeNull();
    expect(hearWord(founding(), 'Glade', 'Rex', { 'Glade|Rex': 20 }, {})).toBe('believe'); // the preacher carries it too
  });

  it('the book and the ticker say who told it', () => {
    const f = { ...founding(), believers: [...founding().believers, 'Rex'], heardFrom: { Rex: 'Sunny' } };
    expect(faithBookLine(f, 'Rex')).toBe("🎶 follows Glade's word: the song under the grass (heard it from Sunny)");
    expect(faithBookLine(f, 'Mossback')).toBe("🎶 follows Glade's word: the song under the grass");
    expect(wordTicker('Rex', 'Sunny', 'Glade', creedById('song'))).toBe("🎶 Rex heard Glade's song from Sunny, and believes.");
  });
});

describe('the faith raises a stone (BACKLOG-614)', () => {
  const three = ['Glade', 'Mossback', 'Sunny'];

  it('three believers, three to haul, two stone in the pile, and no shrine yet', () => {
    expect(SHRINE_BELIEVERS).toBe(3);
    expect(canRaiseShrine(founding(), three, { stone: 2 })).toBe(true);
    expect(canRaiseShrine(founding(), three, { stone: 1, branch: 5 })).toBe(false);
    expect(canRaiseShrine(founding(), ['Glade', 'Sunny'], { stone: 2 })).toBe(false);
    expect(canRaiseShrine({ ...founding(), believers: ['Mossback', 'Sunny'] }, three, { stone: 2 })).toBe(false);
    expect(canRaiseShrine({ ...founding(), shrine: { tileX: 6, tileY: 4, zone: 'bowl' } }, three, { stone: 9 })).toBe(false);
  });

  it('the stone comes out of the pile', () => {
    const pile = { stone: 3, branch: 1 };
    expect(raiseShrine(pile)).toEqual({ stone: 1, branch: 1 });
    expect(pile).toEqual({ stone: 3, branch: 1 });
    expect(shrineTicker('Glade', three)).toBe('🛐 Glade, Mossback and Sunny haul stone from the pile and raise a shrine where Glade preached.');
  });
});

describe('the faith in the save (BACKLOG-614/615)', () => {
  it('accepts the additive fields, absent or well-formed, and rejects malformed ones', () => {
    expect(isFaith(founding())).toBe(true);
    expect(isFaith({ ...founding(), heardFrom: { Rex: 'Sunny' }, shrine: { tileX: 6, tileY: 4, zone: 'bowl', derelict: true } })).toBe(true);
    expect(isFaith({ ...founding(), heardFrom: { Rex: 3 } })).toBe(false);
    expect(isFaith({ ...founding(), shrine: { tileX: 6, zone: 'bowl' } })).toBe(false);
    expect(isFaith({ ...founding(), shrine: { tileX: 6, tileY: 4, zone: 'bowl', derelict: 'yes' } })).toBe(false);
  });
});
