# Cycle 120 — Code Plan

Sequencing: **structure track first** (it changes `foundZone`'s signature), then the lore track adds its
`markSeen` line beside the same two call sites. See Risks.

---

## Structure track — BACKLOG-474 (the unsettled ground)

**Item:** a zone fills from empty by migration alone; the first to settle founds it, and an empty ground
reads as unsettled rather than merely poor.

### Files to create

- `game/src/world/frontier.ts` — pure, no Phaser:
  - `isUnsettled(heads: number, pioneer: string | undefined): boolean` — `heads === 0 && !pioneer`. Two
    arguments, both already derivable at every call site (`zonePopulations`, `pioneerOf`), so the module
    needs no imports and no state.
  - `unsettledNeighbor(neighbors: readonly string[], unsettled: (z: string) => boolean): string | null` —
    the **first** unsettled neighbour in input order (`ZONE_LINKS` order at the call site), else null.
    Deliberately first-match, not random: the BACKLOG-456 catalogue is full of `Math.random()` picks that
    read as parallel-load flakes, and `richestNeighbor` already set this precedent with its strict `>`.
  - `settleMemory(zoneName: string): string` → `🌱 first to settle ${zoneName}` — the founder's own
    memory, distinct from 343's ticker line (which names the dino; a memory is written in the dino's
    own frame). Must not be shareable and must not contain any existing rumour token.
  - `settleLine(): string` → the bubble the founder floats on arrival.
  - `settleEvent(name: string, zoneName: string): string` → `🌱 ${name} settles ${zoneName} — nobody has
    ever lived here` (the ticker line, posted after 343's `🚩` founding line).
  - `UNSETTLED_BADGE = '· unsettled'` (or similar) — the lens read, kept beside its rule the way
    `declineGlyph` lives in `decline.ts` and `GRANARY_GLYPH` with the granary.
- `game/src/world/frontier.test.ts` — colocated unit tests (the `decline.test.ts` / `scarcity.test.ts`
  pattern; note that `game/src/world/*.test.ts` and `tests/unit/*` are both picked up by the **root**
  vitest config — run vitest from the repo root, not from `game/`).
- `tests/e2e/cycle-120-unsettled.spec.ts`.

### Files to modify

- `game/src/scenes/WorldScene.ts`
  - `foundZone(name, zoneId)` — return `boolean` (did this footfall found the ground) instead of `void`;
    keep the early `return` on `recordPioneer` false. It already computes exactly this fact.
  - New private `settleZone(d: Dino, zoneId: string)` — called from both arrival seams with the
    `foundZone` return: files `settleMemory` via `remember`, `showBubble(d, settleLine())`,
    `logEvent(settleEvent(...))`. Keeping the beat in its own method (rather than inline twice) is what
    guarantees the two seams can't drift.
  - `crossDino` — `if (this.foundZone(...)) this.settleZone(d, dest);` (line 4652 today).
  - `relocate` — same, with `destZoneId` (line 4773 today).
  - New private `isZoneUnsettled(zone: string): boolean` — `isUnsettled(this.zoneHeads()[zone] ?? 0,
    pioneerOf(this.pioneers, zone))`.
  - `scarcityDestOf(home)` — insert the frontier tier **above** `richestNeighbor`:
    `unsettledNeighbor(neighbors, (z) => this.isZoneUnsettled(z)) ?? richestNeighbor(...) ?? otherZone(home)`.
  - `scarcityMigrate(d)` — **leave the 458 plenty priming above the frontier tier** (a dino that has heard
    a named thriving ground goes to the ground it heard about; hearsay it holds beats a place nobody has
    described to it). Document that choice in the comment — it is the ordering question the design asked to
    be decided in the open.
  - `zoneMapEntries()` — pass a new `unsettledZones()` map as the next positional arg to `zoneMapModel`.
  - New private `unsettledZones(): Record<string, boolean>` — mirrors `decliningZones()` / `zoneSpends()`.
  - `drawZoneMap()` — when `e.unsettled`, replace the tier badge segment with the unsettled badge (an
    unsettled ground has no prosperity worth reading; showing `○ quiet` beside it is the exact confusion
    this arc removes). Head count line stays (it reads `0 🦕`).
  - Dev hook `__unsettled = () => zoneChain().filter((z) => this.isZoneUnsettled(z))`.
- `game/src/ui/lenses.ts`
  - `ZoneMapEntry` — add `unsettled: boolean` (documented "false when unknown (older callers)", the
    `declining`/`granary` precedent).
  - `zoneMapModel` — new trailing optional param `unsettled: Record<string, boolean> = {}`; entry reads
    `unsettled[id] ?? false`. Trailing + defaulted, so every existing call site and test stays valid.

### Reuse list

- `game/src/world/pioneer.ts` — `pioneerOf` is the "has this ground ever been founded" read; **no new
  founding record**. `recordPioneer` keeps owning first-write-wins.
- `game/src/world/zones.ts` — `zonePopulations`, `zoneChain`, `zoneNeighbors`, `zoneById`.
- `game/src/world/scarcity.ts` — `richestNeighbor` unchanged, still the fallback tier.
- `game/src/world/decline.ts` — `isDeclining`, `ZONE_FLOOR` read only; **not edited** (they are already
  correct at heads 0 and at heads 1).
- `WorldScene.zoneHeads()`, `showBubble`, `logEvent`, `remember` — existing glue.

### New dependencies

none.

### Test plan

Unit (`game/src/world/frontier.test.ts`):
1. `isUnsettled(0, undefined)` true; `isUnsettled(1, undefined)` false; `isUnsettled(0, 'Twitch')` false
   (the emptied-but-founded ground is 460's declining case, never frontier again).
2. `unsettledNeighbor` returns the first unsettled neighbour in input order; null when none is.
3. `settleMemory`/`settleEvent`/`settleLine` name the ground/dino and are stable strings.
4. `settleMemory` is not shareable (`isShareable` from `social/gossip` false) and contains neither
   `GROVE_NEWS_TOKEN` nor `PLENTY_TOKEN` nor `RUMOR_MARK` — it can never be picked up and re-spread.

Unit (`game/src/world/frontier.test.ts`, the "confirm don't rebuild" pins the design asked for):
5. `zoneProsperity({stockpile:0,structures:0,heads:0,harvested:0})` → 0 → `prosperityTier` `'quiet'`.
6. `isDeclining(0, 0)` false — an unsettled ground never wears ⬇.
7. `isDeclining(1, 1)` false — the founder alone in its new ground is not "declining", so 464's last-one
   beat cannot fire on it.
8. `zonePopulations({}, [], 'bowl')` seeds every `ZONES` id including `hollow` at 0.

Unit (`tests/unit/lenses.test.ts` — extend):
9. `zoneMapModel` with an `unsettled` map flags the right entry; omitting the arg leaves every entry
   `unsettled: false` (back-compat).

E2E (`tests/e2e/cycle-120-unsettled.spec.ts`):
10. On a fresh boot `__unsettled()` is `['hollow']` — the three founding grounds are inhabited or founded,
    the fourth is not.
11. The zone-map lens box for the Hollow reads unsettled (via `__zoneMap()` entry flag), and after
    `__migrate('Twitch','hollow')` it does not, and `__unsettled()` is `[]`.
12. That same first arrival posts both beats in order — 343's `🚩 … first ever to set foot in The Hollow`
    and 474's `🌱 Twitch settles The Hollow` — and a second arrival (`Sunny`) posts neither again.
13. A migrant leaving the Fernreach heads for the Hollow over a richer inhabited neighbour: drive
    `__startMigration`-style through the frontier pick and assert the chosen destination is `hollow`.
    (Use the existing `__startMigrationTo`/`__migrate` hooks plus a direct read of the destination pick if
    a hook for it exists; otherwise add a thin `__scarcityDest(name)` dev hook — dev hooks for the
    destination pick are the established pattern for this seam.)

### Risks

- **Ordering vs. word-of-plenty (458).** Frontier sits *below* plenty priming and *above* the richest
  pick. Getting this backwards would make 458's shipped beat unreachable whenever any ground is unsettled.
- **`checkLastOne` (464) false positive.** If a founder's new ground ever registered a peak > 1 it would
  read declining at heads 1 and sound the "gone quiet" beat at the moment of founding — the exact opposite
  of the intended feeling. `bumpPeak` runs before migration each cadence, so peak tracks 0 → 1 with the
  arrival; test 7 pins the shape, and the e2e should confirm no `🍂` line lands on the founding.
- **`ZONE_FLOOR` and a one-dino ground.** The floor consumes the migration roll for a lone founder, so the
  Hollow will not immediately re-empty. Correct, and worth an assertion rather than a comment.
- **Lens box width.** The unsettled badge replaces the tier badge in the same line, so no new line and no
  `boxH` change.

### Estimated touch count

~6 files.

---

## Lore track — BACKLOG-364 (the one who knew first)

**Item:** a dino that has seen a ground and tells a never-been dino about it keeps a teacher's-pride memory.

### Files to create

- `game/src/world/taught.ts` — pure:
  - `type SeenZones = Record<string, string[]>` (dino name → zone ids seen).
  - `markSeen(map: SeenZones, name: string, zone: string): boolean` — appends when absent, returns whether
    it was new. Mutates in place, matching `recordPioneer`'s contract (WorldScene holds `seenZones` as a
    mutable field exactly as it holds `pioneers`), so the two arrival seams read alike.
  - `hasSeen(map, name, zone): boolean`.
  - `teachableZone(map, speaker, listener, chain: readonly string[]): string | null` — the first zone in
    `chain` order the speaker has seen and the listener has not; null for `speaker === listener` or none.
  - `taughtMemory(listener, zoneName): string` → `🚩 showed ${listener} ${zoneName}` — the pride memory.
    Not shareable, no rumour token (the `pondSwapMemory` precedent, which documents exactly this hazard).
  - `taughtWordLine(speaker, zoneName): string` → `${speaker} ${RUMOR_MARK} there's a whole other ground
    out there — ${zoneName}` — the listener's 1-hop word (imports `RUMOR_MARK` from `social/gossip`, as
    `groveword.ts` does).
  - `taughtEvent(speaker, listener, zoneName): string` → the ticker line.
  - `taughtLine(zoneName): string` → the speaker's bubble.
  - `TAUGHT_BOND = 2` — the calibration knob, below `POND_BOND = 3` (a shared place you have *both* seen
    is a stronger tie than one you have merely described).
  - `taughtCount(memories: readonly string[]): { zoneName: string; count: number } | null` — folds a
    dino's own memory ring into the book line's inputs: the ground it has taught most, and how many
    tellings it carries. Reads the same ring 443's `foodwebStanding` reads, so no new tally is persisted.
  - `taughtBookLine(zoneName, count): string` → `showed ${count} other(s) the way to ${zoneName}`.
- `game/src/world/taught.test.ts`.
- `tests/e2e/cycle-120-knew-first.spec.ts`.

### Files to modify

- `game/src/scenes/WorldScene.ts`
  - New field `private seenZones: SeenZones = {};` beside `pioneers`.
  - Seed at spawn/load: after the cast and `dinoZones` exist, `markSeen(this.seenZones, d.name,
    zoneOf(this.dinoZones, d.name, BOWL_ID))` for every dino — so a fresh save has everyone knowing the
    bowl, and an old save is seeded from live home zones on load (the design's stated no-back-fill floor).
  - `crossDino` + `relocate` — `markSeen(this.seenZones, d.name, dest)` beside the existing `foundZone`
    call (**after** the structure track's edit lands there).
  - New private `teachBeat(a: string, b: string): boolean` — mirrors `pondSwapBeat` exactly: resolve
    `teachableZone`, bail on null, dedup by checking `recall(this.memory, a).includes(taughtMemory(b,
    zoneName))`, then `remember` both sides, `strengthen` the bond by `TAUGHT_BOND`, `showBubble` the
    speaker, `logEvent`. Returns whether it fired.
  - `startConversation` — call `this.teachBeat(a.name, b.name)` on the line **after** `this.pondSwapBeat(...)`.
    The gossip cascade above is untouched.
  - `bookRows()` — `taught: (() => { const t = taughtCount(recall(this.memory, d.name)); return t ?
    taughtBookLine(t.zoneName, t.count) : undefined; })()`, in the `pioneer` idiom.
  - Save: `seenZones: this.seenZones` in the envelope; on load `this.seenZones = save.seenZones ?? {}`
    **before** the spawn seeding runs, so an old save gets seeded and a new one is restored.
  - Dev hooks: `__seenZones = () => ({ ...this.seenZones })` and `__teach = (a, b) => this.teachBeat(a, b)`
    (the `__spreadGroveWord` precedent).
- `game/src/ui/lenses.ts`
  - `BookRow.taught?: string` + one `if (r.taught) out.push(...)` in `bookLines`, immediately after the
    `pioneer` line (both are "what this dino did for the map").
- `game/src/world/saveGame.ts`
  - `SaveGame.seenZones?: Record<string, string[]>` (additive, absent → `{}`, no version bump).
  - Parser block modelled on the `pioneers` block but with array values: object guard, then every value
    must be an array of strings, else `return null`.
  - Include `seenZones` in the returned object (the `pioneers` line at ~612).

### Reuse list

- `game/src/ai/memory.ts` — `remember` / `recall`. No new store.
- `game/src/social/gossip.ts` — `RUMOR_MARK`, `isShareable` (the 1-hop guarantee).
- `game/src/world/groveword.ts` — **read as the pattern, not edited**: `pondSwapMemory`'s "must not carry a
  spreadable token" comment is the rule `taughtMemory` follows.
- `game/src/world/zones.ts` — `zoneChain` (deterministic teach order), `zoneById`, `zoneOf`.
- `WorldScene.pondSwapBeat` — the structural template for `teachBeat` (independent of the cascade).
- `WorldScene.bonds`/`strengthen`, `showBubble`, `logEvent`.

### New dependencies

none.

### Test plan

Unit (`game/src/world/taught.test.ts`):
1. `markSeen` adds once, returns false on a repeat, and leaves other dinos untouched.
2. `teachableZone` returns the first chain-order zone the speaker has seen and the listener hasn't.
3. `teachableZone` null when the listener has seen everything the speaker has; null for `a === a`.
4. `taughtWordLine` contains `RUMOR_MARK` → `isShareable` false → the word cannot re-spread (1 hop).
5. `taughtMemory` is not shareable and contains no `GROVE_NEWS_TOKEN` / `PLENTY_TOKEN` / `RUMOR_MARK`.
6. `taughtCount` folds a ring with two tellings of one ground and one of another into the ground with the
   most tellings and its count; null on a ring with no pride memories.
7. `taughtBookLine` reads as specified for count 1 and count 3.

E2E (`tests/e2e/cycle-120-knew-first.spec.ts`):
8. Fresh boot: `__seenZones()` has every dino mapped to `['bowl']`.
9. `__migrate('Twitch','grove')` then `__migrate('Twitch','bowl')` → Twitch's set contains grove and bowl.
10. `__teach('Twitch','Sunny')` → ticker names teacher, learner and The Grove; Twitch's book block shows
    the teaching line; a second `__teach('Twitch','Sunny')` with no new ground adds no second ticker line.
11. `__teach('Sunny','Twitch')` (both bowl-only at that point, or the learner already knowing more) fires
    nothing.

### Risks

- **The cascade must not change.** `teachBeat` is called after `pondSwapBeat`, outside the `relief → … →
  generic` chain. Any refactor that folds it into the chain silently starves one of eight shipped beats and
  will show up as a cycle-076/078 spec failure.
- **Memory ring pressure.** The ring is 6 entries; a chatty pair could push a pride memory out and re-teach
  the same ground later. Acceptable (the same property the 346 swap and 251's fading gratitude live with) —
  but it means the dedup is "recently", not "ever", and the QA criterion is a *second immediate* meeting,
  not a meeting an hour later.
- **Seeding order on load.** Seed from live home zones **after** restoring `seenZones`, or a restored save
  gets overwritten. Both orders "work" but only one keeps history.
- **Save parser strictness.** `seenZones` values are arrays, not strings — copying the `pioneers` block
  verbatim would accept a malformed save. The plan calls this out because it is the one line where the
  two blocks genuinely differ.

### Estimated touch count

~6 files.

---

## Cross-track collision check

| File | Lore track | Structure track | Order |
|---|---|---|---|
| `game/src/scenes/WorldScene.ts` | `seenZones` field, spawn seed, `markSeen` in both arrival seams, `teachBeat`, book row, save, 2 hooks | `foundZone` signature, `settleZone`, both arrival seams, `isZoneUnsettled`, `scarcityDestOf`, `unsettledZones`, lens draw, 1 hook | **structure first** |
| `game/src/ui/lenses.ts` | `BookRow.taught` + `bookLines` | `ZoneMapEntry.unsettled` + `zoneMapModel` | either — disjoint symbols |
| `game/src/world/saveGame.ts` | `seenZones` field + parser | — | — |

The only genuine contact point is the two arrival seams (`crossDino` ~4652, `relocate` ~4773), where the
structure track changes `foundZone`'s call shape and the lore track adds a `markSeen` line next to it.
Land structure, run the suite, then land lore.

**Total: ~10 files** (arc-sized, under the 15-file CHARTER v6 ceiling).
