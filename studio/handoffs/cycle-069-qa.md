# Cycle 69 — QA

Ran the full bar from repo root. `npm run build` clean (tsc -b + vite). **689/689 unit**, **223/223 e2e**
in one fresh run, no flake.

## Lore track — BACKLOG-312 (5/5)

1. ✅ `scanLines` carries a `habit:` line with `fidget().glyph` + `.label` (unit).
2. ✅ The line equals the `fidget()` of the subject's traits — no second derivation (unit reads the same
   `fidget()`).
3. ✅ Determinism: existing `scanLines(rex)` twice-equal test still green (the new line is constant).
4. ✅ All prior dossier lines present; season-sensitive favorite still differs winter vs summer (existing
   scan unit suite untouched, all green).
5. ✅ e2e (`cycle-038-scan`): as LUMEN-3, B beside Rex shows a dossier whose `habit:` line contains
   `__fidget('Rex').label`.

## Structure track — BACKLOG-308 (6/6)

1. ✅ A bowl resource reports `zone:'bowl'`, sprite visible in the bowl, hidden in the grove, visible
   again on return (`cycle-069-zone-objects`).
2. ✅ The plot sprite is bowl-only (visible bowl, hidden grove).
3. ✅ Gather is zone-gated: a grove resource is untouched after a world step while the keeper is in the
   bowl, then picked up after a step in the grove — proving the `resource.zone` gate, not just `inView`.
4. ✅ The plot can't be planted/harvested from the grove (`handlePlot` bowl guard; covered by the
   bowl-only render assertion + the guard).
5. ✅ Cairn `zone` round-trips through save/load; a pre-308 cairn (no zone) still loads; a non-string zone
   is rejected (`saveGame` unit).
6. ✅ Spawn + all 219 prior e2e behaviour-identical: objects default to the bowl (the only boot zone), and
   the prior suite is green untouched.

No console errors in the boot-clean specs. No `SAVE_VERSION` bump (cairn `zone` additive). NPCBrain
boundary untouched by both tracks. Recommend APPROVE / APPROVE.
