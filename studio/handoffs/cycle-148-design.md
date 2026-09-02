# Cycle 148 — Design

Two tracks. **Build the structure track's `chronotype.ts` additions first** — both tracks grow that module
and the lore track's read sits on top of the structure track's count.

---

## Lore track — BACKLOG-110 (+ BACKLOG-279)

**Item:** BACKLOG-110 [social] Hour-aware greeting, taking BACKLOG-279 (greeting carries the hour) with it
as its second clause. Milestone 17's third lore arc: *the hour gets into the voice — a dino's first line of
the day knows what time it is and whether it has been up for it.*

### Why this cycle

Traced before criteria were written, per the discipline that has now paid for itself twice. **The hour is
already in the greeting context and the deterministic voice has never read it.**

`NPCContext.timeOfDay` is set on all three greet paths in `WorldScene.ts` (5313, 5627, 6952), always as
`dayPhase(now.hour)`. It is consumed in exactly one place: `webllmBrain.ts:91`, `It is ${ctx.timeOfDay}.`
in the prompt preamble. `cannedReply` — the stub brain, *and* the WebLLM brain's own fallback while it
loads or errors — composes gratitude, wistfulness, fondness, hunger, the chase, the provider, the season,
the ground's spend policy and the last contested drop, and does not know what hour it is.

The CHARTER's Living-minds line says the model is enrichment **on top** and the deterministic rules are the
**floor**. Here the hour exists only on top. A player who declines the model download gets a park where ten
dinos have kept two different sets of hours for two cycles and not one of them can mention it.

### What ships

A new aside on the canned greeting, composed exactly as the eight before it are, keyed on **the dino's own
standing in its own rest window** rather than on the park's clock-phase.

`chronotype.ts` gains `dayStanding(hour, chronotype, season): DayStanding | null`, with four registers, all
derived from the dino's own `restWindow` and **no new hour constant anywhere**:

| register | when | reads as |
|---|---|---|
| `roused` | `atRest` — you greeted it in its own rest window | you woke it |
| `fresh` | awake, inside the **first quarter** of its waking span | still shaking the night off |
| `waning` | awake, inside the **last quarter** of its waking span | ready to turn in |
| `nightlong` | awake and `dayPhase(hour) === 'night'` | up while the park is dark |
| `null` | awake, mid-span, park not dark | the aside stays silent |

The quarters are **computed from `restWindow`**, not chosen. A spring day-dino rests 21:00–05:00, so it is
awake 05:00–21:00, a 16-hour span whose first quarter is 05:00–09:00 — which is why the four awake Bowl
dinos read `fresh` at 08:00 on a fresh save, and why nothing here was tuned to make that true. Moving
`SEASON_HUDDLE` or `OWL_SHIFT` moves these boundaries with it, which is the corollary under the
reachability bar being obeyed rather than dodged.

`nightlong` wins over `waning` when both hold (being up at midnight is the more specific truth).

`brain.ts` gains `hourAside(standing, traits)` — three temperaments per register, on the exact
`mealtimeAside`/`policyAside` pattern (prickly under `PRICKLY_MAX`, effusive over `EFFUSIVE_MIN`, plain
otherwise), and `NPCContext.standing?: DayStanding`. `cannedReply` composes it **last of all**, after the
mealtime aside, within one raised cap — it is the most ambient thing a dino has to say.

`WorldScene` passes `standing` on all three greet paths from the same `chronoOf`/`currentSeason` reads the
💤 mark and the murmur already use, so the pose, the dream and the voice can never disagree about whether a
dino is asleep. `webllmBrain`'s preamble gains the standing beside the existing `It is ${timeOfDay}.` so
the enrichment path knows the same fact — never asked to author the frame, exactly as 423/408 established.

**279's clause, and how it composes rather than branching.** 279 asks for the *fond* greeting to carry the
hour. It already will: `fondGreeting` is one of the registers `cannedReply` picks and the aside composes
onto whatever was picked, the way hunger and the season already do. No fond-specific branch is written; the
criterion below pins that a fond dino's hello carries both its keeper's designation and its standing.

### Acceptance criteria

- [ ] `dayStanding` returns `roused` for a dino inside its own rest window, at any hour, for both chronotypes.
- [ ] At **08:00 in spring** — the founding save's own hour — `dayStanding` is `fresh` for a day-dino and `roused` for an owl. Asserted through `restWindow`'s derivation, not against a literal 8.
- [ ] The quarter boundaries are derived: a unit test moves `OWL_SHIFT`'s worth of hours and shows the `fresh` window moves with the dino's rest window rather than staying put.
- [ ] `dayStanding` returns `null` for a day-dino at 13:00 in spring — mid-span, park lit — so the aside is a tell and not a tic on every greeting.
- [ ] `nightlong` beats `waning` when the hour satisfies both.
- [ ] `hourAside` returns a distinct line per register **and** per temperament — twelve lines, none equal to another.
- [ ] `cannedReply` with no `standing` is **byte-identical** to today's output for the same context. Pinned as an equality assertion, not assumed.
- [ ] `cannedReply` composes the aside onto every register it can reach: generic, wistful, **fond**, and gratitude.
- [ ] A fond dino (≥ `FOND_MIN` hearts, `keeperName` set) greeted at 08:00 returns one line containing both the keeper designation and the standing tell — BACKLOG-279's clause, pinned.
- [ ] e2e, **frame one, no clock touched**: greet a waking Bowl dino on a fresh save and its reply carries the `fresh` tell.
- [ ] e2e, **frame one**: greet the sleeping owl and its reply carries the `roused` tell, and the two lines differ.
- [ ] e2e: advance to the small hours; the same owl now greets `nightlong`, and a line that was `fresh` at 08:00 is not the line it gives at 23:00.
- [ ] The WebLLM prompt preamble carries the standing (unit test on `buildMessages`, beside the existing `timeOfDay` one).

### Out of scope

- Any new persisted state. A standing is derived from the clock and name-seeded traits every time, like the chronotype it comes from. **Nothing is written to the save.**
- Re-registering the greeting: the tone menu, the caught-mid-tic frame, the bashful/fond openers and the mood are all untouched.
- Hour-aware *dino-to-dino* meeting lines. 110 is about the player's greeting; the npc_meet path keeps today's behaviour.
- A "good morning / good evening" salutation. The register is a **tell composed onto the dino's own line**, not a new opener — a greeting that starts with the time of day is a clock with a face, which is what this arc exists to avoid.

### Constraints

- `@mlc-ai/web-llm` stays imported only under `game/src/ai/`. `hourAside` is pure and Node-testable; no Phaser, no clock read inside it — the hour is a parameter, as it is throughout `chronotype.ts`.
- Additive save changes only — in fact zero save changes.
- Compose, never branch: the aside appends like the eight before it, and the no-`standing` path must stay byte-identical.
- **File overlap:** `chronotype.ts` (shared with the structure track — build theirs first), `WorldScene.ts` greet paths (the structure track does not touch them).

---

## Structure track — BACKLOG-524

**Item:** BACKLOG-524 [emergent] The night shift — 109 gave the park a cast that is up while it is dark, and
no system in the park knows they are there.

### Why this cycle

`residentZones()` (`WorldScene.ts:2409`) is `occupiedZones(...)` — pure membership. `maybeSpawnResource`
loops it, so **a ground produces because somebody lives there, whether or not anybody in it has its eyes
open.** The Fernreach yields at four in the morning at the rate it yields at noon. Two cycles of chronotype
work is true, tested, load-bearing, and changes nothing about what any ground does — CHARTER v7's exact
defect, one layer along from where v7 found it.

### What ships

**One seam.** `chronotype.ts` gains a pure `wakingIn(names, zoneOfName, traitsOfName, hour, season)` →
`Record<zoneId, number>`, and `residentZones()` becomes the set of zones with at least one waking resident.
Nothing else changes what it reads.

**The membership readouts stay membership readouts.** `zonePopulations` still feeds the tally line, the
prosperity signal and the zone lens — a map that showed the Ridge empty because Ember is asleep would be
lying about who lives there. Only the read that drives *work* becomes a read of who is up.

**The watch.** `chronotype.ts` gains `keepsWatch(...)` → the name of the single waking resident of a ground
whose every other resident is at rest, or null (null when nobody is up, when more than one is, and when the
ground has one resident and it is awake — a solo resident is not keeping watch over anybody). On the
migration cadence, a watcher gets a ticker line and a memory, deduped against its own recall ring exactly
as `checkLastOne` (BACKLOG-464) dedupes its beat — a moment, not a tic. The memory rides recall into the
dino's next greeting through the existing path, for free, which is where this track and the lore track meet
without either writing what the other writes.

**Deliberately not a new glyph.** `ROUSE_GLYPH` / 👁 already hangs off `awakeAtNight` and is BACKLOG-520's
drawn host; re-pointing it at the watch would churn a shipped rig's meaning for a tell the ticker already
carries. `isRoused` is untouched.

### Acceptance criteria

- [ ] `wakingIn` counts only residents outside their own rest window, per zone, and returns 0 for a zone whose whole cast is down. Pure, Node-tested, hour and season as parameters.
- [ ] Asserted against the **shipping roster at 08:00 in spring**, derived rather than hardcoded: bowl 4, grove 1, hollow 1, **fernreach 0, ridge 0**.
- [ ] The same assertion at 13:00: fernreach 1 and ridge 1, because both owls have woken.
- [ ] `keepsWatch` returns the lone waker of a multi-resident sleeping ground; **null** for a ground with two awake, for a ground with none awake, and for a solo resident who is merely awake.
- [ ] `maybeSpawnResource` rolls only for zones with a waking resident — a unit or scene test showing a fully-asleep ground does not spawn where before it did.
- [ ] A ground's yield regrowth is unaffected: `workRegrowth` keeps running for every resident zone, awake or not. **A ground does not stop recovering because its cast is asleep** — it stops *producing*. Pinned, because the two live on adjacent lines.
- [ ] e2e, **frame one, no clock touched**: `__resting()` contains Thornback and Ember; a run of world steps at 08:00 leaves the Ridge and the Fernreach with no resource, while an awake ground can still spawn one.
- [ ] e2e, **inside the ten-minute window**: advance to 13:00 (five real minutes at `ACTIVE_SCALE`); the Ridge's and the Fernreach's owls are awake, and the grounds now roll.
- [ ] e2e: the Grove's watcher (Bramble, awake over a sleeping Pip at 08:00) draws a watch line in the ticker, once, and carries the matching memory.
- [ ] Save compatibility: an old save loads and behaves identically. **No new persisted field** — a waking count is re-derived from the clock and name-seeded traits every frame, exactly like the chronotype it comes from.

### Out of scope

- Mending, building, the ballot, the migration tiers and the hatch. 524's text lists them; **this cycle takes the one seam the item itself asks for** — the ground's production — and leaves the rest to follow the pattern once it has one. Ship an arc, not a rewrite.
- Any roster or founding-constant edit. The founding state already exercises this system (two owl-only grounds, asleep at the opening hour, awake five real minutes in) and the bar's corollary is satisfied without moving anything. Verified this cycle, not assumed.
- Changing `zonePopulations` or any readout that hangs off it.
- Re-pointing `ROUSE_GLYPH` / `isRoused`.

### Constraints

- Pure module, no Phaser, no clock read inside `chronotype.ts` — hour and season stay parameters, as the module's own header requires.
- Additive save changes only; here, none at all.
- **File overlap with the lore track:** `chronotype.ts`. Land these additions **first**; the lore track's `dayStanding` builds on the settled module. `WorldScene.ts` is touched by both, in different methods (`residentZones`/the migration cadence here, the three greet-context literals there).

---

## Rider — BACKLOG-515 (not a track, not judged at the bar)

Carried on the structure-smith's explicit ruling, with the diagnosis in `cycle-148-structure.md`. Two
causes, one item number:

1. **Read-after-input.** Phaser emits `Key.on('down')` from the scene update step; a `page.evaluate` on the
   next line is a second CDP round-trip that can land before that frame runs. Fast round-trip loses.
2. **Cold-boot budget.** The first boot against a cold Vite server pays the transform cost; N browsers
   hitting it at once multiply the wait against a 30s `__ready` ceiling.

**What ships:** one exported `settle(page)` beside `boot()` in `tests/e2e/helpers.ts` — the same
`requestAnimationFrame` await `boot()` already performs on its own last-but-two line, extracted and
documented, awaiting **two** frames so a queued DOM key is both processed and emitted. Applied to the four
catalogued specs (`mobile-minds`, `cycle-044-sound`, `cycle-047-warmth`, `cycle-038-scan`) at their
read-after-input seams, and documented beside `boot()` so a new spec reaches for it.

**Acceptance:** the four catalogued specs pass at `--workers=1` on the committed tree, and the full
parallel run is green. `boot()`'s own behaviour is unchanged for every other spec — the extraction must not
alter what `boot` does.

**No bar answer.** A player sees nothing; this is a rider and the constitution judges tracks.
