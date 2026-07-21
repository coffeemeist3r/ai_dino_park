# Cycle 107 — Verdict

## Lore track

**Verdict:** APPROVED
**Item:** BACKLOG-452 — Homecoming from the road

**Rationale:** All eight acceptance criteria PASS with e2e evidence on the real `crossDino` path, not a
shortcut hook. The design's mechanical claim — that a homecoming *resettles* rather than merely decorating —
is honored: the returner overrides 341's tenure reset and reads `settled` on arrival, which feeds straight
back into the settle-resist so a returned dino actually stays. The negative cases are pinned as tightly as
the positive one (no root, wrong destination, same-zone no-op, nobody home), so the beat can't fire by
accident. Logic sits in `belonging.ts` — the module that already owns settle/tenure/home semantics — rather
than a fourth "where a dino lives" module, and the save field is additive with a round-trip test. No scope
creep, no boundary breach.

## Structure track

**Verdict:** APPROVED
**Item:** BACKLOG-448 — The provider role

**Rationale:** Ten of ten criteria PASS. The item could have been satisfied with a one-line role branch over
the existing courier count; the chain instead caught (at the Lore-smith, sharpened by the Structure-smith)
that a tally fed only by crossings would make `provider` a synonym for `wanderer`, and shipped the second,
honest source the item's own wording asks for — the resident that hauls the harvest share to the store. The
at-cap guard is the right kind of care: no credit for hauling nothing. Durability comes free from the 032
`settleRole` spine, and the optional `foodBanked` stat keeps every pre-448 call site and test byte-identical.
Two real bugs were found and closed in-cycle (below); both are improvements to the milestone's own spine.

**On the scope creep (approved):** `foodPileByZone` was declared on `SaveData` but never validated or
returned by `deserialize` — banked food had been silently resetting on every reload since 446 shipped in
cycle 103, unpinned by any test. The fix is one validation block in a file this track was already editing,
and refusing it would have meant adding a *new* persisted field beside a known-broken one. Approved as
planned, now pinned by a round-trip unit test.

**On the flake fix (approved):** `cycle-097-carry-pressure` was genuinely flaky — a bowl dino gathering
mid-crossing auto-crafts a cairn, drains the source under the soft cap, and the pressured two-unit shed
collapses to one. QA reproduced it against `HEAD~1`'s `game/src` (1 failure in 6) before touching it, which
is exactly the discipline the cycle-93 `git stash` reproduction established: prove pre-existing before you
call it pre-existing. Fixed test-side by gluttng the zone with a kind its own recipe can't spend.

**Follow-up seeded:** BACKLOG-456 [infra] — `cycle-077-carry` shares that flake family (a pinned pile
asserted across a multi-step crossing is exposed to ambient gathering). Isolated 10/10, so it is noted, not
a regression, and the item covers the pattern rather than the one spec.

## Cycle

Build clean · vitest **1238/1238** (136 files) · playwright **364 specs**, best full run 363/1 with every
failure passing isolated. `@mlc-ai/web-llm` still imported only under `game/src/ai/`. Save additive.
Milestone 6 arcs closed this cycle: **lore arc 2** (452) and **structure arc 3** (448). Three arcs remain —
450 (scarcity moves the herd), 449 (one terrain per zone, as data), 453 (word of the provider, now unblocked).
