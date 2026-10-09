# Cycle 182 — QA

Board: `npm run build` clean; `npx vitest run` 3294 passed (3 skipped); `npx playwright test` 894/894 on the first
full run. web-llm imported only under `game/src/ai/` (grep).

## Lore track — BACKLOG-139

- [x] `thankfulOpener` three registers by trait — `tests/unit/thanks.test.ts`.
- [x] Consoler reaches the sulker → `__thanks()` is `{ Sunny: 'Rex' }` — e2e test 1.
- [x] Next greet opens *"Sunny: Rex sat with me, earlier. I won't forget it."*; the second greet does not repeat it — e2e test 1.
- [x] Chain order: `thank` is computed only when `caught`, `glad` and `missedTrace` are all absent, and is above
      `toneEcho` in the ternary — by inspection (`pickTone`).
- [x] Keeper first → `__thanks()` empty — e2e test 2.

## Structure track — BACKLOG-578

- [x] `coolFor` floor and cap — unit.
- [x] Cooled map, never below 0, non-feud not named, no-grudges unchanged — unit.
- [x] Five-minute `__catchUp` on the founding park lowers Mossback|Twitch; digest has *"Mossback and Twitch cooled off a little."* — e2e test 3.
- [x] A week: feud below 20; *"Mossback and Twitch seem to have let it go."* — e2e test 4.
- [x] Restore path passes `save.grudges ?? {}` into `fastForward` and assigns `away.grudges` — by inspection.

10/10 pass (two by inspection, named).
