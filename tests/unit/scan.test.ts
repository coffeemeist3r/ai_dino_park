import { describe, it, expect } from 'vitest';
import { canScan, scanLines, scanRefusal, type ScanSubject } from '../../game/src/keeper/scan';
import { keeperById } from '../../game/src/keeper/keepers';
import { AXES, seededPersonality } from '../../game/src/ai/personality';
import { moodFromTraits } from '../../game/src/ai/brain';
import { favoriteFood } from '../../game/src/world/foods';

const aether = keeperById('aether');
const vanta = keeperById('vanta');
const lumen = keeperById('lumen');

const rex: ScanSubject = {
  name: 'Rex',
  species: 'triceratops',
  traits: seededPersonality('Rex'),
  role: 'wanderer',
};

describe('field scan (BACKLOG-157)', () => {
  it('only LUMEN-3 can scan', () => {
    expect(canScan(lumen)).toBe(true);
    expect(canScan(aether)).toBe(false);
    expect(canScan(vanta)).toBe(false);
  });

  it('the dossier names the subject, its species, and its role', () => {
    const text = scanLines(rex).join('\n');
    expect(text).toContain('Rex');
    expect(text).toContain('triceratops');
    expect(text).toContain('wanderer');
  });

  it('all five personality axes appear with both pole labels', () => {
    const text = scanLines(rex).join('\n');
    for (const axis of AXES) {
      expect(text).toContain(axis.low);
      expect(text).toContain(axis.high);
    }
  });

  it('the favorite-food line matches favoriteFood for the same traits', () => {
    const fav = favoriteFood(rex.traits);
    const text = scanLines(rex).join('\n');
    expect(text).toContain(fav.emoji);
    expect(text).toContain(fav.label);
  });

  it('the favorite-food line follows the live season (BACKLOG-170)', () => {
    expect(scanLines(rex, 'winter').join('\n')).toContain(favoriteFood(rex.traits, 'winter').label);
    expect(scanLines(rex, 'summer').join('\n')).toContain(favoriteFood(rex.traits, 'summer').label);
    // Rex sways, so the two readouts differ.
    expect(scanLines(rex, 'winter')).not.toEqual(scanLines(rex, 'summer'));
  });

  it('the mood line matches moodFromTraits for the same traits', () => {
    expect(scanLines(rex).join('\n')).toContain(`mood: ${moodFromTraits(rex.traits)}`);
  });

  it('is deterministic: the same subject scans identically twice', () => {
    expect(scanLines(rex)).toEqual(scanLines(rex));
  });

  it('refusals are distinct, non-empty, in-character — and LUMEN-3 never refuses', () => {
    const a = scanRefusal(aether);
    const v = scanRefusal(vanta);
    expect(a).toBeTruthy();
    expect(v).toBeTruthy();
    expect(a).not.toBe(v);
    expect(scanRefusal(lumen)).toBe('');
  });
});
