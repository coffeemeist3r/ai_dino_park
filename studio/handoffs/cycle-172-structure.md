# Cycle 172 — Structure Handoff

**Intent:** Finish the bond range. Cycle 171 fixed both ends of it at *boot* (founding friends) and at
the *top* (`meetGain` makes 100 an asymptote), and named what it did not fix: nothing ever goes down.
A pair split across grounds keeps its bond forever, and a pair that is always together still reaches
~99.6. Tonight the graph gets its missing direction — a friendship not kept up cools — which is what
makes Milestone 23's "and it moves while you watch" true of the numbers, not only of the words.

**The spine:** `driftBonds(bonds, rate)` in `social/bonds.ts` — every bond above `BOND_REST`
(= `LONER_FLOOR`, 8) moves `rate` of the way toward it; nothing at or below rest moves. Called once per
ambient step (`forceStep`, every 3 s) beside the meeting loop, under the same `ambientHeld` gate. The
rate sets the always-together equilibrium: with `meetGain` = 4·(1 − b/100) per meeting and a meeting
every step, drift of 0.4 %/step settles near 92; a pair apart halves its distance to rest in ~9 real
minutes. Saves unchanged.

**Why the rest is the floor and not zero:** four systems read 8 as "has a friend". Drift crossing it
would turn a quiet cooling into a loner, a grief tic and a withdrawn comforter all at once, which is a
different feature (estrangement) and not one to ship by accident.

**Added to Structure Track:** BACKLOG-570 (bonds drift), BACKLOG-571 (the friend-found moment's host,
which unblocks 568) — the queue was at 3, under X=4.

**Chosen this cycle:** BACKLOG-570 — bonds drift. Milestone 23 structure arc added for it.
Files: `social/bonds.ts` + one call in `WorldScene.forceStep`; no overlap with the lore pick's
book/circle files beyond WorldScene, where the two touch different methods.
