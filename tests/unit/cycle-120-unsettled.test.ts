import { describe, it, expect } from 'vitest';
import { zoneMapModel } from '../../game/src/ui/lenses';
import { zoneChain, BOWL_ID, GROVE_ID, FERNREACH_ID, HOLLOW_ID } from '../../game/src/world/zones';

/**
 * The unsettled ground on the lens (BACKLOG-474) — Milestone 10's closing structure arc. An empty ground
 * has a prosperity of 0 by construction, so before this it drew `○ quiet · 0 🦕`, indistinguishable from a
 * poor inhabited one. The flag is the whole player-facing point of the arc: the box that changes the moment
 * somebody moves in.
 */

describe('zoneMapModel unsettled column (BACKLOG-474)', () => {
  const chain = zoneChain();
  const pops = { [BOWL_ID]: 3, [GROVE_ID]: 1, [FERNREACH_ID]: 1, [HOLLOW_ID]: 0 };

  it('flags only the ground nobody has ever lived on', () => {
    const model = zoneMapModel(chain, pops, BOWL_ID, {}, {}, {}, [], {}, {}, { [HOLLOW_ID]: true });
    expect(model.find((e) => e.id === HOLLOW_ID)!.unsettled).toBe(true);
    expect(model.find((e) => e.id === BOWL_ID)!.unsettled).toBe(false);
    expect(model.find((e) => e.id === FERNREACH_ID)!.unsettled).toBe(false);
  });

  it('stops flagging it once it has a resident', () => {
    const settled = { ...pops, [HOLLOW_ID]: 1 };
    const model = zoneMapModel(chain, settled, BOWL_ID, {}, {}, {}, [], {}, {}, { [HOLLOW_ID]: false });
    expect(model.find((e) => e.id === HOLLOW_ID)!.unsettled).toBe(false);
  });

  it('stays back-compatible with every pre-474 call shape (omitted → nothing unsettled)', () => {
    for (const model of [
      zoneMapModel(chain, pops, BOWL_ID),
      zoneMapModel(chain, pops, BOWL_ID, {}, {}, {}, [], {}, {}),
    ]) {
      expect(model.every((e) => e.unsettled === false)).toBe(true);
    }
  });
});
