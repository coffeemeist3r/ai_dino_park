# Cycle 71 — Design

Lore: BACKLOG-318 (mood lifts the motion). Structure: BACKLOG-314 (zone-aware
resource spawn).

---

## Lore track — BACKLOG-318 (Mood lifts the motion)

**Item:** BACKLOG-318 [emergent] — when a dino's transient funk clears, it throws a
brief brightened flourish of its signature quirk, so recovery reads in motion.

**Why this cycle:** Cycle 70 (310) made the idle fidget read a funk — a sulking dino
mopes (😒), a cold one shivers. But when the funk lifts, today the only signal is the
glyph quietly vanishing. 318 is the recovery twin: the same signature motion comes
back *brightened* for a beat, so making up with a sulking dino, or warming a cold one,
visibly bounces it back. Pure flourish reused at the two recovery sites that already
exist (125 repair, 184 thaw) — the smallest possible "minds show recovery" beat.

**What ships:**
- A pure `reliefFlourish(p)` in `world/fidget.ts`: the dino's signature quirk glyph,
  brightened with a sparkle (e.g. `🐾✨`). Deterministic from traits.
- When a sulk is repaired (the `pendingRepair` make-up greet, in `recordGreet` and
  `recordTone`) or a cold funk is thawed with its beat (`clearColdFunk`), the dino
  flashes that flourish above its head (reusing the existing `flashFeed` channel,
  which is separate from the repair/warm text bubble so they don't collide).
- A `__lastMoodLift()` dev hook returning the last flourish string fired (or null),
  and a pure `__moodLift(name)` passthrough so the flourish is assertable through the
  real scene build without staging transient state.

**Acceptance criteria:**
- [ ] `reliefFlourish(p)` starts with `fidget(p).glyph` and ends with `✨` (the signature motion, brightened).
- [ ] `reliefFlourish` is deterministic — same personality → same string.
- [ ] `__moodLift(name)` via the real build returns `reliefFlourish(traits)` for a known dino.
- [ ] The flourish fires through `flashFeed` at repair and at cold-thaw (verified by code path + the `__lastMoodLift` hook is wired at both sites).
- [ ] Build clean; prior repair (cycle-032 greet-runner-up) and cold (cycle-184) specs stay green — the flourish is additive (a flash beside the existing bubble).

**Out of scope:** the lingering perkier idle after a flourish (325); a smaller/slower
flourish for prickly dinos (327); any change to the affinity/memory of repair or
thaw (318 only adds a visual flash). No new bubble text.

**Constraints:** `fidget()` and `moodFidget()` stay byte-identical. No WebLLM. The
flourish must not replace the existing repair/warm bubble — it's a second, parallel
flash. Pure module — no Phaser in fidget.ts.

---

## Structure track — BACKLOG-314 (Zone-aware resource spawn)

**Item:** BACKLOG-314 [core] — resources spawn and live per zone, so each zone grows
its own gathering economy.

**Why this cycle:** There's one global resource slot and it only ever rolls in the
keeper's zone, so the inhabited grove (274) never accrues anything while you're in
the bowl. Making the resource per-zone gives the grove its own gathering: stuff
spawns there on its own cadence and is waiting when you cross.

**What ships:**
- The single `resource` / `resourceAge` / `resourceSprite` become **per-zone**
  (keyed by zone id). Each zone holds at most one resource.
- `maybeSpawnResource` rolls for **every zone that has resident dinos** (into that
  zone's empty slot) instead of only the keeper's zone — so the grove fills while
  you're away. Resource ages in every zone (so a grove resource is past its grace
  and immediately gatherable when you arrive).
- Gather + fetch operate on the dino's **own home-zone** resource; pickup still only
  fires for dinos in the keeper's active zone (the 274/308 gate is unchanged), so
  the grove's waiting resource is gathered the moment you cross into it.
- Only the active zone's resource sprite is visible (`applyObjectVisibility` loops
  the per-zone sprites).
- `__resource()` returns the active zone's resource, else any present resource (so
  the cycle-069 zone-objects spec, which queries a cross-zone resource, still holds);
  `__spawnResource(kind,x,y,fresh?,zone?)` defaults `zone` to the active zone (so
  every existing resource spec — which spawns in the bowl at boot — is unaffected).

**Acceptance criteria:**
- [ ] A resource spawned in the bowl (active) and one in the grove can exist at the same time (two slots, not one).
- [ ] With a resident dino in the grove, a resource rolls into the grove **while the keeper stands in the bowl** (the grove grows on its own).
- [ ] A grove resource is NOT picked up while the keeper is in the bowl; crossing into the grove, a grove dino on it gathers it (the 274/308 gate holds).
- [ ] `__spawnResource('branch',5,5)` with no zone arg spawns in the bowl at boot (existing specs unaffected); cycle-062/064/065/069 all green.
- [ ] Only the active zone's resource sprite is visible; crossing zones swaps which is shown.
- [ ] Build clean; the stockpile cap (309) and craft (286) loops still work per the active zone.

**Out of scope:** per-zone *stockpile* (banking is still one shared pile — that's
328); carrying resources across zones (329); per-zone spawn-rate tuning; saving the
transient resource (it's not persisted today, unchanged).

**Constraints:** additive, no save change (resource is transient). Keep
`__resource()` / `__spawnResource()` backward-compatible (above). The stockpile/cap
path (309) is shared and must stay green. Resident-zone detection reuses `zoneOf` /
`dinoZones`.

---

## Cross-track collision

Both touch `WorldScene.ts` but in disjoint areas: 318 → `world/fidget.ts` +
`recordGreet`/`recordTone`/`clearColdFunk` (the recovery sites) + a flourish helper;
314 → the resource fields + `maybeSpawnResource`/`spawnResource`/`checkGather`/the
`forceStep` fetch branch + `applyObjectVisibility`. No shared methods. Pure modules
are different files (`fidget.ts` vs `resource.ts`). Either order is safe.
