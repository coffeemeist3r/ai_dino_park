# Cycle 107 — QA

**Build:** ✅ `npm --prefix game run build` clean (`tsc -b` + vite, no type errors).
**Unit tests:** ✅ `npx vitest run` — **1238/1238** across 136 files (+21 tests, +2 files over cycle 106's 1217).
**E2E tests:** ✅ `npx playwright test` — **364 specs**, best full run 363 pass / 1 flake. Every failure seen
across three full runs passed on an isolated re-run; details under *Flakes* below.
**Boundary:** ✅ `@mlc-ai/web-llm` appears under `game/src/ai/` only (grep clean). Save changes additive only
(three new optional fields; an old save loads with `{}`/`undefined` defaults — pinned by unit tests).

---

## Lore track — BACKLOG-452 (Homecoming from the road)

| criterion | status | evidence |
|---|---|---|
| Settled dino returning to zone A shows 🏡 + ticker naming A | PASS | e2e `cycle-107-homecoming.spec.ts` — asserts `🏡 Rex came home to Pocket Cretaceous` in `__events()` |
| Returner keeps a memory naming A / "back where you belong" | PASS | same spec, `__memory().Rex`; unit `cycle-107-homecoming.test.ts` pins the string |
| Returner reads **settled** immediately after the homecoming crossing | PASS | same spec: `__settled('Rex')` false after the outbound crossing, true after the return |
| A resident flashes 👋, keeps a "welcomed <name> back" memory, bond rises | PASS | same spec: parses the greeter out of the 👋 ticker line, asserts its memory + `__bonds()[key]` strictly above the pre-crossing value |
| A crossing to a non-root zone fires nothing and resets tenure as before | PASS | same spec (the outbound leg): no `came home` line, `__settled` false; unit `isHomecoming` false cases |
| A dino with no root fires no homecoming on any crossing | PASS | e2e test 2: `__roots()` empty → two crossings, no 🏡, no welcome |
| A homecoming with no other resident still fires and doesn't throw | PASS | code path guarded (`pickNearest` → null); unit pins `pickNearest([])` null; no console errors in any spec |
| Roots survive a save round-trip; a save without the field loads clean | PASS | unit `saveGame.test.ts` — round-trip + defaults-to-`{}` + malformed-rejects cases |

**Bugs found:** none in this track.
**Recommendation:** **APPROVE**

---

## Structure track — BACKLOG-448 (The provider role)

| criterion | status | evidence |
|---|---|---|
| `deriveRole` returns `provider` at ≥ 3 banks, ahead of the social reads | PASS | unit `cycle-107-provider.test.ts` — 2 banks → wanderer, 3 → provider; a gossip/homebody/socialite stat set flips to provider once banked |
| `ROLE_ICON.provider` exists; the roles lens can render it | PASS | unit asserts `🧺`; `ROLE_ICON` is `Record<Role,string>` so the compiler enforces it (build green) |
| A crossing that moves a food unit credits the carrier exactly 1 | PASS | e2e `cycle-107-provider.spec.ts` test 3 — `__foodBanked().Rex === 1` after one ferrying crossing |
| A crossing that moves nothing credits nobody | PASS | `cycle-106-food-flow.spec.ts` (no-surplus crossing) still green + `__foodBanked` stays empty in the at-cap spec |
| Harvest with a resident credits it +1 and posts a 🧺 line naming it | PASS | e2e test 1 — `🧺 Rex put the harvest away` and `__foodBanked().Rex === 1` |
| Harvest into an at-cap pile credits nobody | PASS | e2e test 2 — bowl seeded `{ berries: 6 }` (cap), `__foodBanked()` stays `{}`, no 🧺 line |
| After 3 credited banks the dino reads `provider` in `__roles()` and the book | PASS | e2e test 1 — three harvests → `__roles().Rex === 'provider'`, `__bookText()` contains `[provider]` |
| A provider whose tally goes quiet keeps the role | PASS | unit — `settleRole('provider','wanderer') === 'provider'` (the 032 spine, unchanged) |
| Tally survives a save round-trip; absent → clean load | PASS | unit `saveGame.test.ts` + `cycle-061-save-version.test.ts` |
| The four legacy roles are unchanged with no banks | PASS | unit (all four re-pinned) + `roles.test.ts` and `cycle-060-roles-persist.test.ts` green untouched |

**Bugs found (fixed in-cycle, both flagged to the Validator):**
1. **`foodPileByZone` never persisted (BACKLOG-446 regression, shipped cycle 103).** It was declared on
   `SaveData` but `deserialize` never validated or returned it, so every zone's banked food silently reset to
   empty on reload — nothing pinned it. Fixed with the planned save work and now pinned by a round-trip unit
   test. Pre-approved scope creep in the codeplan.
2. **`cycle-097-carry-pressure.spec.ts` was genuinely flaky (≈1 run in 6 on clean HEAD).** Seeded with a
   stone/branch glut, a bowl dino gathering mid-crossing auto-crafts a cairn, drains the source under the
   soft cap, and the carry drops from two units to one. Verified pre-existing by re-running the spec against
   `HEAD~1`'s `game/src` (1/6 failures there too), so **not** a cycle-107 regression. Fixed test-side: the
   glut is now fronds, a kind the bowl's cairn recipe can't spend, so the pressure decision can't be flipped
   by ambient gathering. 16/16 green after the fix.

**Recommendation:** **APPROVE**

---

## Flakes (noted, not regressions)

- `cycle-077-carry.spec.ts` — same family as the 097 flake above: an organic bowl spawn gathered mid-crossing
  re-banks a branch, so the pinned `bowl.branch === 0` reads 1. Failed once in a full run; **passed 10/10 on
  isolated re-runs**, and fails on `HEAD~1` too (1/6). Pre-existing. Worth an infra item — the whole
  "assert a pinned pile across a multi-step crossing" pattern is exposed to ambient gathering.
- `mobile-minds.spec.ts` (2 specs) — boot timeouts under a cold parallel full run; **5/5 isolated**. The
  catalogued parallel-load boot flake, unchanged by this cycle.
