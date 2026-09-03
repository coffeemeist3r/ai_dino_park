import { describe, it, expect } from 'vitest';
import {
  MIN_VISITS,
  VISIT_HISTORY_MAX,
  habitualHour,
  hoursApart,
  isAnticipating,
  noteVisit,
  vigilKeeper,
  vigilLine,
  vigilMemory,
} from './vigil';

describe('the visit history (BACKLOG-121)', () => {
  it('keeps the newest visits and drops the oldest', () => {
    let hours: number[] = [];
    for (let h = 0; h < VISIT_HISTORY_MAX + 3; h++) hours = noteVisit(hours, h);
    expect(hours).toHaveLength(VISIT_HISTORY_MAX);
    expect(hours[hours.length - 1]).toBe(VISIT_HISTORY_MAX + 2);
    expect(hours[0]).toBe(3);
  });

  it('will not claim an hour it has only seen once', () => {
    expect(habitualHour([])).toBeNull();
    expect(habitualHour([9])).toBeNull();
    expect(MIN_VISITS).toBe(2);
  });

  it('answers with the mode, not the mean', () => {
    // The mean of these is half past three — an hour this keeper has never once opened the park at.
    expect(habitualHour([9, 9, 21])).toBe(9);
  });

  it('breaks a tie toward the smaller hour, so the answer is deterministic', () => {
    expect(habitualHour([7, 7, 21, 21])).toBe(7);
  });
});

describe('the dial (BACKLOG-121)', () => {
  it('wraps, so midnight is next door to eleven at night', () => {
    expect(hoursApart(23, 0)).toBe(1);
    expect(hoursApart(0, 23)).toBe(1);
    expect(hoursApart(0, 12)).toBe(12);
    expect(hoursApart(9, 9)).toBe(0);
  });

  it('anticipates inside the window and not outside it', () => {
    expect(isAnticipating([9, 9], 9)).toBe(true);
    expect(isAnticipating([9, 9], 10)).toBe(true);
    expect(isAnticipating([9, 9], 8)).toBe(true);
    expect(isAnticipating([9, 9], 15)).toBe(false);
  });

  it('anticipates nothing at all when it has no hour to go on', () => {
    // The park is allowed to be wrong, and allowed not to know. This is the half that makes the beat
    // anticipation rather than a greeting: come at an unusual hour and the hatch is empty.
    expect(isAnticipating([], 9)).toBe(false);
    expect(isAnticipating([9], 9)).toBe(false);
  });
});

describe('who keeps the vigil (BACKLOG-121)', () => {
  it('is the fondest of whoever is awake', () => {
    expect(
      vigilKeeper([
        { name: 'Sunny', friendship: 4 },
        { name: 'Glade', friendship: 30 },
        { name: 'Twitch', friendship: 0 },
      ]),
    ).toBe('Glade');
  });

  it('falls to name order on a fresh save, where nobody is fond of anybody yet', () => {
    expect(
      vigilKeeper([
        { name: 'Sunny', friendship: 0 },
        { name: 'Twitch', friendship: 0 },
        { name: 'Glade', friendship: 0 },
        { name: 'Mossback', friendship: 0 },
      ]),
    ).toBe('Glade');
  });

  it('is nobody when nobody is awake', () => {
    expect(vigilKeeper([])).toBeNull();
  });
});

describe('what it says (BACKLOG-121)', () => {
  it('grades the warmth by hearts and never fakes a bond it has not earned', () => {
    expect(vigilLine('Glade', 9)).toContain('I knew');
    expect(vigilLine('Glade', 0)).not.toContain('I knew');
    for (const hearts of [0, 3, 7]) expect(vigilLine('Glade', hearts)).toContain('Glade');
  });

  it('keeps a memory that says what it was doing, not who it was doing it for', () => {
    expect(vigilMemory()).toContain('glass');
  });
});
