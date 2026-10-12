# Cycle 185 — Design

Milestone 29 (normal, after the festivals tentpole). Both tracks extend `world/festival.ts` and its open/close glue
in `WorldScene`. Neither track touches the save.

## Structure track — BACKLOG-599 the festival fair

**What ships:**
- **The trade.** At `openFestival`, for each guest in attendee order: `barterSwap(homePile, bowlPile,
  structureRecipe(home), structureRecipe(BOWL_ID))`. `aGives` moves one unit home → bowl, `bGives` one unit bowl →
  home, through `setPile` (the 504 seam, so the bowl heap re-syncs). Each guest sees the piles the guest before it
  left. Lossless and cap-safe by construction (`directedCarry` never targets a capped kind).
- **The line.** One ticker line per guest that traded, glyph 🧺:
  - both: *"🧺 Bramble brought 🪨 from the Grove and took 🪵 home"*
  - brought only: *"🧺 Ember brought 🌑 from the Ridge"*
  - took only: *"🧺 Murk took 🪵 home to the Hollow"*
  - neither: no line (nothing happened).
- **Memory.** The guest files *"the spring festival fair — brought 🪨, took 🪵"* (halves omitted when null).
- **The basket.** When at least one unit moved, a `festival-fair` mark (🧺 until 601 draws it) stands at
  `FAIR_TILE` (7,3), beside the rite, for the open phase; destroyed at close; shown only in the bowl. The key joins
  `worldPlacedProps()`.
- Hook `__festivalFair()` → the trades of the current/last festival `[{ name, home, gave, took }]`.

**Reachability:** fresh save, two real minutes in. The grove's guests bring stone, the Ridge's Ember brings obsidian;
the ticker names every trade; a 🧺 stands at the pond; the bowl's heap is not the one it booted with. Before tonight
nothing at a festival touched any ground's goods.

**Acceptance criteria:**
- [ ] `fairTrade(home, homePile, bowlPile)` returns the `barterSwap` picks with each ground's own recipe (unit).
- [ ] `fairLine` covers both/brought/took and returns null for neither; `fairMemory` omits null halves (unit).
- [ ] `festival-fair` is in `worldPlacedProps()` (unit).
- [ ] Fresh save, festival opened: `__festivalFair()` is non-empty, every trade is reflected in `__zonePile`-style
      reads (bowl total conserved with guests' homes: units out of homes = units into bowl and vice versa) (e2e).
- [ ] The basket mark stands at (7,3) while open and is gone after close (e2e).

## Lore track — BACKLOG-180 odd bedfellows, at the ring

**What ships:**
- **Who stood together.** At `closeFestival`, take the circle members (attendees that are not sulkers, present, on
  the bowl). Every pair whose tiles are within one of each other (Chebyshev ≤ 1) stood side by side.
- **The ring bond.** Each such pair gains a flat `RING_BOND = 10` (a one-off beat, flat like comfort's). A pair below
  the friend floor (`LONER_FLOOR` = 8) before and at/over it after is a **new friendship**.
- **Visible.** A 🌱 pops over each new friend (the 571 friend-found mark, `popFriendFoundMark`), and the ticker logs
  *"🌱 Rex and Twitch stood together in the ring — friends now"*. Each files *"the spring festival — stood beside
  Twitch; friends now"*.
- **The tale.** `FestivalTale` gains optional `friend` (each dino's first new friend, lowest name). The greet opener
  appends one sentence in its register:
  - default: *"I stood next to Twitch in the ring — we're friends now."*
  - prickly (agreeableness < 0.35): *"Stood next to Twitch the whole time. Twitch is alright."*
  - solitary (sociability < 0.35): *"Twitch stood by me. I didn't mind."*
- Sulkers stand next to nobody: they keep to the edge, so they gain nothing.
- Hook `__festivalFriends()` → the new pairs of the last close.

**Reachability:** fresh save, four real minutes in, the festival closes. 🌱 pops over the new pairs, the ticker names
them, the bond graph in the book has edges it did not have at boot, and greeting either says so. Before tonight the
festival changed nobody's friendships.

**Acceptance criteria:**
- [ ] `ringPairs(positions)` returns exactly the Chebyshev-≤1 pairs, each once, sorted (unit).
- [ ] `ringFriends(bonds, pairs)` adds `RING_BOND` to each pair and reports only the pairs that crossed the floor (unit).
- [ ] `festivalOpener` with `tale.friend` appends the friend sentence in each of the three registers (unit).
- [ ] Fresh save: open, let the circle form, close — at least one pair gained `RING_BOND`, `__festivalFriends()`
      lists the crossers, their memories carry the line, and greeting one names the friend (e2e).
