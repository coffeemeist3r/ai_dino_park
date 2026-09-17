/**
 * What a dino makes of *you* (BACKLOG-160) — the shading half of "dinos address the observer".
 *
 * The naming half shipped as BACKLOG-276/278: `keeperAddress` escalates designation to nickname at ten
 * hearts and the greet context has carried it since. What never shipped is the part the item's title
 * actually promises — a line that depends on **which** watcher you are. Until this module there was
 * exactly one keeper-aware string in the park, `fondGreeting`, it was gated at eight hearts, and it was
 * byte-identical for every observer. Picking a watcher changed the affinity arithmetic and nothing a
 * player could hear.
 *
 * The shape is deliberately `ai/brain.ts`'s aside idiom (`hungryAside`, `rattledAside`, `providerAside`,
 * `tasteAside`): a temperament-shaded clause with a leading space that composes onto whatever register the
 * dino was going to use. That is why the first impression is reachable on the generic hello a stranger
 * gives you on a fresh save, rather than living inside the eight-heart line where no new player would
 * ever find it.
 *
 * Said **once per dino per watcher** — a first impression that recurred would be a tic, not a beat. The
 * map is keyed by which observer, not by "has met", so changing your chassis re-arms the whole park.
 *
 * Pure TypeScript (no Phaser, no inference): Node-testable. WorldScene owns the map and the save.
 */

import { PRICKLY_MAX, EFFUSIVE_MIN } from '../ai/brain';
import type { Personality } from '../ai/personality';

/** The three shades every aside register in `brain.ts` carries: grumbled, gushed, and plain. */
interface Note {
  prickly: string;
  warm: string;
  plain: string;
}

/**
 * One note per roster id — what the dino can actually *see* standing in front of it.
 *
 * Aki is brass and calm with a lit chest; Vix is a gunmetal wedge with one red slit; Lux is mostly a great
 * round lens and is visibly taking notes. Kes is the odd one out and the notes say so: it is the only
 * watcher a dinosaur can recognise, and the recognition is uncomfortable rather than warm.
 *
 * A unit test asserts there is a note for every id in `KEEPERS`, which is what stops the next observer
 * shipping mute — the exact failure this cycle is fixing for the lines.
 */
const NOTES: Record<string, Note> = {
  aether: {
    prickly: ` …you hum. standing there, humming. I'd rather you didn't.`,
    warm: ` …oh, and you *hum*, did you know? a little warm sound in your chest. I like it, I do.`,
    plain: ` …you hum when you stand still. I noticed that.`,
  },
  vanta: {
    prickly: ` …that red eye of yours. don't point it at me.`,
    warm: ` …oh — your eye! the red one! it's terribly fierce, isn't it. I think it suits you.`,
    plain: ` …you've got the one red eye. it doesn't blink. I've watched.`,
  },
  lumen: {
    prickly: ` …you're writing me down. I can hear the little clicks. stop it.`,
    warm: ` …oh, are you writing me down? in the big round eye? put something nice, won't you!`,
    plain: ` …you're writing me down in that round eye of yours, aren't you.`,
  },
  kestrel: {
    prickly: ` …you smell like family and you don't move like family. I don't care for it.`,
    warm: ` …oh — you smell almost like *us*! a cousin from somewhere, are you? come sit, cousin.`,
    plain: ` …you smell almost like one of us. almost. it's the feathers, I think.`,
  },
};

/** The longest note in the table — `cannedReply`'s length caps are derived from this, never typed. */
export const WATCHER_ASIDE_MAX = Math.max(
  ...Object.values(NOTES).flatMap((n) => [n.prickly.length, n.warm.length, n.plain.length]),
);

/**
 * What this dino says about the watcher in front of it, the first time it meets you wearing that chassis.
 * Temperament-shaded on the register's own convention; no traits gives the plain line. An unknown id (or
 * none) adds nothing at all, which is the back-compat path every existing greet takes.
 */
export function watcherAside(keeperId: string | undefined, traits?: Personality): string {
  const note = keeperId ? NOTES[keeperId] : undefined;
  if (!note) return '';
  if (traits && traits.agreeableness < PRICKLY_MAX) return note.prickly;
  if (traits && traits.agreeableness > EFFUSIVE_MIN) return note.warm;
  return note.plain;
}

/** Ids the register has a note for — the test's iteration target, and a fifth watcher's checklist. */
export function watchersWithNotes(): string[] {
  return Object.keys(NOTES);
}

/** Has this dino yet to meet you wearing *this* chassis? A different watcher is a fresh first look. */
export function firstMeeting(
  met: Readonly<Record<string, string>>,
  dino: string,
  keeperId: string,
): boolean {
  return met[dino] !== keeperId;
}

/** Record the meeting. Returns a new map — the caller's is never mutated. */
export function recordMeeting(
  met: Readonly<Record<string, string>>,
  dino: string,
  keeperId: string,
): Record<string, string> {
  return { ...met, [dino]: keeperId };
}
