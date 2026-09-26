# Cycle 169 — QA

Fifteen acceptance criteria from `cycle-169-design.md`, walked one at a time against the shipped code
and the suites. **15 pass, 0 fail.** One flake seen, identified, and dismissed with evidence rather
than by assertion.

## Board

| Gate | Result |
|---|---|
| `npm run build` | clean |
| `npx vitest run` | **3078 passed**, 3 skipped, 288 files (was 3063 / 286) |
| `npx --yes kill-port 5173` → `npx playwright test` | **834 passed, 0 failed** (was 829) |
| `@mlc-ai/web-llm` outside `game/src/ai/` | none |
| Save format | untouched — nothing added, nothing renamed |
| Working tree | clean at each stage commit |

## Lore track — BACKLOG-204 + BACKLOG-202

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | `distressEventLine` pure, exported, names caller + ground, differs by trigger | **PASS** | `game/src/world/cycle-169-distress.test.ts` — two cases; the cold variant is asserted to carry `shivering` by name, so a refactor that collapses the two triggers into one string reddens |
| 2 | A cry appends the line, and it reaches the ticker | **PASS** | `cycle-169-distress-answer.spec.ts` reads `__ticker()` (the same array `tickerLines` slices) and finds a `📢` line containing `Rex` |
| 3 | Posted on a muted device too | **PASS** | Second spec presses `KeyM`, asserts `__soundMuted()` is true, then fires the cry and still finds the line. The `logEvent` call sits above the `if (!soundMuted())` block, not inside it |
| 4 | `callbackDelayMs` pure, monotone, clamped, positive at max bond | **PASS** | Four cases; the monotone walk steps the whole 0–100 range, and the positivity case walks past 100 |
| 5 | The comforter calls back in its own voice after `callbackDelayMs` | **PASS** | `answerCry` uses `chirpParams(friend.traits)` (not `distressParams`, not `answerParams`) and `callbackDelayMs(bondPoints(...))`; e2e reads `__lastCallback` and finds `{ caller: 'Rex', name: ≠ Rex, delayMs > 0 }` |
| 6 | No comforter over the floor → no callback | **PASS** | `answerCry` is called **after** the two existing `if (!who) return` / `if (!friend) return` guards in `cryDistress`, so an unanswered cry takes the identical path it has since cycle 46. The cycle-046 spec that asserts `responder === null` on a bondless park still passes |
| 7 | Guards: left the roster / muted during the gap | **PASS** | Both written inside the `delayedCall`, re-resolving by name via `dinoByName` — the same two guards and the same order as `hailAndAnswer` (193) |
| 8 | e2e: ticker line + `__lastCallback`, no page errors | **PASS** | Both specs green; the first collects `pageerror` and asserts `[]` |

### The thing QA is actually here for

Criterion 5's first run **failed**, and the way it was fixed is the part worth reading. `__lastCallback`
came back null on a fresh save, because `comforter()` needs a bond over `COMFORT_BOND_FLOOR = 8` and a
park one frame old has an empty bond graph.

The cheap repair was on the shelf: `__bondPair('Rex', 'Sunny', 12)`, exactly as the cycle-046 specs
stage this beat. QA's position is that this would have been **a spec that passes on a park where the
feature never happens** — the CHARTER v7 failure with a green tick on it. The Coder instead measured
whether the park reaches the floor by itself and found that it does, comfortably: the first pair
crosses inside 40 world steps with no hook touched, and by two minutes most of the roster is over it.
The spec now runs the park before it cries. That is a reachability demonstration, not staging, and it
is the right call.

**Carried forward as a finding, not a defect of this cycle:** four systems share the floor value 8
(`COMFORT_BOND_FLOOR`, `LONER_FLOOR`, `HUDDLE_THRESHOLD`, `GRIEF_BOND_FLOOR`) and the founding save
starts every pair at zero, so all four are inert on frame one. It is under a minute of play, not
twenty-four hours, so it does not fail the bar — but it is the corollary's exact shape and it should
be a Structure Track item. Handed to the Validator.

## Structure track — BACKLOG-206

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 9 | `distanceGain` pure; 1 at 0 and `NEAR_PX`; `FAR_LEVEL` at and past `FAR_PX`; monotone; never ≤ 0; 1 for `NaN`/`Infinity`/negative | **PASS** | `cycle-169-space.test.ts`, six cases. The monotone walk steps to `FAR_PX * 1.5`; the bad-input case covers all three |
| 10 | `FAR_LEVEL > 0` asserted **by name** | **PASS** | Its own `it(...)`, titled for what it protects: the floor is a design commitment, not leftover arithmetic |
| 11 | `gainFor(kind)` unchanged for every kind | **PASS** | Totality walk over `VOICE_KINDS` against the cycle-168 numbers written out literally (0.12 / 0.168 / 0.08 / 0.2), and `gainFor(kind, {})` checked as well — an empty options object must not be a silent attenuation |
| 12 | `gainFor(kind, { distancePx })` = `gainFor(kind) * distanceGain(d)` | **PASS** | Cross-product of every kind against five distances |
| 13 | `lastSound.gain` recorded at every scene call site | **PASS** | `gain` is a **required** field on the type, so the five assignment sites (thunk, hail, chirp, the 193 answer, the cry, the new callback) are enforced by the type checker rather than by review |
| 14 | e2e: far greet quieter than near, both > 0 | **PASS** | `cycle-169-sound-has-a-place.spec.ts` places Rex at tile (2,2) and Twitch at (18,13), stands the keeper on Rex, and compares the two answers' `gain` |
| 15 | The book plays at full level wherever the keeper stands | **PASS** | Second spec parks the keeper in tile (0,0), puts Rex in (19,14), opens the book, presses `N`, and asserts `gain` is 0.12 — the undiminished chirp level |

### Notes

- **The dawn chorus became spatial with no call-site edit** (the `chirpFor` default parameter), which
  the code plan flagged as a risk to verify rather than assume. Verified: the cycle-045 chorus specs
  assert order and names, not levels, and are green.
- **Two `delayedCall` copies now exist** where there was one. QA does not treat this as a defect: it
  is named in the source comment, BACKLOG-562 is the queued fix, and the Structure-smith has already
  flagged it as next. Solving it inside a lore fire would have pre-empted a queued structural item
  and done half of it.
- **Flake:** `controls-help.spec.ts` (two cases) failed in the first full run. It passes isolated on
  clean `HEAD` **and** on this tree, and the subsequent full run was green with all 834. It touches
  nothing this cycle changed. The known parallel-load flake — noted, not a regression.

## Both tracks: APPROVE recommended.
