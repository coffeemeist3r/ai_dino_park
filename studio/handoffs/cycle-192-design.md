# Cycle 192 — Design

## Lore track — BACKLOG-615

**Item:** BACKLOG-615 [emergent] The word travels.

**Why this cycle:** Milestone 32's last lore arc. The first sermon reached only the dinos awake at the pond at noon; the
four owls slept through it, and the Grove/Fernreach/Ridge residents went home. A faith that only ever holds the people
who happened to be standing there is a scene, not a religion. Carried through meetings, who comes to believe reads off
the bond graph a second time, at a distance — and the book can say *who told whom*.

**What ships:**
- In any ordinary meeting (`converse`, the shared npc_meet path), if one dino is in the flock (the preacher or a
  believer) and the other has no part in the faith (not preacher, believer or scoffer):
  - a grudge between them at the rival bar (`worstRival`) → the listener **scoffs**: added to `faith.scoffers` naming
    the carrier, a 🙄 bubble, a ticker line `🙄 Twitch won't hear Glade's song from Mossback.`, a scoff memory;
  - else a bond ≥ `WORD_BOND` (12) between them → the listener **believes secondhand**: added to `faith.believers`,
    `faith.heardFrom[listener] = carrier`, a bubble `🎶 Sunny told me about the song.`, a ticker line
    `🎶 Rex heard Glade's song from Sunny, and believes.`, a memory `Sunny told me about the song under the grass, and I believed it`;
  - else nothing.
- Checked in both directions of a meeting (either dino may be the carrier). Deterministic, no RNG draw.
- The book's faith line for a secondhand believer names the carrier:
  `🎶 follows Glade's word: the song under the grass (heard it from Sunny)`. A secondhand scoffer reads
  `🙄 won't hear Glade's song — not where Mossback goes` (the existing scoffer line already names the foe).
- `faith.heardFrom` is additive and optional; old saves load with none.

**Acceptance criteria:**
- [ ] Pure `hearWord(faith, carrier, listener, bonds, grudges)` returns `believe` for bond ≥ 12, `scoff` for a grudge at the rival bar (grudge outranks bond), `null` below 12, and `null` when the carrier is not in the flock or the listener already has a part.
- [ ] On a fresh save after the sermon, `__forceConverse('Sunny','Rex')` makes Rex a believer with `heardFrom.Rex === 'Sunny'`, and the ticker carries `🎶 Rex heard Glade's song from Sunny, and believes.`
- [ ] The order of the meeting does not matter: `__forceConverse('Rex','Sunny')` converts Rex the same way.
- [ ] A dino with a grudge against a believer it meets scoffs: the scoffers map names the carrier, a 🙄 ticker line logs.
- [ ] The book row for a secondhand believer reads `🎶 follows Glade's word: the song under the grass (heard it from Sunny)`.
- [ ] A secondhand believer attends the next service (it is in `faith.believers`).
- [ ] `heardFrom` survives save → reload; a save without it still loads (`isFaith` accepts absent, rejects non-string values).

**Out of scope:** conversion of an existing scoffer or an unmoved sermon hearer by a later sermon; a second faith; LLM
voicing of the telling (the deterministic line is the floor); cross-ground services.

**Constraints:** Beside the gossip cascade, not a rung in it (like `teachBeat`), so no shipped rumor beat gets rarer.
Shares `faith.ts` and `WorldScene.ts` with the structure track (different functions). No RNG draw.

**Ten-minute answer:** the owls wake at 13:00; Rex lives on the bowl with Sunny (bond 30) and Mossback (12). Within
the first ten minutes Rex meets one of them and the ticker says *Rex heard Glade's song from Sunny, and believes.*

## Structure track — BACKLOG-614

**Item:** BACKLOG-614 [emergent] The faith raises a stone.

**Why this cycle:** Milestone 32's last structure arc, and the first landmark raised for a reason other than a full
pile. Measured: the as-shipped bowl has 2 stone by ~80 world steps; the founding faith already holds 3 believers.

**What ships:**
- `SHRINE_RECIPE = { stone: 2 }`, `SHRINE_BELIEVERS = 3`, `SHRINE_GLYPH = '🛐'`, `SHRINE_ART_KEY = 'shrine'`.
- When a service opens (`checkService`) and the faith has no shrine, holds ≥ 3 believers, has ≥ 3 attendees, and the
  faith's ground pile covers the recipe: the pile is spent, `faith.shrine = { tileX, tileY, zone, derelict? }` is set
  at the sermon spot, each attendee shows a 🪨 haul bubble and keeps a memory `we hauled stone to raise a shrine for <creed>`,
  and the ticker logs `🛐 Mossback, Sunny and Glade haul stone from the pile and raise a shrine where Glade preached.`
- The faith mark at the sermon spot becomes the shrine (the `shrine` rig if drawn, else the 🛐 glyph). The service
  continues to gather at the same spot — now at the shrine.
- The shrine is a landmark: it counts in the ground's standing landmarks (upkeep bill), can lapse derelict (drawn at
  `DERELICT_ALPHA`), and the mend errand can patch it. It is NOT a base landmark for the granary gate.
- Persisted inside `faith` (additive, validated by `isFaith`).

**Acceptance criteria:**
- [ ] Pure `canRaiseShrine(faith, attendees, pile)` true only when no shrine, ≥ 3 believers, ≥ 3 attendees and pile covers `SHRINE_RECIPE`; `raiseShrine(pile)` returns the pile minus the recipe.
- [ ] Fresh save → sermon → bowl pile with ≥ 2 stone → 16:00 service: `__faith().shrine` is set at the sermon tile in the bowl, the bowl pile has 2 fewer stone, and the ticker carries the 🛐 raise line.
- [ ] With < 2 stone the service still opens and no shrine is raised (pile unchanged).
- [ ] `__landmarks('bowl')` includes the shrine; `__standing('bowl')` rises by one.
- [ ] A shrine can be marked derelict by upkeep and `__faithMark()` reports it faded (alpha < 1).
- [ ] The shrine survives save → reload.

**Out of scope:** a shrine per creed / per ground; a shrine raised outside the service; the shrine rig (617, Artist).

**Constraints:** Additive save change only. `baseLandmarks` (granary gate) unchanged. The shrine lapses/mends through
the existing `landmarkRecords` / `landmarksIn` lists — no second upkeep path.

**Ten-minute answer:** at 16:00 day one (~8 real minutes) Glade, Mossback and Sunny gather at the pond, haul two
stones from the bowl's pile and a 🛐 shrine stands where the 🎶 stone was.
