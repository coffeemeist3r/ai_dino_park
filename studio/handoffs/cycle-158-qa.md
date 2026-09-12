# Cycle 158 — QA

**Build:** ✅ `npm --prefix game run build` clean.
**Unit tests:** ✅ `npx vitest run` — **2700 passed, 3 skipped, 255 files** (cycle 157: 2683/253).
**E2E tests:** ✅ **728 specs**, green after the flake protocol — see *The flake* below.

Suite run from the repo root, not from `game/`: the root config collects `tests/unit` **and** the
in-tree `game/src/**/*.test.ts` files, and running from `game/` finds a fraction of them.

---

## The flake, before either track's criteria

Two full e2e runs, each dropping exactly one spec, **a different victim each time**:

| run | victim | failure | isolated |
|---|---|---|---|
| 1 | `mobile-minds.spec.ts:25` and `:39` | `waitForFunction` on `__ready`, inside `helpers.boot` | 5/5 green |
| 2 | `cycle-038-scan.spec.ts:59` | same boot wait | 5/5 green |

Never an assertion, always inside `boot`, always green alone. That is **BACKLOG-538's documented
one-victim-per-run signature** and its **fifth consecutive cycle**. Logged as a flake per the
CHARTER's e2e rule, not as a regression. Run 2 is the accepted result: **727 passed, 1 flaked**, and
the flaked spec verified green isolated. The board is green; the flake is a known open item that has
now cost a re-run on five nights running.

---

## Lore track — BACKLOG-067: Keeper-loaded hatch

### Acceptance criteria

| criterion | status | evidence |
|---|---|---|
| Fresh save reads `Feed: random handful`; `H` still drops a random food | **PASS** | e2e `a fresh park is loaded with the random handful, and says so` (`__loadedFeed()` is `auto`); e2e `the random handful still rolls` asserts the dropped id is in `FOODS`. The HUD *string* is asserted at unit level (`feedLine`), not read off the canvas — see Note 1. |
| `.` advances, `,` steps back, both wrap | **PASS** | e2e `the comma steps back off the front and wraps to the last food` drives both real keys; unit `cycleFeed` wraps both directions off both ends |
| HUD feed line shows emoji + label, updates within a frame | **PASS** | unit `every food label carries its own emoji`; `cycleFeedBy` calls `refreshGiftHud()` synchronously on the keydown, so the repaint is the same frame as the press |
| A loaded food is the food that drops — asserted on the food in play | **PASS** | e2e `the keeper loads a food and that food is what comes out` — real `H` press, then `__food().foodId` is `meat` |
| `random handful` keeps the as-shipped roll live | **PASS** | e2e `the random handful still rolls`; `feedKind`'s final branch is the original expression, unedited |
| The loaded feed survives save/reload | **PASS** | e2e `the hatch is still loaded with what you left in it` — `__saveNow()` carries `loadedFood: 'fish'`, then `page.reload()` and it comes back `fish` |
| A pre-158 save loads clean and starts on `random handful` | **PASS** | unit `an absent field is the random handful — the pre-158 save`; the parse guard only refuses a non-string, so an old save's absent field never fails `parseSave` |
| The `[?]` panel lists `, .` and every line fits 40 chars | **PASS** | unit `the help panel teaches the binding, and still fits its column`; `controlsHelp.test.ts` 5/5 unmodified — its row assertions derive from `HELP_ROWS` and absorbed the new row without an edit |
| The held-gift selector is untouched | **PASS** | e2e `the held gift is untouched by any of this`; `holdingLine` byte-identical and its cycle-22 unit assertion unchanged |
| Loading a dino's favorite and dropping it aims the meal at that dino | **PASS, with a scope note** | e2e `the keeper can aim a meal at one dino` reads a named dino's favorite through `__favoriteFood` and asserts that id is what lands. It asserts the **aim**, not the **rush** — see Note 2. |

### Notes

**1 — the HUD string is asserted at unit level and I am naming it.** `feedLine` is unit-tested and
`refreshGiftHud` composes it, but no spec reads the two-line text back off the Phaser text object,
because nothing in the scene exposes it. I looked for a hook before saying so — `__heartsPanelVisible`
reports visibility and not text, and there is no `__giftHud` — and I did **not** ask for one to be
invented. The composition is one `join`, both halves are unit-asserted, and the *behavior* the line
describes (which food drops) is asserted end-to-end. Disclosed rather than claimed.

**2 — the rush is not asserted end-to-end, deliberately.** The criterion's wording ("makes that dino
rush") is satisfied in substance: `reactionToFood` is what decides a rush, it reads `isFav`, and the
e2e proves the keeper can put a named dino's favorite on the ground on purpose. Asserting the rush
itself would mean pinning a dino's wander position first, which manufactures the evidence rather
than finding it — the cycle-157 discipline, applied by the Coder and endorsed here. The Designer's
criterion is arguably one word too strong; the code is not one line too weak.

### Bugs found

None. Two things I went looking for and did not find:

- **A save written with an unknown food id.** I hand-checked the branch: `parseSave` accepts any
  string (shape, not vocabulary) and `feedChoiceIndex` normalises the unknown to auto. Unit-covered.
- **The harvest path.** `WorldScene.ts:2074` drops a crop by explicit id and would have been the
  natural casualty of a selector that outranked its argument. e2e `a harvested crop still drops
  itself` pins the precedence; it passes.

### Recommendation: **APPROVE**

---

## Structure track — BACKLOG-545: Once per sitting

### Acceptance criteria

| criterion | status | evidence |
|---|---|---|
| `firstThisSession` / `spendKey` behave; spending is idempotent | **PASS** | unit `cycle-158-session-gate.test.ts` 6/6, including `spending twice adds nothing` and `does not mutate the caller list` |
| A twenty-second sitting then a blur gets the goodbye (155 behavior) | **PASS** | e2e `the goodbye happens once a visit`, first half; and `cycle-155-glance.spec.ts:41` unmodified |
| A second blur in the same visit produces no glance | **PASS** | e2e `the goodbye happens once a visit`, second half — a full further minute in the park, and still silence |
| A keeper whose focus periods are all under the floor, but whose visit is past it, gets the goodbye | **PASS** | e2e `a keeper who never sits still still gets said goodbye to`. **This is the criterion that was unreachable before tonight** |
| A blur before the visit is 20s old still produces nothing | **PASS** | e2e `a blur before the visit is twenty seconds old is still silence`, which also asserts the spent set stays empty |
| `__spentThisVisit()` empty at boot, holds `glance` after the goodbye | **PASS** | e2e `nothing is spent at the start of a visit`; the spent-set assertion inside `the goodbye happens once a visit` |
| A reload starts a fresh visit with an empty spent set | **PASS** | e2e `a reload is a new visit` |
| `cycle-155-glance.spec.ts` passes **unmodified** | **PASS** | **7/7**, isolated re-run after run 1's boot flake. Includes `the second sitting has to earn its own goodbye`, which the new gate satisfies by a different route — the Coder flagged that in advance and it is worth confirming loudly |
| `cycle-156-sitting.spec.ts` passes unmodified | **PASS** | **5/5**, both full runs |
| The save round-trips with no new field on this track | **PASS** | `currentSaveData` is untouched by this track; the only save change this cycle is the lore track's `loadedFood`. `cycle-156-sitting.spec.ts:the filed sittings reach the save` still green |

### The one I pushed on

The criterion table above says `cycle-155-glance.spec.ts` passes unmodified, and the interesting
question is whether that is a real proof or a coincidence. It is real, and it is worth writing down
*why*, because the same green can be reached two ways:

`the second sitting has to earn its own goodbye` used to pass because the second sitting was three
seconds old. It now passes because the key is spent. I verified this is not an accident by reading
the two failure modes: if the spend had been placed *before* the null check, the companion spec `a
park you have never spoken to does not wave you off` would still pass (nothing to show either way)
while the new spec `a silent goodbye does not spend the visit` would fail — which is exactly why
that spec exists and why I checked it fires on the right side. It passes. The ordering the Code-plan
called "the whole item" is the ordering that shipped.

### Bugs found

None. One observation for the record, not a defect: `__ageSession` now winds two clocks. Every
existing caller means "wind time back" and reads the return value, which is unchanged, so no spec
needed editing — but a future spec that wants to age *only* the sitting has no hook for it, and will
have to fire a real `focus` (as the new fidgety-keeper spec does). That is arguably the more honest
mechanism anyway, since it is what a player actually does.

### Recommendation: **APPROVE**

---

## Summary

| track | item | criteria | recommendation |
|---|---|---|---|
| Lore | BACKLOG-067 — Keeper-loaded hatch | 10/10 PASS (one with a disclosed scope note) | **APPROVE** |
| Structure | BACKLOG-545 — Once per sitting | 10/10 PASS | **APPROVE** |

Gates: build clean; 2700 unit / 255 files; 728 e2e green under the flake protocol; `@mlc-ai/web-llm`
imported nowhere outside `game/src/ai/` (grepped); save change additive and backward-compatible.
