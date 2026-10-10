# Cycle 183 — Design

Milestone 28 (TENTPOLE, festivals). Both tracks build one feature from one new pure module, `world/festival.ts`:
596 owns the calendar, the guest walk and the save field; 594 owns who leads, who sulks, the rings and the lines.

## Structure track — BACKLOG-596

**Item:** BACKLOG-596 — the festival gathering.

**Why this cycle:** the tentpole's spine. Nothing else in Milestone 28 can happen until there is a day the whole
park stands on one ground. The sky event (144) is the template for the gather walk; what is new is that residents
of the other five grounds come to the bowl and go home again.

**What ships:**
- **Calendar.** A festival is due on the first day of a season (`(day - 1) % SEASON_LENGTH_DAYS === 0`) from
  `FESTIVAL_HOUR` (10:00) until `FESTIVAL_HOUR + FESTIVAL_HOURS` (2), once per season, keyed by the absolute season
  index `Math.floor((day - 1) / SEASON_LENGTH_DAYS)`. A late load inside the window still opens it.
- **Check cadence.** A real-time timer (every 3 s, gated by `ambientPaused` like the sky roll) checks the calendar.
  Never from the clock tick, so a restore, `__setClock` or an away catch-up cannot open one retroactively.
- **Gathering.** On open: every dino not mid-migration attends. Residents of other grounds become *guests*: their
  zone is set to the bowl (bare `setZone` — no founding, carry, tenure or seen-ground side effects) and they appear
  at the bowl's east edge on their own row. Every attendee walks toward `FESTIVAL_TILE` (6,4, beside the pond) until
  inside its ring, activity `socializing`. A banner reads *"🎏 The spring festival — the whole park gathers at the
  bowl pond"* and the ticker logs it.
- **Closing.** After `FESTIVAL_DURATION_MIN` (120 in-game minutes) the festival closes: ticker *"🎏 The spring
  festival is over — the guests head home"*. Bowl residents resume wandering. Each guest walks to the east edge and,
  on reaching it, is set back to its home zone at the tile it left from. When the last guest is home the festival
  state clears.
- **Save.** Additive `festivalSeason?: number` (last season index held; absent → -1). While guests are present the
  saved `dinoZones` map writes every guest back to its home ground, so a save never strands one in the bowl.
- **Migration** does not roll while a festival or its walk-home is in progress.

**Reachability (ten-minute question):** fresh save, day 1 08:00 at 60x. At 10:00 — two real minutes in — the banner
appears and five dinos walk in from the bowl's east edge (Bramble, Pip, Thornback, Murk, Ember) and all ten ring
the pond. At 12:00 the guests walk back out. Never seen before: no other ground's resident has ever appeared in the
bowl without a migration.

**Acceptance criteria:**
- [ ] `festivalDue(t, lastSeason)` returns the season index on day 1/8/15/22/29 between 10:00 and 11:59 when not
      yet held, else null; 09:59, 12:00, day 2, and an already-held season are all null (unit).
- [ ] `__setClock(1, 10, 0)` then `__checkFestival()` opens the spring festival; `__setClock(1, 9, 0)` does not (e2e).
- [ ] On a fresh `as-shipped` park the open festival's attendees are all ten dinos and its guests are exactly the
      five non-bowl residents; every guest reads zone `bowl` (e2e).
- [ ] Stepping the world brings every attendee inside its ring of `FESTIVAL_TILE` (e2e).
- [ ] Closing (`__closeFestival`) and stepping returns every guest to its home ground and clears the festival (e2e).
- [ ] The save payload taken mid-festival writes each guest's home zone, and `festivalSeason` (unit on the pure
      helper + e2e on `__saveData` or equivalent).
- [ ] The same season does not open twice (`__checkFestival` after close returns null) (e2e).

**Out of scope:** per-season rites and the drawn mark (597); offline festivals (an away span crossing a festival
day holds none); the model's half.

## Lore track — BACKLOG-594

**Item:** BACKLOG-594 — who leads and who sulks.

**Why this cycle:** the tentpole's headline is that the festival *reads* the bond and grudge graphs in public. The
gathering alone is a crowd; this makes it a cast.

**What ships (all pure in `festival.ts`, read at open):**
- **Sulkers:** an attendee whose `worstRival` among the other attendees is non-null keeps to the outer ring (3) and
  floats *"😤 not standing anywhere near {foe}"*.
- **Leader:** among non-sulking attendees, the one with the highest sum of bond points to the other attendees (ties
  by attendee order); null if every sum is 0. Ring 0 — it stands on the festival tile. On open it floats its opening
  line and the ticker logs *"🎏 {leader}: {line}"*.
- **Opening line, in the leader's register** (the 139 register split): prickly (agreeableness < 0.35) *"Fine.
  Everyone's here. It's {season}. Let's get on with it."*; solitary (sociability < 0.35) *"...{Season}, then. Good
  that you all came."*; otherwise *"Everyone's here! {Season}'s come round again — come stand by the water!"*.
- **Everyone else:** ring 1.
- **Memories (at open):** leader `opened the {season} festival at the bowl pond`; sulker `the {season} festival —
  kept to the edge; {foe} was there`; everyone else `the {season} festival at the bowl pond — {leader} opened it`
  (or `the {season} festival at the bowl pond` when there is no leader).

**Reachability:** the founding graph decides it. Sunny's founding bonds sum highest (30 Rex + 18 Ember + 14 Glade =
62), so **Sunny leads** (correcting the lore handoff's guess of Rex). Mossback and Twitch hold the founding feud (40)
and both attend, so **both keep to the edge**, each naming the other. Seen two real minutes into a fresh save.

**Acceptance criteria:**
- [ ] `festivalSulkers` returns each attendee with a rival in the circle, with its foe (unit).
- [ ] `festivalLeader` picks the highest bond sum, skips sulkers, returns null on an all-strangers circle (unit).
- [ ] `openingLine` returns the three registers (unit).
- [ ] On a fresh `as-shipped` park the festival's leader is Sunny and its sulkers are Mossback (foe Twitch) and
      Twitch (foe Mossback) (e2e).
- [ ] After stepping, Sunny stands on `FESTIVAL_TILE` and Mossback/Twitch stand outside ring 1 but inside ring 3 (e2e).
- [ ] Every attendee's recall holds its festival memory; Sunny's names opening it, Mossback's names Twitch (e2e).

**Out of scope:** the post-festival greet line (595); bond changes from attending; the leader's line from the model.
