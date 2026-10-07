# Cycle 180 — Design

Milestone 26 (tentpole). Both picks close the last two arcs.

## Lore track — BACKLOG-589

**Item:** BACKLOG-589 [emergent] The ground answers a newcomer.

**Why this cycle:** The last lore arc of the tentpole asks for a park event answered differently by different minds,
with yesterday's reflection part of the answer. An arrival is the event a fresh save reaches first: 586's errands start
crossings at 20 s. Every resident sees the same arrival. Tonight each one answers from who it is and from how
yesterday went.

**What ships:**
- Pure `game/src/ai/welcome.ts`. `answerArrival(resident, traits, newcomer, { yesterday, rival, met })` returns one of
  `bristle | missed | company | curious | cold`, or null. It checks these rules in order:
  1. A rival (grudge ≥ `RIVAL_BAR`) **bristles**.
  2. A resident whose yesterday's `best` is the newcomer **missed** it.
  3. A sociable resident (≥ `MISSES_COMPANY`) whose yesterday had nobody **brightens** (`company`).
  4. A curious resident (≥ `CURIOUS`) that has met the newcomer fewer than 3 times is **curious**.
  5. A loner (sociability < 0.3) **turns away** (`cold`).
  6. Anyone else carries on (null).
- `welcomeText(kind, resident, newcomer)` gives two name-seeded wordings per kind. `welcomeLine(newcomer, zoneName, answers)`
  gives the ticker line, for example *🌿 The Bowl answers Sunny: Rex glad it came, Twitch turns away.*
- Scene: at the end of `crossDino`, each resident of the destination answers. Excluded: the newcomer, and any resident
  that already greeted it this crossing (452's homecoming welcome, 459's plenty welcome). Each answerer gets a bubble.
  The line is logged when at least one resident answered.

**Acceptance criteria:**
- [ ] Unit: one newcomer, five residents with different traits and yesterdays give five different answers. Yesterday alone decides `missed` and `company`.
- [ ] Unit: a rival outranks yesterday; a resident with no reflection is never `missed` or `company`; text is name-seeded (two residents can word one kind differently).
- [ ] E2E (as-shipped): Sunny is moved to the Grove, then crosses back to the bowl on foot. The ticker carries `answers Sunny:` naming Rex (`glad it came`, because yesterday was Sunny) and Twitch (`turns away`). A bubble shows over Rex.
- [ ] E2E (as-shipped): Mossback crossing back to the bowl gets a different answer from Twitch (`bristles`, the founding feud) than Sunny did (`turns away`).
- [ ] A crossing onto a ground where nobody answers logs no answer line.
- [ ] Build clean, unit + e2e green.

**Out of scope:** model-authored answers; memories or bond changes from an answer; answers to the instant `relocate` path.

**Constraints:** `crossDino` is shared with 588's follow walk. 589 only appends to the end of `crossDino`. 588 does not touch `crossDino`.

## Structure track — BACKLOG-588

**Item:** BACKLOG-588 [ai] The model's hand on whom and where.

**Why this cycle:** This is the tentpole's last structure arc. CHARTER v9 requires the deterministic floor to ship in the same
cycle, and the reachability bar applies unchanged. So the arc is one decision with two halves: whom and where. On the floor,
a sought companion on another ground is a reason to go there. The model folds onto that floor the way 393's intent does.

**What ships:**
- **Floor, the follow:** in `runErrand`, before the plan's place errands, the first dino by name whose sought companion
  (582) is on another ground and not yet reached sets off one hop toward it (`hopToward`, `startMigration`). The ticker
  says *🧭 Sunny sets off for The Bowl — after Rex.*, the 🧭 mark pops, and `went` is recorded so the dusk voice can
  lead with it. A follow is blocked when the dino is asleep or migrating, when the companion is migrating, or when the
  dino is its ground's last resident (`ZONE_FLOOR`). It is also blocked for a mutual pair: only the first-named of the
  two goes. The rule is pure `shouldFollow` in `ai/companion.ts`.
- **Model:** add optional `NPCBrain.choose(ctx, { companions, grounds })` returning `{ seek, go } | null`. It is
  implemented only on the WebLLM brain, for a ready engine only. The reply is parsed by a pure `parseChoice` against
  the two closed lists. In `chooseSeek`, after the floor pick, and only when `allowAmbient` allows: the brain gets every
  other dino in the park and the neighbouring ground names. If the phase is unchanged when the answer arrives, two folds apply:
  - `foldChoice` takes a named companion. It becomes `{ name, why: 'chosen' }`, and the ticker says
    `🧠 👀 … goes looking for X — its mind made up.` The companion may be on another ground; the follow then walks there.
  - `foldPlace` takes a named neighbouring ground. It replaces this phase's errand destination if the errand has not run.
  - Anything else keeps the floor.

**Acceptance criteria:**
- [ ] Unit: `foldChoice` accepts a closed-list name and rejects null, self, and unknown names. `foldPlace` accepts only a neighbour. `parseChoice` reads names case-insensitively from free text.
- [ ] Unit: `shouldFollow` blocks on the last resident, a migrating companion, the same ground, and the second-named of a mutual pair.
- [ ] E2E (as-shipped): two errands send Bramble and then Glade off. Glade arrives on the Grove. The next errand tick is Glade following Mossback: the ticker carries `🧭 Glade sets off for … — after Mossback.` and Glade is migrating.
- [ ] E2E: a fake `choose` returning Twitch for Sunny makes Sunny seek Twitch with why `chosen` and a `🧠` ticker line. A fake returning an unknown name leaves Sunny seeking Rex (`yesterday`).
- [ ] `@mlc-ai/web-llm` is still imported only under `game/src/ai/`. No save change.
- [ ] Build clean, unit + e2e green.

**Out of scope:** multi-hop route planning beyond `hopToward`; model-authored reasons text; on-screen-only budgeting (107).

**Constraints:** the follow rides the migration tick, which every spec pauses. The cycle-179 errand specs stay valid,
because without steps no zone changes, so no follow can occur. File overlap with 589 is `WorldScene.ts` only, in
different methods.
