# Cycle 181 — QA

Board: `npm run build` clean · `npx vitest run` **3281 passed** (3 skipped) · `npx playwright test` **889/889** on the
first full run (a cold-Vite boot timeout on the very first isolated run of the new spec passed on re-run: the known
boot flake, not a regression). Boundary grep clean: `@mlc-ai/web-llm` only under `game/src/ai/`. No save change.

## Lore track — BACKLOG-148

| # | Criterion | Result |
|---|---|---|
| 1 | `toneEcho` pure; null with no last tone / neutral; four registers | PASS (unit) |
| 2 | Same last tone fond on one dino, sour on another | PASS (unit, and e2e across the founding cast: both `Ribbing me again? Good.` and `Teasing again. Wonderful.` appear) |
| 3 | First greet no echo; second greet has it | PASS (e2e) |
| 4 | caught/glad/missed opener wins over the echo | PASS by inspection: the echo is the last arm of the existing ternary chain. No dedicated test. |
| 5 | Build/unit/e2e green; no save change | PASS |

## Structure track — BACKLOG-592

| # | Criterion | Result |
|---|---|---|
| 1 | `answerSeek` / `answerEffect` pure, all five kinds | PASS (unit) |
| 2 | Sunny back → Rex seeking Sunny (`yesterday`), 👀 line, bond up | PASS (e2e; the bond rises net of drift, +4 bump minus ~1.5 ambient drift over the walk) |
| 3 | Mossback back → Twitch grudge up, Twitch seeking Mossback (`rival`) | PASS (e2e, including the `spoiling for it` line) |
| 4 | A cold answerer drops a seek on the newcomer | PASS by inspection (`actOnAnswer`). No dedicated test: there is no hook to plant a seek. |
| 5 | Build/unit/e2e green; no save change | PASS |

10/10 criteria pass. Two of them pass by inspection, and those two are named above.
