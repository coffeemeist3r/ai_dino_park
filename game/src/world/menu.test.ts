import { describe, it, expect } from 'vitest';
import { FOODS } from './foods';
import { menuLine, noteTaste, hasTasted, MENU_BLANK, MENU_GLYPH, FAVORITE_UNKNOWN } from './menu';

const greens = FOODS.find((f) => f.id === 'greens')!;
const meat = FOODS.find((f) => f.id === 'meat')!;

describe('BACKLOG-069 — the menu in the book', () => {
  it('starts blank: one cell per food and no favorite named', () => {
    const line = menuLine([], greens);
    expect(line.startsWith(`${MENU_GLYPH} menu: `)).toBe(true);
    expect(line).toContain(FAVORITE_UNKNOWN);
    expect(line).not.toContain('loves');
  });

  it('has exactly one cell per food, so a food added later cannot silently shorten the line', () => {
    const cells = menuLine([], greens).slice(`${MENU_GLYPH} menu: `.length).split('  ')[0];
    expect([...cells].filter((c) => c === MENU_BLANK)).toHaveLength(FOODS.length);
  });

  it('fills in the slot of a food that has been eaten, and leaves the rest blank', () => {
    const line = menuLine(['greens'], meat);
    expect(line).toContain(greens.emoji);
    expect(line).not.toContain(meat.emoji);
  });

  it('names the favorite only once that food has actually been eaten', () => {
    expect(menuLine(['meat'], greens)).toContain(FAVORITE_UNKNOWN);
    expect(menuLine(['meat', 'greens'], greens)).toContain(`loves ${greens.emoji} ${greens.label}`);
  });

  it('a full menu still only names the one favorite', () => {
    const all = FOODS.map((f) => f.id);
    const line = menuLine(all, greens);
    expect(line).toContain(`loves ${greens.emoji} ${greens.label}`);
    expect(line).not.toContain(MENU_BLANK);
  });
});

describe('BACKLOG-069 — the record', () => {
  it('records a taste', () => {
    const rec = noteTaste({}, 'Rex', 'greens');
    expect(hasTasted(rec, 'Rex', 'greens')).toBe(true);
    expect(hasTasted(rec, 'Rex', 'meat')).toBe(false);
  });

  it('is idempotent, and returns the identical object on a repeat', () => {
    const once = noteTaste({}, 'Rex', 'greens');
    expect(noteTaste(once, 'Rex', 'greens')).toBe(once);
  });

  it('keeps dinos apart', () => {
    const rec = noteTaste(noteTaste({}, 'Rex', 'greens'), 'Mossback', 'meat');
    expect(hasTasted(rec, 'Rex', 'meat')).toBe(false);
    expect(hasTasted(rec, 'Mossback', 'meat')).toBe(true);
  });

  it('accumulates across foods', () => {
    const rec = noteTaste(noteTaste({}, 'Rex', 'greens'), 'Rex', 'fish');
    expect(rec['Rex']).toEqual(['greens', 'fish']);
  });

  it('an unknown dino reads as having tasted nothing', () => {
    expect(hasTasted({}, 'Nobody', 'greens')).toBe(false);
    expect(menuLine([], greens)).toContain(FAVORITE_UNKNOWN);
  });
});
