# Cycle 61 — Verdict

Third two-track cycle. Judged per track.

## Lore track
- **Verdict:** APPROVED
- **Item:** BACKLOG-276 — The keeper has a name
- **Rationale:** All 8 criteria pass. The fond pole of the greeting ladder (272) now turns outward: a
  ≥8-heart dino names the *observer* by designation ("There you are, AETHER-1!") instead of naming itself,
  so deep friendship is the thing that earns your name in its mouth. The cut is minimal and disciplined —
  a pure `designationOf` helper in `keepers.ts`, an optional `NPCContext.keeperName`, a two-arm
  `fondGreeting` that falls back byte-for-byte to the cycle-272 line when no designation is supplied, and
  the same string threaded through the canned and LLM paths plus the two greet sites. The NPCBrain
  boundary held (the designation is computed in the scene and passed in; `ai/` imports no `keeper/`). The
  one in-fire fixup — cycle-060's e2e expecting the dino's name in the fond line — is exactly the feature
  changing what the old test pinned, and the cycle-060 *unit* tests stayed green untouched (they pass no
  keeperName). No save or world change on this track. `reworkCount` clear.

## Structure track
- **Verdict:** APPROVED
- **Item:** BACKLOG-040 — Save format versioning + migration hook
- **Rationale:** All 8 criteria pass. The save's exact-version gate, which would have *discarded* any
  future non-v1 save, is replaced by a real migration path: `SAVE_VERSION` is 2, a pure exported
  `migrate(raw)` lifts an older save up the `MIGRATIONS` chain (the 1→2 step is the no-op stamp that proves
  the hook), and `deserialize` migrates-then-validates. Critically, old saves still load — a v1 payload,
  including one carrying only a subset of additive fields, upgrades cleanly to v2 with defaults applied —
  so the additive-only rule is honored by the very mechanism that now makes *non*-additive changes safe.
  Unknown/newer/missing versions are still rejected. This is the load-bearing infra the last two verdicts
  flagged, landed before 146/145/274 each add more state — the unglamorous spine, exactly the
  Structure-smith's mandate. `saveGame.ts` only; the existing save-test suite stayed green untouched.
  `reworkCount` clear.

## Notes
- Both tracks APPROVED → cycle closes; Lore-smith bumps to 62 next run.
- Diff is 10 files (5 src, 5 test), +273/−14, no new deps, no framework, boundaries verified.
- Follow-ups standing: lore 275/277 + this cycle's 278–282 (the greeting ladder can now escalate to the
  nickname, the hour, keeper-swaps, a named dino-friend, or the book). Structure queue back to 146/145/274
  with the version+migration hook now in place under all of them.
- **The save can now evolve, not just accrete.** The next structural field can ship as a real migration if
  it ever needs to be non-additive; until then the additive habit still works and is still cheapest.
