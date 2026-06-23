/**
 * Sleep murmurs (BACKLOG-181) — the den dreams. A huddled dino occasionally murmurs a quiet 💭 sleep-line
 * drawn from its strongest memory of the day, so the night becomes a place where each dino's day echoes
 * back in its own half-formed thought (distinctness in the overheard-dream register).
 *
 * Pure TypeScript (no Phaser, no AI backend — the `NPCBrain` boundary stays intact): Node-testable. This
 * is the deterministic core; an LLM-coloured murmur could layer on later behind `brain.ts` (181 follow-ups).
 */

/** The day's strongest memory to dream on — the most recent entry, or null when the dino has none yet. */
export function pickMurmurMemory(events: string[]): string | null {
  return events.length ? events[events.length - 1] : null;
}

/**
 * A 💭 sleep-line from a memory. A logged memory often leads with an event glyph ("🍖 ate its favorite");
 * strip that so the dream reads as a drowsy fragment, not a copied log line. No memory → a generic doze.
 */
export function murmurLine(memory: string | null): string {
  if (!memory) return '💭 …zzz…';
  const frag = memory.replace(/^[^A-Za-z0-9]+/, '').trim();
  return `💭 …${frag}…`;
}
