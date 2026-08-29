/**
 * NPCBrain — hard boundary between the game and whatever inference backend powers NPCs.
 *
 * Implementations MUST conform to this interface. The game must NOT import WebLLM
 * (or any concrete inference backend) outside this folder. This is what lets us swap
 * to a native Capacitor LLM plugin on mobile without touching scene code.
 *
 * Charter §Stack — "The NPCBrain interface is a hard boundary. WebLLM-specific code
 * must not leak past it."
 */

import type { Personality } from './personality';
import type { Season } from '../world/seasons';
import type { SpendPriority } from '../world/governance';
import type { HatchOutcome } from '../world/manner';
import type { TicKind } from '../world/tic';
import type { Activity } from '../world/activity';
import { WebLLMBrain } from './webllmBrain';
import { rand } from '../world/rng';
import { theZone } from '../world/zones'; // BACKLOG-499

export interface NPCContext {
  name: string;
  species: string;
  personality: string;
  traits?: Personality;
  recentMemory?: string[];
  /** Time-of-day phase (dawn/day/dusk/night) for prompt flavor. */
  timeOfDay?: string;
  /** Player friendship level with this dino, 0–10 hearts. */
  affection?: number;
  /** If set, the name of whoever just cleared this dino's name — surfaces as spoken gratitude (BACKLOG-247). */
  gratitude?: string;
  /** The chosen observer's designation — a fond dino drops it into its hello (BACKLOG-276). */
  keeperName?: string;
  /** Pressing hunger (need-drive 371 over threshold): the dino lets it slip in its line (BACKLOG-368). */
  hungry?: boolean;
  /** If set, the name of the carnivore that just chased this dino — it greets rattled, naming it (BACKLOG-440). */
  rattled?: string;
  /** The provider keeping this dino's zone fed — it names them, unprompted (BACKLOG-453). Never itself. */
  provider?: { name: string; zoneName: string };
  /** The season the bowl is living in (BACKLOG-173): a dino grumbles through winter, savours spring. */
  season?: Season;
  /**
   * The spend policy of the ground this dino lives on (BACKLOG-469), set only for a **hungry** dino on a
   * zone whose provider has set one (463): it voices how its ground has chosen to feed it — grateful on a
   * feed-first ground, grumbling on a bank-first one. Absent when the dino isn't hungry or the ground has
   * no policy, so the tell stays a flavour beat rather than an every-greet tic.
   */
  groundPolicy?: SpendPriority;
  /**
   * How this dino's last contested drop went, and who it was with (BACKLOG-404). Set only while the beat is
   * still on the 6-slot recall ring, so the mood is a passing feeling rather than a standing fact — the
   * career read lives in the collection book (402), and this is the one the player hears.
   */
  mealtime?: { outcome: HatchOutcome; other: string };
  /**
   * The ritual this dino was interrupted at (BACKLOG-423), set only on a catch. The model is told what
   * happened and answers in the colour of it — it is never asked to author the bashful/fond frame itself,
   * which stays the deterministic layer (`ticAside`, `caughtOpener`). Absent → today's prompt exactly.
   */
  interrupted?: { kind: TicKind; label: string };
  /**
   * What this dino was doing when the keeper walked up (BACKLOG-300), from the 295 activity read. Set only
   * when it was doing something nameable — a plain wanderer carries nothing, so an ordinary greet's prompt
   * is byte-identical to before. Never set on a catch: the ritual (`interrupted`) is the more specific
   * truth about a dino found alone with its own habit, and the two never both fire.
   */
  doing?: Activity;
}

export interface Observation {
  kind: 'player_approach' | 'player_greet' | 'world_event' | 'npc_meet';
  detail?: string;
}

export interface Reply {
  text: string;
  mood?: 'happy' | 'neutral' | 'wary' | 'excited';
  /** Where the line came from — the model, or the canned safety net. */
  source?: 'llm' | 'canned';
}

/** Dialog marker so the player can tell a model-written line from the fallback. */
export function replyPrefix(source?: Reply['source']): string {
  return source === 'llm' ? '🧠 ' : '';
}

export interface NPCBrain {
  respond(ctx: NPCContext, obs: Observation): Promise<Reply>;
  /** Optional lifecycle status for backends that load asynchronously (e.g. WebLLM). */
  status?(): string;
  /**
   * Brain-biased intent (BACKLOG-393): the model's lean on a dino's day — a kind + a short note —
   * or null when it can't/won't author one. Optional: the stub omits it entirely, and the caller
   * falls back to the seeded procedural intent either way. The draft is untrusted; `fromDraft`
   * (ai/intent.ts) validates it against the closed kind set.
   */
  intend?(ctx: NPCContext): Promise<import('./intent').IntentDraft | null>;
  /**
   * Persona authoring (BACKLOG-103): 2–3 sentences of self written from park lore — or null when
   * the model can't/won't. Optional: the stub omits it, and the caller keeps the deterministic
   * procedural persona either way. The raw text is untrusted; `fromPersonaDraft` (ai/persona.ts)
   * validates it. Fired once per dino ever (generate-once) — never per message.
   */
  author?(ctx: NPCContext): Promise<string | null>;
}

const cannedGreetings = [
  "Oh, hello! I haven't seen you around the park before.",
  "*sniffs the air* You smell like the human cave. Welcome.",
  "Hi! Did you bring snacks? I love snacks.",
  "Don't step on my favorite rock, please. That one. Yes, that one.",
];

/** Mood reflects personality so traits are observable in the dialog. */
export function moodFromTraits(t: NPCContext['traits']): Reply['mood'] {
  if (!t) return 'neutral';
  if (t.bravery <= 0.2) return 'wary';
  if (t.sociability >= 0.8 && t.agreeableness >= 0.7) return 'happy';
  if (t.energy >= 0.65 && t.curiosity >= 0.6) return 'excited';
  return 'neutral';
}

/**
 * The agreeableness ceiling below which a dino reads as "prickly" — pinned to the `low`-pole cutoff
 * `describePersonality` uses in `personality.ts`, so "prickly" means the same thing everywhere.
 */
export const PRICKLY_MAX = 0.4;

/**
 * The agreeableness floor above which a dino reads as "warm" — pinned to the `high`-pole cutoff
 * `describePersonality` uses in `personality.ts` (`> 0.6`), the warm mirror of `PRICKLY_MAX`.
 */
export const EFFUSIVE_MIN = 0.6;

/**
 * The friendship ceiling (in hearts) at or below which a dino reads as "neglected" — the keeper has
 * barely visited it, so it greets wistfully (BACKLOG-271) rather than with the generic hello. Inclusive.
 */
export const WISTFUL_MAX = 1;

/** A neglected dino's opening line — wistful, hoping to be noticed, naming itself (BACKLOG-271). */
export function wistfulGreeting(name: string): string {
  return `Oh… you came to see *me*, ${name}? I wasn't sure you still knew I was here.`;
}

/**
 * The friendship floor (in hearts) at or above which a dino reads as a close friend — it opens fondly
 * (BACKLOG-272) instead of with the generic hello. The warm pole of WISTFUL_MAX. Inclusive.
 */
export const FOND_MIN = 8;

/**
 * A close dino's opening line — warm, familiar, glad you came (BACKLOG-272). When the chosen observer's
 * designation is known, the dino names *you* instead of itself (BACKLOG-276) — deep friendship earns
 * your name in its mouth. No designation → the original self-naming line, byte-for-byte (back-compat).
 */
export function fondGreeting(name: string, keeperName?: string): string {
  if (keeperName) return `There you are, ${keeperName}! Good to see you back, friend.`;
  return `There you are, friend! ${name}'s been hoping you'd come round.`;
}

/**
 * A just-cleared dino's spoken thanks, naming who set its record straight (BACKLOG-247). Temperament
 * colours it: a prickly dino (`agreeableness < PRICKLY_MAX`) grumbles it (BACKLOG-253), a warm one
 * (`agreeableness > EFFUSIVE_MIN`) gushes (BACKLOG-261), and an even-tempered one says it plain. No
 * traits → the plain line (back-compat default).
 */
export function thanksLine(clearer: string, traits?: Personality): string {
  if (traits && traits.agreeableness < PRICKLY_MAX) {
    return `…yeah. thanks, I guess. ${clearer} set the record straight.`;
  }
  if (traits && traits.agreeableness > EFFUSIVE_MIN) {
    return `${clearer} told the whole park I was alright — best friend a dino could ask for, I'll never forget it!`;
  }
  return `${clearer} told everyone I was alright — I owe them one.`;
}

/**
 * A pressing-hunger aside a dino lets slip mid-greeting (BACKLOG-368), temperament-shaded like the thanks
 * register: a prickly dino (`agreeableness < PRICKLY_MAX`) grumbles it, a warm one (`> EFFUSIVE_MIN`) makes
 * a whole plea of it, an even-tempered one just mentions it. No traits → the plain mention (back-compat).
 * Leads with a space so it appends cleanly onto whatever register produced the base line.
 */
export function hungryAside(traits?: Personality): string {
  if (traits && traits.agreeableness < PRICKLY_MAX) return ` …and I'm starving, if the keeper's asking.`;
  if (traits && traits.agreeableness > EFFUSIVE_MIN) {
    return ` Oh — and I'm *so* hungry, you wouldn't believe, could you spare a bite?`;
  }
  return ` …could eat, honestly.`;
}

/**
 * A still-shaken aside from a dino that just slipped a hunt (BACKLOG-440), naming its chaser. Temperament-
 * shaded like the hunger tell (368): a prickly dino (`agreeableness < PRICKLY_MAX`) plays it down, a warm one
 * (`> EFFUSIVE_MIN`) makes a whole breathless thing of it, an even-tempered one says it plain. No traits →
 * the plain line. Leads with a space so it appends cleanly onto whatever register produced the base line.
 */
export function rattledAside(hunter: string, traits?: Personality): string {
  if (traits && traits.agreeableness < PRICKLY_MAX) return ` …${hunter} took a run at me. I'm fine. obviously.`;
  if (traits && traits.agreeableness > EFFUSIVE_MIN) {
    return ` oh, you should've SEEN it — ${hunter} nearly had me, I've never run so fast!`;
  }
  return ` …give me a sec, ${hunter} nearly had me.`;
}

/**
 * Word of the provider (BACKLOG-453) — a dino names whoever keeps its zone's pantry full. Third person, on
 * purpose: reputation is what others say when you aren't the one talking, so the caller never passes a
 * dino its own name. Temperament-shaded like the thanks register (253/261/262) and the hunger tell (368):
 * a prickly dino concedes it, a warm one makes a whole thing of it, an even-tempered one states it — the
 * *fact* is identical in all three, only the voice moves.
 *
 * The ground goes through `theZone` (BACKLOG-499) — this line used to drop the article entirely to dodge
 * "the The Grove", which left a capitalised article mid-sentence. Leads with a space so it appends onto
 * whatever register produced the base line.
 */
export function providerAside(providerName: string, zoneName: string, traits?: Personality): string {
  if (traits && traits.agreeableness < PRICKLY_MAX) {
    return ` …and ${theZone(zoneName)} eats because of ${providerName}. there. I said it.`;
  }
  if (traits && traits.agreeableness > EFFUSIVE_MIN) {
    return ` Oh — and you should know ${theZone(zoneName)} eats because of ${providerName}! Nobody puts food away like they do.`;
  }
  return ` ${theZone(zoneName)} eats because of ${providerName}, if you're keeping track.`;
}

/**
 * Season in the voice (BACKLOG-173) — the turning year slips into a dino's greeting, unprompted. Only the two
 * emotionally-charged seasons speak: a **winter grumble** and a **spring savour**. Summer and fall return ''
 * on purpose — contentment needs no comment, and staying quiet three-quarters of the year keeps the tell a
 * flavour beat, not an every-greet tic. Temperament-shaded like the hunger (368) / rattled (440) / provider
 * (453) asides: a prickly dino (`agreeableness < PRICKLY_MAX`), a warm one (`> EFFUSIVE_MIN`), and an even
 * one each get a distinct line. Leads with a space so it appends cleanly onto whatever register produced the
 * base line. No traits → the even line.
 */
export function seasonAside(season: Season, traits?: Personality): string {
  const prickly = !!traits && traits.agreeableness < PRICKLY_MAX;
  const warm = !!traits && traits.agreeableness > EFFUSIVE_MIN;
  if (season === 'winter') {
    if (prickly) return ` …cold enough for you? I hate winter. don't ask me again.`;
    if (warm) return ` Brr — winter's really got its teeth in, hasn't it? Stay warm out there, friend!`;
    return ` …chilly one, this winter. I'll be glad when it passes.`;
  }
  if (season === 'spring') {
    if (prickly) return ` …spring, I suppose. the grass is less awful. that's something.`;
    if (warm) return ` Oh, feel that? Spring's here — everything's green and new, I could just sing about it!`;
    return ` spring's come round again — good to feel the warm back.`;
  }
  return ''; // summer / fall — deliberately quiet
}

/**
 * Fed first, or left short (BACKLOG-469) — a hungry dino voices its ground's spend policy (463). The same
 * hunger lands differently depending on what the ground decided: a **feed-first** ground reassures ("it feeds
 * its own first — I'll be alright"), a **bank-first** ground stings ("I go short while the walls go up").
 * Temperament-shaded like the season (173) / provider (453) / hunger (368) asides via `PRICKLY_MAX` /
 * `EFFUSIVE_MIN`; leads with a space so it appends cleanly; no traits → the even line. The caller only sets
 * `groundPolicy` for a hungry dino on a policy'd ground, so this always has a real stance to voice.
 */
export function policyAside(policy: SpendPriority, traits?: Personality): string {
  const prickly = !!traits && traits.agreeableness < PRICKLY_MAX;
  const warm = !!traits && traits.agreeableness > EFFUSIVE_MIN;
  if (policy === 'feed') {
    if (prickly) return ` …at least this ground feeds its own before it builds. small mercies.`;
    if (warm) return ` Oh — but this ground feeds its own first, bless it, so I'll be alright! I always am here.`;
    return ` good thing this ground feeds its own first — I'll be alright.`;
  }
  if (prickly) return ` …and we go short while the walls go up. figures. don't get me started.`;
  if (warm) return ` …though we do go a bit hungry while the granary fills — for the winter's sake, I know, I know.`;
  return ` …and we go short a while, mind, so the granary can rise.`;
}

/**
 * Mealtime mood in the voice (BACKLOG-404) — the last contested drop, said out loud.
 *
 * The park has kept a hatch ledger since cycle 84 and read it two ways, both as *history*: a career folded
 * into a book note (402) and a per-opponent disposition spent on the next contest (401/389/403). This is the
 * third register and the only one that is a **feeling** — a dino greeted a beat after the drop tells you how
 * it went, unprompted, and stops mentioning it once the memory rolls off its ring.
 *
 * Temperament-shaded like every aside above it (`PRICKLY_MAX` / `EFFUSIVE_MIN`, leading space, no traits →
 * the even line). The grid is deliberately **not** uniform: a prickly dino that stood its ground is flinty
 * about it while a warm one is almost sorry it came to that, and a warm dino that gobbled is sheepish where
 * a prickly one gloats. Same four facts, twelve different people.
 *
 * It always names the other dino, because the ledger always has — 401's whole finding was that a drop is a
 * history between *two* dinos, and a line that said "I got the last one" without saying who from would throw
 * that away.
 */
export function mealtimeAside(outcome: HatchOutcome, other: string, traits?: Personality): string {
  const prickly = !!traits && traits.agreeableness < PRICKLY_MAX;
  const warm = !!traits && traits.agreeableness > EFFUSIVE_MIN;
  switch (outcome) {
    case 'gobbled':
      if (prickly) return ` …and I got in ahead of ${other} at the hatch. they were too slow. that's all there is to it.`;
      if (warm) return ` …oh, and I did rather snatch that last one out from under ${other}. I'll make it up to them.`;
      return ` …got to the drop before ${other} did, if you're counting.`;
    case 'yielded':
      if (prickly) return ` …let ${other} have the last one. don't read anything into it.`;
      if (warm) return ` …I let ${other} eat first — they needed it more than me. I'm sure something else will come along.`;
      return ` …${other} got the last one. I stepped back. it's fine.`;
    case 'stood':
      if (prickly) return ` …${other} tried to take my food. ${other} did not take my food. remember that.`;
      if (warm) return ` …I did have to hold my ground against ${other}, which I hated, but it *was* mine.`;
      return ` …stood my ground against ${other} at the hatch. felt good, honestly.`;
    case 'slunk':
      if (prickly) return ` …${other} wouldn't shift. wasn't worth the trouble. I wasn't hungry anyway.`;
      if (warm) return ` …${other} wouldn't budge and I just… went away. I hate it when it goes like that.`;
      return ` …${other} wouldn't move off the drop. I let it go.`;
  }
}

/** Canned reply used by the stub brain and as the WebLLM brain's fallback (while loading or on error). */
export function cannedReply(ctx: NPCContext): Reply {
  let reply: Reply;
  // A just-cleared dino leads with gratitude, naming its clearer (BACKLOG-247) — the deterministic
  // half of "thanks in the voice"; the LLM path colours the same fact via buildMessages.
  if (ctx.gratitude) {
    reply = { text: thanksLine(ctx.gratitude, ctx.traits), mood: 'happy', source: 'canned' };
  }
  // A neglected dino (rock-bottom friendship, nothing to be grateful for) opens wistfully (BACKLOG-271)
  // — the affection-pole counterpart of the gratitude register. Gratitude above always wins.
  else if (ctx.affection !== undefined && ctx.affection <= WISTFUL_MAX) {
    reply = { text: wistfulGreeting(ctx.name), mood: moodFromTraits(ctx.traits), source: 'canned' };
  }
  // A close dino (high friendship) opens warmly (BACKLOG-272) — the warm pole of the wistful greeting.
  else if (ctx.affection !== undefined && ctx.affection >= FOND_MIN) {
    reply = { text: fondGreeting(ctx.name, ctx.keeperName), mood: moodFromTraits(ctx.traits), source: 'canned' };
  } else {
    const idx = Math.floor(rand() * cannedGreetings.length);
    const text = cannedGreetings[idx].replace('the park', `the park, ${ctx.name} here`).slice(0, 200);
    reply = { text, mood: moodFromTraits(ctx.traits), source: 'canned' };
  }
  // Hunger you can hear (BACKLOG-368): a dino over the need threshold lets the want slip into whatever it
  // was going to say, regardless of register — the tell composes with gratitude/wistful/fond/generic alike.
  if (ctx.hungry) reply = { ...reply, text: (reply.text + hungryAside(ctx.traits)).slice(0, 240) };
  // Rattled after the chase (BACKLOG-440): a prey fresh off a hunt names its chaser, composing onto whatever
  // the line already was (gratitude/wistful/fond/generic/hungry) — the food-web mirror of the hunger tell.
  if (ctx.rattled) reply = { ...reply, text: (reply.text + rattledAside(ctx.rattled, ctx.traits)).slice(0, 280) };
  // Word of the provider (BACKLOG-453): the standing of whoever keeps this zone fed slips in last — it's
  // the least urgent thing a dino has to say, and it composes onto every register above it.
  if (ctx.provider) {
    reply = {
      ...reply,
      text: (reply.text + providerAside(ctx.provider.name, ctx.provider.zoneName, ctx.traits)).slice(0, 320),
    };
  }
  // Season in the voice (BACKLOG-173): the most ambient tell of all slips in last (winter grumble / spring
  // savour; summer & fall stay quiet), composing onto every register above it.
  if (ctx.season) {
    const aside = seasonAside(ctx.season, ctx.traits);
    if (aside) reply = { ...reply, text: (reply.text + aside).slice(0, 400) };
  }
  // Fed first, or left short (BACKLOG-469): a hungry dino on a policy'd ground voices how it's chosen to feed
  // it — grateful (feed) or grumbling (bank). Gated on hunger here too so the module is self-consistent
  // regardless of caller; composes last, onto every register above it, within the raised cap.
  if (ctx.hungry && ctx.groundPolicy) {
    reply = { ...reply, text: (reply.text + policyAside(ctx.groundPolicy, ctx.traits)).slice(0, 400) };
  }
  // Mealtime mood in the voice (BACKLOG-404): how the last contested drop went, composed last of all — it is
  // the most recent thing that happened to this dino but the least *urgent* thing it has to say, and putting
  // it after the policy aside keeps every earlier cap exactly where it was. The final cap is the only one
  // raised, and only enough to hold the longest of the twelve lines.
  if (ctx.mealtime) {
    reply = {
      ...reply,
      text: (reply.text + mealtimeAside(ctx.mealtime.outcome, ctx.mealtime.other, ctx.traits)).slice(0, 460),
    };
  }
  return reply;
}

class StubBrain implements NPCBrain {
  async respond(ctx: NPCContext, _obs: Observation): Promise<Reply> {
    return cannedReply(ctx);
  }
}

export type BrainKind = 'stub' | 'webllm';

export function makeBrain(kind: BrainKind): NPCBrain {
  switch (kind) {
    case 'stub':
      return new StubBrain();
    case 'webllm':
      // brain↔webllmBrain is a cyclic import, but the refs are only touched at call time
      // (here / inside respond), never at module-eval, so ESM resolves it safely.
      return new WebLLMBrain();
  }
}
