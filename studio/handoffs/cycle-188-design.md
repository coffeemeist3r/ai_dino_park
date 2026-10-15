# Cycle 188 — Design

Two tracks, one shared seam: the molt (`WorldScene.moltDino`). Structure builds the walk; lore gives the walkers
their words. Build structure first.

## Structure track — BACKLOG-604

**Item:** BACKLOG-604 [core] Egg-born dinos grow up.

**Why this cycle:** life stages (602) exist, but only Pip holds one — every egg-born dino still steps out of the
shell adult. Youth must be the default for anybody born, and the molt needs the park around it: the dinos it belongs
to walk over. This is the last structure arc of the tentpole.

**What ships:**
- `hatchEgg` writes `growth[name] = { hatchedAtMin: now }`: the hatchling is young, half size, piping, and molts on
  the 602 clock (two in-game days). It persists through the existing additive `growth` save field.
- At a molt, `moltWitnesses` picks who comes: its parents (from `born`; a founder has none), then its closest
  friend (`bestFriendOf`), then its worst rival (`worstRival`, ≥ `RIVAL_BAR`). Only those on the **same ground**,
  never itself, each at most once (a parent who is also the friend comes as a parent).
- Each witness walks to the molted dino's live tile (a priority branch in the world step, below the console walk,
  above food) and is marked `responding`. On arrival (Chebyshev ≤ 1) the visit resolves; a walk not finished in
  `MOLT_VISIT_STEPS` (30) world steps is dropped.
- Host for art 606: while a dino is young and `hasPropArt('shellcap')`, a `shellcap` image rides on its head; it is
  dropped at the molt. `shellcap` registered as world-placed in `reachability.ts`.
- Fresh save: Pip molts at 14:00 day 1 on the Grove → Bramble (closest friend, same ground) walks to Pip.

**Acceptance criteria:**
- [ ] S1 `moltWitnesses` unit: parents first, then friend, then rival; filters other grounds and self; dedups a parent-friend.
- [ ] S2 Fresh save, clock to 14:01 day 1: `__moltVisits()` contains Bramble → Pip as `friend`.
- [ ] S3 Bramble's visit resolves (arrival) within the step budget and clears from `__moltVisits()`.
- [ ] S4 `__layEgg('Rex','Sunny')` + `__forceHatch()`: the hatchling is `young`, scale 0.5, has a growth record.
- [ ] S5 `__moltNow(<hatchling>)` queues both parents on the same ground as `parent` visits.
- [ ] S6 Old saves: founders gain no growth record; the only new field is the optional `greeted` on a record.

**Out of scope:** guardian tether while young (607); parents crossing grounds to a molt; LLM-authored witness lines.

**Constraints:** additive save only; `moltDino` is shared with the lore track (structure lands the walk, lore adds
the lines on arrival). `@mlc-ai/web-llm` untouched.

## Lore track — BACKLOG-605

**Item:** BACKLOG-605 [social] The park sees it grow up.

**Why this cycle:** the last lore arc of Milestone 30. A molt nobody remarks on is a sprite change; a molt the park
answers is an event in somebody's life.

**What ships:**
- On arrival each witness speaks once, in its register: parent *"🐚 That's my Pip. All grown."*, friend *"Look at
  you, Pip!"*, rival *"Still small to me."* — and files `saw Pip grow up`. The ticker carries the line.
- The keeper's greeting reads the stage. While young, the line opens *"\*bounces\* I'm nearly big, you know."*; the
  first greet after the molt opens *"🐚 Notice anything? I'm grown."* (consumed — `greeted: true` on the growth
  record, persisted), and after that the dino greets as itself. A dino with no growth record greets unchanged.
- Fresh save: Bramble tells Pip *"Look at you, Pip!"*; greeting Pip before 14:00 has the youngster opener, after has
  *"I'm grown"* once.

**Acceptance criteria:**
- [ ] L1 `witnessLine` unit: three registers, name in parent/friend lines; `stageOpener` young / first-grown / later / none.
- [ ] L2 Fresh save molt: Bramble's memory gains `saw Pip grow up`; the ticker carries `Look at you, Pip!`.
- [ ] L3 `__pickTone('Pip','warm')` before the molt contains `I'm nearly big`; after the molt the first contains
      `I'm grown`, the second does not; `__growth().Pip.greeted === true`, kept across reload.
- [ ] L4 A founder with no record (Rex) greets without either opener.

**Out of scope:** model-authored remarks (deterministic floor only this cycle); kin crossing grounds.

**Constraints:** the stage opener sits beside the existing one-or-none opener chain, not inside it — it is a fact
about the speaker, not an event, so it may co-occur with an opener. It goes ahead of the aside.
