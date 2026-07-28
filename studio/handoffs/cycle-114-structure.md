# Cycle 114 — Structure Handoff

**Intent:** Close the honest gap 455 left behind. The pantry-spoilage sink (455) rides a live-only `onHour`
day hook, which never fires on a restore/away `clock.set` — so a hoard banked and walked away from survives a
long absence *untouched* while the away digest (106) fast-forwards everything else. 462 folds spoilage into the
away catch-up: apply the elapsed in-game days' worth of the same capped, self-limiting decay when the clock
jumps a gap, and surface it in the "while you were away" digest. Deterministic (day-count in, no rolls), never
below the safe floor — the completion of 455's live-only spine, and Milestone 8's fifth (final structure) arc.
It pairs cleanly with the lore pick (178, the socialize roll) — **no file overlap** (spoilage/away vs. the
step-loop social roll), so the Coder's two-track fire stays clean.

**Added to Structure Track:** none — drained from queue (4 open ≥ X=4).

**Chosen this cycle:** **BACKLOG-462** — Spoilage while you're away (the day-counted decay in the away catch-up,
surfaced in the homecoming digest).
