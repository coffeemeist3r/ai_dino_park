import { describe, it, expect } from 'vitest';
import { dinoActivity, ACTIVITY_GLYPH, type Activity, type ActivityFlags } from '../../game/src/world/activity';

const NONE: ActivityFlags = {
  gazing: false,
  inspecting: false,
  responding: false,
  feeding: false,
  huddling: false,
  gathering: false,
  socializing: false,
};

describe('dino activity readout (BACKLOG-295)', () => {
  it('returns each activity for its lone flag', () => {
    expect(dinoActivity({ ...NONE, gazing: true })).toBe('gazing');
    expect(dinoActivity({ ...NONE, inspecting: true })).toBe('inspecting');
    expect(dinoActivity({ ...NONE, responding: true })).toBe('responding');
    expect(dinoActivity({ ...NONE, feeding: true })).toBe('feeding');
    expect(dinoActivity({ ...NONE, huddling: true })).toBe('huddling');
    expect(dinoActivity({ ...NONE, gathering: true })).toBe('gathering');
    expect(dinoActivity({ ...NONE, socializing: true })).toBe('socializing');
  });

  it('defaults to wandering when nothing is going on', () => {
    expect(dinoActivity(NONE)).toBe('wandering');
  });

  it('honors precedence: gazing beats everything', () => {
    expect(dinoActivity({ ...NONE, gazing: true, feeding: true, gathering: true })).toBe('gazing');
  });

  it('honors precedence: feeding beats huddling beats gathering beats socializing', () => {
    expect(dinoActivity({ ...NONE, feeding: true, huddling: true })).toBe('feeding');
    expect(dinoActivity({ ...NONE, huddling: true, gathering: true })).toBe('huddling');
    expect(dinoActivity({ ...NONE, gathering: true, socializing: true })).toBe('gathering');
  });

  it('has a glyph for every activity', () => {
    const all: Activity[] = [
      'gazing',
      'inspecting',
      'responding',
      'feeding',
      'huddling',
      'gathering',
      'socializing',
      'wandering',
    ];
    for (const a of all) expect(ACTIVITY_GLYPH[a]).toBeTruthy();
  });
});
