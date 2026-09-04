# Cycle 150 — QA

**Build:** ✅ clean (`npm --prefix game run build`).
**Unit tests:** ✅ **2440 passed**, 3 skipped, across 234 files (`npx vitest run` from the repo root —
running from `game/` finds only a fraction of them).
**E2E tests:** ✅ **659/659 passed** on a full run (5.8m, `npx playwright test` after
`npx --yes kill-port 5173`). No flake on the full run; a cold first run of the vigil spec alone timed out
two tests on `__ready` and passed them at 1.1s on the immediate re-run — the catalogued cold-Vite boot
flake, not a regression, and it did not recur in the full pass.

---

## Structure track — BACKLOG-529: the keeper's own clock is not the park's

| Criterion | Status | Evidence |
|---|---|---|
| `new Date(` appears only in `keeperclock.ts` and tests; zero in `WorldScene.ts` | **PASS** | `grep -rn "new Date(" game/src --include=*.ts \| grep -v '\.test\.'` → 3 hits, all `keeperclock.ts` (two in code, one in its header prose). |
| `keeperHour` returns the local hour, asserted twelve hours apart | **PASS** | `keeperclock.test.ts` › "reads the local hour of an injected epoch", "two epochs twelve hours apart…". |
| DST fall-back: the repeated hour is recorded twice | **PASS** | `keeperclock.test.ts` › "fall-back: the repeated local hour is recorded twice". **Confirmed actually exercised** — the test warns and returns on a zone with no DST, and no warning appeared on this run, so the assertion ran against a real transition found by scanning the machine's own zone. |
| `keeperDay` is a local calendar day | **PASS** | `keeperclock.test.ts` › "is the local calendar day, and changes across local midnight" + the padding case. |
| `__keeperNow` makes the vigil deterministic, hours derived not literal | **PASS** | `cycle-149-vigil.spec.ts` › "nobody waits when the keeper turns up at an hour it has never seen" — now sets the keeper twelve hours off the *learned* hour (read from `__visitHours()`) and asserts no vigil, then puts it back on that hour and asserts one. Both halves derive; the spec's old `new Date().getHours()` is gone. |
| `away.ts` carries the duration-vs-hour note naming `keeperclock.ts` | **PASS** | `away.ts` header, second paragraph. |
| Save shape unchanged; old saves load | **PASS** | No `saveGame.ts` change in the diff; `visitHours` is the same `number[]`. The full e2e suite includes the save/restore specs and is green. |
| Existing vigil specs still hold; any changed spec named | **PASS, with the one named change** | `cycle-149-vigil.spec.ts` test 3 was rewritten, exactly as the codeplan pre-authorised. Tests 1 and 2 are untouched and green. |

**Bugs found:** none.

**A note the Validator should have.** The spring-forward test is real but narrow: it proves the skipped hour
is never *returned*, which is the whole claim the module makes, but the park has no behaviour that depends
on a missing hour, so what is pinned is the seam's answer rather than a park behaviour. That is the correct
scope for this item and it is worth saying out loud, because the next reader will otherwise assume the vigil
has been tested across a DST boundary. It has not; nothing in the park does anything special there, which
is the design's stated position.

**Recommendation: APPROVE.**

---

## Lore track — BACKLOG-116: missed-you memory

| Criterion | Status | Evidence |
|---|---|---|
| `missedGrade` pure; no dino name in `missed.ts` | **PASS** | `missed.test.ts` › "is pure — same inputs, same grade". Grep for all ten roster names over `missed.ts` → no hits. |
| All three grades occur among the founding Bowl at zero friendship, derived not named | **PASS** | `missed.test.ts` › "the Bowl's founding residents produce every grade at zero friendship" — builds the cast from `ROSTER.filter(r => !r.zone)` and asserts `new Set(grades).size === 3`. Shipping values: two aloof, one missed, two unmoved. |
| Hearts can move `aloof` → `missed` | **PASS** | `missed.test.ts` › "hearts alone can move a fixed personality from aloof to missed". In the shipping park the two aloof founders cross at **5** and **9** hearts. |
| `__catchUp(5min)` files for every graded dino; `__catchUp(4min)` files none | **PASS** | `cycle-150-missed.spec.ts` › "the threshold has two sides". |
| Marks visible for graded dinos, invisible for `unmoved` | **PASS, met differently from how it was written** — see below | `cycle-150-missed.spec.ts` › "you can see who noticed before you talk to anyone". |
| `missed` and `aloof` differ in opener and memory | **PASS** | Unit: "give each grade its own words". E2E: "every account is its own, and somebody formed none" asserts the two filed memories differ and that an unmoved dino filed nothing. |
| Greeting leads with the opener; the mark then clears | **PASS** | `cycle-150-missed.spec.ts` › "greeting it says the thought out loud, and the mark goes". |
| An unconsumed trace clears after `MISSED_MARK_STEPS` | **PASS** | `cycle-150-missed.spec.ts` › "a thought nobody comes over for goes unsaid" — 45 driven steps against a budget of 40. |
| A caught-mid-tic dino keeps the caught opener | **PASS** | `cycle-150-missed.spec.ts` › "a dino caught mid-ritual leads with the ritual, not with you". |
| Save shape unchanged; no trace survives a reload | **PASS** | `missedTrace` appears nowhere in the save path (grep against `currentSaveData`/`serialize`). Session-only by construction, the `pendingRepair` precedent. |
| Build / unit / e2e green | **PASS** | See header. |

### The criterion met differently from how it was written

The design said *"a **visible** sprite for each graded dino."* As written that is **false**, and the codeplan
predicted it: the missed-you mark sits at the bottom of the hour-mark precedence order, so a graded dino that
is *also* asleep, up-at-night, or keeping the vigil wears the higher mark and no thought. At the founding hour
the Bowl's owl is face-down and one resident is at the glass, so the frame-one park genuinely has graded
dinos wearing nothing.

What is asserted instead, and what the player actually experiences: **every visible missed-mark belongs to a
graded dino, and no ungraded dino wears one.** That is the claim in both directions with no false half, and
it is checked over names the spec reads back from the hooks. Recording the difference rather than quietly
narrowing the criterion, per the cycle-149 precedent.

### The reachability answer

*In a fresh save, watched for ten minutes, what does the player see that they could not see before?*

Open the park, play a minute (an autosave lands on the in-game hour boundary, which is one real minute at
`ACTIVE_SCALE`), close the tab, come back five minutes later. Previously: a digest paragraph and one dino
saying "welcome home". Now, on top of that, **two residents of the Bowl are standing there with a thought
over their heads and two are not** — and walking up to a marked one gets a different first sentence
depending on which of them it is. Sunny says it came back to you; Mossback denies having noticed. Twitch and
Glade never registered that you were gone, and the empty air over them is the difference.

That is inside the ten-minute window, on a save with an empty friendship book, and it needs no dev hook —
`MISSED_MIN_MINUTES = 5` against the nuzzle's 360 is the constant that makes it so, and it was set for
exactly this reason rather than inherited.

### Bugs found

None. One thing found and fixed during the fire rather than filed: the first draft of the greet spec asserted
the returned line *begins* with the mark. It does not — `pickTone` returns
`<source-prefix><name>: <opener> <reply>`, so the opener leads the dino's words and not the string. The
assertion was corrected to `` `${name}: 💭` ``, which is the claim that actually mattered.

### Declared gap

**`MISSED_ART_KEY` has no rig yet**, so the mark currently draws as the 💭 emoji through `makeHourMark`'s
fallback — correct and shipping, and BACKLOG-531 is queued to draw it tonight with this as its host. The
`alpha` assertions in the spec hold either way, since alpha is applied to the mark object whichever branch
built it.

**Recommendation: APPROVE.**
