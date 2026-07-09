# Cycle 96 — QA

**Build:** `npm run build` ✅ exit 0 (only the pre-existing Phaser chunk-size warning).
**Unit:** `npx vitest run` ✅ **1060/1060** (118 files).
**E2E:** `npx --yes kill-port 5173` then `npx playwright test` ✅ **316 passed, 1 known parallel-load flake** (`cycle-068-grove-populate` › save/reload — passes on isolated re-run + is untouched by this cycle's diff; the catalogued IndexedDB-under-parallel-load flake, not a regression). The new specs (4) + the one spec the memory-cut touched (`cycle-087-solitary-tic`) all pass isolated and alongside each other.

---

## Lore track — BACKLOG-410 Homesick sooner

> **Scope note carried from the Coder:** the planned `strangeZoneTicMemory` was **cut**. 410's gate fires for any fresh friendless-in-zone lone dino (which includes the plain-405 lone dino), so a distinct memory would have *replaced* the shipped "a little ritual of your own" memory (a 405 regression, caught by cycle-087), and it could never coexist with the 414 grief memory (grief keeps priority) — dead text. 410 ships as the **onset shortening only**, exactly the item's ask ("falls into its tic *faster*"). AC re-scored against that.

| # | Criterion | Result |
|---|---|---|
| 1 | `aloneInStrangeZone` truth table (only fresh AND friendless-in-zone reads strange) | ✅ unit |
| 2 | `TIC_AFTER_STEPS_HOMESICK < TIC_AFTER_STEPS`; `inventsTic` fires at the homesick threshold, not before | ✅ unit |
| 3 | ~~`strangeZoneTicMemory` distinct from plain/grief~~ | ⏸ **cut** (see scope note) — the ritual's memory (plain 405 / grief 414) is intentionally unchanged |
| 4 | e2e: a fresh friendless-in-zone dino invents its tic by step 12, before the plain 20 | ✅ e2e (`solo < 20`, invented at the homesick threshold) |
| 5 | e2e control: a *settled* dino is not strange and still needs the full stretch (gate shortens, never disables) | ✅ e2e |
| 6 | Two shorteners compose via `Math.min` (393 solitary day still wins if lower); no change to motion/anchor/glyph/bonds/save; 414 grief aim intact | ✅ (unit min-behavior; cycle-087 + cycle-094 grief-tic green) |

## Structure track — BACKLOG-428 Zone prosperity index

| # | Criterion | Result |
|---|---|---|
| 1 | `zoneProsperity` non-negative + monotonic; empty zone = 0; documented weights (structure>head>pile=harvest) | ✅ unit |
| 2 | `prosperityTier` partitions at both boundaries; `PROSPERITY_GLYPH`/`prosperityBadge` per tier | ✅ unit |
| 3 | `zoneMapModel` sets each entry's tier from the passed map; absent → 'quiet'; keeper/counts unchanged; 3-arg back-compat | ✅ unit |
| 4 | e2e: map lens carries a tier per zone; seeding a zone's pile climbs its tier quiet→growing→thriving; lens draws without error | ✅ e2e |
| 5 | e2e: harvesting a zone's plot bumps that zone's `harvested` signal; `harvestedByZone` round-trips through save (additive; old save → `{}`, malformed → null) | ✅ e2e (harvest term) + unit (save round-trip + defaults + rejects) |
| 6 | Build clean; full suite green; no WebLLM outside `game/src/ai/`; `harvested` global untouched; save additive | ✅ (grep: `@mlc-ai/web-llm` only under `ai/`) |

**Recommendation: APPROVE both tracks.** 410 ships its observable core (sooner onset), the speculative memory correctly cut before it regressed 405. 428 folds all four per-zone signals into a legible tier on the map lens — Milestone 2's closing structure arc.
