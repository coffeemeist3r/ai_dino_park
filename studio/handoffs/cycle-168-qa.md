# Cycle 168 — QA

**Build:** ✅ `npm run build` clean (vite, 8.9 s, no type errors).
**Unit:** ✅ `npx vitest run` — **3043 passed**, 3 skipped, across **285 files**.
**E2E:** ✅ `npx --yes kill-port 5173` then `npx playwright test` — **828 passed**, 0 failed, in one
full run.

**Boundary checks (CHARTER):**
- `@mlc-ai/web-llm` imported only under `game/src/ai/` — `grep -rl` returns
  `ai/webllm.worker.ts` and `ai/webllmBrain.ts` and nothing else. ✅
- `ctx.destination` appears **once** in the whole repo, in `voice.ts`'s bus connection. ✅
- `AudioContext` / `GainNode` / `OscillatorNode` appear outside `voice.ts` only inside doc comments
  (`answer.ts:10`, `chirp.ts:3`, `chorus.ts:3`, `WorldScene.ts:1439`) — all four are prose saying the
  file is *not* allowed to touch it. ✅
- Save format: unchanged. Neither track reads or writes a persisted field. ✅
- Tree clean, `main` green.

**Note on the verification method.** This is a scheduled unattended run, so the dev-server preview
could not be started (no one present to approve it). That is not a gap in coverage here: every
player-facing claim below is verified by Playwright driving the real built app in a real Chromium,
which is a stronger check than a screenshot.

**Flakes observed and re-run to ground, per the CHARTER's known-flake rule:**
- First `cycle-168` run: two book specs failed inside `boot()` on the 30 s ceiling (cold Vite/Phaser
  warm-up, the cycle-93 signature — no exception, canvas stalls). Re-run isolated: **6/6 pass in
  6.6 s.** Full-suite run afterwards: green.
- `controls-help.spec.ts:19` failed once in a full run and passes 3/3 isolated. Known parallel-load
  flake, not a regression — and specifically *not* caused by this cycle's new help row: that row's
  width failure was a **real** unit failure, which was fixed (below) before this run.

---

## Structure track — BACKLOG-559 (one bus for every voice)

### Acceptance criteria

| Criterion | Status | Evidence |
|---|---|---|
| `audio/mix.ts` exists, imports nothing from `voice.ts` and nothing WebAudio-typed, exercised by a Node Vitest file | **PASS** | `game/src/audio/mix.ts` — its only import is none; `cycle-168-mix.test.ts` runs in the Node environment with the rest of the suite |
| `gainFor('chirp') === 0.12`; `gainFor('thunk')` within 1e-9 of `0.12 * 1.4` | **PASS** | `cycle-168-mix.test.ts` › "the identity cases" (2 tests) |
| `gainFor('hail') < gainFor('chirp') < gainFor('distress')`, all in `(0, 1]` | **PASS** | `cycle-168-mix.test.ts` › "the two this cycle makes expressible"; range asserted in the totality test |
| `gainFor` total over `VoiceKind` — a test walks every member | **PASS** | `cycle-168-mix.test.ts` › "totality" (3 tests), walking `VOICE_KINDS`; plus a no-duplicates check so a kind added to the type without a level cannot pass silently |
| `ctx.destination` matches exactly once in `voice.ts` | **PASS** | `grep -c` → `1`, the bus's own connection |
| `MASTER_GAIN` gone from `voice.ts` | **PASS** | `grep -c` → `0`; the 0.12 lives in `mix.ts` as `BASE`, and the old inline `* 1.4` is now `BASE * 1.4` on the `thunk` row with its reason beside it |
| `hailAndAnswer` plays `'hail'` / answer `'chirp'`; `cryDistress` plays `'distress'`, observable | **PASS** | `cycle-168-voice-bus.spec.ts` › "the hail and the answer are different kinds through one bus" and "a cry is its own kind" |
| `@mlc-ai/web-llm` under `game/src/ai/` only | **PASS** | grep, above |
| No save-format change at all | **PASS** | no persisted field touched; the 24 save/reload specs in the suite are green unchanged |
| An e2e drives a greet on a fresh save and asserts the observed kinds — the reachability walk | **PASS** | `cycle-168-voice-bus.spec.ts` test 1: `boot` → `foundingState('as-shipped')` → `settle` → greet Rex → `kind: 'hail'`, then polls to `kind: 'chirp'` / `name: 'Rex'`. No seeded friendship, no clock skip, no population floor |
| build / vitest / playwright green | **PASS** | header |

### The reachability question (CHARTER v7)

> *In a fresh save, watched for ten minutes, what does the player see that they could not see before?*

**Two sounds change, both inside the first minute, neither needing anything to be earned.**

1. **Walk up to any dinosaur and press Z.** Since last cycle the keeper's hail and the dino's answer
   have played at exactly the same level, so the greet was two equal beeps a fifth apart. Now the hail
   sits back at 0.08 and the answer comes forward at 0.12 — it reads as *you called, and something
   answered you*, which is the sentence BACKLOG-193 was named for and could not quite make.
2. **Rap the glass near a timid dino.** A frightened yelp is short by design (`distressParams` cuts
   the call to 55%), and a short call at the same gain is a *smaller* sound — so the one noise in
   this park meant to cut through has been the quietest thing in it since cycle 46. It now plays at
   0.20 and carries.

Neither was expressible before, because there was no object in the park representing how loud a call
is; both are now decided by a pure function a test can read. This is the bus's reachable half, which
the item's own seed text correctly refused to let be deferred.

### Bugs found

**None beyond the acceptance set.** One latent wart was *found and corrected* rather than shipped
around: `cryDistress` recorded `lastSound = { kind: 'chirp' }` for a distress call, so no observer —
spec or human — could distinguish a cry from a greeting in the park's own record. No existing spec was
asserting that wart, so nothing had to be loosened to fix it.

### Recommendation: **APPROVE**

---

## Lore track — BACKLOG-195 (cry in the book)

### Acceptance criteria

| Criterion | Status | Evidence |
|---|---|---|
| Fresh save → `V` to the book → `N` prefixes exactly one name line with `▸`, the first dino's | **PASS** | `cycle-168-cry-in-the-book.spec.ts` › "N steps a cursor…" — asserts exactly one `▸` on the first render and after the step |
| Five more `N` presses wrap to the first dino, exactly one `▸` at every step | **PASS** | same file › "the cursor wraps back to where it started" — walks `__bookRows().length` steps, asserting the single-`▸` invariant on each |
| Each `N` records a chirp for the newly selected dino, params deep-equal `chirpParams(traits)` | **PASS (with a note)** | same file › "N steps a cursor…" asserts `kind: 'chirp'` and `name` **read out of the book text**, so the spec cannot pass on a cursor that moved elsewhere. The params equality is covered structurally: `stepBookCursor` calls `chirpFor`, which is the one existing path that computes `chirpParams(d.traits)` — no second derivation exists to diverge from |
| `N` outside the book lens changes neither cursor nor last sound | **PASS** | same file › "N outside the book lens does nothing at all" |
| Exactly one block carries a `🔊 voice · ` line | **PASS** | same file › "the selected block names its voice, and only that block" — counts occurrences *and* asserts the line sits within two rows of the `▸`, so it belongs to the selected block rather than merely being unique |
| `voiceLine(params)` renders `🔊 voice · N Hz · N pip(s)`, singular at 1 | **PASS** | `cycle-168-voiceline.test.ts` › "the plain form" (3 tests) |
| `voiceLine(child, [a, b])` appends `between` / `above both` / `below both` correctly | **PASS** | `cycle-168-voiceline.test.ts` › "the blend, made legible" (5 tests), including the inclusive boundary (a child landing exactly on a parent's pitch is *between*, not above) and order independence |
| Hatchling with both parents present → comparison form; one parent absent → plain form | **PASS (unit only)** | `voiceParentsOf` returns `undefined` unless **both** `dinoByName` lookups resolve (`WorldScene.ts`), and the two rendering shapes are pinned by the unit file. The design explicitly allowed unit-only here; the park has no egg-hatch dev hook, and adding one to prove a two-branch guard is not worth a scene seam |
| Muted: `N` still moves the `▸`, the voice line still renders, last sound unchanged | **PASS** | same file › "muted, the cursor still moves and the voice line still reads" — and it restores the device's mute state, per the cycle-167 courtesy |
| Removing the selected dino leaves the cursor valid | **N/A — unreachable** | The clamp ships (`bookRows` reads `Math.min(bookCursor, dinos.length - 1)` and writes it back), but **nothing in this park removes a dino**: `this.dinos` is mutated in exactly one place, `push` at `WorldScene.ts:3974`. The bowl is deathless by CHARTER and has no departure-from-roster path. Marked N/A rather than PASS because there is no runnable check, and a criterion with no check should be named, not scored |
| build / vitest / playwright green | **PASS** | header |

### The reachability question (CHARTER v7)

> *In a fresh save, watched for ten minutes, what does the player see that they could not see before?*

**Press `V` to the book, then `N` five times.** You hear the five founders' voices back to back —
Twitch's squeak near the top of the 148–797 Hz spread, Mossback's rumble near the bottom — with each
one's block naming its own pitch and pip count as it plays. That is the first time in this game's life
that two dinos can be heard **next to each other**: the voicebox has existed since cycle 44 and the
only way to compare two calls was to walk across the bowl and greet each in turn, by which time you
had forgotten the first. The spec `"two entries, two voices"` asserts exactly this and asserts the two
pitches differ.

It costs two keys and nothing else — no friendship, no day boundary, no population floor.

### Bugs found

**One, real, found by the suite and fixed at its root — worth the Validator's attention.**

The `▸` cursor mark broke **thirteen** e2e specs across four files. Each file carried its own
hand-written copy of the same book-block parser, locating a dino's block with
``line.startsWith(`${name}  (`)``. The selected entry's header no longer starts with its name, so
every parser found every block **except the one the player is looking at** — which is also the only
block that would ever carry new information.

The fix was not four patches. One `isBookHeader` now lives in `tests/e2e/helpers.ts` and the four
copies call it; each spec's own block-slicing logic is untouched. That a single render change could
redden thirteen specs at once *is* the finding: the duplication was the defect, and the `▸` only
revealed it.

Second, smaller: the new `[?]` help row was one character too wide for the panel (`helpLines` pads to
the widest key, and the assert is `< 40`; the row landed at exactly 40). Two unit specs caught it
before it reached a human. Shortened to `next book entry + cry`. **This is the check working**, and it
is noted rather than hidden because a help row silently overflowing the panel is precisely the class
of thing nobody would have reported.

### Recommendation: **APPROVE**

---

## Something the Validator should weigh (not a bug, a judgement)

The design ruled that half of BACKLOG-195 — *"a hatchling's cry blends its parents' parameters the way
its traits do"* — **was already true and had been since cycle 44**, because `blendTraits` blends the
traits and `chirpParams` derives the call from the traits. Building it would have been bit-identical
work, which CHARTER v7 calls a REWORK. The track therefore shipped that half as **legibility** (the
book naming where a voice sits between its parents') rather than as arithmetic.

QA agrees with the ruling and has verified the reasoning directly: `blendTraits` at
`social/breeding.ts:48` averages per axis, `hatch` at `:133` feeds the blend straight into the new
dino, and `chirpParams` reads nothing but traits. There is no third path. **The item's stated
behaviour was real and unreachable, which is the exact failure the cycle-166 milestone essay named as
this studio's most common one** — and this cycle found it by reading the code before writing any,
rather than after shipping a duplicate.
