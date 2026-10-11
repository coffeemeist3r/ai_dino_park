# Cycle 184 — QA

Board: `npm run build` clean; `npx vitest run` 319 files / 3309 passed (3 skipped, pre-existing); `npx playwright
test` 901/901 on the first full run. An earlier isolated run of the two festival specs hit two `__ready` boot
timeouts (cold Vite, the known flake) and passed on immediate re-run. `@mlc-ai/web-llm` imported only under
`game/src/ai/`. No save change.

## Structure track — BACKLOG-597
- [x] `festivalRite` returns four distinct names, glyphs, art keys and bubbles — unit.
- [x] Banner and close line carry the glyph and rite (`🌸 The spring festival — a blossom ring at the bowl pond`) — unit.
- [x] Memory names the rite for leader and circle, not the sulker — unit + e2e.
- [x] The four `festival-*` keys are in `worldPlacedProps()` — unit.
- [x] Spring opens with mark `festival-spring` at (5,3); close removes it — e2e.
- [x] Day 22 opens winter's lantern vigil (`festival-winter`) — e2e.
- [x] Circle memories name the rite — e2e (Rex: *"the spring festival — the blossom ring; Sunny opened it"*).

## Lore track — BACKLOG-595
- [x] `festivalOpener` five registers (proud, grudging leader, sore, glad, relieved, lukewarm, no leader) — unit.
- [x] No tales while open; after close every attendee holds one — e2e.
- [x] Sunny's next greet opens proud, the one after does not repeat it — e2e.
- [x] Mossback's greet: *"Twitch was there, so I kept to the edge."* — e2e.

11/11 pass.
