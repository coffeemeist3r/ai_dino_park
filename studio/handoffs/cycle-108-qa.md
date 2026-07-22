# Cycle 108 — QA

**Build:** ✅ clean (`✓ built in 8.74s`, PWA precache generated).
**Unit tests:** ✅ **1268 / 1268** passed, 138 files (was 1238 / 137 — +30 new).
**E2E tests:** ✅ **368 / 368** passed in 6.0m, **zero failures, zero retries.** No parallel-load flake surfaced
this run — including `cycle-097-carry-pressure` and `cycle-077-carry`, the two specs BACKLOG-456 tracks.

Notable: `mobile-minds.spec.ts` "long dialogs page GBA-style: E forward, ◀ back, ✕ closes from any page"
**passed**. That is the standing red catalogued as BACKLOG-430. One green run is not a fix — it has passed
intermittently before — but it is worth the Validator's attention that the whole suite read clean.

Verification method note: every criterion below is backed by a named automated test. Where a criterion is
about code *structure* rather than behavior (cascade position, export surface), it is scored against a
direct read of the shipped source, cited by line.

---

## Lore track — BACKLOG-453 (Word of the provider)

### Acceptance criteria

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | `zoneProvider` returns highest-tally provider; no-provider zone → null; ties alphabetical | **PASS** | `cycle-108-provider-word.test.ts` — "names the highest-tally provider living in the zone", "breaks a tie alphabetically", "ignores residents who have not settled the provider role", "an empty park has no provider anywhere" |
| 2 | `zoneProvider` ignores providers in a different zone | **PASS** | same file — "ignores a provider living in another zone" |
| 3 | `cannedReply` appends the aside; byte-identical without a provider | **PASS** | same file — "is byte-identical to today when there is no provider" (pinned on the deterministic gratitude register, per the plan's random-branch risk), "appends the provider aside when there is one" |
| 4 | Three distinct temperament strings, same provider + zone in each | **PASS** | same file — "is a distinct line per temperament" (`new Set(asides).size === 3`), "names the same provider and zone in every voice" |
| 5 | Greeting the provider itself produces **no** aside; another resident does | **PASS** | e2e `cycle-108-provider-word.spec.ts` — "the provider never talks up its own pantry" + "a resident tells the keeper who keeps its ground fed" |
| 6 | Composes hungry + rattled + provider, in that order, within the cap | **PASS** | unit — "composes after hunger and the chase, in that order, without truncating" (asserts index ordering *and* the full clause survives the 320 cap) |
| 7 | `spreadProviderWord` plants a `RUMOR_MARK` line that cannot re-spread | **PASS** | unit — "plants the word on the listener and returns it", "plants a rumor that cannot re-spread" (`isShareable === false`) |
| 8 | Null rumor + unchanged store for all three refusals (self, no provider, speaker *is* provider) | **PASS** | unit — "a provider never talks up its own pantry", "says nothing when the zone has no provider", "says nothing to itself"; each asserts `out.store === store` (identity, not equality) |
| 9 | In `converse`, fires only when relief/warm/cold/grove decline, **and posts a 🧺 ticker naming speaker and listener** | **FAIL** | Cascade position correct (`WorldScene.ts:3251` — `grove.rumor ? grove : spreadProviderWord(...)`, log else-if at `:3257` in lockstep). **But the ticker names the listener and the zone, not the speaker:** `🧺 ${b.name} heard who keeps ${zone} fed`. See Bugs. |
| 10 | Listener carries the word in `recall`, so its own next greeting can surface it | **PASS** | e2e — "the word travels" asserts `__memory().Mossback` contains the rumor; `pickTone` feeds `recentMemory: recall(...)` (`WorldScene.ts` greet context), the same channel every other trace uses |
| 11 | e2e: greeting a non-provider resident shows a dialog line naming provider + zone | **PASS** | e2e — "a resident tells the keeper who keeps its ground fed": the returned dialog line contains `Pocket Cretaceous eats because of Sunny` |

**10 / 11 pass.**

### Bugs found

**BUG-1 (criterion 9, the failure).** The 🧺 ticker line drops the speaker.

```ts
// WorldScene.ts:3257 — shipped
else if (pword.rumor) this.logEvent(`🧺 ${b.name} heard who keeps ${zoneById(zone).name} fed`);
```

The criterion asks for a line "naming speaker and listener", and every sibling rung in the same cascade
does exactly that — `🌿 ${b.name} heard about the grove from ${a.name}` (:3256), `🗣️ ${b.name} heard news
about ${a.name}` (:3258). This one names the listener and the *zone* instead. The consequence is real if
small: the ticker is the keeper's only view of who is talking to whom, and for this rung alone the player
cannot tell who carried the word. It also breaks the local convention a reader would rely on.

Not a behavioral defect — the memory, the rumor, the cascade order and the no-self-praise rule are all
correct and covered. It is a one-string miss against a written criterion. The natural fix keeps the zone,
which is genuinely useful information, and restores the speaker:

```ts
`🧺 ${b.name} heard from ${a.name} who keeps ${zoneById(zone).name} fed`
```

No other bugs found. Nothing regressed: the 448 provider specs, the 447 food-flow specs, and the 452
homecoming specs are all green, and `roleOf` being reached from `converse` (a new call path) settles roles
no differently than the lens and book already did — the cycle-060 role specs and `cycle-107-provider` pass
unchanged.

### Recommendation: **REWORK**

One criterion fails, build and suite green. Per routine 5's failure table that is REWORK, and the bar does
not get lowered for a cosmetic miss — a criterion the Designer wrote is a criterion the Coder owes. The
scope is a single template string with a test to pin it; the rework loop should be correspondingly short and
must not re-open anything else on this track.

---

## Structure track — BACKLOG-449 (One terrain per zone, as data)

### Acceptance criteria

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Full `COLS × ROWS` sweep reports identical `TileKind` per zone after the refactor | **PASS** | `cycle-108-terrain-table.test.ts` — "bowl/grove/fernreach: every tile matches its own rule", 300 tiles per zone against the unchanged `*TileAt` rules |
| 2 | `zoneWaterTile` identical for all three zones; `null` for unknown | **PASS** | same file — "each zone returns exactly the landmark it returned before", "the landmark values themselves are the pre-refactor ones" (literal `{3,2}` / `{COLS-3,3}` / `{3,floor(ROWS/2)}`), "an unknown zone has no water" |
| 3 | `zoneTint` identical for all three; untinted default for unknown | **PASS** | same file — "tints are unchanged, unknown zones untinted" |
| 4 | `zoneTileAt` still returns `null` for unknown id → plain-grass fallback intact | **PASS** | same file — "an unknown zone still returns null, so drawFloor keeps its plain-grass fallback"; `drawFloor` untouched (probe-at-(0,0) branch unchanged) |
| 5 | All six per-zone functions still exported; the four existing test files pass **unmodified** | **PASS** | `git status` shows zero changes to `cycle-067-grove-terrain`, `cycle-086-fernreach-terrain`, `cycle-079-pondsight`, `cycle-079-grove-plot`; all 4 green (29 tests) |
| 6 | Table-driven landmark invariant over **every** zone with a landmark | **PASS** | same file — "every declared water landmark actually sits on water under its own zone rule", iterating `Object.entries(ZONE_TERRAIN)` (not three named zones), so a fourth row is covered on the day it is added |
| 7 | A test-only fourth descriptor gets terrain, tint, landmark, `atWater` with zero dispatcher edits | **PASS** | same file — "gets ground, tint, a landmark and working atWater with zero dispatcher edits"; asserts `null` *before* registration, then all four reads after. Rule (`x < 2 → water`, else `fern`) is unlike all three real layouts, so a stale lookup cannot pass by coincidence. `afterEach` deletes the row — no leakage |
| 8 | `atWater` unchanged for all three zones | **PASS** | `cycle-079-pondsight` (10 tests) + `cycle-086-fernreach-terrain` (9 tests) green unmodified |
| 9 | Floor bakes and tints in-game for all three zones | **PASS** | e2e `cycle-067-path-water-art`, `cycle-086-fernreach-terrain`, `cycle-105-waterhole` ("the bowl floor still renders with a terrain layout") — all green |

**9 / 9 pass.**

### Bugs found

None. Two observations for the Validator, neither a defect:

- The Coder shipped this with **zero** `WorldScene.ts` edits, not the "~1 import line" the plan allowed.
  That is the strongest possible evidence the criterion-7 generalization is real: the consumer of all three
  dispatchers never noticed they were rewritten.
- The plan's "run the sweep against pre-refactor code first" step was **not** executed, and the codeplan's
  Shipped section says so plainly rather than quietly skipping it. QA accepts the substitute: criterion 1
  compares the dispatcher against each zone's own unchanged rule function, and criterion 2 independently
  pins the three landmarks to literal coordinates transcribed from the pre-refactor source. A layout change
  would have to corrupt the rule *and* the literal in the same direction to pass both. The deviation is
  logged honestly and the coverage is equivalent.

### Recommendation: **APPROVE**

Every criterion passes on automated evidence, the refactor is provably invisible to its consumers, and the
"kept in sync with" comments are now a mechanism that fails CI instead of a comment nobody re-reads.

---

# Rework loop 1 — QA re-verification

**Structure track (449): APPROVED in the first pass — not re-tested, not re-opened.**

**Build:** ✅ clean. **Unit:** ✅ 1268 / 1268 (138 files). **E2E:** ✅ **368 / 368** on the confirming run.

## Lore track — BACKLOG-453, criterion 9 re-scored

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 9 | In `converse`, fires only when relief/warm/cold/grove decline, and posts a 🧺 ticker naming **speaker, listener, and zone** | **PASS** | `WorldScene.ts:3257` now `🧺 ${b.name} heard from ${a.name} who keeps ${zoneById(zone).name} fed`; e2e "the word travels" asserts the exact phrase `Mossback heard from Rex who keeps Pocket Cretaceous fed` |

**11 / 11 pass. Lore track recommendation: APPROVE.**

The other ten criteria were not re-run for scoring but are covered by the same suite, which is green. The
rumor written to memory (`providerWordLine`) is unchanged and still pinned by the memory assertion in the
same spec — the fenced constraint held.

**A note on the fix that came free.** The tightened assertion failed on its first run for a reason unrelated
to the defect it was written for: `🧺` is shared with 448's haul line, and the spec's
`.find(e => e.includes('🧺'))` was selecting `🧺 Sunny put the harvest away…` instead of the gossip event.
The *original* weak assertion had masked that by matching a phrase fragment rather than a whole line. So the
spec had been reading the wrong event since it was written, and only became honest when it was asked to be
exact. Production was correct throughout. This is worth the Validator's ink: the weak assertion hid two
things, not one.

## E2E flake — `cycle-076-news-pull`, not a regression

The **first** confirming full run came back 367/368: `cycle-076-news-pull.spec.ts` "grove news pulls a
curious, un-traveled bowl dino over a coin-flip" failed with `__maybeMigrate()` returning `Sunny` where the
spec expects `Mossback`. Diagnosed before being labelled, in this order:

1. **Isolated re-run:** passes, 792ms.
2. **Under parallelism, 12 repeats × 4 workers:** 12/12 pass. It needs full-suite load, which is the
   catalogued signature.
3. **Code path:** `Sunny` means `pickMigrant` took its *first* branch — `homesick` — which short-circuits
   before the grove-pull logic the spec is actually about. `homesickOf` reads `this.bonds` and
   `this.tenure` and nothing else. The cycle-108 diff writes `this.roles` (via `roleOf`) and `this.memory`
   (via `spreadProviderWord`). **Disjoint. The diff cannot reach the branch that failed.**
4. **The decisive one:** the *previous* full run was 368/368 green **with the entire provider rung already
   shipped**. The only delta between that green run and the red one is a `logEvent` template string and a
   test's `.find` predicate — neither touches simulation state.
5. **Fresh full run:** ✅ **368 / 368**.

Routine 0's test is "passes isolated **and** a fresh full run is green → flake, note it, not a regression."
Both hold. Noted, not a regression.

**But it is a new member of a known family, and should be catalogued rather than shrugged at.** The spec
drives two full crossings via ~40 `__stepWorld` calls each, and `__stepWorld` deliberately bypasses
`__pauseAmbient` — so ambient meetings run on those same steps and mutate `bonds`. If any dino becomes
homesick during the drive, `pickMigrant`'s first branch fires and the spec fails on an exact-identity
assert. That is precisely the BACKLOG-456 shape (driven crossing + ambient activity on the driven steps +
an exact assert), with `bonds`/`homesick` in place of the pile arithmetic. It is *also* latently
nondeterministic independent of load, since the homesick pool is chosen with `Math.random()`.

**Recommended to the Validator:** fold this spec into BACKLOG-456's text as a third named instance, so the
eventual `__pauseAmbient`-one-level-down fix is scoped to cover it. No code change this cycle — it is
pre-existing, off this diff, and out of both tracks' scope.
