# Cycle 130 — Structure Handoff

**Intent:** Milestone 13's third structure arc, and the last unpaid half of Milestone 8. The lean season (461)
gave the turning year a grip on *food* — a ground holds less in winter and its hoard spoils sooner — and the
year now reaches the pantry, the spoilage band, the den, the daytime cluster and the crop yield. It has never
once reached a **drink**. `THIRST_RATE` is the same number in August as in January, and the waterholes (445)
are seasonless furniture. 466 builds the mirror of `seasonGrip`: one pure per-season thirst modifier the needs
tick reads, so summer parches the bowl and winter eases it. Foundation-first — one multiplier plus the ticker
line that keeps the change from being silent; a visibly shrinking waterhole sprite stays deferred.

Picked ahead of 482 (the standings fold) deliberately: 482 is a refactor across the book, the lens and the
save, and it wants the two `[core]` items above it out of the way first — and 466 does not touch the lore
track's neighbourhood at all (403 lives in `pecking.ts` + the feeding branch; this lives in `seasons.ts` +
`needs.ts` + the waterhole hook). Two tracks, no shared function.

**Added to Structure Track:** none — drained from queue (4 open ≥ X=4).

**Chosen this cycle:** **BACKLOG-466** — the dry season. A pure `seasonThirst(season)` multiplier in
`seasons.ts` beside `seasonGrip`/`seasonSocialBias`, threaded through the trait-scaled `thirstRate` so it
composes rather than replaces; spring and fall exactly 1.0 so a fresh clock stays byte-identical to every
build since 371, matching the compatibility discipline 461/178/171 all kept. Summer quickens, winter eases,
the season-turn ticker says which — no silent change (CHARTER §Quality bar).
