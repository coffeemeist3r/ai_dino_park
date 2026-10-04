# Cycle 177 — QA

**Board:** `npm run build` clean · `npx vitest run` **3218 passed** (3 skipped), 306 files · `npx playwright test`
**871/871** on the first full run (10.4 min) · `@mlc-ai/web-llm` only under `game/src/ai/` · no save change.
The new spec's first isolated run hit the known cold-Vite boot timeout on 2 of 3 tests; re-run 3/3 in 3.9 s and green
inside the full suite. Not a regression.

## Lore track — BACKLOG-391 (6/6)

1. **PASS** — `cycle-177-regret.test.ts` › "a shove past a friend is regretted…": true at `ADMIRE_BAR` and 30, false at 9 and 0.
   "the regret is not a pecking beat": `[snatched, regret]` reads `{score 1, beats 1}`; regret/sorry/heard-sorry match no weight.
2. **PASS** — "the apology is owed while the regret is on the ring": owed for Sunny, not Glade, not after the sorry.
3. **PASS** — e2e "shoving past a friend is regretted…": `__gobbleFood` = Sunny/Rex, `__lastRegret` = Rex/Sunny, Rex's
   ring holds the regret, ticker has `😓 Rex felt bad about shoving past Sunny`.
4. **PASS** — same spec: `__forceConverse('Sunny','Rex')` (Sunny opens) → Rex speaks *"Sorry about the hatch, Sunny. I
   was starving."*, ticker `🙇 Rex said sorry to Sunny`, regret replaced by the sorry memory, Sunny remembers it; the
   following meeting is ordinary talk.
5. **PASS** — e2e "shoving past a stranger costs nothing": under `strangers` the shove happens, no regret.
6. **PASS** — unit "the mark is placed by the world".

**Reachability probe:** as-shipped home zones read Rex, Sunny, Glade all `bowl`. Rex (agreeableness 0.02) is a
gobbler whenever hunger ≥ 0.5; Sunny (bravery 0.06) cedes every contest; founding bond 30. Glade→Sunny (14) is a
second friend-shove on the same ground.

## Structure track — BACKLOG-577 (4/4)

1. **PASS** — unit "one standoff is not a history; two are" / "a stare-down weighs half a stand" (stand + held = 3;
   one backed not cowed, two cowed).
2. **PASS** — unit "the book names the standoff rival".
3. **PASS** — e2e "two stare-downs in the grass…": as-shipped park, two forced standoffs → `__bookText` carries
   `faced down Twitch` and `wary of Mossback`.
4. **PASS** — 128 pecking, 174 standoff, 175 cowed, 176 admire all green in the full run.

**Watched for:** `cycle-128-pecking` "no hatch history → no pecking line" on a boot park with the feud live — would
need two ambient standoffs inside the spec; green.
