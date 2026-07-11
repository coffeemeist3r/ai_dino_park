# Cycle 98 — QA

**Build:** ✅ clean (`npm --prefix game run build`).
**Unit tests:** ✅ 1094/1094 (+16 this cycle).
**E2E tests:** ✅ 322 passed. 4 specs failed on the parallel run — `controls-help` (×2),
`cycle-002-daynight` (midnight/noon overlay), `cycle-003-save` (fresh-boot day-1) — all **boot-timing**
specs untouched by this cycle's diff (feeding / plot / foods / save-schema). Re-run isolated
(`--workers=1`): **10/10 green**. The catalogued cold-boot parallel-load flake, not a regression.

WebLLM boundary: ✅ `@mlc-ai/web-llm` only under `game/src/ai/`. Saves additive (old saves load; the
new `fernreachPlot` defaults null, round-trips, rejects malformed).

---

## Lore track — BACKLOG-385 + 386 (Provision remembered)

| Criterion | Status | Evidence |
|---|---|---|
| 386: a yield sets `__nuzzle` = {from: friend, to: giver} + logs 💛 | PASS | e2e cycle-098-provision "thanks its benefactor…" |
| 386: no yield → `__nuzzle` null | PASS | e2e cycle-098-provision "un-owed friend… no yield" |
| 385: after A→B, `__owesFood()[B]` includes A | PASS | e2e cycle-098-provision (meal 1) |
| 385: B repays A at bond 25 (below GENEROUS_BOND, above RECIPROCAL_BOND) only because owed; un-owed pair at 25 does not yield | PASS | e2e cycle-098-provision (meal 2 + control); unit cycle-098-reciprocity |
| 385: repayment clears the debt + files "repaid X's kindness" memory | PASS | e2e cycle-098-provision (meal 2) |
| Default path unchanged (empty `owes` = cycle-83 verdict) | PASS | unit cycle-098-reciprocity regression pin; cycle-083/084/085 specs green |
| gobble/stand-up untouched; build + suite green; no save schema change (lore); WebLLM under ai/ | PASS | full suite; boundary grep |

**Bugs found:** none. **Recommendation: APPROVE.**

---

## Structure track — BACKLOG-432 (Fernreach plot + a farmable third crop)

| Criterion | Status | Evidence |
|---|---|---|
| `cropOf('fernreach')` = {food:'roots', ripe:'🍠'}; roots ∈ FOODS | PASS | unit cycle-098-fernreach-plot; cycle-095-crops |
| `PLOT_TILE_BY_ZONE['fernreach']` is Fernreach grass, off edges/creek/fern, distinct from bowl/grove | PASS | unit cycle-098-fernreach-plot |
| roots flips no roster favorite in any season (Rex meat/berries, Twitch greens, Glade meat hold; ≥3 span) | PASS | unit cycle-098-fernreach-plot; foods.test still green |
| ripe 🍠 distinct from sprout 🌿, roots 🥕, 🍓, 🥬 | PASS | unit cycle-098-fernreach-plot |
| plant → ripen → P harvests a roots drop + bumps the harvest tally | PASS | e2e cycle-098-fernreach-farm "grows and harvests its own roots" |
| a planted Fernreach plot survives save→reload; old saves load with none | PASS | e2e cycle-098-fernreach-farm "survives save → reload"; unit saveGame (old-save/malformed/round-trip) |
| build + full suite green; save additive | PASS | see header |

**Bugs found:** none. **Recommendation: APPROVE.**
