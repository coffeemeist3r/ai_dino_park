# Cycle 192 — QA

- **Build:** ✅ clean
- **Unit tests:** ✅ 3418 passed / 3 skipped (335 files)
- **E2E tests:** ✅ 930/931 on the full run; the one failure was a real regression of this cycle's own making, fixed in
  this fire: `cycle-191-faith-art.spec.ts` asserted `__faithMark()` with an exact `toEqual`, and the hook now also
  reports `alpha` and `shrine`. Loosened to `toMatchObject` (a test-only change, same assertion on the same fields);
  green isolated. No flakes this run.

## Lore track — BACKLOG-615

| criterion | status | evidence |
|---|---|---|
| `hearWord` believe ≥12 / scoff on grudge (outranks bond) / null below, off-flock, already-parted | PASS | `cycle-192-faith.test.ts` "the word travels" (5 tests) |
| Fresh save → sermon → `__forceConverse('Sunny','Rex')`-equivalent converts Rex, heardFrom, ticker | PASS | e2e "Rex slept through the sermon…" (drives `__forceConverse('Rex','Sunny')`, the production `converse` path) |
| Meeting order does not matter | PASS | same spec: Rex is the *speaker*, Sunny the carrier; unit `hearWord` both orders via `faithWordBeat` |
| A grudge against the carrier scoffs, names the carrier, 🙄 ticker | PASS | e2e "a grudge against the one telling it scoffs" |
| Book row names who told it | PASS | e2e `__bookRows` Rex row; unit `faithBookLine` |
| A secondhand believer attends the next service | PASS | it is in `faith.believers`, which `serviceAttendees` reads (unit 191 `serviceAttendees`) |
| `heardFrom` survives reload; `isFaith` accepts absent, rejects malformed | PASS | e2e reload poll; unit "the faith in the save" |

**Bugs found:** none. **Recommendation:** APPROVE.

## Structure track — BACKLOG-614

| criterion | status | evidence |
|---|---|---|
| `canRaiseShrine` gates + `raiseShrine` spend (pure) | PASS | unit "the faith raises a stone" |
| Sermon → bowl stone ≥2 → 16:00 service raises shrine at the sermon tile, pile −2 stone, 🛐 ticker | PASS | e2e "at the service the faithful haul two stone…" (pile {stone:3,branch:1} → {stone:1,branch:1}) |
| Short pile: service opens, no shrine, pile unchanged | PASS | e2e "short of stone…" |
| `__landmarks('bowl')` includes it; `__standing('bowl')` +1 | PASS | e2e asserts `__standing` before+1 |
| Upkeep can lapse it; mark fades | PASS | e2e "a shrine the bowl cannot keep up lapses and fades" (🛐 in the lapse lines, `derelict`, alpha < 1) |
| Survives reload | PASS | e2e reload poll on `shrine.zone` |

**Reachability evidence:** a probe on an as-shipped save (before the code was written) banked the bowl's second stone by
~80 world steps (~4 real minutes), and the founding faith holds three believers from noon. So the shrine is raised at
the day-one 16:00 service with no fixture help. Not asserted by a spec on natural stepping, on purpose: the stone count
hangs on the shared RNG stream, and a spec that relies on that luck breaks the first time something unrelated shifts it.

**Bugs found:** none. **Recommendation:** APPROVE.
