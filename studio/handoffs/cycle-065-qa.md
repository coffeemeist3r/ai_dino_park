# Cycle 65 — QA

**Test run (latest code):** `npm run build` clean · `npm run test:unit` **629 passed** · `npx playwright test` **206 passed** (full run). cycle-065 specs re-run ×3 (`--repeat-each=3`) stable; the first cold parallel run hit the catalogued cold-boot flake (green warm). Dev server HTTP 200. New specs boot error-free (`expect(errors).toEqual([])`).

## Lore track — BACKLOG-295 Dino activity readout — 5/5 PASS

- [x] Pure `dinoActivity(flags)` returns the right state per flag and honors precedence (gazing > inspecting/responding > feeding > huddling > gathering > socializing > wandering; all-false → wandering). — `cycle-065-activity.test.ts`.
- [x] Each dino shows exactly one activity glyph, updated every step to match its actual behaviour. — e2e: after a daytime step every dino reads a valid activity and none reads `gazing`; after `__triggerSky` every dino reads `gazing`. The production `forceStep` feeds the same realized flags to both movement and `dinoActivity`, so glyph and behaviour can't diverge.
- [x] No collision/duplication with the existing 💤 / ❄ marks. — `refreshActivityMarks` suppresses the glyph while `isHuddling` (💤 owns that slot at `-TILE`); cold 🥶 stays at `-TILE*1.4`.
- [x] `__activity(name)` dev hook returns the current activity id. — used throughout the e2e.
- [x] web-llm boundary untouched. — `world/activity.ts` is a pure function of plain flags; no ai/ import.

## Structure track — BACKLOG-297 Legible gathering — 5/5 PASS

- [x] `RESOURCE_SPAWN_CHANCE` raised (0.05 → 0.12, pinned) and `rollResource` still one-at-a-time. — `cycle-065-gather-grace.test.ts`; `maybeSpawnResource` still guards `if (this.resource ...) return`.
- [x] Pure `resourceFetchable(age)` false below `RESOURCE_GRACE_STEPS`, true at/above. — unit, full age range.
- [x] A freshly-spawned resource is NOT picked up during the grace; a "ready" spawn still is. — e2e: a `fresh` drop on a dino is unbanked after one step (resource still present, stockpile empty); a default drop banks on the next step. The fetch-movement branch and `checkGather` are both gated.
- [x] A natural spawn emits a kind-named log note ("🪵 a branch fell into the bowl"). — `maybeSpawnResource` logs via the existing `logEvent`.
- [x] No save change; one-at-a-time holds; `world/resource.ts` Phaser-free. — grace/rate are pure constants + a pure predicate; no `SaveData` touch.

## Regression / notes
- Existing resource/craft/stockpile e2e (cycle-062/063/064) unaffected: `__spawnResource` defaults `fresh=false` → age starts at the grace, preserving the immediate single-step pickup those specs assume. Full suite green.
- Cross-track: both touched `WorldScene.ts` (`forceStep` among them) in disjoint lines — the structure gate is the `else if` fetch condition + the top age increment; the lore capture sets `activityById` per branch + the trailing refresh. No interference, green together.
- The initial cold parallel run of the four cycle-065 specs failed (3/4) on the documented cold-boot flake and was green warm + stable ×3 — noted, not a regression.

**Recommendation: APPROVE / APPROVE.**
