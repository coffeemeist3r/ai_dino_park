# Cycle 37 — QA

**Item:** BACKLOG-155 [core] Selectable keeper — character-select spine + persisted choice + affinity-fit ability.

## Gates
- `npm run build` — clean (tsc -b + vite build).
- `npx vitest run` — **263 unit** passing (+9: 6 `keepers.test.ts`, 3 `saveGame.test.ts`).
- `npx --yes kill-port 5173` then `npx playwright test` — **87 e2e** passing.
- Boundary: `@mlc-ai/web-llm` imports remain only under `game/src/ai/` (grep clean). `keepers.ts` imports only the `Personality` type from `ai/`.
- Save: additive `keeperId?` only — `SAVE_VERSION` unchanged (1).

## Acceptance criteria — 12/12 PASS
- [x] `keeper/keepers.ts` exports a roster of exactly 3 observers, each with unique `id`, `name`, `era`, `backstory`, `ability {label,desc,appeal}`; pure (no Phaser). — `keepers.test.ts` "has exactly three observers…"
- [x] `keeperById(id)` returns the match, else the first observer for unknown/undefined (never throws). — unit "keeperById finds by id and falls back…"
- [x] `keeperBonus` ∈ `[0,2]` integer; strong fit → `>0`; missing traits → `0`. — unit "keeperBonus is always an integer in [0,2]…"
- [x] At least one observer yields `>0` for a fitting personality and `0` for a clashing one (per-dino observable). — unit "a strongly-fitting dino earns a bonus; a clashing one earns none".
- [x] Boot with no save → `__keeper()` is the default (AETHER-1 = `aether`). — e2e "boot is clean and the default observer…".
- [x] `K` / `__pickKeeper(id)` toggles `__keeperPickerOpen()` and changes `__keeper()`. — e2e "K opens the picker and a digit key chooses…".
- [x] After choosing a non-default observer and reloading, `__keeper()` is still the chosen id. — e2e "the chosen observer persists across a reload…".
- [x] `__exportSave()` includes `keeperId` equal to the current choice. — same e2e (asserts `exported.keeperId === 'lumen'`).
- [x] Greeting a fitting dino raises friendship by `greetGain + keeperBonus`; switching to a non-fitting observer yields only the base. — e2e "the observer you are changes how fast a dino warms to you" (asserts `boosted − base === bonus`).
- [x] An old save JSON with no `keeperId` deserializes (additive) and defaults to the first observer. — unit "loads an older save lacking keeperId…" + e2e default-on-fresh-boot.
- [x] build clean; vitest green (new `keepers.test.ts`); playwright green (new `cycle-037-keeper.spec.ts`). — see Gates.
- [x] web-llm only under `ai/`; no new dependency. — boundary grep clean; `package.json` untouched.

## Regression caught + fixed in-session
First full run failed `cycle-035-tones` "choosing a tone shifts affinity by a valid tone delta". Root
cause is **correct new behavior, stale assertion**: the keeper bonus (BACKLOG-155) applies to the
tone-pick path — which, since BACKLOG-142, *is* the real in-game greet — so the observed affinity
shift is now `tone delta + keeper bonus`, not the raw tone delta. The tones spec asserted the raw
delta against a fixed set. Fixed by reading the current observer's `__keeperBonus('Sunny')` and
asserting against `VALID_DELTAS.map(d => d + bonus)` — the test still pins the four tone outcomes,
now offset by the keeper's contribution. Re-ran tones + realtime isolated (6/6) and the full suite
(87/87). (This is the same class of cross-spec update as drawing a fallback-control species: a
legitimate behavior change updating a downstream spec, not a loosened assertion.)

## Notes
- Cold parallel-boot flake (documented): the 4-test `cycle-037-keeper.spec` and `cycle-028-realtime`'s
  T-toggle each failed once on a cold full run and passed clean isolated / on the green full re-run —
  the known cold-Vite parallel-load flake, not a regression. Hardened `cycle-037-keeper` test 2 to
  `expect.poll` so it no longer depends on a fixed wait.
- Boot stays clean: the first-time invite is a fading, non-interactive `add.text` (no `dialogOpen`,
  no input capture), so all ~20 specs that press keys at boot pass unchanged.

**Recommendation: APPROVE.** State → phase: validator-pending.
