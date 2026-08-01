# Cycle 118 — QA

**Build:** ✅ `npm --prefix game run build` clean (type-check passes, PWA precache generated).
**Unit tests:** ✅ `npm run test:unit` — **1423 passed / 1423** across 158 files (+19 this cycle).
**E2E tests:** ✅ `npx playwright test` — **409 passed / 409** (+10 this cycle), full parallel run, no
flaky, no retries. Port freed with `npx --yes kill-port 5173` first.

**Boundary check:** ✅ `grep -rn "@mlc-ai/web-llm" game/src --include=*.ts | grep -v "game/src/ai/"` is
empty — the `NPCBrain` boundary holds.
**Save check:** ✅ neither track adds, renames, or reorders a save field. `saveGame.test.ts` green
untouched; 471's counters are explicitly in-memory.

---

## Lore track — BACKLOG-471 (the grumble reaches the keeper)

### Acceptance criteria

| criterion | status | evidence |
|---|---|---|
| `heldShort` true **only** for `'bank'` with a pile a 0-reserve would have spent; false for `'feed'`, `null`, `undefined`, and false for an empty pile under any policy | **PASS** | `cycle-118-discontent.test.ts` — "is true only under bank, when the pile holds exactly the reserve of the favourite" + "is false for an empty pantry under every policy". The empty case is checked for `{}` *and* `{berries: 0}`. |
| A starving resident of a `bank` ground with a reserve-only pantry goes unfed (unchanged 463) **and** that ground's short count rises | **PASS** | e2e `cycle-118-discontent.spec.ts` — "a bank-first ground that leaves its own short grumbles to the keeper": `__discontent().shorts.bowl` reaches ≥ 2 while the dino is never fed. The unchanged-463 half is separately still green in `cycle-115-governance.spec.ts`. |
| On the second short, `__events` carries `/going hungry while the granary fills/` naming that ground | **PASS** | same spec — exactly one matching line, containing 😟. |
| Further shorts the same in-game day add no second line; a day later one does | **PASS** | "the grumble is a standing, not a tic": short count rises, `lastDay.bowl` unchanged, matching lines still 1; after `__setClock(day + 1)` the stamp advances. |
| A successful spend resets the count to 0 | **PASS** | "feeding one of its own clears the grievance": after banking above the reserve, `shorts.bowl === 0` and the ticker carries `stores fed Rex`. |
| A park with no provider never logs a discontent line | **PASS** | "a park with no provider never grumbles": `__spendPriority('bowl')` null, six starve+step drives, zero matching lines, zero console errors. |
| Build / unit / e2e green; no new save fields; boundary held | **PASS** | see header. |

**7/7 PASS.**

### Bugs found

None. Two observations worth recording, neither a defect:

1. **The e2e's `'bank'` ground rests on Rex's name-seeded temperament.** The spec *asserts*
   `__spendPriority('bowl') === 'bank'` in its setup rather than assuming it, so a future trait or roster
   change fails loudly on a named assertion instead of silently testing an inert path. This is the right
   shape and matches how `cycle-116-policy-voice.spec.ts` handles the same dependency (it branches on the
   emergent policy rather than hardcoding one).
2. **The drive loops (`for i < 12 && shorts < 2`)** are deliberately state-driven rather than
   fixed-iteration, which is exactly the seam BACKLOG-456 asks other specs to adopt. They read the ledger
   between steps instead of assuming an exact pile total, so ambient gathering can't turn them red.

### Recommendation: `APPROVE`

---

## Structure track — BACKLOG-465 (per-crop seasonal yield)

### Acceptance criteria

| criterion | status | evidence |
|---|---|---|
| `cropYield` is 2 / 0 / 1 for a crop's good / lean / other seasons; unknown id is 1 everywhere | **PASS** | `cycle-118-crop-season.test.ts` — "is thick in a crop the good season…" (asserted against the table across all three crops × four seasons) + "yields the base in every season for a food with no row". |
| `cropYield(food, 'spring') === 1` for every crop — the hinge | **PASS** | "leaves spring the hinge for every crop"; corroborated end-to-end by "a fresh boot is spring, and a spring harvest banks exactly one, silently". |
| Each of summer/fall/winter has exactly one crop at 2 and exactly one at 0 | **PASS** | "rotates: summer/fall/winter each have exactly one thriving crop and exactly one thin one" — a shape invariant, so a fourth crop can't silently break the rotation. Also pinned in-browser by "the table the sim runs on rotates the chain through the year", which reads `__cropYield` rather than a copy of the table. |
| A summer bowl harvest banks two and credits the hauler twice | **PASS** | e2e "summer banks the bowl double, and says so" (berries +2). Hauler credit is per banked unit by construction (the loop calls `creditHauler` inside the guard); `cycle-107-provider.spec.ts` still green on the single-credit spring path. |
| A fall bowl harvest banks zero, credits nobody, still clears the plot, still bumps the tally, still drops | **PASS** | e2e "fall banks the bowl nothing — but the crop is still harvested and still drops": berries unchanged, `__harvested()` +1, `__plot('bowl')` null, `you harvested the crop` on the ticker. |
| A good-season harvest never banks past the cap | **PASS** | e2e "a good season never banks past the cap": store driven to `__foodCap - 1` in summer, a double harvest lands exactly at cap. |
| A non-neutral harvest logs thick/thin; a spring harvest logs neither | **PASS** | the thick line in the summer spec, the lean line in the fall spec, and the explicit absence assertion in the spring spec. |
| The turn into summer/fall/winter logs the season's winner and loser; spring logs none | **PASS** | unit "names this season winner and loser, straight off the table" + "is silent in spring"; e2e "the season turn announces which ground the year now favours" drives a live day-7→8 crossing. |
| Build / unit / e2e green; no new save fields | **PASS** | see header. |

**9/9 PASS.**

### Bugs found

None. Two notes for the record:

1. **The codeplan's sharpest risk did not bite.** It flagged that a spec ripening a plot with
   `__setClock(planted + 2)` could cross a season boundary and land a harvest outside spring, moving an
   exact banked total. I re-read every harvest-driving spec (`cycle-095`, `-096`, `-098`, `-103`, `-107`,
   `-108`, `-115`, `-116-handover`, `-116-policy-voice`, `-117-policy-word`, `-117-spend-lens`,
   `cycle-066-plot`, `cycle-079-grove-plot`): each plants at day 1 and re-plants on the harvest day, so
   three consecutive harvests land on days 3, 5, 7 — the last one on the final day of spring, one day
   short of the summer boundary. The whole suite ran green, which is the empirical half of the same
   answer, but the margin is **one in-game day**. Flagged to the Validator as a durability note, not a
   defect: a future spec that harvests a fourth time on the same drive would cross into summer and start
   banking double.
2. `seasonCropLine` is generated by scanning `CROP_SEASON` rather than written per season, and the unit
   test asserts the sentence against the table rather than against a literal. The line cannot drift from
   the data it describes — the failure mode 468's verdict called out for glyph/`type` pairs.

### Recommendation: `APPROVE`
