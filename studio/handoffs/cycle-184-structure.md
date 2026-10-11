# Cycle 184 — Structure Handoff

**Intent:** Milestone 28's second spine arc. The festival has a calendar and a gathering but one generic shape: the
same 🎏 banner and the same words in every season. BACKLOG-597 gives each season its own rite — spring's blossom
ring, summer's sun dance, fall's harvest heap, winter's lantern vigil — with its own banner, bubble and memory, and
puts a prop at the pond for the length of the festival. That prop is the host the Artist has been waiting on
(cycle 183-art no-op'd for want of it).

**Reachability:** a fresh save boots on day 1 of spring at 08:00. At 10:00 the banner names the blossom ring, a
blossom mark stands at the pond and the circle floats 🌸. The other three rites are a `__setClock` away for the specs.

**Added to Structure Track:** none — drained from queue (597, 563, 581 open; tentpole arcs come first).

**Chosen this cycle:** BACKLOG-597 — each season's rite + a drawn festival mark.

**Collision check:** shares `world/festival.ts` and `openFestival` with 595. One Coder fire: 597 owns the rite table,
banner/bubble/memory variants and the pond prop; 595 owns the after-festival greet opener.

**Solo cycle:** not declared.
