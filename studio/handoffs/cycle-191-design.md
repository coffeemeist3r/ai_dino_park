# Cycle 191 — Design

Both tracks consume one pure module, `game/src/world/faith.ts`. The lore track writes the faith (the sermon); the
structure track persists it and gives it an hour (the service). **Sequence: structure's record type + save field
first, then the sermon writes into it, then the service reads it.** Both touch `WorldScene.ts` (`closeFestival`,
`forceStep`, `refreshActivityMarks`, `bookRows`, save/restore) — one Coder, one pass.

## Lore track — BACKLOG-030

**Item:** BACKLOG-030 (reshaped) — the first sermon.

**Why this cycle:** The North Star's "occasionally invent religions" is the last headline the park has never touched,
and the first festival hands it a congregation for free: at 12:00 on day one the whole park is standing at the bowl
pond. A sermon is a mind *acting* in front of others, and who believes it is the bond graph made audible.

**What ships:**
- When a festival closes and the park holds no faith yet, the **preacher** is chosen: the awake attendee whose home
  ground is the bowl with the highest curiosity (ties by name). None → no sermon; the next festival tries again.
  Founding read: **Glade** (0.57) — Rex, Pip, Thornback and Ember are more curious but are owls, asleep at noon.
- Its **creed** comes from its persona text by keyword (first match in table order): `music|hum|song|sing` → the song
  under the grass 🎶; `rock|stone` → the stones 🪨; `sun` → the sun ☀️; `damp|water|pond|rain` → the water 💧;
  `old|remember` → the old ways 🌿; otherwise the sky ✨. Glade ("calm, musical, a little aloof") → 🎶.
- The preacher's bubble and the ticker carry its sermon line: `🎶 Glade stays at the pond and preaches: "There's a song
  under the grass. Hush, and you'll hear it."`
- **Hearers** are every other awake attendee. Deterministic, no RNG draw:
  - bond to the preacher ≥ `HEED_BOND` (10) → **believes** (bubble: the creed's believe line);
  - else a grudge ≥ `RIVAL_BAR` against the preacher or any believer → **scoffs** (🙄 bubble), remembering *whom* it
    will not follow;
  - else **unmoved** (nothing).
  Founding read: Mossback, Sunny, Murk believe; Twitch scoffs (because Mossback believes); Bramble unmoved.
- One summary ticker line: `🎶 Mossback, Sunny and Murk believe Glade. Twitch scoffs.` (scoffer clause omitted when none).
- Memories: preacher, each believer, each scoffer file one line (`remember`).
- **Book:** a `faith` line per dino in the faith: preacher `🎶 preaches the song under the grass (since day 1)`;
  believer `🎶 follows Glade's word: the song under the grass`; scoffer `🙄 won't hear Glade's song — not where Mossback
  goes` (the "not where" clause only when the scoffer's reason is a believer, not the preacher).
- **Idle glyph:** a believer or the preacher, wandering with no mood/lift/copied/kept mark showing, idles with the creed
  glyph one world-step in five (`faithBeat`).

**Acceptance criteria:**
- [ ] `pickPreacher` returns the highest-curiosity awake bowl-home candidate; ignores sleepers and guests; null when none.
- [ ] `creedFor(persona, traits)` maps the founding personas by keyword in table order; unmatched → sky.
- [ ] `hearSermon` with founding bonds/grudges and Glade preaching to {Mossback, Sunny, Twitch, Bramble, Murk} →
      believers [Mossback, Sunny, Murk], scoffers {Twitch: Mossback}, unmoved [Bramble].
- [ ] Fresh save, festival closed at day 1: `__faith()` returns preacher Glade, creed `song`, and every believer's bond to
      Glade ≥ 10; the ticker holds the sermon line and the believe line.
- [ ] A second festival close does not preach again (one faith per park).
- [ ] The book shows the faith line for the preacher, a believer and the scoffer.
- [ ] Over ≥ 5 world-steps a wandering believer's activity mark shows the creed glyph at least once.

**Out of scope:** LLM-authored sermons (the deterministic line is the floor; a brain sermon is a later item); spread
through meetings (615); owls hearing it secondhand (615); cross-ground believers attending; the shrine (614).

**Constraints:** no `rand()` draw anywhere in the sermon (the shared stream moves every other dino's dice). The sermon
runs inside `closeFestival` after `ringMakesFriends`. Mood glyphs outrank the faith glyph.

## Structure track — BACKLOG-613

**Item:** BACKLOG-613 — the faithful keep an hour.

**Why this cycle:** A sermon remembered only as a memory line is a beat. A faith that is *in the save* and *keeps an
hour* is a role and a calendar — the first recurring gathering after the festival, and the persistence the next two
arcs (615 spread, 614 shrine) stand on.

**What ships:**
- `Faith` record: `{ creed, preacher, zone, tileX, tileY, day, believers, scoffers: Record<string,string>,
  lastServiceDay? }`, written by the sermon (zone = bowl, tile = the preacher's tile when it preached).
- Additive save field `faith?: Faith`, validated on load (unknown creed / non-string names / non-finite numbers →
  corrupt save, the file's policy); absent → no faith.
- **The service:** checked on a real-time cadence (as the festival is). Due when the hour is `SERVICE_HOUR` (16), the
  day is ≥ the sermon day, the faith has not held a service today, and no festival or sky event is running.
  Attendees: the preacher and each believer that exists, is on the faith's ground, is not migrating, and is awake.
  Fewer than two → skip today (marked held, so it does not re-check every 3 s).
- While open (`SERVICE_MIN` = 60 in-game minutes): attendees walk to the faith tile — preacher onto ring 0, believers
  within ring 1 — and stand there (`activity = socializing`); everyone else lives normally. A guest walking home and a
  migrating dino are not pulled.
- Open: ticker `🎶 Glade's faithful gather at the pond for the song: Mossback, Sunny.` (names the believers coming); each
  attendee files a memory. Close: ticker `🎶 The faithful drift off from the pond.`
- Dev hooks: `__faith()`, `__service()`, `__holdService()`.

**Acceptance criteria:**
- [ ] `serviceDue` true at 16:xx after the sermon day when not held today; false at 15:xx, false once held, false
      before the sermon day.
- [ ] `serviceAttendees` keeps preacher + believers on the faith's ground, drops sleepers, migrants and away believers.
- [ ] Round-trip: `serialize`/`deserialize` keeps a faith; a malformed faith → null; a save without one loads fine.
- [ ] Fresh save: festival closed, then at 16:00 day 1 `__service()` is open with Glade and ≥ 1 believer; within
      `SERVICE_MIN` they stand within ring 1 of the faith tile; the ticker carries the gather line.
- [ ] Reload after the sermon: `__faith()` returns the same preacher, creed and believers.
- [ ] `npm run build` clean, vitest green, playwright green.

**Out of scope:** cross-ground walks to the service; the shrine; a service lens glyph.

**Constraints:** additive save only; `stepService` must not move a dino the festival/sky event owns (those return
before the per-dino loop); the service branch sits below migration and the guest skip in the per-dino ladder.
