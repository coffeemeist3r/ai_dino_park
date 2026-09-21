# Cycle 164 — QA

**Build:** PASS — `npm run build` (tsc -b + vite build) clean.
**Unit tests:** PASS — **2918 passed**, 3 skipped, 274 files (`npx vitest run` from the repo root,
which is the config that covers both `tests/unit` and `game/src`; running from `game/` finds a
fraction of them).
**E2E tests:** PASS — **793 passed**, 0 failed (`npx --yes kill-port 5173` then `npx playwright test`).

**On the e2e flake, named rather than swept.** The first full run failed two specs —
`cycle-121-yearning.spec.ts:97` and `cycle-136-mending.spec.ts:121` — both on
`locator('canvas').waitFor` / `__ready` timing out at the 30,000ms ceiling, neither on anything this
cycle touched. Both passed isolated (14/14 across the two files) and a fresh full run was green at
793/793. That is the signature BACKLOG-553 describes: a **stall**, not budget creep, against a p95
boot of ~735ms. Recorded, not counted as a regression.

---

## Lore track — BACKLOG-157 (Read the Room)

| Criterion | Status | Evidence |
|---|---|---|
| `keeper/room.ts` is pure (no Phaser, no webllm), exports `canReadRoom`/`roomLines`/`roomRefusal`, unit-tested | **PASS** | imports are `social/bonds`, `world/skyEvent`, `./keepers` and nothing else; `game/src/keeper/room.test.ts`, 16 tests |
| `canReadRoom` true for `aether` only | **PASS** | `room.test.ts` "is the diplomat alone" — iterates `KEEPERS`, so a fifth seat fails loudly |
| `roomRefusal` distinct + non-empty for `vanta`/`lumen`/`kestrel`, `''` for `aether` | **PASS** | `room.test.ts` "is distinct and in-character for every other seat" (asserts set size) + "is empty for the one who can" |
| `R` as AETHER-1 opens the panel; `R` again hides it | **PASS** | e2e `cycle-164-room.spec.ts` "a brand-new park has something to say…" + "R again closes the readout" |
| `R` as another observer leaves the panel hidden and surfaces the refusal | **PASS** | e2e "other observers cannot read a room" (bubble path, VANTA-9) + "an empty ground reads as empty…" (ticker path, Kes) |
| pairs at ≤2 tiles same zone; no pair across zones at identical tiles | **PASS** | `room.test.ts` "pairs two dinos at the edge of the radius", "does not pair two dinos one tile past it", "does not pair two dinos standing on identical tiles of different grounds" |
| bond ≥ ease floor reads `at ease`, below reads `edgy` | **PASS** | `room.test.ts` "reads a warm pair as at ease and a cold one as edgy, on the exact boundary" — tests `EASE_BOND` and `EASE_BOND - 1`, so the comparison operator itself is pinned |
| a dino with nobody within 2 tiles is listed alone, by name | **PASS** | `room.test.ts` "names whoever nobody is standing near" |
| deterministic, alphabetical | **PASS** | `room.test.ts` "is byte-identical however the cast is ordered" (reversed input) + "sorts pairs alphabetically, and names each pair smaller-first" |
| empty cast → header, no false claim | **PASS** | `room.test.ts` "an empty room is a header and nothing else" (exact array equality, both with and without a place) **and** e2e on the Saltpan, which asserts the live panel is exactly `['— Read the Room —', 'The Saltpan']` |
| **fresh save, AETHER-1, more than a header** (CHARTER v7) | **PASS** | e2e "a brand-new park has something to say about its own floor" — `foundingState(page, 'as-shipped')`, default observer, no pick, `lines.length > 1`, console error list empty |
| `R` does not set `dialogOpen` / does not eat the next `E` | **PASS** | zero occurrences of `dialogOpen` inside `toggleRoom` (grepped); e2e "the readout never blocks the talk path — E still opens the tone menu with it up" |
| e2e: `R` as Aki opens; `R` as Vix does not and refuses | **PASS** | the two e2e tests above |

**Out-of-scope checks I ran anyway**
- The reuse the codeplan mandated was actually taken: `roomLines` calls `stargazingPairs`, and there
  is no second pair-finder in `keeper/`. `stargazingPairs(gazers, radius = 1)` — every pre-existing
  caller and every stargazing test is untouched and green.
- The room read is scoped to the keeper's own ground (`roomMembers` filters on `this.zoneId`), so a
  dino in the Grove is neither paired nor listed as alone in the bowl's readout. Verified by the e2e
  on the Saltpan returning an exactly-empty body while five dinos exist elsewhere.

**Bugs found:** none.

**Recommendation: APPROVE.**

---

## Structure track — BACKLOG-555 (the watcher's record)

| Criterion | Status | Evidence |
|---|---|---|
| `keeper/record.ts` pure, unit-tested | **PASS** | single import, `./keepers`; `game/src/keeper/record.test.ts`, 12 tests |
| `newRecord` → `switches: 0`, `sinceDay`, `id`, no `previousId` | **PASS** | `record.test.ts` "is this observer, chosen today, never switched" (exact object equality) |
| `switchTo` bumps, files outgoing id, resets `sinceDay`, **drops persona** | **PASS** | `record.test.ts` "bumps the count…", "files the *immediately* previous id, not the original one", "drops the persona cache", "does not mutate its input" |
| `recordFrom` seeds from a bare `keeperId`, or from the default | **PASS** | `record.test.ts` three `recordFrom` tests, including "a saved record wins over the bare id" |
| a full record round-trips deep-equal | **PASS** | `tests/unit/cycle-164-keeper-record-save.test.ts` "survives a reload unchanged" + the persona-carrying variant |
| **a save with no `keeper` key loads** (additive-save rule) | **PASS** | same file, "loads, with no record at all" and "is seeded from its bare keeperId by the caller" — the old-shaped fixture is built by deleting the key from a serialized save, so it is genuinely the pre-555 shape |
| a malformed record is rejected, not coerced | **PASS** | same file, ten `reject(...)` cases: null, string, missing id, non-string id, non-number/non-finite `sinceDay`, non-number `switches`, non-string `previousId`, half-typed persona, null persona |
| `plaqueLines` with no `watch` byte-identical | **PASS** | `tests/unit/plaque.test.ts` "adds exactly one line, and is byte-identical to the pre-555 plaque without it" — compares the filtered arrays, not just the length |
| `plaqueLines` with `watch` renders exactly one extra line | **PASS** | same test; ordering pinned by "engraves the watcher above the sitting and the streak" |
| fresh save shows `Watch · ` naming the observer and `since day 1` | **PASS** | e2e `cycle-164-watch.spec.ts` "a fresh park engraves who is watching, since day one" — and it additionally asserts the line does **not** say "watcher", i.e. the count is suppressed at zero |
| re-picking the worn observer does not increment `switches` | **PASS** | e2e "re-picking the observer you already wear is not a switch" |
| picking a different observer increments by exactly 1 and sets `previousId` | **PASS** | e2e "switching observers files the change and re-engraves the brass" |
| e2e: fresh boot shows the line; switching at `K` changes it | **PASS** | the two e2e tests above, plus "the record survives a reload, tenure and all" — which QA notes was **not** in the design's list and is the one that would have caught a record that lived only in memory |

**Bugs found: none.** One near-miss worth recording rather than filing: the record's brass helper was
written as `watchLine` and collided at compile time with `world/watch.ts`'s `watchLine`
(BACKLOG-524). `tsc` caught it on the first build and the Coder renamed it `tenureLine`. It never
reached a test, but it is the kind of collision that in a dynamically-typed file would have shipped
as a silently wrong import, and the rename is commented at the definition so the next person does
not undo it.

**Amendments to the acceptance set:** none needed this cycle — every criterion as written was
testable as written.

**Recommendation: APPROVE.**

---

## The BACKLOG-556 rider (art host)

Not an acceptance set of its own, but checked, because a host that reddens the reachability register
is exactly the failure the cycle-145 amendment exists to prevent:

- `tests/unit/cycle-145-reachability.test.ts` — **8/8 pass** with `MOPE_ART_KEY` added to
  `worldPlacedProps()`. The key is placed *and* registered, so it is a true entry, not a silencing one.
- No rig exists yet, so `hasPropArt('mope')` is false and `makeHourMark` falls back to the `Text`
  glyph — the mark renders exactly as it did before this cycle. The whole mark family's e2e
  (`__marks`) is green, including `mope`.
- The Artist is therefore unblocked on BACKLOG-556 **tonight**, which was the point of scheduling the
  host rather than merely naming it.

## Scoring

**Criteria: 26/26 PASS** (13 lore, 13 structure). Build clean, 2918 unit, 793 e2e, zero failures on
a fresh full run. Both tracks: **APPROVE**.
