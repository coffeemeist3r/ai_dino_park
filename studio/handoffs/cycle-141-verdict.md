# Cycle 141 — Verdict

**Lore track: APPROVED. Structure track: APPROVED. Milestone 16 opened.**

Build clean. Unit **2081 passed / 2 skipped** across 208 files. E2E **590 passed / 2 failed** — both boot
timeouts under parallel load (`cycle-110-plenty`, `cycle-123-capacity`), both green on an isolated re-run,
neither anywhere near either diff. 24/24 acceptance criteria pass. The brain boundary holds. No save field
was touched by either track.

---

## Lore track

**Verdict:** APPROVED
**Item:** BACKLOG-300 — Caught in the act

**Rationale.** BACKLOG-295 shipped a per-dino activity read forty-odd cycles ago and it has driven exactly
one thing since: a glyph over a head. Everything the park has built about *who a dino is* — its ritual, its
palate, its grudges, its gossip — routes into the greeting, and the one fact that differs per dino *and* per
minute was not among them. Walk up to a dino face-down in a food drop and it greeted you exactly as it would
have standing still in an empty field.

Now it swallows first. It peels itself out of the pile, or answers from where it is curled without getting
up. It sets down what it was carrying, carefully. Nine activities, two phrasings apiece, picked by
`hashSeed(name)` — so the same dino always words it the same way, which makes it a tell you can learn, while
two dinos caught at the same thing need not sound alike.

**The call that makes it a ship rather than a config field.** Cycle 140 spent its verdict on exactly this
question and the answer is now a habit: the clause is deterministic and ships to every device, and the model
context (`doing`) is the enrichment on top. A machine that declines the download gets the whole beat. And
`doingNow` is read once and used three times — the aside, the prompt, and anything that files later — the
same `ticFor` discipline 423 adopted, which is the class of bug this codebase has now caught five times.

**What I checked hardest.** `wandering` returning null is doing a lot of load-bearing work in this design:
it is what keeps the ordinary greet byte-identical and stops the beat becoming an every-greet tic. It is not
asserted, it is tested twice — a unit spec over the whole cast, and an e2e that greets an idle dino and
proves none of the six clauses appear. The exactly-one-aside rule between 423 and 300 is likewise a test,
not a comment: a dino found mid-ritual talks about the ritual and nothing else, because a dino alone with
its own private habit is the more specific truth about it.

**Reachability (CHARTER v7).** *In a fresh save, watched for ten minutes:* press `H`, watch the swarm, walk
up to whoever got to the food first and press `E` — and it swallows before it talks. No model, no bond
floor, no day boundary, no threshold. The e2e proves it headless with no WebGPU rather than the verdict
asserting it: it drives the world until somebody is genuinely feeding, huddling or gathering, greets them,
and asserts their own clause is present and the other activities' are absent.

---

## Structure track

**Verdict:** APPROVED
**Item:** BACKLOG-504 — the pile is a number in a menu

**Rationale.** This is the oldest true-and-unwatchable thing in the park. The per-zone stockpile has been
load-bearing since cycle 285 — it pays the upkeep bill, funds a mend, stakes a seat in the ballot, fills
toward the granary's cap, rides along with a courier — and its entire on-screen existence was one line of
text inside a lens, one screen away from the ground it describes. A dino carried a stone across a ground,
which is the whole point of 328, and the stone became an integer.

Now each ground has a bank tile, and the heap on it steps with the total. Three steps, the same tile on
every ground on purpose — the player learns one place and can then find the bank anywhere, the way `H` is
one key everywhere — and a unit test asserts that tile is grass on all five grounds against `zoneTileAt`,
so a later terrain pass that grows a pond over it fails a test instead of drowning the heap.

**The half that makes it a ship.** The thresholds are `[1, 2, 4]`, and they were chosen to sit *around* the
founding state rather than above it. The Grove ships with `{ stone: 2 }` — 136's founding pile, untouched —
which is **step 2**: a heap standing on the ground one edge east of where a new player wakes up. `REPAIR_COST`
is 1, so when Bramble walks over and puts the founding ruin back up, inside the first minute, the heap
**visibly drops a step**. That is the CHARTER v7 corollary read forwards rather than as a veto: instead of
tuning a founding constant up to clear a threshold, the threshold was placed where the founding state
already lives, and both halves are pinned by tests that say out loud what breaks if a later pass moves them.
The bowl is deliberately left bare, so the first gathered stone banking is itself a visible event — and
cycle 136's "the founding park is not made rich" guard stays green untouched.

**The part I would have rejected this on, and didn't have to.** A heap that agrees with the pile *most of
the time* is worse than no heap. The pile was written in fifteen scattered places and the Coder collapsed
every one onto a single `setPile` seam, so a future pile write cannot forget the heap because there is
nowhere else to write a pile. QA verified that by grep rather than by trust: four remaining mentions of
`stockpileByZone`, being the declaration, the accessor, a save read, and the restore replace — which is
followed by a full resync. That is the lazy fix and the root-cause fix being the same fix, which is this
studio's favourite shape and it is nice to see it arrive on a rendering item.

**Reachability (CHARTER v7).** *In a fresh save, watched for ten minutes:* walk one edge east into the
Grove and there is a heap of stone on the ground that was never there before; stand still and watch the
resident mend the fallen cairn, and the heap drops a step while you are looking at it. Back in the bowl,
the first stone a curious dino carries home makes a heap appear on bare ground. Four e2e tests, fresh save,
no model.

**Note for the Artist.** This ships on the glyph fallback — `pile_1/2/3` are BACKLOG-506, seeded this cycle
precisely for it. The heap is legible either way (the stone glyph once per step), which is the same
per-item fallback 490, 494, 496 and 502 all ship. One thing 506 should know: `syncBank` destroys and
re-creates its sprite when a step crosses between glyph and rig, which is the guard against a *partially*
drawn rig set calling `setTexture` on a `Text`. That branch is dormant today and the first rig landed is
what first exercises it, so a spec for it belongs in the 506 fire.

---

## Milestone

**Milestone 16 — "Somewhere to stand"** opened this cycle and took its first bite from both ends: one lore
arc closed (300) and the structure arc that names the milestone is closed too (504, with its art half 506
still queued for the Artist). Four arcs remain: the ritual's mark, the hatch's mouth, the branch's stake,
the frontier's form, and the reachability register.
