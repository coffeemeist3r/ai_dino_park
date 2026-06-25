# Cycle 77 — Design (two tracks)

## Lore track — BACKLOG-346 Pond-swappers

**Item:** BACKLOG-346 [social] Pond-swappers — two grove-visited dinos who meet swap pond notes: a small shared-place bond bump + a memory each.

**Why this cycle:** The grove arc has made *one* dino at a time discover the pond (339 arrival, 342 the news, 345 the pull). The natural next beat is social: once two dinos have *both* stood by the pond, the place becomes something they have in common. This is the grove's version of stargazing companions (288) — shared experience knits a specific pair — and it reuses the exact same spines (the converse seam, `strengthen`, the memory store), so it's a clean, lazy add.

**What ships:** When two dinos converse (the existing ambient NPC-meet) and **both** have set foot in the grove (`groveVisited`), they trade pond notes: each files a `🌿 traded pond stories with <other>` memory and their pairwise bond ticks up by a small `POND_BOND`. A 🌿 log line marks it ("Rex and Twitch compared notes on the grove"). Watch two returned travelers bump into each other in the bowl and come away a little closer. A meeting where either dino has never crossed produces no swap.

**Acceptance criteria:**
- [ ] When two grove-visited dinos converse, **each** dino files a memory naming the other in the form `traded pond stories with <other>`.
- [ ] The pair's bond increases by `POND_BOND` (symmetric — `strengthen` applied once for the unordered pair), and `POND_BOND` is a small positive constant (≤ the sky's `SHARED_WONDER_BOND`).
- [ ] A meeting where **at least one** dino is not in `groveVisited` produces **no** pond-swap memory and **no** bond change from the swap.
- [ ] The pond-swap memory does **not** re-spread as grove news — it must not contain `GROVE_NEWS_TOKEN`, so `spreadGroveWord` never picks it up (verified: a dino holding only a pond-swap memory spreads nothing groveward).
- [ ] A `__pondSwap(a, b)` dev hook returns the swap result computed off the live `groveVisited` set (drives the e2e headless, no model).
- [ ] Existing converse behaviour is unchanged when the swap doesn't fire — cold/warm/relief/grove/gossip cascade and the sympathy/grateful block are byte-identical (the swap is an additive, independent block).

**Out of scope:** Temperament-coloured swap line (354), the book tie (353), the stronger told-to-your-face pull (355), any one-shot/cooldown limit (the bond saturates at the 100 cap; repeat swaps are harmless — note it, don't gate it).

**Constraints:** Pure predicate in `world/groveword.ts` (no Phaser, no AI import — the `NPCBrain` boundary holds). The swap memory text must be provably distinct from `GROVE_NEWS_TOKEN` (`'pond over in the grove'`) — unit-pin it. No save-format change (memories + bonds already persist).

## Structure track — BACKLOG-329 Carry between zones

**Item:** BACKLOG-329 [core] Carry between zones — a dino crossing zones ferries one banked resource with it, the first link between the two zone economies.

**Why this cycle:** Per-zone resources (314) and per-zone stockpiles (328) gave each zone its own economy, but the two are sealed: a pile only ever grows from local gathering, never from the other zone. 329 opens the first trade route — a visible crossing (334) now *moves* one banked resource between piles — the prerequisite for directed carry (356) and edge barter (358), and the thing that gives divergent piles (348) a point.

**What ships:** When a dino completes a visible crossing (`crossDino`), if the zone it's **leaving** has a banked resource to spare and the zone it's **entering** isn't at cap for that kind, it carries exactly **one** resource across: the source pile drops by one, the destination pile gains one. A 🪵/🪨 log line names it ("Rex carried a branch to The Grove"). The instant teleport paths (`__migrate`/`relocate`) do **not** carry — carry rides only the watchable crossing, keeping every existing migration/zone spec green by construction.

**Acceptance criteria:**
- [ ] A dino completing `crossDino` with a non-empty **source-zone** pile and the **destination** zone below cap for the carried kind moves exactly one resource: source `−1`, destination `+1` (total conserved across the two piles).
- [ ] An **empty** source-zone pile → no carry; both piles unchanged.
- [ ] The destination zone at cap for **every** kind the source could offer → no carry; both piles unchanged (lossless — nothing vanishes).
- [ ] A log line names the carried kind and the destination zone.
- [ ] The instant `__migrate(name, zone)` / `relocate` path performs **no** carry (parity: existing cycle-068/069/071 migration + zone specs stay green).
- [ ] `__zoneStockpile(z)` reflects the post-carry piles for both zones; the pick of *which* kind to carry is deterministic (a pure helper, unit-tested).
- [ ] `stockpileByZone` still round-trips through save unchanged — no `SAVE_VERSION` bump.

**Out of scope:** Directed/needs-based carry (356 — this cycle ferries a deterministic spare, e.g. the most-stocked kind), two-way barter (358), carrying more than one resource, carrying on the instant teleport path.

**Constraints:** Pure pick-one-to-carry helper in `world/resource.ts` (mirrors `bankResource`/`craft` — returns new piles, never mutates). The transfer + log live in `WorldScene.crossDino` only. Reuse `pileFor`/`bankResource`/`atCap`. **Cross-track file note:** both tracks touch `WorldScene.ts` but in **different methods** — lore in `converse`, structure in `crossDino` — no region overlap; Coder may build in either order.
