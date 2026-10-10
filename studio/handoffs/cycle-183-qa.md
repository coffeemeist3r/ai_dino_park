# Cycle 183 — QA

Board: `npm run build` clean; `npx vitest run` 3302 passed / 3 skipped (318 files); `npx kill-port 5173` then
`npx playwright test` **898/898** on the first full run. Web-LLM boundary: `@mlc-ai/web-llm` imported only under
`game/src/ai/` (grep clean). One cold-boot timeout on the very first isolated run of the new spec (2 of 3 specs at
`__ready`); passed on re-run and in the full suite — the known cold-Vite boot flake, not a regression.

## Structure track — BACKLOG-596

- [x] `festivalDue` window/once: day 1/8/15/22/29 at 10:00 due; 11:59 due; 09:59, 12:00, day 2, held season null (unit).
- [x] `__setClock(1,9,0)` + `__checkFestival()` → null; `__setClock(1,10,0)` → spring festival (e2e).
- [x] Fresh `as-shipped` park: 10 attendees, guests exactly Bramble/Pip/Thornback/Murk/Ember, each reads zone `bowl` (e2e).
- [x] 24 world steps: every attendee within ring 3 of `FESTIVAL_TILE` (e2e).
- [x] `__closeFestival` + steps: festival clears, Pip→grove, Ember→ridge, Murk→hollow (e2e).
- [x] Save mid-festival writes guests home (`__saveZones`: Pip grove, Ember ridge) and `festivalSeason` = 0; the
      save field round-trips, is absent on an old save, refuses a non-integer (unit + e2e).
- [x] Same season never opens twice (`__checkFestival` after close → null) (e2e).
- [x] Extra: the live 3 s timer, ambient resumed at 09:59, opens the festival on its own (e2e).

## Lore track — BACKLOG-594

- [x] `festivalSulkers` returns each attendee with a rival in the circle + its foe (unit).
- [x] `festivalLeader`: highest bond sum, skips sulkers, null on strangers (unit); founding park → Sunny (unit + e2e).
- [x] `openingLine` three registers (unit).
- [x] Founding park: leader Sunny; sulkers Mossback→Twitch, Twitch→Mossback (e2e).
- [x] After stepping: Sunny on the tile (ring 0), Rex ≤ 1, Mossback/Twitch at ring 2–3 (e2e).
- [x] Memories: Sunny "opened the spring festival…", Mossback "…kept to the edge; Twitch was there", Rex "…Sunny opened it" (e2e).

**15/15 criteria pass** (one extra). None by inspection only. Not tested in-browser by eye: the unattended run
cannot start the dev server; the banner and bubbles reuse the season-turn banner and `showBubble` unchanged.
