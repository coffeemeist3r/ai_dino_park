# Cycle 88 — Design

Two file-disjoint tracks. Lore: catch a dino mid-ritual and it gets shy. Structure: the
third zone finally gathers its own thing.

---

## Lore track — BACKLOG-408 Caught mid-tic

**Item:** BACKLOG-408 [social] — a dino the keeper greets while it's deep in its solitary
tic (405) startles (😳) and its next line comes out bashful, as if caught doing something private.

**Why this cycle:** Cycle 87 gave a lone dino a private ritual (405); cycle 88's whole point
is to let the *player* discover one in the act. The tic was distinctness the player could only
watch from afar — this makes it something you can walk up on and get a reaction to, turning a
background behaviour into a personal, funny, memorable moment. The player is not a dino, so
approaching to greet never counts as the company that breaks a tic (405's `companyNear` scans
only other dinos) — a dino can genuinely be mid-ritual when you press greet.

**What ships:** When you press E/Z near a dino that is *currently mid-tic* (it has invented
its signature ritual this solitary stretch — WorldScene's `ticInvented` holds its name), the
dino startles: a 😳 flash floats over it as the greet opens. When you then pick a tone and its
reply appears, the reply is prefixed with a short, deterministic **bashful opener** (e.g.
`*startled* Oh—! You caught me…`) so the line reads as being caught doing something private.
It files a one-time memory naming the ritual (`caught you mid-<label> — the keeper saw`). A dino
that is *not* mid-tic greets exactly as before (no 😳, no opener, byte-identical). The bashful
framing is deterministic — it wraps whatever the brain **or** the StubBrain returns, so it works
with no model and tests headless.

**Acceptance criteria:**
- [ ] Greeting a dino that is mid-tic (has invented its tic) floats a 😳 startle over that dino as the greet opens.
- [ ] After a tone pick, that dino's shown reply begins with a deterministic bashful opener (present with StubBrain, no model needed).
- [ ] Greeting a dino that is NOT mid-tic shows the normal reply with no bashful opener and no 😳 — byte-identical to the pre-408 greet flow.
- [ ] Being caught files a one-time memory naming the ritual, retrievable from that dino's recent memory; it does not re-file on a second greet within the same solitary stretch.
- [ ] The catch changes neither the tone affinity delta (142) nor any bond — it only colours the reply and files a memory.
- [ ] A dev hook drives it deterministically: put a named dino mid-tic, greet + pick a tone, observe the bashful reply + the 😳 + the memory.

**Out of scope:** BACKLOG-407 (shared tic); the high-affinity "pleased not bashful" variant
(413, seeded); any LLM-authored bashful prose (we frame deterministically, we don't prompt for it).

**Constraints:** Must not break the tone-greet flow (142) or the E/Z dialog. Model-optional
(no dependence on WebLLM; stays behind the `NPCBrain` boundary — we wrap the returned text, we
don't ask the model to be bashful). Reuse `ticInvented`/`signatureTic`/`flashFeed`/`remember`.
Shares `WorldScene.ts` with the structure track but in a different method (the greet path
`openToneMenu`/`pickTone` vs `maybeSpawnResource`) — no function overlap.

---

## Structure track — BACKLOG-400 Third-zone resource bias

**Item:** BACKLOG-400 [emergent] — the third zone (378) leans its own resource kind,
extending the per-zone bias (348) past two so the chain runs three diverging economies.

**Why this cycle:** The Fernreach has a spine (378), terrain (399), and ground art (fern 406)
but no economy of its own — resource bias (348) is a two-row table, so the Fernreach inherits
the uniform 50/50 fallback and gathers the same stone/branch its neighbours do. Leaning it
toward a third kind is the last piece that makes the three zones *distinct places* to gather,
and it gives directed carry / barter (356/358) a genuine third pile to balance.

**What ships:** A third resource kind — a **frond** (🌾) — the Fernreach's ground turns up.
`ZONE_BIAS` gains `fernreach → frond`, so resources rolled in the Fernreach lean frond (past
`BIAS_WEIGHT` the off-kind still appears), the same lean the bowl has toward stone and the grove
toward branch. Bowl and grove roll **byte-identically** (their bias rows unchanged; the existing
favoured-vs-off logic yields a branch/stone off-kind for every zone, so frond is *Fernreach-
exclusive* — it never leaks into another zone's roll). Frond banks into the per-zone stockpile,
shows in the Stores readout as `🌾 N`, and can be carried/bartered as a spare like any kind.
Frond is **not** a craft-recipe kind this cycle, so a Fernreach dino still raises a cairn by
default (the frond-distinct structure is the seeded follow-up 417). Save is additive
(`Stockpile = Partial<Record<ResourceKind, number>>`) — no version bump.

**Acceptance criteria:**
- [ ] `pickKind(rng, fernreach)` returns 🌾 frond more often than not; over many seeded rolls the frond share ≈ `BIAS_WEIGHT` (favored), the rest a branch/stone off-kind.
- [ ] `pickKind(rng, bowl)` leans stone and `pickKind(rng, grove)` leans branch with the **exact** pre-400 distribution — frond never appears in a bowl or grove roll (a seeded-RNG parity assertion).
- [ ] `pickKind(rng)` with no zone (or an unbiased zone) returns a uniform 50/50 branch/stone, never frond — back-compat.
- [ ] A banked frond appears in the Fernreach's Stores plaque line as `🌾 N`, in `RESOURCE_GLYPH` order after branch/stone.
- [ ] `pickCarry` can ferry a frond as a spare between piles; `directedCarry` does **not** target frond for the cairn/lean-to recipe (frond isn't a recipe kind) — it falls back to a spare, and cairn balancing (356) is unchanged.
- [ ] `barterSwap` treats frond as a normal kind (a Fernreach pile heavy with frond can hand one to a neighbour via the spare fallback).
- [ ] An old save with no frond loads unchanged (no `SAVE_VERSION` bump); a Fernreach pile that banks frond persists and restores it.
- [ ] `zoneStructure(fernreach)` / `structureRecipe(fernreach)` resolve to a valid structure (frond → cairn default; `STRUCTURE_BY_BIAS` is type-complete over the new union).

**Out of scope:** A frond-distinct *structure* (417, seeded); making frond a craft ingredient;
a third-zone plot crop (418, seeded); resource regrowth (384).

**Constraints:** Bowl/grove gathering distribution byte-identical (the cycle-078 bias parity
spec is the guardrail). Additive save only — no version bump; save validation must accept the
new key. No exhaustive `switch` on `ResourceKind` exists today (confirmed) — the union add is
safe, but the Code-planner must grep for any hard-coded `branch`/`stone` pair (sprite draw,
stockpile display, save validation) that would silently exclude frond. Shares `WorldScene.ts`
with the lore track in a different method.
