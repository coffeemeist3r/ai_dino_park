import { describe, it, expect } from 'vitest';
import { repairGain, repairLine, repairMemory, REPAIR_BONUS } from '../../game/src/world/repair';
import { greetGain, BASE_GAIN } from '../../game/src/social/friendship';
import { seededPersonality } from '../../game/src/ai/personality';

describe('repair (BACKLOG-125)', () => {
  const warm = seededPersonality('Sunny');
  const cold = seededPersonality('Twitch');

  it('a repair greet always out-earns a normal greet for the same dino', () => {
    expect(repairGain(warm)).toBeGreaterThan(greetGain(warm));
    expect(repairGain(cold)).toBeGreaterThan(greetGain(cold));
    expect(repairGain(undefined)).toBeGreaterThan(greetGain(undefined));
  });

  it('the outsized bump is exactly REPAIR_BONUS above the normal gain', () => {
    expect(repairGain(warm) - greetGain(warm)).toBe(REPAIR_BONUS);
    expect(repairGain(cold) - greetGain(cold)).toBe(REPAIR_BONUS);
  });

  it('the no-traits path is the base gain plus the bonus', () => {
    expect(repairGain(undefined)).toBe(BASE_GAIN + REPAIR_BONUS);
  });

  it('the repair line names the dino and shows the 😊', () => {
    expect(repairLine('Glade')).toContain('Glade');
    expect(repairLine('Glade')).toContain('😊');
  });

  it('the repair memory names the dino and is distinct from a plain greet line', () => {
    const m = repairMemory('Glade');
    expect(m).toContain('Glade');
    expect(m).toBeTruthy();
    expect(m).not.toBe('the human stopped by to say hello');
  });
});
