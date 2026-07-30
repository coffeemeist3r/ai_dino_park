# Cycle 116 — Structure Handoff

**Intent:** Milestone 9's structure spine — governance made **transferable**. Last cycle (463) a zone's
provider set a spend priority read by two hooks, but it shipped silent: the priority re-sets whenever the
provider identity changes (`spendPriorityFor` recomputes on read), yet nothing *marks* the moment, so the
say passing from one dino to another is invisible. **BACKLOG-467** gives that turnover a beat: when a zone's
provider role passes to a new dino (448 — one out-banks the incumbent), the incoming provider's temperament
re-sets the table (already the case) and the handover lands a one-off **logged governance beat** on the
keeper's ticker ("Sunny sets the Grove's table now — mouths before walls"), so *who holds the say, and the
moment it turns over,* is legible instead of silent. Not a vote (031 stays deferred); the policy-setter's
turnover made visible.

**Chosen this cycle:** **BACKLOG-467** — The say changes hands. Top of the Structure Track queue and the
natural governance follow-up 463 opened. On-milestone (Milestone 9 structure arc 1 of 2).

**Added to Structure Track:** none. The queue sits at **4 open** (467/468/465/466) = cap X=4, so
drain-before-invent holds — no new structural items this cycle. 468 (the lens read) is Milestone 9's other
structure arc; 465/466 (seasonal yield / dry season) stay off-milestone in the queue for after.

**Shape for the Coder:**
- New pure module `world/handover.ts` — `handoverBeat(prevProvider, nextProvider, zoneName, priority)`
  returns the ticker line when there's a genuine change to a new non-null provider (`next !== prev && next`),
  else `null`. The line reads the new priority so governance colours it (feed → "mouths before walls",
  bank → "walls before mouths"). First emergence (prev `null` → a first provider) counts as the say *taking*
  hold and fires too. Node-testable; no Phaser, no roles store (providers passed in).
- WorldScene: a persisted, additive `lastProviderByZone: Record<string,string>` (absent → `{}` on load).
  A new `checkProviderHandover()` called at the **tail of `forceStep`** (after `checkGather`, so this step's
  banking is reflected): for each zone, compare `providerFor(zone)` to `lastProviderByZone[zone]`; on a
  changed non-null provider, `logEvent(handoverBeat(...))`, re-read `spendPriorityFor(zone)` (persists the
  new policy), and update `lastProviderByZone`. A `__providerHandover()` dev hook returning the last beat (or
  driving one) for the e2e.

**File-overlap note:** the lore track (469) touches `ai/brain.ts` + `WorldScene.pickTone`'s greet bag; this
track touches `WorldScene.forceStep` tail + `world/handover.ts` (new) + the save envelope. Both add to
`WorldScene.ts` in different methods; 467 adds one additive save field (`lastProviderByZone`), 469 adds
none — sequence the save-field addition cleanly. No shared logic.
