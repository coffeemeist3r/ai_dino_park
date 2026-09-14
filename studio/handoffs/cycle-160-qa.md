# Cycle 160 — QA

**Build:** ✅ clean (`npm --prefix game run build`, 9.1s, no TS errors)
**Unit tests:** ✅ **2768 passed** / 3 skipped, 261 files (`npx vitest run`, from the repo root)
**E2E tests:** ✅ **759 passed** / 0 failed (`npx playwright test`, full suite)
**Boundary:** ✅ `@mlc-ai/web-llm` grep over `game/src` returns hits only under `game/src/ai/`.

**One flake, named and disposed of.** The first full e2e run of this fire came back
`1 failed — cycle-042-art-pixel-sunny.spec.ts:23`, the signature the routine file describes: not an
assertion about this cycle's code, green on an isolated re-run (2/2 in 2.9s), and green on a fresh full
run immediately after (759/759). This is the BACKLOG-538 family, not a regression — 042 asserts that
five dino sprites have baked, and both tracks tonight are a book line and a button press. Logged rather
than swallowed, because the four-day CI blindness of cycles 156–159 started with a red board nobody
named.

---

## Lore track — BACKLOG-069

| Criterion | Status | Evidence |
|---|---|---|
| `menuLine` is pure, Node-testable, no Phaser | **PASS** | `game/src/world/menu.ts` imports only `./foods`; `menu.test.ts` (11 cases) runs in the Node environment |
| Fresh save: one `🍽 menu:` per dino, seven `·`, `(favorite unknown)` | **PASS** | e2e `a fresh save opens with every menu blank` — asserts the line count equals the roster and the blank count equals `FOODS.length` |
| Feeding one dino fills its slot, others unchanged | **PASS** | e2e `feeding one dino fills in one slot — for that dino only`; `__tasted('Rex')` is `['greens']`, the other block still reads `FOODS.length` blanks |
| `loves <emoji> <label>` appears only after eating the favorite | **PASS** | e2e `the favorite is named only once that dino has eaten it` — a wrong dinner leaves `(favorite unknown)` standing, the right one replaces it |
| Survives a save/reload round-trip | **PASS** | e2e `the menu survives a reload`; unit `the menu record, round-tripped > survives a reload` |
| A pre-160 save (no `tasted`) loads and shows the fresh-save line | **PASS** | unit `a save that predates it still loads, with nothing discovered` — `deserialize` returns non-null, `tasted` undefined, scene reads `?? {}` |
| LUMEN-3's scan records the favorite; `scanLines` output unchanged | **PASS** | e2e `what LUMEN-3 reads, the book keeps`; `keeper/scan.ts` has **zero** diff this cycle, and the whole `cycle-038-scan.spec.ts` file still passes |
| A refusal records nothing | **PASS** | e2e `a refusal records nothing` — `__refused` fires, `__tasted` is `[]` |
| `feedFromStores` recording covered by a unit test on the recorder | **PASS** | `menu.test.ts` covers `noteTaste` (record, idempotence, per-dino isolation, accumulation); the scene site is one call to it |
| Full suites green, build clean | **PASS** | above |

**Bugs found:** none.

**Two observations worth carrying, neither a defect.**

1. **The trait setters move the favorite.** The Coder's own note, and QA confirms it is a live hazard
   rather than a one-off: `greens.appeal` is `{ agreeableness: 1 }`, so `__setTrait(name,
   'agreeableness', 1)` — the standard way every feeding spec in this repo makes a dino agreeable — can
   *change which food is that dino's favorite*. Any future spec that stages a palate and then asserts
   about the favorite has to read the favorite **after** it finishes perturbing traits, or not perturb
   them. Four specs in `tests/e2e` set that axis today; none of them assert about favorites, so nothing
   is currently wrong.
2. **The menu line is honest about being empty, which is the point and is also the reachability
   answer.** Worth stating plainly for the Validator: a fresh save's book shows the blank menu on frame
   one, so the sub-goal announces itself before the player has done anything. The line is not hidden
   until it has content.

**Recommendation: APPROVE.**

---

## Structure track — BACKLOG-547

| Criterion | Status | Evidence |
|---|---|---|
| `LONG_PRESS_MS` + pure `isLongPress` in `input/touch.ts`, unit-tested, no Phaser | **PASS** | `game/src/input/touch.test.ts` — boundary above/below/at, custom threshold, and the band assertion |
| Hold past 400ms steps the loaded feed and drops nothing | **PASS** | e2e `a hold on the feed button steps the loaded feed and drops nothing` — real mouse down/up on the button's canvas coordinates |
| Tap under 400ms drops and leaves the selector alone | **PASS** | e2e `a tap on the feed button still drops, and changes nothing about the selector` |
| A 1200ms hold steps exactly once | **PASS** | e2e `a hold steps exactly once, however long it is held` — `LONG_PRESS_MS * 3` of extra hold, same slot after |
| The gift HUD's second line reflects the new feed | **PASS** | e2e `the HUD under the thumb says what is loaded now` — asserts `__giftHudText()` contains `feedLine(label)`, built from the production `feedChoices()` |
| Other buttons + sheet rows still fire on pointerdown | **PASS** | e2e `the other buttons still resolve on pointerdown`; the whole of `touch-controls.spec.ts` (6 tests) passes with **no edits** |
| A press ending outside the button does not drop | **PASS** | e2e `sliding the thumb off the button before letting go drops nothing` — **this one failed first and the code changed**, see below |
| Desktop (`H`, `,`, `.`) unchanged | **PASS** | no diff to the keyboard bindings; `cycle-158-*` feed specs pass untouched |
| Full suites green, build clean | **PASS** | above |

**Bugs found: one, caught by the acceptance set and fixed.**

The first implementation released on *any* pointerup, wherever it landed — so a thumb that pressed the
feed button, slid across the glass and let go still dropped food. The design's criterion named this
(`a press that ends outside the button does not drop`) and the criterion did its job. `endFeedPress` now
takes the release position and only drops when the release is still inside the button's circle, via the
same `actionButtons` / `inCircle` geometry `dispatchTouchTap` uses. A release with no position (the dev
hook path) is still treated as on-target. **This is the right default for the one verb here you cannot
take back:** sliding off a button is how every touch UI says *never mind*.

**One thing I checked specifically, because the design flagged it as the risk.** The single-dispatch
rule holds: `git diff` shows no new `pointerdown`/`pointerup` handler on any game object, no new
scene-level listener, and the feed press rides the `release` closure `enableTouch` already registers
for the stick. `dispatchTouchTap` is still the only resolver.

**Recommendation: APPROVE.**

---

## Score

**20 / 20 criteria pass**, both tracks. One flake named (`cycle-042`, re-run green isolated and in a
fresh full run), one real bug found by the acceptance set and fixed inside the fire.
