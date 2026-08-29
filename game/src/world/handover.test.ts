import { describe, it, expect } from 'vitest';
import { handoverBeat, priorityPhrase, HANDOVER_MARK } from './handover';

/**
 * The say changes hands (BACKLOG-467) — the governance turnover beat. Pure wording + the "genuine handover"
 * rule; WorldScene owns the per-zone tracking and the ticker. The integration seam (one beat per handover,
 * persisted holder) is proven in the e2e.
 */
describe('handoverBeat (BACKLOG-467)', () => {
  it('fires on the first provider a zone crowns (prev null → a name)', () => {
    const beat = handoverBeat(null, 'Sunny', 'The Grove', 'feed');
    expect(beat).not.toBeNull();
    expect(beat).toContain('Sunny');
    expect(beat).toContain("the Grove's table"); // BACKLOG-499
    expect(beat!.startsWith(HANDOVER_MARK)).toBe(true);
  });

  it('fires on a true turnover (one name → a different name)', () => {
    const beat = handoverBeat('Sunny', 'Rex', 'The Grove', 'bank');
    expect(beat).toContain('Rex');
    expect(beat).not.toContain('Sunny');
  });

  it('stays silent when the provider is unchanged', () => {
    expect(handoverBeat('Sunny', 'Sunny', 'The Grove', 'feed')).toBeNull();
  });

  it('stays silent when the say falls vacant (next null) — a departure is not a handover', () => {
    expect(handoverBeat('Sunny', null, 'The Grove', 'feed')).toBeNull();
    expect(handoverBeat(null, null, 'The Grove', 'bank')).toBeNull();
  });

  it('the priority colours the tail — feed puts mouths first, bank puts walls first', () => {
    expect(handoverBeat(null, 'Sunny', 'The Grove', 'feed')).toContain('mouths before walls');
    expect(handoverBeat(null, 'Sunny', 'The Grove', 'bank')).toContain('walls before mouths');
    expect(priorityPhrase('feed')).toBe('mouths before walls');
    expect(priorityPhrase('bank')).toBe('walls before mouths');
  });
});
