# Cycle 137 — QA

Verified against `studio/handoffs/cycle-137-design.md`. Two criteria were **restated by the Coder**
during the build (both recorded in the codeplan's "Shipped" section) and are judged against the
restatement, with the original noted.

## Gates

| Gate | Result |
|---|---|
| `npm run build` | **clean** |
| `npx vitest run` | **1924 / 1924** across 196 files |
| `npx --yes kill-port 5173` + `npx playwright test` | **561 passed, 1 failed** |
| `@mlc-ai/web-llm` boundary | **clean** — `grep -rn '@mlc-ai/web-llm' game/src --include=*.ts` outside `game/src/ai/` returns nothing |
| Save compatibility | **additive** — one optional field (`catchWarmth?`), no version bump, absent ⇒ `{}` |
| Tree | clean, every stage its own commit |

The single e2e red is `mobile-minds.spec.ts` → "long dialogs page GBA-style: E forward, ◀ back, ✕
closes from any page", failing at the `ArrowLeft` page-back step. That is **BACKLOG-430**, which the
cycle-135 verdict reproduced on a stashed clean HEAD; it is nowhere near either track's diff. Not a
regression, and deliberately not silenced.

## Lore track — BACKLOG-422

| # | Criterion | Result |
|---|---|---|
| 1 | `catchWarmth('bashful', …) === 0` — the unfond catch never warms | **PASS** — unit (driven through `caughtRegister(n, false)` for n=1,2,3,9) + e2e (`__catchWarmth` reads `{stretch: 0, life: 0}` after three catches on a 0-heart dino) |
| 2 | A full climb grants 2, then 3, then 4 | **PASS** — unit and e2e, both driven through `caughtRegister` rather than the register names, so the prices stay attached to 420's actual climb |
| 3 | The fourth catch in a stretch grants 0 and still prints its resigned opener | **PASS** — unit asserts both halves; e2e ledger reads `[2, 3, 4, 0]` |
| 4 | A dino at the lifetime ceiling grants 0 on a fresh stretch | **PASS** — unit; also pins `LIFETIME === PER_STRETCH * 4` so the two constants cannot drift apart silently |
| 5 | Partial room is clamped, not overshot | **PASS** — unit: `catchWarmth('teasing', 8, 0) === 1`, the tighter of the two ceilings wins, never negative |
| 6 | Points rise by the register's price; `resetTic` clears the stretch tally | **PASS** — e2e: the ledger moves 2/3/4, total points rise by ≥ 9, and after `__resetTic` the stretch tally is 0 while the lifetime tally holds at 2 |
| 7 | The lifetime tally round-trips a save | **PASS by construction, not by spec** — see *Gap* below |
| 8 | A whole-heart crossing logs one line; a sub-heart grant logs none | **RESTATED → PASS.** Ships as *one beat per solitary stretch, on the first catch that pays.* The Coder's reason is sound and is the better design: the greet path applies its own tone gain (142) in the same call, so whether *the warmth* crossed a heart depends on a quantity the beat has nothing to do with — the same three catches would announce or not announce for reasons invisible to the player. The e2e pins both directions (three paid catches → exactly 1 line; a fresh stretch → a 2nd) |

**Gap, recorded rather than papered over.** Criterion 7 (save round-trip) has no spec. The field is
written beside `foodBanked` and restored beside it with the same `?? {}` idiom, and the existing
save-shape spec covers the envelope — but nothing asserts *this* key survives a reload, so a future
refactor that drops the write would be caught by nothing. It is the smaller half of the criterion (the
ceiling arithmetic itself is unit-tested) and it does not block: the reachable behaviour is verified.
Filed as a note for the Validator rather than claimed as covered.

## Structure track — BACKLOG-492

| # | Criterion | Result |
|---|---|---|
| 1 | Unlived ⇒ shift 0 ⇒ the pre-492 answer | **PASS** — unit, over five real cast members, for both calls, and for `undefined` traits (which stay `undefined` so `providerPriority`'s own absent-trait default is reached rather than a synthesised neutral dino) |
| 2 | No experience moves a ballot past `LIVED_NUDGE_CAP` | **PASS** — unit, including out-of-range inputs (`hunger: 40`, `stake: -12`), which are clamped before weighting |
| 3 | A decided temperament never turns | **PASS** — unit (Bramble 0.870 feeds, Rex 0.019 banks under every extreme) and e2e (a warm seat holding most of the pile still feeds, through the production path) |
| 4 | A near-threshold seat turns both ways | **PASS** — unit (Pip banks at high stake, feeds when hungry) and e2e (the founding Grove) |
| 5 | `heldShort` alone leans a bank-leaning seat toward feeding | **PASS** — unit |
| 6 | The labour ballot is the mirror | **PASS** — unit: hunger → gather, stake → build, same cap; Rex (energy 0.541) turns and is pinned |
| 7 | A fresh boot seats a Grove council of one, and it is Pip | **PASS** — e2e reads `__councils().grove === ['Pip']`, and `spendTieBreak` is `null` (neither Grove dino reaches `PROVIDER_BANKS`), so the founding call is a genuine single ballot rather than a monarchy wearing a council's badge |
| 8 | The founding Grove reads `bank`, where the unshaded ballot reads `feed` | **PASS** — e2e; the unshaded answer is pinned in the unit spec (`votedSpend(PIP) === 'feed'`) so both halves of the claim are asserted somewhere |
| 9 | Driving the seat's hunger up turns the call and logs the line | **PASS** — e2e: `__setNeed('Pip','hunger',0.9)` flips `__spendPriority('grove')` to `feed`, and the next world step lands `the Grove's council calls it: feeds its own first` in the ticker |
| 10 | A council-less ground is untouched | **PASS** — e2e: after `emptyGrounds()` the Grove seats nobody again. Note this needed a **fix**, not just a spec: `__clearFounding` was dropping the bank ledger but leaving the *stored* policy those tallies had produced (463's lingering-policy rule), so the "pre-v7 park" it restored still carried a decision |
| 11 | Build / unit / e2e | **PASS** — see Gates |

**Deviation reviewed and endorsed:** `SeatExperience.share` → `stake`, measured against an even split.
QA agrees this is a correctness fix rather than a convenience. Under the absolute read, the ordinary
ground in this park — one dino has banked, nobody else has — handed that dino a share of `1.0` and
therefore the maximum available nudge, permanently, on every such ground. That is a constant, and this
item exists to replace a constant with a history. `cycle-121-work-priority` caught it by turning red on
a *provider* assertion, which is the suite doing exactly what it should. The unit spec now carries a
case named for it (`a seat pulling exactly its weight is not shaded by its stake`).

## Reachability audit (CHARTER v7)

Both tracks answered the question, and QA checked the answers rather than accepting them.

- **Structure — verified, and it is the strong one.** Before this cycle `__councils()` returned `[]` for
  every ground on a fresh save; the e2e now reads a seated Grove at boot, a shaded call at boot, and a
  *turn* driven by a need that builds at `HUNGER_RATE` per step (~45 steps, ~2¼ real minutes at
  `WANDER_STEP_MS`). A player who opens the zone map, walks around for two minutes and opens it again
  sees a different glyph and a ticker line explaining it. Seven cycles of governance became reachable
  tonight, which is a larger result than the item promised.
- **Lore — verified but conditional, and the condition is worth naming.** The warmth rides 413's
  `FOND_MIN` gate of **8 hearts**, so the ten-minute claim assumes a player who spends most of that ten
  minutes greeting one dino. That is reachable (the e2e drives the real greet path from a set bond) but
  it is not *incidental* — a player who wanders is unlikely to trip it. The register climb it prices has
  the same gate, so this is inherited rather than introduced, and it is not grounds for REWORK. It is
  the thing to watch if the milestone's remaining lore arcs keep stacking on the fond floor.

## Verdict recommendation

Both tracks **APPROVED**. One follow-up worth filing: a save round-trip spec for the `catchWarmth`
field (QA's own gap, above).
