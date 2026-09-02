/**
 * The watch (BACKLOG-524) — the human half of the night shift.
 *
 * `wakingIn` makes a ground's *output* follow its cast's hours; this is the one thing somebody does
 * *because* they are the only one awake on it. Same shape as `lastone.ts` (464) on purpose: pure strings, a
 * bubble, a ticker line and a memory that rides recall into the dino's next greeting, with WorldScene doing
 * the scanning and the dedup. Two beats that read alike in the ticker should be built alike.
 *
 * The 👁 here is plain text and is **not** `ROUSE_GLYPH`: that one hangs off `awakeAtNight` and is
 * BACKLOG-520's drawn host, and re-pointing a shipped rig's meaning for a tell the ticker already carries
 * would be churn.
 */

/** The bubble over whoever is keeping the watch. */
export function watchLine(): string {
  return '👁 Somebody should stay up…';
}

/** The ticker line naming who is awake while their ground sleeps, and where. */
export function watchEvent(name: string, zoneName: string): string {
  return `👁 ${name} keeps the watch over ${zoneName}`;
}

/** The trace the watcher keeps — rides recall into its next greeting (no leading article). */
export function watchMemory(zoneName: string): string {
  return `you kept the watch while ${zoneName} slept`;
}
