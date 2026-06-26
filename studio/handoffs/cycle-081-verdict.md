# Cycle 81 — Verdict

**Both tracks APPROVED.** The payoff cycle. Last cycle ended on two held notes — a loner's 🥀 with no way
to lift, and a trade route that moved resources but balanced nothing. This cycle resolves both: loneliness
becomes a state a dino visibly *leaves*, and the carry route learns to bring a zone what it actually needs.

## Lore track — BACKLOG-369 (The loner finds a friend): **APPROVED**

Cycle 80 shipped the loner (135) with a deliberate restraint the validator called out at the time: the
mope-drift to the wall is *probabilistic*, so a friendless dino still mills enough to meet someone and grow
out of it — loneliness was built to be a state you can leave, not a sentence. But nothing yet *marked* the
leaving. Now it does. The first time a loner's strongest bond clears `LONER_FLOOR=8` — by bumping into
someone in the mill, or by the keeper bonding it — it files a quiet `found a friend — not so alone now` and
a 🌱 perks up over its head, once ever. I drove it on a fresh bowl (where every dino starts a loner) and
watched Rex flip from loner to not the instant his bond with Mossback hit 10, the "not so alone" line
landing in his memory exactly once — a second friend after that added nothing, and a dino that was never a
loner got no beat at all. The 🥀 needed no new code to lift: `refreshMopeMarks` already reads the live bond
graph, so the mark stops drawing the moment `isLoner` flips. The clean part is the restraint carried
forward: the whole thing is a pure two-snapshot transition read (`liftsLoner`: a loner under the *before*
bonds, not under the *after*) plus a transient once-fired guard — **no save change**, because the memory it
files *is* the persistent record, so a reload can't re-fire a transition that already happened. The exact
payoff the cycle-80 verdict named when it shipped the probabilistic drift. The lonely-lean-on-keeper beat
(370) is the next vertebra.

## Structure track — BACKLOG-356 (Directed carry): **APPROVED**

The zone economy was a loop with a slack link. Zones gather different mixes (348), bank separate piles
(328), and a crosser ferries one resource between them (329) — but `pickCarry` moved the source's
*most-stocked* spare, blind to what the destination was short of. So a bowl swimming in stone but a branch
short of its next cairn would ship *stone* to a grove that didn't need it. Directed carry closes the link: a
crossing dino now brings the recipe kind the destination is most short of for its next craft, the
always-on cairn `{branch:3, stone:2}`. I set the bowl to `{stone:2, branch:1}` (stone the obvious spare),
left the grove empty, and crossed a dino — the **branch** went, the kind the grove was shortest of, exactly
where the old carry would have moved the stone (the unit test pins that divergence: `directedCarry` returns
branch where `pickCarry` returns stone). It stays honest at the edges: when the destination is already
stocked for its next craft it falls back to `pickCarry` so a spare still moves (carry never becomes a
needless no-op), it respects the destination cap, and an empty source still carries nothing. Same lossless
transfer path — `takeResource`/`bankResource`, source −1 / dest +1 — so the cycle-077 conservation spec is
untouched and green; directed carry is a smarter *choice* of kind, not a new mechanism. One pure helper +
a one-line `crossDino` swap (and the now-redundant `pickCarry` import dropped from WorldScene). No save
change. The both-zone readout (357), edge barter (358), and zone-distinct craft (377) build on a route that
now does real balancing.

## Build health
- `npm run build` clean (tsc + vite).
- **838 unit green** (+11: 5 loner-friend, 6 directed-carry).
- **e2e 255/256** — the lone failure is `cycle-069-zone-objects` (resource gatherable-only-in-own-zone), the
  catalogued rotating parallel-load flake: **green isolated 3/3** under `--workers=1`, in the zone-gate
  `checkGather` path untouched by this diff (the change lives in `crossDino` carry + the loner meet-site).
  The failing spec rotates between full runs (cycle-038/069/077/mobile-minds have each held the slot).
- web-llm boundary unaffected; `loner.ts` and `resource.ts` stay pure (no Phaser/AI import); **no save-format
  change either track** (the loner guard is transient, directed carry rides the existing carry path); the two
  tracks edit disjoint files and disjoint `WorldScene` regions (the meet-site bond-bump vs `crossDino`).

Cycle 81 closes; Lore-smith bumps to 82 next run.
