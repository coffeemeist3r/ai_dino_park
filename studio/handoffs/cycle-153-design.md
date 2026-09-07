# Cycle 153 — Design

Two tracks. Neither is a solo cycle; both sections are live.

---

## Lore track — BACKLOG-114: the away-log in the book

### The complaint, stated precisely

The homecoming digest is the only thing this park ever says about **you**. Since cycle 149 it has grown
four separate authors — the warm pairs (106), the cold pairs (113), the spoilage/upkeep tail (462/480), and
the per-dino accounts that hang over heads on return (116) — and every one of them is written into
`this.dialog.show('While you were away…\n' + away.digest.join('\n'))`, a modal that the next keypress
destroys with no record anywhere.

The book is the park's memory of everything else. It keeps a dino's quirk, its ritual, its hours, its
dreams, its standings, its parents and its food-web record — permanently, through saves. The one thing it
does not keep is the paragraph the park wrote about your absence.

### What ships

**A `— While you were away —` block at the head of the collection book, holding the last three returns,
newest first, each stamped with how long the gap was and how long ago it ended. Persisted in the save.**

Three, not one. The item says "the last digest"; the reason to keep more is that the digest's *content* now
varies with the gap — five minutes says one thing, a day says another — and a log with one entry is a mirror
of the modal rather than a record. Three is the smallest number that shows the news changing.

### Design

**New pure module `game/src/world/awaylog.ts`.**

```ts
export interface AwayEntry { at: number; minutes: number; lines: string[] }
export const AWAY_LOG_KEPT = 3;
export function keepAwayLog(prev: AwayEntry[], entry: AwayEntry): AwayEntry[]
export function awayLogLines(log: AwayEntry[], now: number): string[]
```

- `at` is wall-clock ms at the moment of return; `minutes` is `away.minutes`, the in-game span the digest
  itself is about. Both are needed and they are different numbers: one answers *when did this happen to me*,
  the other *how long was the park alone*. Confusing them is the obvious bug here.
- `keepAwayLog` prepends and truncates to `AWAY_LOG_KEPT`. An entry with **no lines is not kept** — an
  absence the park had nothing to say about should not push a real one off the end.
- `awayLogLines` renders the block. Empty log → **empty array**, so a park nobody has left shows no heading
  at all rather than an empty frame. The relative stamp reuses `fmtSpan` from `away.ts`, which must be
  exported for this (it is currently module-private and already formats exactly this kind of span). One
  formatter for one idea, per the BACKLOG-495 doctrine the last two cycles have been applying.

**`lenses.ts`** — `bookLines(rows, away: string[] = [])` emits the away block immediately after the
`— Collection Book —` header and before the first dino. Defaulted, so every existing `bookLines(...)` call
site and every test literal stays valid.

**`WorldScene`** — a persisted `awayLog: AwayEntry[]` field:
- written wherever `lastAwayDigest` is assigned its **final** value (the restore path after the spoilage/
  upkeep tail is appended, and `__catchUp` after the same), so the log holds the whole digest rather than
  the half that existed before the tail;
- restored `save.awayLog ?? []`, saved in `currentSaveData`, validated in `deserialize` as the additive
  optional field the last twenty have been (absent → `undefined` → `[]` on load, no version bump);
- `bookLines(this.bookRows(), awayLogLines(this.awayLog, Date.now()))` at both render sites (`bookPanel`
  refresh and `__bookText`), so the hook and the panel can never disagree.
- New hook `__awayLog = () => [...this.awayLog]`.

### Acceptance criteria (lore track)

1. `awayLogLines([], now)` returns `[]` — a park nobody has left shows no heading.
2. `keepAwayLog` holds at most `AWAY_LOG_KEPT` entries, newest first, and drops the oldest on overflow.
3. `keepAwayLog` refuses an entry with no lines; the log is unchanged.
4. `bookLines(rows)` with no away argument is **byte-identical** to its output before this cycle (every
   existing call site and test literal keeps working).
5. `bookLines(rows, ['x'])` puts `x` after the `— Collection Book —` header and before the first dino name.
6. A save round-trips `awayLog` through `serialize` → `deserialize`; a save written **without** the field
   loads clean and yields an empty log (additive, no version bump).
7. `deserialize` rejects a malformed `awayLog` (not an array / an entry with a non-numeric `at`) rather than
   loading a broken one.
8. **e2e:** boot, `__catchUp(5 * 60 * 1000)`, dismiss the dialog, read `__bookText()` — it contains the
   `While you were away` heading and at least one line the `__awayDigest()` also contains.
9. **e2e (the item's actual subject):** the same, then `__saveNow()`, reload the page, and the book **still**
   carries that block. Re-readable means later, not just before the next keypress.
10. **e2e:** two returns produce two entries in `__awayLog()`, newest first.

### The reachability answer (lore track)

> *In a fresh save, watched for ten minutes, what does the player see that they could not see before?*

**Step away for five minutes, come back, press any key to clear the digest without reading it, then press V.
The book's first block is the paragraph you just dismissed — and it is still there tomorrow.** Five minutes
is `AWAY_BEAT_MIN_MINUTES`, the same constant the warm and cold digest halves are gated on, so this is
reachable exactly when there is anything to log.

---

## Structure track — BACKLOG-535: the stake's kept step

### What ships

**`stakeUpkeepStep`, and a fourth founder's-stake state driven by it — so the Grove's stake changes in
front of the player when somebody mends the cairn.**

The Structure-smith's handoff records the driver decision (the upkeep ledger) and why `pileStep` and the
prosperity index lost; that argument is not repeated here.

### Design

**`stake.ts`:**

```ts
export const STAKE_KEPT_ART_KEY = 'founder_stake_kept';
export function stakeUpkeepStep(standing: number, derelict: number): boolean {
  return standing > 0 && derelict === 0;
}
export function stakeArtKey(kind: FoundingKind | null, hollowed: boolean, kept: boolean): string | null
```

- `standing > 0` is load-bearing and is the half that is easy to drop: a ground with **no landmarks at all**
  has nothing to keep up, and a stake that called that *kept* would say the Bowl — which ships bare — is
  being looked after better than the Grove, which ships a ruin somebody is about to fix. Nothing is not the
  same as nothing broken.
- Precedence: **hollowed > kept > kind.** A ground everybody left looks the same whether it was tended or
  not; that is already the rule that hollowed beats kind, and it is what leaving does.
- `kept` is a required parameter, not optional. Every call site is in this repo, the compiler finds them
  all, and a defaulted `kept = false` would let a future call site silently opt out of the state.

**`WorldScene`:**
- `syncStakes()` passes `stakeUpkeepStep(this.standingIn(this.zoneId), this.derelictIn(this.zoneId))`;
  `__stake` does the same, through the same expression.
- `worldPlacedProps()` gains `STAKE_KEPT_ART_KEY` — the world can place it, which is what that set means.
- **The half that can quietly ship dead.** Every path that changes a ground's standing/derelict counts must
  reach `syncStakes`. Audited:
  - mend resolve (`stepMend`) → calls `applyObjectVisibility()` → `syncStakes`. ✔ **This is the bar answer's
    path and it already works.**
  - the upkeep pass / lapse (`runUpkeepPass`) → `applyObjectVisibility()`. ✔
  - restore, founding seed, zone cross, `__found` → `applyObjectVisibility()`. ✔
  - **raising a landmark (`buildOnGather` → `place*`) → does NOT.** Both of its exit branches call
    `refreshPlaque()` and nothing else. Add `this.syncStakes()` beside each, at the dispatcher rather than in
    all five `place*` functions — one place all five route through.

**`reachability.ts`** — a new entry, with both frames:

- `id: 'BACKLOG-535/518'`, founded `holds`: the founding Grove is **not** kept
  (`!stakeUpkeepStep(foundingStanding, foundingDerelict)` derived off `FOUNDING_LANDMARKS`/`FOUNDING_RUIN`,
  never restated as literals) — i.e. the change the player watches is still *available* to watch.
- `played.holds`: `stakeUpkeepStep(after.standing[grove], after.derelict[grove])` against
  `afterOneSession()`. This is the claim that breaks if a later tuning pass thins the founding skyline or
  makes the ruin unaffordable.

**The art.** `founder_stake_kept` is a host with no rig until routine 7 fires tonight; the existing
`hasPropArt(key) ? bake : STAKE_GLYPH` fallback covers it, which is the safe direction (a placeable key with
no rig is the graceful path; a drawn rig with no host is the red build the cycle-145 amendment forbids).

### Acceptance criteria (structure track)

1. `stakeUpkeepStep(0, 0) === false` — a ground with nothing raised is not "looked after".
2. `stakeUpkeepStep(2, 0) === true`; `stakeUpkeepStep(2, 1) === false` — one ruin is enough to break it.
3. `stakeArtKey('walked', false, true) === STAKE_KEPT_ART_KEY`.
4. `stakeArtKey('born', true, true) === STAKE_HOLLOWED_ART_KEY` — hollowed outranks kept.
5. `stakeArtKey(null, false, true) === null` — ground nobody founded still shows nothing.
6. `stakeArtKey(kind, false, false)` returns exactly what it returned before this cycle for both kinds.
7. The founding Grove reads **not kept**, derived from the founding tables (not literals).
8. `afterOneSession()`'s Grove reads **kept**.
9. `worldPlacedProps()` contains `STAKE_KEPT_ART_KEY`, and the register's "every drawn rig can be placed"
   entry still passes.
10. **e2e:** boot a fresh save, walk/`__zone` into the Grove, read `__stake()` — it is `founder_stake`
    (not kept, the ruin is down). Run the mend to completion (`__stepMend` until it resolves), read
    `__stake()` again — it is `founder_stake_kept`.
11. **e2e:** the register walks clean in both frames (`__darkEntries()` empty).

### The reachability answer (structure track)

> *In a fresh save, watched for ten minutes, what does the player see that they could not see before?*

**Walk one edge east into the Grove and stand near the founder's stake. It is the plain post. Within a
minute a resident walks to the fallen cairn and puts it back up — and the stake changes, in the same
moment, to the mark of a ground somebody is keeping up.** No clock has to turn and no day boundary is
involved: the mend is a live errand with a wall-clock cooldown, it is the first thing a new park does, and
this is the first state in the founder's-mark family that the player watches *change* rather than finds
already set.

---

## Notes for the Code-planner

- The two tracks share `WorldScene` and nothing else. 114 lives in the save/book/away region; 535 lives in
  the stake/landmark region. No shared function is edited by both.
- `fmtSpan` must be **exported** from `away.ts`, not copied. That is the one cross-file move in the lore
  track and the one place it can go wrong quietly.
- BACKLOG-530 is **not** in scope this cycle and must not be smuggled in as "one small hook". The
  Structure-smith recorded it as a rider for a cycle whose track lands early; it is not this cycle's track
  and it is not this cycle's rider.
