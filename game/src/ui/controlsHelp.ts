/**
 * Controls help (HUD overhaul, 2026-06-12) — pure text for the bottom bar and
 * the [?] help panel. No Phaser.
 *
 * Why: the old one-line controls hint was ~610px of monospace on a 640px
 * canvas — it ran under the gift HUD and the plaque, and all three bottom
 * texts collided. The full key reference now lives in a toggled panel; the
 * bottom bar keeps three short pieces (gift left · plaque centre · chip right).
 */

/** The bottom-right chip that summons the panel. Click it, or press ? or /. */
export const HELP_CHIP = '[?] controls';

/** The held-item line, keys omitted — those live in the help panel now. */
export function holdingLine(label: string): string {
  return `Holding: ${label}`;
}

export interface HelpRow {
  keys: string;
  action: string;
}

/** Every keyboard binding the scene wires, one row each. */
export const HELP_ROWS: ReadonlyArray<HelpRow> = [
  { keys: 'WASD / arrows', action: 'move' },
  { keys: 'E or Z', action: 'talk' },
  { keys: 'F', action: 'give held item' },
  { keys: '[ ]', action: 'switch held item' },
  { keys: 'H', action: 'drop food' },
  { keys: 'C', action: 'friendship hearts' },
  { keys: 'V', action: 'lens (book / news)' },
  { keys: 'K', action: 'observer' },
  { keys: 'B', action: 'field scan' },
  { keys: 'M', action: 'sound on/off' },
  { keys: 'T', action: 'time speed' },
  { keys: 'O', action: 'export save' },
  { keys: '?', action: 'close this' },
];

/** The rendered panel lines: a title, then keys padded into a tidy column. */
export function helpLines(rows: ReadonlyArray<HelpRow> = HELP_ROWS): string[] {
  const pad = Math.max(...rows.map((r) => r.keys.length));
  return ['— Controls —', ...rows.map((r) => `${r.keys.padEnd(pad)}  ${r.action}`)];
}
