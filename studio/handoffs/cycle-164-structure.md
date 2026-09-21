# Cycle 164 — Structure Handoff

**Intent:** Milestone 21 has one unchecked structure arc and this is it. The save persists exactly
one fact about the observer — `keeperId?: string` — which was the right scope for BACKLOG-155 and is
now the reason **two** queued keeper items have nowhere to land: 156's persona cache has no field,
and 162's "the watcher changed" is not derivable from the save at all, because there is no previous
id, no switch count and no timestamp. A load looks identical whether you have worn one chassis for a
month or four in an hour. Ship the record so the milestone's last two lore arcs have somewhere to
stand.

**Solo cycle:** not declared. `cycle - lastSoloCycle` is **13**, so the mechanical gate is open, but
555 is neither top-of-queue-by-default nor passed over twice for scope — it is an ordinary-sized
item that has been queued for one cycle. The recorded solo candidate remains **553**. Declaring one
for an item merely because the counter allows it is exactly what CHARTER v8 says not to do.

**Added to Structure Track:** none — drained from queue (4 open ≥ X=4).

**Chosen this cycle:** **BACKLOG-555** — the watcher's record, not just its id.

**Scope, and the part not to defer.** A `keeper` record beside `keeperId` carrying, at minimum: when
the current observer was chosen (in the game's own day/step terms, the units the plaque and the
streak already use), how many times the watcher has changed, and the previous id — plus a slot
156's persona cache can occupy without a second save migration. **Strictly additive**: an old save
with a bare `keeperId` loads to a record seeded from it, and a save with neither loads to a record
seeded from the default observer. Pure and Node-testable in `world/saveGame.ts` + `keeper/`, no
Phaser.

**The reachability half is the item, not a rider on it.** CHARTER v7 calls a record nothing reads a
REWORK, and this one is unusually easy to get wrong in that direction because its whole stated
purpose is to be read *later*, by 156 and 162. So it ships with at least one line a player can see
on a fresh save — the keeper's tenure on the brass, beside the park's own day count, which is the
plaque's existing idiom and needs no new object. A switch count of zero and a tenure of "since day
1" on a brand-new park is a true reading, not a placeholder.

**Collision note (the Lore-smith flagged it first, correctly).** The lore track is BACKLOG-157 and
adds a **new file** under `keeper/` plus a `WorldScene` input binding and panel. This track edits
`world/saveGame.ts`, `keeper/` (a new record module), and the plaque's line builder. The two share
the `keeper/` directory and `WorldScene`, and share **no file** except `WorldScene`, where they
touch different regions (a key binding + panel vs. the save/load path and `plaqueLines`). Named so
the Coder sequences them rather than discovering it.
