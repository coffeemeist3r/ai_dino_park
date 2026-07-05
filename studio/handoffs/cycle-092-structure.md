# Cycle 92 — Structure Handoff

**Intent:** Close Milestone 1's persistence spine. The migration *rail* itself already
shipped early (BACKLOG-040: `SAVE_VERSION`, an ordered `MIGRATIONS` table keyed by
from-version, a `migrate()` chain, and a worked v1→v2 step in `saveGame.ts`). What BACKLOG-426's
own text names but that 040 never shipped is the **root of the rail**: today a *versionless*
save (the oldest, pre-versioning shape) is **rejected** by `migrate()` (`v < 1 → null`) and
silently becomes a new game — a data-loss trap. 426 roots the chain at v0: a missing `version`
is read as 0 and lifted through a v0→v1 no-op migration, so *every* save, from the very first,
rides the migration chain instead of being discarded. Small, honest, and the one thing that
makes "a save that can grow" true from the origin — the milestone's last structure arc.

**Added to Structure Track:** BACKLOG-428 (zone prosperity index), BACKLOG-429 (zone carry
pressure) — the queue sat at 3 open (417/418/426, below cap X=4), so seeded two foundation
items that keep the resources→economy arc alive past the milestone (a zone-health read; the
first inter-zone flow pressure). Both structural, foundation-first.

**Chosen this cycle:** **BACKLOG-426** — root the save-migration rail at v0 so versionless
saves load through a v0→v1 no-op instead of being rejected. Milestone 1 structure arc 3
(final). File-disjoint from the lore track: 426 touches only `saveGame.ts` + its unit test;
the lore track (012, daily plan) touches `ai/` + `WorldScene` + the book, and is deliberately
kept out of the save path. No collision.
