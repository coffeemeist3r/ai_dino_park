# Cycle 173 — Structure Handoff

**Intent:** Break the phone's capacity wall. BACKLOG-552 has sat top of the Structure Track while three
milestone items went past it, and every keeper verb added since has shipped keyboard-only because of it:
`R` (Read the Room, cycle 164), `P` (the plot), `N` (the book cursor), `?` (help). The Android PWA is a
shipping surface; a verb it cannot reach is a verb half the audience does not have.

**Off-milestone, with reason:** Milestone 23's structure arcs are all closed (3/3). This is the top of the
queue and on-surface for the whole park, not one milestone.

**The spine:** option (b) from the item — `sheetRows` grows a second column to the left of the first, so
the sheet holds up to twenty rows with the same pitch and the same clearance from the action cluster. It
stays pure geometry; the geometry test becomes a pairwise-disjoint and clears-the-cluster check instead
of "each row below the last", so the next verb is a one-line addition and a failing test if it ever
does not fit. The four keyboard-only verbs get rows.

**Added to Structure Track:** none — drained from queue (4 open ≥ X).

**Chosen this cycle:** BACKLOG-552 — the More sheet is full.
Files: `input/touch.ts`, `WorldScene.onTouchButton`, the touch unit test + e2e. No overlap with the lore
pick beyond WorldScene, where the two touch different methods.
