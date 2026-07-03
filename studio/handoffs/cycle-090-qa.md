# Cycle 90 — QA

**Build:** ✅ clean (`npm --prefix game run build`, tsc + vite)
**Unit tests:** ✅ 963/963 (106 files; +27 new: 17 intent + 4 edge-indicators pass among them)
**E2E tests:** ✅ 288/288 on the final full run (5.3m). Two earlier single-spec incidents, both resolved — see Bugs.

**Boundary:** `@mlc-ai/web-llm` imports confined to `game/src/ai/` (webllmBrain.ts, webllm.worker.ts) ✅
**Save format:** untouched (no `saveGame.ts`/`saveStore.ts` diff) ✅

## Lore track — BACKLOG-393 Brain-biased intent

| criterion | status | evidence |
|---|---|---|
| Every dino has an intent post-boot, no model | PASS | e2e `cycle-090-intent` test 1 (headless, stub brain) |
| Closed kind set + deterministic procedural author | PASS | unit: 200-sample closed-set sweep, (name,day) determinism |
| Weight nudges pinned (social/solitary/forage/restless) | PASS | unit: chance pins 0.65/0.25/base; forage +0.25 cap 1; restless stay-reroll only |
| Nudges bounded (no freeze/peg) | PASS | unit: [0.05,0.95] clamp; ticAfter floor ceil(base/2); reroll may re-stay |
| Garbage brain draft → procedural floor | PASS | unit: fromDraft null/unknown/empty; parseIntentDraft garbage → null |
| WebLLM stays behind NPCBrain | PASS | grep above; `intend` lives on WebLLMBrain only, stub omits it |
| Book shows "today: …" | PASS | e2e test 3 (`__bookText` contains the line) |
| `__setIntent` forces, `__intent` reads back | PASS | e2e test 2 |
| No save-format change | PASS | no persistence diff; intents transient by design |

**Bugs found:**
- **Real interaction, fixed in-QA (test-only):** `cycle-077-carry` failed full-run AND isolated —
  a seeded forage-day intent widens resource notice, so an organic grove spawn (which leans
  *branch*, 348) got gathered + banked mid-spec, double-counting the pile the spec pins. The spec
  pins carry *conservation*, not world quietness: pinned all intents `social` at spec start via the
  new `__setIntent` hook (the cycle-087 de-flake precedent). 3/3 isolated + full run green after.
  Production code unchanged — the widened notice is 393 working as specced.
- **Catalogued flake, not a regression:** `cycle-078-grove-pull` failed once under full parallel
  load, 3/3 green isolated, and the final fresh full run is 288/288 green. Migration ranking reads
  news freshness only (intent never touches the migration branch — it `continue`s before the
  decision block). The known parallel-load class (cycles 87/89 precedent).

**Recommendation:** APPROVE

## Structure track — BACKLOG-398 Edge indicator

| criterion | status | evidence |
|---|---|---|
| Pure `edgeIndicators` pinned for all three zones + unknown | PASS | unit `cycle-090-edge-indicators` (4 tests) |
| Bowl: east label only | PASS | e2e `cycle-090-edge-labels` test 1 (`['The Grove ▸']`, zero console errors) |
| Zone change re-renders (grove 2 labels, Fernreach 1) | PASS | e2e test 2 |
| Real keeper crossing relabels | PASS | e2e test 3 (`__setPlayer` + `__tryCross` → grove labels) |
| Chrome placement, no overlap | PASS | depth 7 (under HUD/dialog at 13), edge-centered mid-height; plaque bottom-center, HUD top-left |
| Crossing behavior byte-identical | PASS | cycle-059/073/085 zone specs green in full run; no crossing-logic diff |

**Bugs found:** none.

**Recommendation:** APPROVE
