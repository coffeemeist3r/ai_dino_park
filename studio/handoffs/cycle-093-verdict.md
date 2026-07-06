# Cycle 93 — Verdict

## Lore track

**Verdict:** APPROVED
**Item:** BACKLOG-341 — home-zone settling (a dino belongs to a zone)

**Rationale:** All six acceptance criteria PASS. The item was honestly reshaped from its grove-specific
text ("prefers the grove") to the general spine the milestone needs, and it lands the observable behavior:
a dino accrues residence tenure on the migration cadence, crosses `SETTLE_ROLLS` and becomes settled
(e2e: tenure 3 → not settled, 4 → settled), the collection book then reads "at home in Pocket Cretaceous",
and a zone change resets tenure to 0 (home starts fresh). The logic is a clean pure module
(`world/belonging.ts`) with the scene glue thin, exactly per CHARTER; the deterministic floor is real —
no WebLLM anywhere near it, and the one piece of randomness (the settled-resist damp) is isolated behind an
injectable `rand` and unit-pinned at both bounds. It touches the save additively (a new `tenure` field,
undefined-when-absent, no version bump) so an old save loads clean and settles from scratch. The settled
dino genuinely migrates less (the resist gate in `maybeMigrate`), so "home" stops being a per-roll accident
— which is precisely what the next two lore arcs (the departed-friend tic 414, homesickness 340) need to
mean anything. No scope creep, no CHARTER breach. **Milestone 2 lore arc 1.**

## Structure track

**Verdict:** APPROVED
**Item:** BACKLOG-417 — the Fernreach's frond thatch

**Rationale:** All six acceptance criteria PASS. This closes a real gap 377 left open: the frond bias had
been an explicit `'cairn'` placeholder, so the three-zone chain raised only two landmark kinds and the
frond-rich Fernreach couldn't spend its own gather. 417 wires the stashed 427 rig into the world with its
own `{frond:4}` recipe, and the e2e proves the chain now raises three distinct structures (bowl cairn /
grove lean-to / Fernreach thatch), the thatch spends the pile exactly, renders from the pixel rig
(`__thatchIsArt` true, not the glyph fallback), and survives a save round-trip additively (version stays 2).
The refactor to a single generic `buildStructureFor` is the right call — it collapses what would have been a
third bespoke afford/spend pair into one path keyed off `structureRecipe`, and I checked that the cairn/
lean-to math stays byte-identical through it (the cycle-074 shelter spec + the whole craft/carry/barter set
are green). The frond recipe now feeds carry/barter, but frond is Fernreach-exclusive (400) so those cleanly
fall back to a spare — no cross-zone regression, confirmed by the barter spec. The one overturned test
(cycle-088's "Fernreach builds a cairn by default") was correctly updated to the thatch behavior — its own
old name pointed at 417 as the follow-up, so this is an intended contract change, not a silenced failure.
**Milestone 2 structure arc 1.**

## Cycle-level

Build clean; **1020 unit green (+15 net)**; e2e **301 pass / 2 fail**. Both failures are off every cycle-93
diff: `cycle-028-realtime` is the catalogued cold-boot parallel flake (passes isolated); `mobile-minds`
"long dialogs page GBA-style" is a **genuine pre-existing break** — QA reproduced the identical failure by
`git stash`-ing the entire cycle-93 diff and re-running on clean HEAD, and it fails in isolation, so it is
*not* the parallel flake the cycle-92 verdict logged it as (the flake has hardened or the environment
shifted). It lives in the keeper-picker/dialog ArrowLeft `prev()` path, untouched by either track. Rather
than scope-creep the milestone-opening cycle into an unrelated dialog fix, it is filed as **BACKLOG-430**
(infra) and called out in the chronicle so it isn't lost; both cycle-93 tracks carry their own passing unit
+ e2e coverage independent of it. No CHARTER breach: `@mlc-ai/web-llm` stays under `ai/` (grep clean),
saves are additive with no version bump, the deterministic floor + NPCBrain boundary hold.

Both tracks APPROVED → cycle closes, phase → `lore-pending`, Lore-smith bumps to 94.

**Milestone 2 "Places to belong" is 2/6** (lore arc 1 · structure arc 1). The chain now raises three
distinct skylines and its dinos have a reason to stay.
