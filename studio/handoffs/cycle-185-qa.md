# Cycle 185 — QA

Board: `npm run build` clean; `npx vitest run` 321 files / 3329 passed (3 skipped, pre-existing); `npx playwright
test` **904/904** on the first full run, twice (before and after the ring fix below). `@mlc-ai/web-llm` imported only
under `game/src/ai/`. No save change.

**Finding, fixed before this verdict (coder commit 66a98d4):** a fresh-save probe of the first build made seventeen
new friendships at one close — the ring stands inside a 3×3, so nearly every pair is adjacent. Fixed with
`ringPartners` (one neighbour each, strangers first). Re-probed: three friendships, all across grounds —
Bramble–Ember, Murk–Pip, Rex–Thornback.

## Structure track — BACKLOG-599
- [x] `fairTrade` returns the `barterSwap` picks with each ground's recipe — unit.
- [x] `fairLine` both/brought/took, null for neither; `fairMemory` omits null halves — unit.
- [x] `festival-fair` in `worldPlacedProps()` — unit.
- [x] Fresh save: fair non-empty, piles changed, every resource conserved park-wide, one trade per ground — e2e.
      Live: *"🧺 Bramble brought 🪨 from The Grove and took 🪵 home"*, *"🧺 Thornback took 🪨 home to The Fernreach"*,
      *"🧺 Ember brought 🪨 from The Sunward Ridge"*.
- [x] Basket at (7,3) while open, gone at close — e2e.

## Lore track — BACKLOG-180
- [x] `ringPairs` exactly the Chebyshev-≤1 pairs, each once — unit.
- [x] `ringPartners` one neighbour each, strangers first — unit (added with the fix).
- [x] `ringFriends` adds `RING_BOND`, reports only floor-crossers — unit.
- [x] Opener carries the friend sentence in all three registers — unit.
- [x] Fresh save: a pair gained ≥10, `__festivalFriends` lists crossers, memory + ticker + tale carry it, greeting a
      bowl resident names the friend — e2e. Live: Rex, *"The spring festival. Sunny opened it. It was fine, I suppose.
      Stood next to Thornback the whole time. Thornback is alright."*

10/10 pass.
