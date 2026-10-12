# Cycle 185 — Code plan

## Structure track — BACKLOG-599 the festival fair

**`game/src/world/festival.ts`** (pure)
- `FAIR_TILE = { tileX: 7, tileY: 3 }`, `FAIR_ART_KEY = 'festival-fair'`, `FAIR_GLYPH = '🧺'`.
- `fairTrade(home, homePile, bowlPile)` → `barterSwap(homePile, bowlPile, structureRecipe(home), structureRecipe(BOWL_ID))`.
  Reuse: `barterSwap` / `structureRecipe` (`world/resource.ts`), `BOWL_ID` (`world/zones`).
- `fairLine(name, groundName, gave, took)` → string | null; `fairMemory(season, gave, took)`.
- Export `FAIR_ART_KEY` into `world/reachability.ts` `worldPlacedProps()`.

**`WorldScene.ts`**
- `openFestival`: after the guests are gathered, per guest: `fairTrade` → `setPile(home, takeResource(...))` +
  `setPile(BOWL_ID, bankResource(...))` for `gave`, the reverse for `took`; log + remember; collect into
  `this.festivalFair`. Place the basket via `makeHourMark(FAIR_ART_KEY, FAIR_GLYPH)` at `FAIR_TILE` when any unit moved.
- `closeFestival`: destroy the basket. Zone visibility alongside the rite mark (line ~8534).
- Hooks `__festivalFair`, `__festivalBasket`.

## Lore track — BACKLOG-180 odd bedfellows at the ring

**`game/src/world/festival.ts`** (pure)
- `RING_BOND = 10`; `ringPairs(positions: Record<string, Tile>)` → `[a,b][]` (Chebyshev ≤ 1, a<b, sorted).
- `ringFriends(bonds, pairs, floor = LONER_FLOOR)` → `{ bonds, crossed: [a,b][] }` via `strengthen`/`bondPoints`.
  `LONER_FLOOR` from `world/loner.ts` (check for an import cycle; pass floor in if one exists).
- `FestivalTale.friend?`; `ringFriendLine(friend, traits)`; `festivalOpener` appends it.
- `ringFriendLine`/`ringFriendMemory`/`ringFriendTicker`.

**`WorldScene.ts`**
- `closeFestival`: circle = attendees − sulkers present on the bowl; positions via `tileOf`; `ringPairs` →
  `ringFriends`; `this.bonds = ...`; for each crossed pair: tale.friend (first by name), memory, ticker, 🌱 pop.
- Hook `__festivalFriends`.

## Tests
- `game/src/world/cycle-185-festival.test.ts` — fairTrade/fairLine/fairMemory, ringPairs/ringFriends, opener
  registers, `worldPlacedProps` has `festival-fair`.
- `tests/e2e/cycle-185-festival-fair-ring.spec.ts` — fresh save: open at day 1 10:00, fair trades + basket + pile
  conservation; step the world until the ring forms, close, check bonds/friends/memory/greet. `foundingState()` per
  the ratchet.

## Shipped (coder)

- As planned, one deviation: **one trade per ground, not per guest.** The first live run had Bramble bring 🪨 and
  take 🪵, then Pip — the grove's second guest — bring the 🪵 straight back and take the 🪨. Net nothing, two lines
  of noise. The ground's first guest carries its trade; the design's "each guest" now reads "each ground".
- Build clean; unit 3328 green (321 files); e2e 904/904 first full run. web-llm boundary intact. No save change.
