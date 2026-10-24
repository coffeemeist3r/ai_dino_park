import { describe, expect, it } from 'vitest';
import { courtTicker, courterMemory, courtship, type CourtContext } from './courtship';
import { RIVAL_BAR } from './grudges';
import { foundingBonds } from '../world/founding';
import { ROSTER } from '../entities/roster';
import { pairKey } from './meetings';

const names = ROSTER.map((r) => r.name);
const ctx = (grudge: number): CourtContext => ({
  bonds: foundingBonds(),
  names,
  bravery: { Mossback: 0.3, Glade: 0.6 },
  young: new Set(),
  pairs: {},
  grudges: { [pairKey('Mossback', 'Glade')]: grudge },
});

describe('a grudge in the way (BACKLOG-624)', () => {
  it('a grudge at the rival bar turns the courter down', () => {
    expect(courtship('Mossback', 'Glade', ctx(RIVAL_BAR))).toEqual({ courter: 'Glade', courted: 'Mossback', accept: false, grudge: true });
  });

  it('a grudge cooled below the bar pairs anyway, as old rivals come round', () => {
    expect(courtship('Mossback', 'Glade', ctx(RIVAL_BAR - 1))).toEqual({ courter: 'Glade', courted: 'Mossback', accept: true, cameRound: true });
    expect(courtship('Mossback', 'Glade', ctx(0))).toEqual({ courter: 'Glade', courted: 'Mossback', accept: true });
  });

  it('the ticker and the memory say why', () => {
    const no = { courter: 'Mossback', courted: 'Twitch', accept: false, grudge: true } as const;
    expect(courtTicker(no, 'a fern')).toBe("💔 Mossback courts Twitch with a fern. Twitch hasn't forgiven Mossback.");
    expect(courterMemory(no, 'a fern')).toBe("I courted Twitch with a fern; Twitch hasn't forgiven me");
    expect(courtTicker({ courter: 'A', courted: 'B', accept: true, cameRound: true }, 'a song')).toBe('💕 A courts B with a song. B says yes. Old rivals, come round.');
  });
});
