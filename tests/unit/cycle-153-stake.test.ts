/**
 * BACKLOG-535 — the stake's driver, decided.
 *
 * The fourth founder's-stake state has had a rig waiting for it since cycle 144 and no host for seven
 * Artist fires, because *the ground is still being looked after* was not a number this park had. These
 * tests pin the number it now is — the upkeep ledger — and, more importantly, pin the thing the choice was
 * made for: the founding Grove reads **not kept** and reads **kept** after the mend a player watches in the
 * first minute. A driver that could not move between those two frames would have been the wrong driver
 * however nice the rig looked.
 */

import { describe, it, expect } from 'vitest';
import {
  STAKE_ART_KEY,
  STAKE_HOLLOWED_ART_KEY,
  STAKE_KEPT_ART_KEY,
  STAKE_NATIVE_ART_KEY,
  stakeArtKey,
  stakeUpkeepStep,
} from '../../game/src/world/stake';
import { FOUNDING_LANDMARKS, FOUNDING_RUIN } from '../../game/src/world/founding';
import { afterOneSession, darkEntries, worldPlacedProps } from '../../game/src/world/reachability';

describe('what "still being looked after" means (BACKLOG-535)', () => {
  it('is false for a ground that has raised nothing — nothing is not the same as nothing broken', () => {
    expect(stakeUpkeepStep(0, 0)).toBe(false);
  });

  it('is true for a ground whose whole skyline is standing', () => {
    expect(stakeUpkeepStep(2, 0)).toBe(true);
    expect(stakeUpkeepStep(1, 0)).toBe(true);
  });

  it('is false the moment one landmark is down, however many are up', () => {
    expect(stakeUpkeepStep(2, 1)).toBe(false);
    expect(stakeUpkeepStep(9, 1)).toBe(false);
  });
});

describe('the mark a kept ground shows', () => {
  it('shows the tended post whichever way the ground was founded', () => {
    expect(stakeArtKey('born', false, true)).toBe(STAKE_KEPT_ART_KEY);
    expect(stakeArtKey('crossed', false, true)).toBe(STAKE_KEPT_ART_KEY);
  });

  it('yields to hollowed — an abandoned ground is abandoned, tended or not', () => {
    expect(stakeArtKey('born', true, true)).toBe(STAKE_HOLLOWED_ART_KEY);
    expect(stakeArtKey('crossed', true, true)).toBe(STAKE_HOLLOWED_ART_KEY);
  });

  it('still shows nothing on ground nobody has ever founded', () => {
    expect(stakeArtKey(null, false, true)).toBeNull();
  });

  it('leaves the three existing states exactly as they were', () => {
    expect(stakeArtKey('born', false, false)).toBe(STAKE_NATIVE_ART_KEY);
    expect(stakeArtKey('crossed', false, false)).toBe(STAKE_ART_KEY);
    expect(stakeArtKey('born', true, false)).toBe(STAKE_HOLLOWED_ART_KEY);
  });
});

describe('the two frames the driver was chosen for', () => {
  const z = FOUNDING_RUIN.zone;

  it('reads not-kept on the founding Grove, so the change is there to watch', () => {
    // Derived off the founding tables rather than written down: a later pass that thins the skyline or
    // drops the ruin fails here naming this item instead of going quiet.
    const standing = FOUNDING_LANDMARKS.filter((l) => l.zone === z).length;
    expect(stakeUpkeepStep(standing, 1)).toBe(false);
  });

  it('reads kept after one watched session — the mend is what flips it', () => {
    const after = afterOneSession();
    expect(after.derelict[z] ?? 1).toBe(0);
    expect(stakeUpkeepStep(after.standing[z] ?? 0, after.derelict[z] ?? 0)).toBe(true);
  });

  it('is a state the world can actually place, and the whole register still walks clean', () => {
    expect(worldPlacedProps().has(STAKE_KEPT_ART_KEY)).toBe(true);
    expect(darkEntries()).toEqual([]);
  });
});
