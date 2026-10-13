# Cycle 186 — Design

Milestone 29 (*the festival changes the park*). Both tracks extend `festival.ts` (pure) + the festival glue in
`WorldScene`. No save change on either track.

## Lore track — BACKLOG-133 (reshaped): the leader fetches the sulkers

**Behaviour.**
1. `COAX_AFTER_MIN = 30` in-game minutes after the opening, if the festival has a leader and the leader is **not
   prickly** (agreeableness ≥ 0.35), the leader starts fetching. Order: `coaxOrder(leader, sulkers, bonds)` — the
   sulkers sorted by bond with the leader, most first, then by name. A prickly leader fetches nobody (it said *"let's
   get on with it"*).
2. While fetching, the leader leaves the centre and steps toward its current target each festival step. When within
   one tile (Chebyshev ≤ 1) the ask resolves:
   - leader bubble + ticker: `coaxLine(target, season, leaderTraits)` — warm *"Come on, Twitch — it's spring. Stand
     with us."*; shy (sociability < 0.35) *"...Twitch? There's room by me."*
   - the sulker answers `coaxAnswer(foe, traits)`: **comes** iff agreeableness ≥ 0.35 — shy *"...alright. Just for a
     bit."*, otherwise *"Oh — alright!"*; a prickly one refuses *"😤 Not while Mossback's in there."*
   - comes in → removed from `sulkers` (so `festivalRing` puts it in the circle and the close's ring pass sees it),
     leader–sulker bond `+RING_BOND`, ticker `🤝 Sunny fetched Twitch in from the edge`.
   - refuses → stays a sulker; ticker `😤 Mossback wouldn't come in from the edge`.
   - both file memories: leader `the spring festival — brought Twitch in from the edge` / `— Mossback wouldn't come in`;
     sulker `the spring festival — Sunny fetched me in from the edge` / `— Sunny came for me; I stayed out`.
   Then the next target; when the queue is empty the leader walks back to the centre.
3. Tales: a fetched dino's tale has no `foe` and carries `fetchedBy`; its head reads *"The spring festival. I was
   keeping to the edge, but Sunny came and fetched me in."* A refuser's head gains *"Sunny came to fetch me. No."*
   after the edge sentence. The leader's tale carries `broughtIn` (list) → *"Twitch came in from the edge, too."*
4. Dev hook `__coaxFestival()` starts the fetch immediately (e2e).

**Acceptance criteria.**
- L1 `coaxOrder` sorts by leader bond desc then name; returns [] for a null or prickly leader. (unit)
- L2 `coaxAnswer` comes iff agreeableness ≥ 0.35; refusal names the foe; lines differ by register. (unit)
- L3 Fresh save, spring festival, coax run: Sunny reaches Mossback and Twitch; Mossback refuses and stays in
  `sulkers`; Twitch comes in and leaves `sulkers`; Sunny–Twitch bond rose by `RING_BOND`; ticker carries both lines. (e2e)
- L4 After the fetch and a few steps Twitch stands inside the circle (Chebyshev ≤ `CIRCLE_RING` of the festival
  tile); at the close Twitch is in a ring pair (bond to some neighbour rose). (e2e)
- L5 Greeting Twitch after the close names Sunny fetching it in; Mossback's memory carries the refusal. (e2e)
- L6 Founding feud unchanged (grudge Mossback|Twitch untouched). (e2e)

## Structure track — BACKLOG-600: the keeper in the ring

**Behaviour.**
1. Each open-phase festival step, if the keeper is in the bowl and `keeperInRing(playerTile)` (Chebyshev ≤
   `SULK_RING` of `FESTIVAL_TILE`) and not yet counted, the keeper becomes an attendee (`f.keeper = true`, once).
2. On arrival: leader bubble + ticker `keeperWelcome(keeperName, leaderTraits)` — warm *"The keeper came too! Come
   stand with us, Keeper!"*, prickly *"Oh. The keeper. Fine — stand there, then."*, shy *"...You came. Good."*; with
   no leader, ticker `🎏 the keeper joined the spring festival`. Every attendee: keeper friendship `+KEEPER_FESTIVAL_GAIN`
   (= `BASE_GAIN`, 3) and memory `the spring festival — the keeper came`.
3. At the close every tale carries `keeper: boolean`; `festivalOpener` ends with `keeperTaleLine(present, traits)`:
   present → warm *"You were there too!"*, prickly *"You were there. I saw."*; absent → warm *"You missed it — come next
   season?"*, prickly/shy *"You weren't there."* A tale with `keeper` undefined (old tests) is unchanged.
4. Dev hook `__festivalKeeper()` returns whether the keeper counted.

**Acceptance criteria.**
- S1 `keeperInRing` true at Chebyshev ≤ 3 of (6,4), false at 4. (unit)
- S2 `festivalOpener` appends the present/absent line by register; unchanged when `keeper` is undefined. (unit)
- S3 Fresh save, festival open, keeper placed at the pond: after one step `__festivalKeeper()` is true; Sunny's welcome
  is in the ticker; every attendee's keeper friendship rose by 3 and each has the memory. Counted once only. (e2e)
- S4 Keeper away all festival: after the close, a greet ends with the absent line; with the keeper present, the
  present line. (e2e)

## Reachability (both)
Fresh save, two real minutes: the festival opens. Half a game-hour later Sunny walks out to Mossback (refused, to her
face) and Twitch (comes in) — visible walk, bubbles, ticker. If the player walks to the pond at any point while it is
open, Sunny turns and welcomes the keeper and hearts tick. After noon every greet says whether the keeper came.
