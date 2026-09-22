/**
 * The watcher's self (BACKLOG-156) — the keeper's mirror of `ai/persona.ts`.
 *
 * CHARTER "Living minds" says a mind is authored from world lore where the device allows and stands on
 * a deterministic procedural floor where it does not, generated once, cached, persisted. Every dinosaur
 * in the bowl has had that since BACKLOG-103. The thing the player *is* has had one hand-written line,
 * `Keeper.backstory`, since cycle 155 — and a grep the night this item was taken found **zero render
 * sites** for it. Four observers, four written pasts, and nobody had ever read one.
 *
 * So this module is deliberately two halves that ship together: the persona, and `keeperIntroLines`,
 * which is where a player reads it. Caching a second and richer string into the same silence would have
 * been BACKLOG-156 shipped as groundwork, and CHARTER v7 calls groundwork a REWORK.
 *
 * Pure TypeScript (no Phaser, no WebLLM): Node-testable. The cache is `KeeperRecord.persona`, the slot
 * BACKLOG-555 shipped empty and shape-matched to `SaveData.personas`, so nothing here needs a migration.
 * The validation and the generate-once guard are `ai/persona.ts`'s — imported, never restated.
 */

import { hashSeed, mulberry32 } from '../ai/personality';
import { PARK_LORE, PERSONA_MAX } from '../ai/persona';
import type { KeeperPersona } from './record';
import type { Keeper } from './keepers';

/**
 * The canon the authoring prompt leans on, from the *watcher's* side.
 *
 * `PARK_LORE` describes the vivarium for something living inside it. A keeper is on the other side of
 * the glass and arrived from another time, so the prompt needs that premise on top. Composed rather
 * than re-written: one canon, one edit site, and a change to the park reaches both prompts.
 */
export const KEEPER_LORE =
  `${PARK_LORE} ` +
  'You are writing one of the watchers. They are not native to the park and not, mostly, alive in the ' +
  'way the dinosaurs are: they drifted back out of far-future eras to observe, and they cannot go in. ' +
  'All a watcher can do is look, open the hatch, and keep records nobody asked it for.';

/** What it does with its hands, in a place where it has nothing to do with them. */
const HABITS = [
  'it stands at the same pane every morning and will not say why',
  'it has never once opened the hatch without announcing itself first',
  'it counts the sleepers before it counts anything else',
  'it waits out the whole of a nap rather than wake anybody',
  'it walks the long way round the bowl so the edge-dwellers see it coming',
  'it logs the weather in a park that has no weather',
  'it leaves the light on a little past dusk, every time',
  'it will not step between two dinos that are talking',
];

/** The thing about this place it has not worked out yet — a watcher's version of a want. */
const STUDIES = [
  'it is still trying to work out what the quiet ones are for',
  'it wants to know which of them would miss it',
  'it is working out whether being watched is a kindness',
  'it is trying to learn a name it has not been told',
  'it wants to see one of them do something it did not predict',
  'it is still deciding whether it is a keeper or a guest',
  'it wants to catch the exact moment two of them become friends',
  'it is trying to find out what they call it when it is not listening',
];

/** What ends up in the record. The last clause, because it is the one that sounds like a voice. */
const NOTES = [
  'Its notes are mostly about the light.',
  'Its notes are dated in a calendar nothing here uses.',
  'Its notes have more questions in them than findings.',
  'It writes everything down twice, in case.',
  'Its notes begin, every day, with who was awake.',
  'It has never filed a single one of its reports.',
  'Its notes stop mid-sentence whenever somebody comes near the glass.',
  'It keeps one page that is only names.',
];

const pick = <T>(rand: () => number, arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];

/**
 * The deterministic floor: an **id**-seeded self composed from small authored tables, opening on the
 * keeper's own hand-written `backstory` kept verbatim — exactly as `proceduralPersona` keeps a dino's
 * roster `flavor`. Same keeper, byte-identical text, every call, every device.
 *
 * Seeded off `keeper.id` rather than `keeper.name` on purpose. The name carries a designation *and* a
 * quoted nickname and is the field most likely to be reworded for flavour; the id is the stable key the
 * save, the art lookup and `keeperById` all already trust. A cosmetic rename must not silently re-author
 * a cached self, which is the failure mode a name seed would have shipped with.
 */
export function proceduralKeeperPersona(keeper: Keeper): KeeperPersona {
  const rand = mulberry32(hashSeed(`${keeper.id}#keeperpersona`));
  const habit = pick(rand, HABITS);
  const study = pick(rand, STUDIES);
  const note = pick(rand, NOTES);
  const text = `${keeper.backstory} Here, ${habit}, and ${study}. ${note}`;
  return { text: text.slice(0, PERSONA_MAX), source: 'procedural' };
}

/**
 * What the picker says when you commit to an observer — and the only place in the park a keeper's self
 * has ever been legible.
 *
 * Three lines: who you are and when you came from, what you are good at, and who you are. The persona
 * goes last because it is the longest and the only one that changes between a procedural floor and an
 * authored self; a player who has seen this dialog before reads the first two lines and stops.
 */
export function keeperIntroLines(keeper: Keeper, persona: KeeperPersona): string[] {
  return [
    `You are ${keeper.name}, from ${keeper.era}.`,
    `${keeper.ability.label}: ${keeper.ability.desc}`,
    persona.text,
  ];
}
