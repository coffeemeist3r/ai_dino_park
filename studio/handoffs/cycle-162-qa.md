# Cycle 162 — QA

**Gate:** `npm run build` clean · `npx vitest run` **2822 passed, 3 skipped** (267 files) ·
`npx --yes kill-port 5173` then `npx playwright test` **771 passed, 0 failed**, one full run, **no flake,
no isolated re-run**. Boundary grep clean (`@mlc-ai/web-llm` under `game/src/ai/` only). Tree clean.

Deltas: unit **+16** (2806 → 2822), e2e **+8** (763 → 771).

Three criteria were **amended in flight**; each is judged against its amended text and the amendment is
argued below, not buried. Nothing was marked PASS against a criterion it did not meet.

---

## Lore track — BACKLOG-126

| # | criterion | verdict | evidence |
|---|---|---|---|
| 1 | lowest-friendship eligible watcher; tie → nearest → name | **PASS** | `envy.test.ts` "picks the lowest-friendship eligible watcher, not the nearest" + "breaks a points tie by distance, then by name" |
| 2 | above the ceiling is never chosen | **PASS** | `envy.test.ts` — `ENVY_POINTS_CEILING + 1` null, `ENVY_POINTS_CEILING` chosen; boundary pinned both sides |
| 3 | `>= eater` is never chosen | **PASS** | `envy.test.ts` "never picks a watcher the keeper does not like less than the eater" — ahead, level and behind, three cases |
| 4 | out of range is never chosen | **PASS** | `envy.test.ts` — `ENVY_WATCH_TILES + 0.1` null, `ENVY_WATCH_TILES` chosen |
| 5 | no eligible watcher → null, tail does nothing | **PASS** | `envy.test.ts` empty case, plus "an unfed park envies nobody" (whole roster on zero) |
| 6 | favorite fires it; a **warmed** food fires it too | **PASS** | e2e 1 (favorite) and e2e "a warmed food is a good dinner too" — meals 1 and 2 file nothing, meal 3 crosses `WARM_AT` and files |
| 7 | an ordinary meal fires nothing | **PASS** | same spec: `__envy` is `{}` and the ticker holds zero `🥺` lines after two ordinary meals |
| 8 | the witness files `the keeper likes <eater> more` | **PASS**, criterion amended | e2e 1 reads `__memory`. **Amendment:** the design said "readable in the book"; the book prints quirks, dreams, plans and the menu, not raw memories. The memory store is what the murmur (`pickMurmurMemory`) and the dialogue read, so that is the honest reader. The feature did not move; the criterion named the wrong one. |
| 9 | next greet floats the wistful line and clears; the second is ordinary | **PASS** | e2e 1. "Said once" is asserted as a **count of one** after two greets, because `__bubbleTexts` is the live list and an absence check would pass while the first bubble is still on screen |
| 10 | the tone door (142) takes the same line | **PASS** | e2e 1 drives `__pickTone`, which is the door `E` actually opens; e2e "the plain greet door says it too" drives `__greet`. Both doors proven, not assumed |
| 11 | the greet's gain is unchanged | **PASS** | e2e "envy colours what a dino says and does not charge the keeper for a hello" — same dino, two greets, `wistfulGain === plainGain` off `__friendshipPoints` |
| 12 | repair / warm / loner still win | **PASS**, criterion amended | **Amendment: the loner no longer wins, deliberately.** Under the design's order the e2e found envy could never be said on a fresh save — every founding dino is friendless, so `lonely` is true on every hello and the perk-up ate the line every time. Repair (125) and warm (184) still win: both are one-shot beats caused by *this* greet. The loner perk-up is not — it fires on every hello to a friendless dino and will fire again next time, while envy fires once ever. This is CHARTER v7's corollary applied to a precedence table, and the bug it caught is exactly the dormancy the bar exists to stop. |
| 13 | a slight older than the window is gone | **PASS** | `envy.test.ts` boundary (`n-1` false, `n` true) **and** e2e "a slight nobody came back for goes unsaid", which steps 101 real ambient ticks through `__stepWorld` rather than editing the record — the expiry is proven where it runs |
| 14 | `envy` round-trips; an old save loads clean | **PASS** | `cycle-162-envy-save.test.ts` — round-trip, pre-162 save (`envy` undefined), an unknown dino kept, and five corrupt shapes rejected |
| 15 | **reachability** — the first favorite meal of a fresh park | **PASS** | e2e 1 runs on `foundingState(page, 'as-shipped')` with nothing set up but where two dinos stand. No refill, no day boundary, no population floor, no founding constant moved |

**Ten-minute question, answered:** *drop the satchel's food next to two dinos. One eats it; the other
pulls a 🥺, the ticker says it watched, and the next time you walk over to say hello it does not say the
ordinary thing — it says* "Oh — hello. ...you gave Rex the good one." *Five minutes later, if you never
came back, it has let it go.* None of that was reachable at any point before tonight.

---

## Structure track — BACKLOG-551

| # | criterion | verdict | evidence |
|---|---|---|---|
| 16 | undrawn, it is byte-for-byte the 371 mark | **PASS** | e2e "the need tell is still the 371 mark" (shown by `pressingNeed`, hidden without one) + the second spec's undrawn branch asserting `{ kind: 'text', text: NEED_GLYPH[...] }`. The visibility gate, the `y - TILE * 1.7` offset and `pressingNeed` are untouched in the diff |
| 17 | with a rig, the mark is an `Image` with that need's texture | **PASS (conditional, and it is the right kind)** | the spec's drawn branch. It is written to pass in **either** state, so it is live the instant the Artist lands 550 and cannot rot in between. The rigs did not exist when this ran |
| 18 | switching need switches the texture | **PASS (same branch)** | drawn branch asserts the two textures **differ** — the `missed` / `missed_aloof` swap |
| 19 | one rig drawn, one missing | **PASS**, criterion amended | **Amendment: not implementable as written.** One sprite, two keys, and no base rig to fall back on — an `Image` asked for the undrawn need would keep wearing the *other* need's picture, worse than the glyph it replaced. The shipped rule is **both keys or neither**. Amended criterion: *with one rig drawn, both needs still read their glyph and nothing crashes* — which the undrawn branch covers, since one-drawn and none-drawn take the same path by construction. 550 is "the need marks", plural, so this costs the Artist nothing |
| 20 | both keys in `worldPlacedProps()`, the 145 walk green | **PASS** | `cycle-162-envy-save.test.ts` asserts both, reading `NEED_ART_KEY` rather than literals so a rename cannot pass it. `cycle-145-reachability.test.ts` green in the full run |
| 21 | `__marks` still reports the `need` family | **PASS** | e2e 1 of the pair asserts `need` present and absent by pressing need |
| 22 | no founding constant edited | **PASS** | diff touches `WorldScene.ts`, `needs.ts`, `reachability.ts`, `saveGame.ts` and five new test files. `founding.ts`, `roster.ts` and the founding fixtures are untouched, so 533's entry condition does not trip and it stays due at cycle 165 |

### The reachability flag the Validator must rule on

The design wrote this track's reachability answer down in advance and made it conditional: **the host
alone changes nothing a player sees.** With no rig drawn the mark is the same `Text` showing the same
glyph — which is the design's own words for a REWORK, *unless the rig ships in the same cycle*.

It has not shipped yet. The Artist (routine 7) fires after the Validator in this session's order, so at
the moment this QA is written the structure track's reachability answer **does not exist**. QA does not
have the standing to approve or reject that; it flags it. The design's instruction to the Validator is
explicit: *if the Artist cannot draw it, this track is not APPROVED on the grounds that the host is nice
— it takes the REWORK.*

Everything else on this track passes.

---

## Notes for the Validator

- Both amendments were found **by the tests**, not by reading, and one of them (criterion 12) was a live
  CHARTER v7 defect that would have shipped a beat no fresh save could ever reach. That is the second
  consecutive cycle in which the reachability bar caught something at implementation time rather than at
  verdict time.
- One pre-existing cosmetic duplicate noticed in passing and **not touched** (out of scope):
  `WorldScene.ts` bakes `missedAloofTex` twice on consecutive lines (~3774/3775). Harmless — `??=` makes
  the second a no-op — but it is a real line of dead code and somebody should file it.
