/**
 * Per-dino persona (BACKLOG-103) — CHARTER "Living minds": each dino is a distinct mind, not a
 * shared template with different adjectives. A persona is a short paragraph of self — a scrap of
 * backstory, a want, a fear, a speech quirk — LLM-authored from park lore where a model runs,
 * deterministic and name-seeded everywhere else. Generated ONCE, cached, persisted in the save,
 * never regenerated per message; a phone loading a save pays nothing.
 *
 * Pure TypeScript (no Phaser, no WebLLM): Node-testable. All inference stays behind NPCBrain.
 */

import { hashSeed, mulberry32, type Personality } from './personality';

export interface Persona {
  text: string;
  /** Where the words came from — the model, or the deterministic floor. */
  source: 'llm' | 'procedural';
}

/** Persona length cap — a persona is a paragraph, not a biography (prompt budget). */
export const PERSONA_MAX = 240;

/**
 * The park canon the authoring prompt leans on (BACKLOG-103 "authored from world lore") — the
 * vivarium framing, compact enough to ride every persona request.
 */
export const PARK_LORE =
  'The park is Pocket Cretaceous: a small glass-walled vivarium world of linked zones — the home ' +
  'bowl, a shaded grove, the golden Fernreach — where a handful of dinosaurs live whole lives. ' +
  'A watcher tends them from beyond the glass: dropping food through the hatch, warming the cold, ' +
  'learning each dino by name.';

const BACKSTORIES = [
  'hatched under the big sky-light and never stopped watching it',
  'was the last of its clutch out of the shell, and hurried ever since',
  'remembers the morning the glass fogged over and the world went soft',
  'grew up by the pond edge, and still smells of it',
  'once slept through a whole meteor shower and heard about it for weeks',
  'was first through the east edge when the grove opened',
  'kept a shiny stone for a season, then gave it away',
  'sat out a cold night alone once, and never quite forgot',
];

const WANTS = [
  'wants a friend who stays past dusk',
  'wants to taste every food the hatch has ever dropped',
  'wants to see what is past the farthest edge',
  'wants its name called first at the glass',
  'wants a warm spot no one else has found',
  'wants to be the one the others come to',
  'wants one story of its own worth retelling',
  'wants the den to itself just once',
];

const FEARS = [
  'the quiet after the lights go out',
  'being the last one anyone greets',
  'cold mornings with no one near',
  'the deep middle of the pond',
  'a day the hatch never opens',
  'being talked about after dark',
  'the far edge and what leaves through it',
  'forgetting a friend before the friend forgets it',
];

const QUIRKS = [
  'talks in questions, even to itself',
  'repeats the last word of a thought, thought',
  'hums the middle of every sentence',
  'names things before describing them',
  'trails off when the sky is interesting…',
  'counts things aloud that need no counting',
  'answers a beat late, like it heard an echo first',
  'says goodbyes twice, once for luck',
];

const pick = <T>(rand: () => number, arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];

/**
 * The deterministic floor: a name-seeded persona composed from small authored tables, trait-shaded,
 * with the hand-written roster flavor kept verbatim. Same inputs → byte-identical text, every call,
 * every device — headless CI, a declined download, and the stub brain all get a full self.
 */
export function proceduralPersona(name: string, species: string, flavor: string, traits: Personality): Persona {
  const rand = mulberry32(hashSeed(`${name}#persona`));
  const backstory = pick(rand, BACKSTORIES);
  const want = pick(rand, WANTS);
  const fear = pick(rand, FEARS);
  const quirk = pick(rand, QUIRKS);
  // A bold dino won't own its fear out loud; a timid one leads with it (trait-shaded phrasing).
  const fearLine = traits.bravery > 0.6 ? `would never admit it fears ${fear}` : `fears ${fear}`;
  const text = `${name} the ${species} — ${flavor}. ${capitalize(name)} ${backstory}; ${want}, and ${fearLine}. ${capitalize(name)} ${quirk}.`;
  return { text: text.slice(0, PERSONA_MAX), source: 'procedural' };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Drafts shorter than this are noise (a bare "ok."), not a persona — keep the floor instead. */
export const DRAFT_MIN = 20;

/**
 * Fold an untrusted model draft onto the fallback: null, empty, or too-short keeps the fallback
 * unchanged; anything else is trimmed and word-boundary capped at PERSONA_MAX. Garbage in →
 * deterministic floor out, never a crash.
 */
export function fromPersonaDraft(raw: string | null, fallback: Persona): Persona {
  const s = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (s.length < DRAFT_MIN) return fallback;
  let text = s;
  if (text.length > PERSONA_MAX) {
    const head = text.slice(0, PERSONA_MAX - 1);
    const space = head.lastIndexOf(' ');
    text = (space > 40 ? head.slice(0, space) : head).trimEnd() + '…';
  }
  return { text, source: 'llm' };
}

/**
 * The generate-once guard: an 'llm' persona is settled forever (never re-authored); a procedural
 * one upgrades through `fromPersonaDraft` at most as far as one valid draft takes it. Pure.
 */
export function upgradePersona(cached: Persona, draft: string | null): Persona {
  if (cached.source === 'llm') return cached;
  return fromPersonaDraft(draft, cached);
}
