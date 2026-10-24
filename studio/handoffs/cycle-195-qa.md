# Cycle 195 — QA

- **Build:** ✅ clean
- **Unit tests:** ✅ 3463 passed, 3 skipped (342 files)
- **E2E tests:** ✅ 944/944 on one full run (no flakes)
- **Boundary:** ✅ `@mlc-ai/web-llm` imported only under `game/src/ai/`

## Lore track — BACKLOG-624

| criterion | status | evidence |
|---|---|---|
| grudge ≥ bar refuses; below accepts | PASS | `cycle-195-grudge.test.ts` "a grudge at the rival bar…", "…cooled below the bar…" |
| refusal / came-round text | PASS | `cycle-195-grudge.test.ts` "the ticker and the memory say why" |
| as-shipped Mossback/Twitch refused, no pair, no nest | PASS | e2e "the founding feud cannot pair" |
| Rex and Sunny still pair | PASS | same spec, tail; probe step 14 |

**Probe (headless, as-shipped, no hooks but `__stepWorld`):** step 14 `💕 Rex courts Sunny with a pretty stone. Sunny says
yes.` / `🥲 Ember is glad for Sunny and Rex`; step 38 `💔 Mossback courts Twitch with a fern. Twitch hasn't forgiven
Mossback.` — the cycle-194 blind spot, now a refusal on the ticker.

**Bugs found:** none. **Recommendation:** APPROVE.

## Structure track — BACKLOG-625

| criterion | status | evidence |
|---|---|---|
| `weddingDue` gates; `isPairs` validates `wed` | PASS | `cycle-195-wedding.test.ts` |
| guests filter | PASS | `cycle-195-wedding.test.ts` "the guests are friends of either mate…" |
| 15:00 wedding, ticker, guests ring the nest ≤ 20 steps, book, memory, close, once, reload | PASS | e2e "Rex and Sunny are wed at their nest at 15:00…" |
| unattended reach on the live cadence | PASS | e2e "the wedding comes on its own, on the live cadence" (no `__holdWedding`) |
| build / suites / boundary / additive save | PASS | above; `pairs[*].wed` optional |

**Probe:** pair at step 14, clock to 15:00: `💍 Rex and Sunny are wed at their nest. Mossback and Glade came.` Twitch, on
the same ground, was not asked (bond < 10). Note: `__stepWorld` does not move the clock under the paused-ambient
harness, so the unattended 08:00→15:00 run is the live clock (7 real minutes at 60x), covered by the cadence spec.

**Bugs found:** none. **Recommendation:** APPROVE.
