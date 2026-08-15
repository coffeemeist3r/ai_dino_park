# Cycle 131 — QA

**Gates**

| gate | result |
|---|---|
| `npm run build` | clean (tsc + vite + PWA precache, 11 entries) |
| `npx vitest run` | **1753 / 1753** green, 182 files (1732 → 1753; +21 this cycle) |
| `npx --yes kill-port 5173` → `npx playwright test` | **504 / 504** green, 9.8m, **first full run, zero retries** |
| `@mlc-ai/web-llm` boundary | imported only in `game/src/ai/webllm.worker.ts` + `game/src/ai/webllmBrain.ts` |
| save format | untouched — `world/saveGame.ts` not in the diff; no new persisted field on either track |
| working tree | clean at commit |

**On the flake.** Cycle 130 closed on a warning: two consecutive full runs each lost a different spec, and
the conclusion was that at 499 specs the failure had become a property of the run rather than of any spec.
Tonight's run was **504 specs, first attempt, no failures, no retries**. That is not a refutation — a die
that comes up clean once has not stopped being a die — but it is the first data point since that finding and
it belongs beside it. BACKLOG-486 (seeded this cycle by the Structure-smith) is the item that would settle it.

---

## Lore track — BACKLOG-404 · 12 / 12 criteria pass

| # | criterion | result |
|---|---|---|
| 1 | `lastHatchOutcome` returns the **latest** matching memory | PASS — unit "takes the newest beat, not the first"; both orderings asserted |
| 2 | `lastHatchOutcome([])` null; fresh park byte-identical | PASS — unit; and `cannedReply({...})` vs `{...mealtime: undefined}` compared string-for-string |
| 3 | all four beats recognised off `manner.ts`'s own regexes | PASS — unit; 404 added **no** new copy of the four strings. Exact grep for the literals: `manner.ts` ×3 (read), `pecking.ts` ×3 (read), `WorldScene.ts` ×2 + `feeding.ts` ×1 (**write**) — unchanged from before this cycle. The two *reader* copies and the write sites still not behind builders are exactly BACKLOG-483, which stays open and is now a three-consumer problem |
| 4 | the 385 repay is **not** a contested outcome | PASS — unit, including the case where a repay sits *on top of* a real beat and must not mask it |
| 5 | 12 asides, non-empty, leading space, naming the other dino | PASS — unit asserts all four properties across the grid |
| 6 | all twelve distinct | PASS — `new Set(lines).size === 12` |
| 7 | no traits → the even-band line | PASS — unit, all four outcomes |
| 8 | composes with the hunger tell, still capped | PASS — unit (warm band, slunk + hungry, ≤ 460) |
| 9 | emitted only when `ctx.mealtime` is set; existing brain tests unchanged | PASS — `tests/unit/brain.test.ts` 26/26 green, not edited |
| 10 | WorldScene passes it live off the recall ring; nothing when quiet | PASS — e2e "a dino with a quiet ring says nothing about mealtimes" |
| 11 | the 403 mercy pair is not read as an outcome | PASS — `mercyMemory` / `sparedMemory` match none of the four patterns (they are prose about a *gift*); no unit or e2e produces a mealtime line from them |
| 12 | e2e: seeded gobble → the reply names the victim and reads smug; fresh park → silent | PASS — both specs, plus a third pinning newest-wins in the live game (stand then slink-off reads **sore**, not proud) |

**Played it.** Seed Rex a "you shouldered past Sunny and snatched the food first" and greet him: the wistful
opener (271, he is a 0-heart founder) runs on into *"…got to the drop before Sunny did, if you're counting."*
The composition is the point — it is the same dino's same greeting with one more thing on its mind. Greet him
again after five other memories have rolled through and he has stopped mentioning it, with no code anywhere
that decides when to stop.

**Watch item (not a defect).** The gate is the 6-slot ring, which is generous: a dino that contests a drop
and then does nothing memorable will still be talking about it a good while later. That is the designed
trade — the alternative is a timestamp, which is the mechanism 251 taught this park to avoid — but it is
worth a look once the ring ever grows.

---

## Structure track — BACKLOG-482 · 12 / 12 criteria pass

| # | criterion | result |
|---|---|---|
| 1 | pure, no Phaser, Node-testable | PASS — imports `ai/roles`, `world/pioneer`, `world/zones` only |
| 2 | `zoneStandings([], {})` → `[]` | PASS — unit |
| 3 | a standing per kind iff earned | PASS — unit (pioneer-only ground; council/provider gated on banking) |
| 4 | **agreement pin**: provider + council identical to `roles.ts` for the same input | PASS — unit loops every zone comparing `providerOf`/`councilOf` against `zoneProvider`/`zoneCouncil`, and asserts the answers are not vacuously empty |
| 5 | `standingsOf` finds standings across grounds | PASS — unit (pioneer of one ground, seated + providing on another) |
| 6 | council line byte-identical, `voice`/`voices` | PASS — unit; and e2e reads `👥 one of` out of the live book |
| 7 | provider standing renders no book line | PASS — unit (`standingLine` → null) |
| 8 | `providerFor` unchanged; 467 handover + 453 aside unchanged | PASS — e2e `__zoneProvider` returns the banked dino; `cycle-127-council`, `cycle-129-council-vote`, the handover and provider-word specs all green **unedited** |
| 9 | lens still shows `👥N`, nothing on a bare ground | PASS — e2e both directions |
| 10 | book shows seat + pioneer lines, same order | PASS — `bookLines` renders the folded list in the council's old slot; `cycle-119-pioneer` and `cycle-127-council` green |
| 11 | `__councils()` unchanged; `__standings()` added | PASS — e2e asserts the two agree name-for-name |
| 12 | no assertion changed its **expectation** | PASS — two edits total, both shape-only (`ui/lenses.test.ts`, `tests/unit/cycle-119-pioneer.test.ts` now build `standings: [...]` instead of `council:`/`pioneer:`); every expected string is the string it was |

**The strongest evidence is what didn't happen.** This item's whole claim is that it changes nothing, and
the suite it had to satisfy was 504 e2e specs and 1753 unit tests written by thirty other cycles against the
exact strings and decisions it rewired. It passed all of them on the first run with two field-name edits and
zero expectation edits.

**Note for the Validator.** The design declined to build the `since` field the BACKLOG text sketched, on the
grounds that a live-derived council can only ever answer "now". QA agrees and thinks it is the sharper call:
shipping a `since` here would have made **BACKLOG-484** *look* done while leaving the wobble it exists to fix
completely unaddressed. Worth carrying into the verdict.
