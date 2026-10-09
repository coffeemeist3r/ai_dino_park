# Cycle 182 — Codeplan

## Lore track — BACKLOG-139

**Files to modify:**
- `game/src/world/comfort.ts` — add `thankfulOpener(friend, traits?)`.
- `game/src/scenes/WorldScene.ts` — new transient `thanks: Record<string, string>`; set in `stepConsole`'s resolution
  and the homecoming comfort; read + delete in `pickTone`, slotted between `missedTrace` and `toneEcho`;
  `__thanks` dev hook.

**Reuse list:** opener chain in `pickTone`; `Personality` axes (`ai/personality.ts`); the 136 e2e staging
(`__forceContest`, `__bondPair`, `__placeDino`, `__consoler`).

**New dependencies:** none.

**Test plan:**
- Unit `tests/unit/cycle-182-thanks.test.ts` — three registers by trait; names the friend.
- E2E `tests/e2e/cycle-182-thanks.spec.ts` — 136 stage → consoler arrives → `__thanks` → greet opens with thank,
  second greet does not; keeper-first stage files none.

**Risks:** the sulker's funk may have its own greet branch; the opener chain still runs after it (checked).

## Structure track — BACKLOG-578

**Files to modify:**
- `game/src/world/away.ts` — `GRUDGE_COOL_PER_DAY`, `MAX_COOL`, `coolFor`, `cooledLine`, `letGoLine`;
  `AwayInput.grudges?`, `AwayResult.grudges`; cooling pass + digest lines.
- `game/src/scenes/WorldScene.ts` — restore path passes `save.grudges ?? {}` and assigns `away.grudges`; `__catchUp`
  passes and assigns `this.grudges`.

**Reuse list:** `perMinute`, `strengthen`, `bondedPairs`, `RIVAL_BAR` (`social/grudges.ts`).

**Test plan:**
- Unit `tests/unit/cycle-182-grudge-cool.test.ts` — floor/cap; cooled map; both digest lines; no grudges → unchanged.
- E2E `tests/e2e/cycle-182-grudge-cool.spec.ts` — five-minute catch-up and multi-day catch-up on the founding park.

**Risks:** `away.ts` importing `social/grudges.ts` — grudges imports only `bonds`/`closest`, no cycle.

**Estimated touch count:** ~7 files across both tracks.
