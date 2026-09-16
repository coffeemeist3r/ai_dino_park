import { describe, expect, it } from 'vitest';
import {
  ENVY_FADES_AFTER_STEPS,
  ENVY_POINTS_CEILING,
  ENVY_WATCH_TILES,
  enviousWitness,
  envyEventLine,
  envyHasFaded,
  envyMemory,
  envySawMemory,
  wistfulGreetLine,
  type Watcher,
} from './envy';

const w = (name: string, points: number, tiles: number): Watcher => ({ name, points, tiles });

describe('enviousWitness (BACKLOG-126)', () => {
  it('picks the lowest-friendship eligible watcher, not the nearest', () => {
    expect(enviousWitness([w('Near', 12, 1), w('Far', 3, 4)], 30)).toBe('Far');
  });

  it('breaks a points tie by distance, then by name', () => {
    expect(enviousWitness([w('Far', 5, 4), w('Near', 5, 1)], 30)).toBe('Near');
    expect(enviousWitness([w('Zeb', 5, 2), w('Ada', 5, 2)], 30)).toBe('Ada');
  });

  it('never picks a watcher above the ceiling', () => {
    expect(enviousWitness([w('Rich', ENVY_POINTS_CEILING + 1, 1)], 99)).toBeNull();
    expect(enviousWitness([w('Just', ENVY_POINTS_CEILING, 1)], 99)).toBe('Just');
  });

  it('never picks a watcher the keeper does not like less than the eater', () => {
    // below the ceiling and standing right there, but it is *ahead* of the eater: nothing to envy.
    expect(enviousWitness([w('Ahead', 9, 1)], 4)).toBeNull();
    expect(enviousWitness([w('Level', 9, 1)], 9)).toBeNull();
    expect(enviousWitness([w('Behind', 8, 1)], 9)).toBe('Behind');
  });

  it('never picks a watcher out of range', () => {
    expect(enviousWitness([w('Yonder', 0, ENVY_WATCH_TILES + 0.1)], 10)).toBeNull();
    expect(enviousWitness([w('Edge', 0, ENVY_WATCH_TILES)], 10)).toBe('Edge');
  });

  it('is null with nobody watching', () => {
    expect(enviousWitness([], 10)).toBeNull();
  });

  it('is null when the eater itself has nothing — an unfed park envies nobody', () => {
    // Every gate is a strict `<` against the eater, so a roster all on zero produces no slight at all.
    expect(enviousWitness([w('A', 0, 1), w('B', 0, 2)], 0)).toBeNull();
  });
});

describe('envyHasFaded', () => {
  it('holds the slight, then drops it', () => {
    expect(envyHasFaded(0)).toBe(false);
    expect(envyHasFaded(ENVY_FADES_AFTER_STEPS - 1)).toBe(false);
    expect(envyHasFaded(ENVY_FADES_AFTER_STEPS)).toBe(true);
  });

  it('lapses inside the ten minutes CHARTER v7 measures a feature over', () => {
    expect((ENVY_FADES_AFTER_STEPS * 3) / 60).toBeLessThan(10);
  });
});

describe('the words', () => {
  it('files the item’s own sentence, and names the eater in every line', () => {
    expect(envyMemory('Rex')).toBe('the keeper likes Rex more');
    expect(envySawMemory('Rex', 'greens')).toContain('Rex');
    expect(envySawMemory('Rex', 'greens')).toContain('greens');
    expect(envyEventLine('Glade', 'Rex', 'greens')).toContain('Glade');
    expect(envyEventLine('Glade', 'Rex', 'greens')).toContain('Rex');
    expect(wistfulGreetLine('Glade', 'Rex')).toContain('Glade');
    expect(wistfulGreetLine('Glade', 'Rex')).toContain('Rex');
  });
});
