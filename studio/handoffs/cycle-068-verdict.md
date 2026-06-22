# Cycle 68 — Verdict

Both tracks APPROVED. Build clean; 687/687 unit; 219/219 e2e in one fresh run, no flake. No CHARTER
breach — no new frameworks, `@mlc-ai/web-llm` stays under `game/src/ai/` (neither track touches the brain),
the NPCBrain boundary is intact, and the only save change is additive (`dinoZones?`, no `SAVE_VERSION` bump).

## Lore track

**Verdict:** APPROVED
**Item:** BACKLOG-306 — In-character homecoming

**Rationale:** The welcome-back beat now performs the returning dino's signature idle quirk — the closest
dino greets the keeper in its own body language ("Rex paces — You're finally back! 👋"), reading the exact
`fidget()` label the book (303) and the live above-head glyph (298) use, so all three always agree. All five
acceptance criteria pass: the line carries name + quirk label + 👋 (e2e), the label equals
`fidget(traitsOf(homecomer)).label` (e2e reads `__fidget` and asserts containment), two different
most-pronounced traits give different lines (unit), and — the load-bearing guarantee — calling `homecoming()`
with no quirk lookup returns the cycle-30 strings byte-for-byte, so the cycle-30 + cycle-112 specs stayed green
untouched. The change is minimal and pure: an optional clause on `homecomingLine`, an optional lookup param on
`homecoming()`, a one-method WorldScene supplier. `homecoming.ts` stays Phaser-free. Exactly the cheap,
high-distinctness surfacing the item asked for — body language that leaves the page and becomes a moment.

## Structure track

**Verdict:** APPROVED
**Item:** BACKLOG-274 — Populate the grove

**Rationale:** The grove is inhabited at last. Three real additions complete the spine: durable occupancy
(`dinoZones` persisted additively, old saves → all bowl, validated like `roles`), migration (a sparse
real-time roll on the proven sky-event cadence — capped ≤1/in-game-day, never on `clock.set()` — plus the
deterministic `__migrate` hook and an interior-tile reposition), and the proximity-interaction filter
(`nearestDino`, `checkFeeding`, `checkGather` all AND-gate the dino find on the existing `inView`). All seven
criteria pass. The decisive design call is right: **spawn is byte-identical** — the grove fills by migration,
not by relocating founders — so the 216 prior e2e are green by construction, and the new spec proves the
behaviour cleanly (a migrated dino drops out of the bowl, isn't `nearestDino` there, becomes visible +
interactable once the keeper crosses over, and survives a save/reload). The off-zone feed/gather gating shares
the very same one-line `inView` predicate the `nearestDino` e2e exercises, so it's covered by construction.
Reuse is total (one tiny pure `otherZone`); no new occupancy primitive.

**Scoped-out, not a regression:** world *objects* (food drops, cairns, the plot, spawned resources) still
render at bowl coordinates regardless of the active zone — the cross-zone prop bleed already queued as
BACKLOG-308. The design drew this boundary explicitly; 274 gates which *dino* may interact, 308 will gate where
*objects* draw. Worth picking 308 next so the grove's own floor isn't overlaid with bowl-built props.

## Housekeeping — BACKLOG-293 ABANDONED

Closed `[a]` this cycle as a confirmed duplicate of BACKLOG-286, which already persists the cairn (additive
`cairns` save field) and re-renders it on load (`drawCairn` in the restore loop). The cycle-64, -67, and -68
verdicts each flagged it; abandoning it now stops the structure queue from carrying dead debt forever. This
drops the open Structure Track to **3** (308 / 309 + the freshly-freed slot), so next cycle's Structure-smith
brainstorms to refill (cap X=4) before picking — likely 308 (zone-scoped world objects), the natural follow-on.

## Cycle close
Both tracks resolved APPROVED → the Lore-smith bumps to cycle 69. The Artist fires next (renderable-now work:
the plot's 🌱🌿🍓 crop stages for 145, then grove ambient props once 308 lands).
