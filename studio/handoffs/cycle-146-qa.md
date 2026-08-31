# Cycle 146 — QA

**Gates, re-run against the committed tree (not taken from the Coder's report):**

- `npm run build` — **clean**.
- `npx vitest run` — **2310 passed**, 3 skipped, across 224 files. Zero failures.
- `npx --yes kill-port 5173 && npx playwright test` — **633 passed, 2 failed**, twice, with the same two:
  - `mobile-minds.spec.ts` "long dialogs page GBA-style" — **the standing red**, filed under BACKLOG-515,
    fails at `--workers=1` on a stashed clean HEAD since cycle 135. Not this cycle's.
  - `cycle-038-scan.spec.ts` "the scan never blocks the talk path" — **proven flake.** Passed in the first
    full run of the night, failed in the second and third, and passes **5/5 isolated**. This is 515's
    second direction (pass serial, fail under load), the same signature the `controls-help` pair wore last
    cycle. Nothing in this cycle's diff is near the dossier or the tone menu.
- `@mlc-ai/web-llm` boundary — `grep` over `game/src` outside `game/src/ai/` returns **nothing**. Held.
- Save — `version` still **2**, and the exported key set is unchanged. Chronotype is derived from the
  name-seeded traits on every read and is written nowhere. Additive, as specced.

Everything below was read off a **fresh save on frame one**, at day 1 08:00, with no clock manipulation
and no hooks beyond reads — because that is the window the CHARTER v7 bar is measured in.

---

## Lore track — BACKLOG-109

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | `chronotypeOf` — Rex owl, Sunny day | **PASS** | `{"Rex":"owl","Sunny":"day", …}` |
| 2 | Exactly 4 owls (Rex, Pip, Thornback, Ember) / 6 day-dinos | **PASS** | live roster read, unit + e2e |
| 3 | At least one owl spawns in the Bowl | **PASS** | Rex; asserted over `ROSTER`, not a literal |
| 4 | `atRest(8, 'owl'/'day', 'spring')` true/false | **PASS** | unit |
| 5 | `atRest(23, 'day'/'owl', 'spring')` true/false | **PASS** | unit |
| 6 | `restWindow('day', s)` equals `SEASON_HUDDLE[s]`, all four seasons | **PASS** | unit, all four |
| 7 | `restWindow('owl', s)` is that shifted +8h mod 24, all four | **PASS** | unit, all four |
| 8 | Frame one, no clock move: Rex resting, a Bowl day-dino not | **PASS** | `hour: 8`, `resting: ["Rex","Pip","Thornback","Ember"]` — Sunny, Mossback, Twitch, Glade all up |
| 9 | At 23:00 something reads awake-at-night and something reads resting | **PASS** | e2e; the two sets are asserted disjoint |
| 10 | A resting unbonded dino does not change tile across a step | **PASS** | e2e, Rex's x/y identical across two `__stepWorld()` |
| 11 | Book shows "keeps late hours" / "up with the sun" | **PASS** | both present in `__bookText()` on frame one |
| 12 | Nothing new in the save | **PASS** | version 2, key set unchanged |
| 13 | Suite green under the gates; web-llm boundary held | **PASS** | above |

**The reachability question, answered from the readout rather than from the design:** open a fresh save and
Rex — the first dino in the roster, in the Bowl — is asleep at eight in the morning with a 💤 over it while
Mossback, Sunny, Twitch and Glade are up and moving. No walk, no wait, no lens, no model. Twelve real
minutes later the park inverts and Rex is the only thing moving under a 👁. **Met on frame one.**

---

## Structure track — BACKLOG-509

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | Bowl / Grove / Fernreach recipes carry `obsidian: 1` | **PASS** | unit |
| 2 | The Ridge carries no tithe beyond the beacon's own 3 | **PASS** | unit; `structureRecipe(RIDGE_ID).obsidian === 3` |
| 3 | The back-compat default ground is tithed | **PASS** | unit |
| 4 | `buildStructureFor` returns null for a recipe-covering, shard-less pile | **PASS** | unit |
| 5 | Same pile plus a shard builds, and spends it to 0 | **PASS** | unit |
| 6 | Carry/barter name obsidian as the shortfall | **PASS** | unit, `directedCarry` + `barterSwap` |
| 7 | `GRANARY_RECIPE.obsidian` unchanged at 1 | **PASS** | unit |
| 8 | A fresh save seeds no obsidian on any non-Ridge ground | **PASS** | `__pilesByZone()` on frame one: `bowl {}`, `grove {stone:2}`, `fernreach {}`, `hollow {}`, `saltpan {}`, `ridge {}` — **no obsidian anywhere, including the Ridge** |
| 9 | The lens names the shortfall; the Ridge does not read as owing it | **PASS** | see below |
| 10 | e2e, frame one: the zone map shows the Bowl waiting on the shard | **PASS** | e2e |
| 11 | The promotion is exact — short-only-the-shard routes to the Ridge, short of two kinds routes on appeal | **PASS** | unit both ways + the new `cycle-142-obsidian` case, both directions |
| 12 | Every reddened spec repaired by making its assumption explicit | **PASS** | nine repairs, reviewed one by one; none weakens an assertion |
| 13 | Suite green under the gates | **PASS** | above |

Criterion 9, verbatim off frame one:

```
bowl       short 🪵3 🪨2 🌑1◂The Sunward Ridge
grove      short 🪵6 🪨2 🌑1◂The Sunward Ridge
fernreach  short 🌾4 🌑1◂The Sunward Ridge
hollow     short 🪵3 🪨2 🌑1◂The Sunward Ridge
ridge      short 🌑3
```

**The reachability answer holds, and it holds in the half the design said it had to.** Every ground the
player can walk to says, on the opening frame, that its next landmark is waiting on black glass from a
place that is named — and the Ridge's row carries no source arrow, because the Ridge owes nobody.

---

## Findings

**One fixed in this fire.** The `short` row was also rendering on the **Saltpan**, a ground nobody has ever
settled. A ground with no backs on it has nothing building and no shortfall worth naming, and the row was
sitting directly under the unsettled badge whose whole job is to say why the ground is empty — the same
argument that took 477's governance glyphs off those two rows. Suppressed for unsettled and hollowed
grounds; build re-run clean. Not a criterion failure, but it is on the exact lens this track's reachability
answer rests on, so it was worth paying at QA rather than filing.

**One logged, not fixed.** The Ridge's row reads `short 🌑3`, which is true — an empty Ridge cannot afford
its own beacon — but the word "short" beside the kind everybody else owes it invites a misread. It carries
no `◂source`, and `shortOnlyTithe` is correctly false there, so nothing behaves wrong. A future cycle may
want a different word for a ground standing on its own supply. Not this one's.

**One worth the Validator's attention.** The Coder's `WORK_BUILD_FLOOR` finding is the most valuable thing
in the cycle and it deserves a line in the verdict: a literal `6` sitting under a comment claiming it was
"above the cairn recipe" went **silently false** the moment the tithe raised a cairn to 6, taking the
gather-first defer unreachable. Nothing failed. No test noticed until a spec that used the deferral did.
That is BACKLOG-519's class of defect — a claim written down twice — with real behavioural consequences,
and it was found by moving a constant, which is what CHARTER v7 asks the studio to do more of.
