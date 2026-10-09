# Cycle 182 — Design

## Lore track — BACKLOG-139

**Item:** BACKLOG-139 — thankful line.

**Why this cycle:** Milestone 27 lore arc 2. A friend has walked over to talk a sore dino round since cycle 33, and the
ledger of who owes whom (132) has been kept since cycle 34. The consoled dino has never told anyone. The keeper's
greet is where the park's minds speak to the player, and 148 just proved the opener chain can carry a remembered
beat. This weaves the comfort graph into the voice.

**What ships:** when a friend talks a sore dino round (the hatch-sulk consoler of 136 reaching it, or the homecoming
consoler of 130), the consoled dino holds a *thank*. The next time the keeper greets it, its reply opens by naming
who came, in a register read off its own traits:
- prickly (agreeableness < 0.35): *"Rex came over. Didn't need it. ...Don't tell them I said thanks."*
- solitary (sociability < 0.35): *"Rex came and sat with me. Didn't say much. Neither did I. It helped."*
- otherwise: *"Rex sat with me, earlier. I won't forget it."*
The thank is spoken once and consumed. The keeper getting there first (the funk ends before the friend arrives) files
no thank, since nobody came.

**Acceptance criteria:**
- [ ] `thankfulOpener(friend, traits)` is pure and returns the three registers above by trait (unit).
- [ ] When the 136 consoler reaches the sulker, `__thanks()` holds `{ [sulker]: comforter }` (e2e).
- [ ] The next `__greet(sulker)` reply text starts with that dino's thank naming the comforter, and a second greet
      does not repeat it (e2e).
- [ ] The opener sits in the one-or-none chain below the caught / glad / missed openers and above 148's tone echo
      (inspection + the chain order in code).
- [ ] The keeper getting there first files no thank (e2e: the 136 "keeper first" stage leaves `__thanks()` empty).

**Out of scope:** persisting the thank across a reload; the model's half (the thank in the greet prompt); thanks for
a distress answer (202) — that beat resolves elsewhere and does not consult the ledger.

**Constraints:** transient scene field only, no save change. Reuse the existing opener chain in `pickTone`. Touches
`WorldScene.ts` (`stepConsole`, homecoming comfort, `pickTone`) — far from 578's sites.

## Structure track — BACKLOG-578

**Item:** BACKLOG-578 — grudges cool while you're away.

**Why this cycle:** Milestone 27 structure arc 2. `fastForward` moves every friendship across an absence but never
the grudge graph, so the founding feud returns exactly as hot after a week as after a minute. A system that ignores
time the keeper spends away is a system half-woven.

**What ships:** `fastForward` takes the grudge graph and cools every grudge by a capped per-minute amount
(`coolFor(minutes)`, same `perMinute` shape and same five-minute floor as drift-apart). The homecoming digest names
each feud that was at or above `RIVAL_BAR` before the absence, at most two:
- still at or above the bar: *"Mossback and Twitch cooled off a little."*
- now below it: *"Mossback and Twitch seem to have let it go."*
Both the restore path and the `__catchUp` mirror apply the cooled graph.

**Acceptance criteria:**
- [ ] `coolFor(4)` is 0; `coolFor(5)` ≥ 1; `coolFor` is capped (unit).
- [ ] `fastForward` with a grudge map returns cooled grudges, never below 0, and leaves bonds' behaviour unchanged (unit).
- [ ] A five-minute absence on the founding park lowers Mossback|Twitch and the digest contains
      "Mossback and Twitch cooled off a little." (e2e, `__catchUp`).
- [ ] A multi-day absence drops the founding feud below `RIVAL_BAR` and the digest contains
      "Mossback and Twitch seem to have let it go." (e2e).
- [ ] The save-restore path passes `save.grudges` through `fastForward` (inspection).

**Out of scope:** memories of a cooled feud; warming grudges across an absence; tuning `GRUDGE_DRIFT`.

**Constraints:** `grudges` is optional on `AwayInput` so every existing caller and test keeps working. No save change.
