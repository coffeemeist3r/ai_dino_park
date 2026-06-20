# Cycle 62 — Structure Handoff

**Intent:** Open the civilization arc. The save just gained its version + migration hook (040 last
cycle), so the build arc can finally start laying state down. The first beat is the **resource-gathering
spine** (146): a raw resource appears in the bowl, a dino notices it, walks over, and picks it up,
accruing a tally. Gathering only — crafting/building/governance stay deferred. It mirrors the proven
feeding spine (`world/feeding.ts`), so it's low-risk and reuses `stepToward`/`reachedFood`.

**Cap rule:** the Structure Track had fallen to **3 open** (146/145/274) — below X=4 — so I brainstormed
**2 new items** to refill before picking:
- **BACKLOG-285** — Resource stockpile (gathered resources bank into a shared per-kind park total, persisted + readout).
- **BACKLOG-286** — First craft (at a stockpile threshold a dino crafts one simple object — the first resources→craft step).

**Added to Structure Track:** BACKLOG-285, BACKLOG-286 (queue now 5 open: 146[~]/145/274/285/286).

**Chosen this cycle:** BACKLOG-146 — resource gathering spine (raw resource spawns → a dino fetches it →
per-dino tally + additive save). Top unblocked item; queue-order pick.

**Collision check:** the lore track (278) touches `keeper/` + `ai/` + the two WorldScene *greet* sites.
146 touches a new `world/resource.ts` + the WorldScene *world-tick/spawn* region + an additive save field.
No file overlap in `keeper/`/`ai/`; both edit WorldScene but in different methods (greet glue vs. tick/
spawn glue). Coder sequences cleanly; flag the shared file in the codeplan so edits don't clobber.
