/**
 * Controls help (HUD overhaul, 2026-06-12) — pure text for the bottom bar and
 * the [?] help panel. No Phaser.
 *
 * Why: the old one-line controls hint was ~610px of monospace on a 640px
 * canvas — it ran under the gift HUD and the plaque, and all three bottom
 * texts collided. The full key reference now lives in a toggled panel; the
 * bottom bar keeps three short pieces (gift left · plaque centre · chip right).
 */

import { governanceLegend } from '../world/governance';

/** The bottom-right chip that summons the panel. Click it, or press ? or /. */
export const HELP_CHIP = '[?] controls';

/** The held-item line, keys omitted — those live in the help panel now. */
export function holdingLine(label: string): string {
  return `Holding: ${label}`;
}

/**
 * The loaded-feed line (BACKLOG-067), the hatch's half of the same HUD. Keys omitted, as above.
 *
 * BACKLOG-546: an optional stock count, appended as ` ×N`. The number ticking down on every `H` is how
 * the keeper feels the satchel at all — the plaque says what you have, this says what you are about to
 * spend. Omitting `count` reproduces the cycle-158 line exactly.
 */
export function feedLine(label: string, count?: number): string {
  return count === undefined ? `Feed: ${label}` : `Feed: ${label} ×${count}`;
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
  { keys: ', .', action: 'switch loaded feed' },
  { keys: 'H', action: 'drop food' },
  { keys: 'C', action: 'friendship hearts' },
  { keys: 'V', action: 'lens (book / news)' },
  { keys: 'N', action: 'next book entry + cry' },
  { keys: 'K', action: 'observer' },
  { keys: 'B', action: 'field scan' },
  { keys: 'M', action: 'sound on/off' },
  { keys: 'T', action: 'time speed' },
  { keys: 'O', action: 'export save' },
  { keys: '?', action: 'close this' },
];

/**
 * The one gesture the touch layer has that no key spells (BACKLOG-547).
 *
 * The action buttons are one-verb buttons and the More sheet is at its geometric ceiling at ten rows
 * (BACKLOG-552), so the loaded-feed selector lives on a hold of the feed button. A gesture nobody is told
 * about is a gesture nobody finds, so the manual says it — on desktop too, where it is documentation of
 * the game rather than of the device in the reader's hand.
 */
export const TOUCH_HINT = 'hold 🍖 (touch)  switch loaded feed';

/**
 * The rendered panel lines: a title, then keys padded into a tidy column, then the governance legend
 * (BACKLOG-477) — the map lens's per-zone call row is glyphs, and a glyph a player can't decode is
 * decoration. Derived from `GOVERNANCE_CALLS`, so it can never drift from what the map actually draws.
 */
export function helpLines(rows: ReadonlyArray<HelpRow> = HELP_ROWS): string[] {
  const pad = Math.max(...rows.map((r) => r.keys.length));
  return [
    '— Controls —',
    ...rows.map((r) => `${r.keys.padEnd(pad)}  ${r.action}`),
    TOUCH_HINT,
    '',
    ...governanceLegend(),
  ];
}
