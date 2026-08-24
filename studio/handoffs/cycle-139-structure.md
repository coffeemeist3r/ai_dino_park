# Cycle 139 — Structure Handoff

**Intent.** The spine this cycle is *governance you can walk up to*. Since 479 the park has built two
votes, a term, a turnover beat, a bill lean and two lens glyphs on top of three constants —
`COUNCIL_MIN_BANKS`, `COUNCIL_PER_HEADS`, `COUNCIL_SEATS_MAX` — that were picked in cycle 119 against a
single five-dino bowl and have never been re-read since the cast was spread across five grounds. 492 had to
seed a founding bank ledger *by hand* to make any of it reachable, and it discovered the need by accident.
Nothing in the repository states what population governance is designed to be observable at, and nothing
asserts the shipping roster clears it — so the next tuning pass to the cast size, the banking rate or the
seat cap takes the whole of politics dormant again, silently, with every spec green. That is precisely the
failure mode CHARTER v7 was amended to stop.

**Added to Structure Track:** BACKLOG-500 (the grounds nobody lives on), BACKLOG-501 (the reachability
register). The track stood at **2 open**, below the cap of X=4, so this fire brainstormed before draining.

**Chosen this cycle:** **BACKLOG-497** — *the council nobody can convene*.

**Why 497 over 495 (the top pointer).** 495 asks for a declared founding fixture for the *e2e suite*: a
seam a spec opts into by name. It is the right item and it is bit-identical by construction — no player
sees a fixture. Under CHARTER v7 that is a REWORK waiting to happen, and it is also the wrong order:
495 wants to name "what founding state a spec wants", and the founding state's own governance claim is
still undeclared, so 495 would be naming a fixture whose most load-bearing assertion has no home yet.
497 first, 495 next.

**The reachable half, named up front (CHARTER v7).** 497 as filed is a documentation-and-test item, and a
documentation-and-test item ships nothing a player can see. Reading the constants against the shipping
roster turns up the thing that makes it a real cycle: the founding park seats **exactly one council, of
exactly one seat**. The Grove has two residents, `councilSeats(2, 2) = 1`, and every other ground seats
nobody — the bowl, where the player spawns and where five of the eight dinos live, has banked nothing and
therefore has no politics at all. So every governance beat the park has built that needs *more than one
ballot* — the majority arithmetic (487), the tie-break, a call that can split — is unreachable on a fresh
save for the same reason the whole system was unreachable before 492. Ship the seam **and** a founding bowl
ledger that seats a council which can disagree, in the same cycle, exactly as v7's corollary demands.

**Collision check with the lore track.** BACKLOG-411 lives in `world/tic.ts` + the greet path in
`WorldScene`; 497 lives in `world/founding.ts`, `ai/roles.ts` and the founding-seed branch. They meet only
in `WorldScene` and not in the same method. Clean two-track fire.
