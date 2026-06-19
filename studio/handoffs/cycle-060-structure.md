# Cycle 60 — Structure Handoff

**Intent:** Make jobs durable. Roles already *emerge* from behavior (BACKLOG-020: gossip / homebody /
socialite / wanderer, derived live in `roles.ts` `deriveRole`), but because they're recomputed every
read, a role evaporates the moment the behavior that earned it fades — a socialite that stops mingling
silently reverts to 'wanderer'. BACKLOG-032 gives an emerged role *permanence*: once a dino has found
its place, it keeps it. This is the spine the persistent-civilization arc (guards, chefs that stay
chefs) builds on, and the natural structural follow to the role system.

**Cap rule:** 5 open items in the Structure Track ≥ X=4 → drain mode, no new structural items. Picked
the queue top (143 shipped last cycle; 032 is now top).

**Added to Structure Track:** none — drained from queue (5 open ≥ X=4).

**Chosen this cycle:** **BACKLOG-032** — Roles persist across cycles.

**Scope steer for the Designer (foundation-first, one fire):**
- A pure `settleRole(prev, derived)` in `roles.ts`: once a dino holds a **non-wanderer** role it never
  falls back to 'wanderer'; it only changes when a *different* non-wanderer role emerges. (prev absent
  or 'wanderer' → take derived; prev non-wanderer + derived 'wanderer' → keep prev; prev non-wanderer +
  derived other non-wanderer → take derived.) Fully unit-tested.
- Persist the settled role per dino in the save (additive `roles: Record<string, Role>`; absent → {}).
- WorldScene: route `roleOf(name)` through `settleRole` against the persisted store, write the settled
  role back, return it — so the lens, the book, and `__roles` all show the durable role. Restore the
  store on load.
- **Deferred (not this cycle):** role-specific *behavior* (a guard actually guarding) — 032's spine is
  the durable role *identity*; behavior driven by role is the BACKLOG-104 action-layer's job. Note it.
