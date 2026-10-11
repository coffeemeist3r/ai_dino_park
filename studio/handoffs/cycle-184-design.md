# Cycle 184 — Design

Milestone 28 (TENTPOLE, festivals). Both tracks extend `world/festival.ts` and its glue in `WorldScene`.

## Structure track — BACKLOG-597

**Item:** each season's rite + a drawn festival mark.

**What ships:**
- **Rite table** (`FESTIVAL_RITES: Record<Season, Rite>`), one per season: `{ name, glyph, artKey, bubble }`.
  - spring — *the blossom ring*, 🌸, `festival-spring`, "🌸 round the ring!"
  - summer — *the sun dance*, ☀️, `festival-summer`, "☀️ dance for the sun!"
  - fall — *the harvest heap*, 🍂, `festival-fall`, "🍂 one more on the heap!"
  - winter — *the lantern vigil*, 🏮, `festival-winter`, "🏮 hush… watch the light"
- **Banner** names the rite with its glyph: *"🌸 The spring festival — a blossom ring at the bowl pond"*; the close
  line takes the glyph too. The leader's opening bubble is prefixed with the rite glyph instead of 🎏.
- **Bubble.** At open, every circle attendee (not the leader, not a sulker) floats the rite's bubble.
- **Memory** names the rite: leader *"opened the spring festival — led the blossom ring"*; circle *"the spring
  festival — the blossom ring; Sunny opened it"* (no leader: *"the spring festival — the blossom ring"*); the
  sulker's memory is unchanged (it was not in the rite).
- **The mark.** For the festival's open phase a prop stands at `RITE_TILE` (5,3), the pond's east bank: the baked
  `festival-<season>` rig when drawn, the rite glyph until then (`makeHourMark`). Removed at close. The four keys
  join `worldPlacedProps()` so the Artist's rigs pass the reachability register.

**Reachability:** fresh save, 10:00 day 1 (two real minutes): banner names the blossom ring, 🌸 stands at the pond
and the circle floats 🌸 bubbles. Before tonight every season's festival was an identical 🎏.

**Acceptance criteria:**
- [ ] `festivalRite(season)` returns four distinct names, glyphs, art keys and bubbles (unit).
- [ ] `festivalBanner`/`festivalClosedLine` carry the season's glyph and rite name (unit).
- [ ] `festivalMemory` names the rite for leader and circle, not for the sulker (unit).
- [ ] The four art keys are in `worldPlacedProps()` (unit).
- [ ] Opening the spring festival on a fresh park puts the mark (key `festival-spring`) at `RITE_TILE`; closing
      removes it (e2e via `__festivalMark`).
- [ ] At `__setClock(22, 10, 0)` the opened festival is winter's: mark `festival-winter`, banner names the vigil (e2e).
- [ ] Circle attendees' memories name the rite (e2e).

## Lore track — BACKLOG-595

**Item:** the festival, remembered.

**What ships:**
- At close, every attendee still present gets a transient *tale* `{ season, rite, leader, foe? }` (like 139's
  `thanks`, not persisted: a reload forgets an unspoken tale).
- `festivalOpener(name, tale, traits)` — its register:
  - the **leader**: proud — *"I opened the spring festival. Everyone came to the blossom ring."*
    (prickly leader: *"Somebody had to open the spring festival. It went fine."*)
  - a **sulker**: sore — *"The spring festival. Twitch was there, so I kept to the edge."*
  - a **warm** circle dino (default): glad — *"The spring festival was lovely — Sunny opened the blossom ring."*
  - a **solitary** dino (sociability < 0.35): glad it is over — *"The spring festival's over. Good. That was a lot
    of dinos."*
  - a **prickly** dino (agreeableness < 0.35): *"The spring festival. Sunny opened it. It was fine, I suppose."*
  - no leader: the warm line reads *"The spring festival was lovely."*
- **Greet chain:** the festival opener sits below 139's thanks and above the last tone (148). Consumed by the one
  line it is said in.
- Hook `__festivalTales()` for specs.

**Reachability:** fresh save, festival closes at 12:00 (four real minutes). Greet Sunny → proud; Mossback → sore
about Twitch; any other bowl dino → its register's line. Never said before: no dino has ever spoken of a festival.

**Acceptance criteria:**
- [ ] `festivalOpener` returns the five registers above (unit).
- [ ] After open + close on a fresh park, every attendee holds a tale; none do while the festival is open (e2e).
- [ ] Greeting Sunny after close opens with the proud line; greeting again does not repeat it (e2e).
- [ ] Greeting Mossback after close names Twitch (e2e).

**Out of scope:** guests' tales are told only if the keeper meets them on their home ground (they keep the tale; no
special routing). Model enrichment.
