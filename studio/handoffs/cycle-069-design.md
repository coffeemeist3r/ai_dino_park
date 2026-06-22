# Cycle 69 — Design

## Lore track — BACKLOG-312: Quirk in the scan

**Spec.** LUMEN-3's Field Scan dossier (`keeper/scan.ts`, `scanLines`) gains one line reporting the
subject's signature resting quirk, read from the same `fidget()` the bowl glyph (298), the book (303),
and the homecoming (306) use. Pure formatting over the subject already passed in; no new state.

**Acceptance criteria.**
1. `scanLines` output contains a `habit:` line carrying `fidget(subject.traits).glyph` and `.label`.
2. The line equals what `fidget()` returns for the same traits (no second derivation).
3. Determinism preserved: the same subject scans identically twice.
4. The pre-312 lines (header, species·role, five axes, mood, favorite food) are all still present and the
   season-sensitive favorite line still differs winter vs summer (existing scan tests untouched).
5. e2e: as LUMEN-3, B beside a dino shows a dossier whose `habit:` line matches `__fidget(name).label`.

## Structure track — BACKLOG-308: Zone-scoped world objects

**Spec.** Each world object carries a home zone and renders + interacts only there.
- **Resource:** records the active zone at spawn; drawn only when that zone is active; gatherable only
  when `resource.zone === activeZone` (AND-ed onto the existing 274 `inView` dino gate).
- **Cairn:** records the crafter's zone at placement; each cairn sprite drawn only when its zone is
  active. Persisted via an additive `zone` field on the existing `cairns` save array (old saves → bowl on
  restore; no `SAVE_VERSION` bump — mirrors `dinoZones`).
- **Plot:** fixed bowl installation — sprite drawn and P-workable only in the bowl.
- Render visibility re-applied on every zone switch (edge-walk cross, the `__setZone` hook) and on
  restore.

**Acceptance criteria.**
1. A resource dropped in the bowl reports `zone: 'bowl'` and its sprite is visible in the bowl, hidden in
   the grove, visible again back in the bowl.
2. The plot sprite is visible in the bowl, hidden in the grove.
3. A resource is gathered only in its own zone: a grove resource is untouched while the keeper is in the
   bowl, and picked up once the keeper is in the grove (proves the `resource.zone` gate, not just `inView`).
4. The plot cannot be planted/harvested from the grove.
5. A cairn's `zone` round-trips through save/load; a pre-308 cairn (no zone) still loads (backfilled to
   bowl); a non-string zone is rejected.
6. Spawn + the existing 219 e2e are byte-identical in behaviour (objects default to the bowl, the only
   zone present at boot).

**Out of scope:** per-zone resource *spawn cadence* (BACKLOG-314); dino-built structures beyond the cairn
(BACKLOG-315). 308 only scopes the objects that already exist.
