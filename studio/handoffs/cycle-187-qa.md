# Cycle 187 — QA

- **Build:** ✅ clean (`tsc -b && vite build`)
- **Unit tests:** ✅ 3365 passed, 3 skipped (325 files)
- **E2E tests:** ✅ 910 passed, 1 skipped (pre-existing conditional skip), first full run — no flake
- **Boundary:** ✅ `@mlc-ai/web-llm` only under `game/src/ai/`

## Structure track — BACKLOG-602

| criterion | status | evidence |
|---|---|---|
| `stageOf`/`moltDue`/`youngVoice`/`growthLine` unit-tested; no record → adult | PASS | `cycle-187-growth.test.ts` |
| Fresh save: Pip young, all else adult; Pip scale 0.5, rest 1 | PASS | e2e "a fresh park has one youngster" |
| Book: Pip block has `🥚 young`, no other block | PASS | same spec (`~6 h`, count = 1) |
| Pip's voice pitched higher than raw `chirpParams` | PASS | unit `youngVoice`; book/`chirpFor` route through `chirpOf` |
| `growth` round-trips; pre-187 save loads all-adult | PASS | unit save block; e2e reload |
| Founding calibration: youth ends ≤10 real min, after festival | PASS | unit founding test (6 real min, 14:00 ≥ 12:00) |

**Bugs found:** none. **Recommendation:** APPROVE

## Lore track — BACKLOG-023

| criterion | status | evidence |
|---|---|---|
| `moltKind`/`moltTraits`/lines unit-tested, grudge beats friend, clamp | PASS | `cycle-187-molt.test.ts` |
| Fresh save past 14:00: Pip molted once, adult, scale 1, ticker, agreeableness +0.15 | PASS | e2e "at two in the afternoon" |
| Bubble names Bramble; memory `grew up — came out softer` | PASS | e2e "the molt line names its friend" + memory assert |
| Book `🐚 grew up on day 1 — came out softer`, young line gone | PASS | e2e |
| Reload: adult, scale 1, shifted agreeableness kept, no second molt | PASS | e2e reload half |
| Shed-skin mark at the molt | PASS | `__moltHusks() === 1`; `molt` registered as world-placed prop |

**Bugs found:** none blocking. Noted: callback cue and distress cry still use raw traits (not piped up while young).
**Recommendation:** APPROVE
