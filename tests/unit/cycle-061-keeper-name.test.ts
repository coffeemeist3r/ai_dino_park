import { describe, it, expect } from 'vitest';
import { cannedReply, fondGreeting, FOND_MIN, wistfulGreeting } from '../../game/src/ai/brain';
import { buildMessages } from '../../game/src/ai/webllmBrain';
import { KEEPERS, designationOf } from '../../game/src/keeper/keepers';

/**
 * The keeper has a name (BACKLOG-276). A fond (≥ FOND_MIN hearts) dino drops the chosen observer's
 * designation into its hello — deep friendship earns your name in its mouth. With no keeperName the
 * fond line falls back to the cycle-272 self-naming line, byte-for-byte.
 */

const base = { name: 'Sunny', species: 'brontosaurus', personality: 'warm' };
const AKI = 'AETHER-1';

describe('designationOf (BACKLOG-276)', () => {
  it('strips the nickname off every keeper, leaving the unit code', () => {
    expect(designationOf(KEEPERS[0])).toBe('AETHER-1');
    expect(designationOf(KEEPERS[1])).toBe('VANTA-9');
    expect(designationOf(KEEPERS[2])).toBe('LUMEN-3');
  });
});

describe('fondGreeting names the keeper when given (BACKLOG-276)', () => {
  it('with a keeper designation, the line names the observer', () => {
    expect(fondGreeting('Sunny', AKI)).toContain(AKI);
    expect(fondGreeting('Sunny', AKI)).toContain('There you are');
  });
  it('without a keeper designation, the line is the cycle-272 self-naming line (back-compat)', () => {
    expect(fondGreeting('Sunny')).toBe('There you are, friend! Sunny\'s been hoping you\'d come round.');
    expect(fondGreeting('Sunny')).toContain('Sunny');
    expect(fondGreeting('Sunny')).not.toContain(AKI);
  });
});

describe('cannedReply — a close dino names the keeper (BACKLOG-276)', () => {
  it('≥8 hearts + keeperName → the reply names the observer', () => {
    const r = cannedReply({ ...base, affection: FOND_MIN, keeperName: AKI });
    expect(r.text).toContain(AKI);
    expect(r.source).toBe('canned');
  });
  it('≥8 hearts, no keeperName → the cycle-272 line (back-compat)', () => {
    expect(cannedReply({ ...base, affection: FOND_MIN }).text).toBe(fondGreeting('Sunny'));
  });
  it('gratitude still beats the named fond line', () => {
    const r = cannedReply({ ...base, affection: 10, keeperName: AKI, gratitude: 'Twitch' });
    expect(r.text).not.toContain(AKI);
    expect(r.text).toContain('Twitch');
  });
  it('the low pole (1 heart) is wistful regardless of keeperName', () => {
    expect(cannedReply({ ...base, affection: 1, keeperName: AKI }).text).toBe(wistfulGreeting('Sunny'));
  });
  it('the mid band (5 hearts) stays generic — keeperName does not pull it fond', () => {
    const t = cannedReply({ ...base, affection: 5, keeperName: AKI }).text;
    expect(t).not.toContain('There you are');
    expect(t).not.toContain(AKI);
  });
});

describe('buildMessages — fond colour names the keeper for the LLM (BACKLOG-276)', () => {
  it('adds the naming instruction when keeperName is set', () => {
    const sys = buildMessages({ ...base, affection: 10, keeperName: AKI }, { kind: 'player_greet' })[0].content;
    expect(sys).toContain('dear, familiar friend');
    expect(sys).toContain(`call them ${AKI}`);
  });
  it('is byte-identical to the unnamed fond clause when keeperName is unset', () => {
    const sys = buildMessages({ ...base, affection: 10 }, { kind: 'player_greet' })[0].content;
    expect(sys).toContain('dear, familiar friend');
    expect(sys).not.toContain('call them');
  });
});
