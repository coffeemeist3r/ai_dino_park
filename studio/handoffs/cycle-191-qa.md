# Cycle 191 — QA

**Build:** ✅ clean (`tsc -b && vite build`).
**Unit tests:** ✅ 3404 passed, 3 skipped (333 files).
**E2E tests:** ✅ 925/925 on the first full run (8.7 min). The faith spec's very first isolated run hit the known
cold-boot `__ready` timeout on two specs (cold Vite, before the dev server was warm); green on the immediate rerun
and in the full suite. Not a regression.
**Boundary:** `@mlc-ai/web-llm` only under `game/src/ai/` (grep).
**Live browser check:** not done — the unattended run's request to start the dev-server preview was declined. The
production paths are the same ones the hooks drive (`closeFestival` from `stepFestival`; `checkService` from the 3 s
timer), so the e2e covers the sermon and service code itself, not only a dev seam.

## Lore track — BACKLOG-030

| criterion | status | evidence |
|---|---|---|
| `pickPreacher` highest-curiosity awake bowl-home; sleepers/guests ignored; null when none | PASS | unit `Glade preaches: the more curious owls are asleep at noon…` |
| `creedFor` by keyword in table order; unmatched → sky | PASS | unit `matches keywords in table order…` (6 founding personas) |
| `hearSermon` founding read → believers Mossback/Sunny/Murk, scoffers {Twitch: Mossback}, unmoved Bramble | PASS | unit `love believes, a grudge against a believer scoffs…` (at noon's awake set) |
| Fresh save, festival close → `__faith` Glade/song, believers' bonds ≥ 10, sermon + believe ticker | PASS | e2e `the festival closes and Glade preaches the song…` |
| Second festival close does not preach again | PASS | same spec, day-8 festival |
| Book faith line for preacher, believer, scoffer | PASS | same spec (`__bookRows`) + unit `preacher, believer, scoffer…` |
| Creed glyph on a wandering believer's mark within steps | PASS | e2e `a believer idles with the creed glyph now and then` |

**Bugs found:** none.
**Recommendation:** APPROVE.

## Structure track — BACKLOG-613

| criterion | status | evidence |
|---|---|---|
| `serviceDue` 16:xx after the sermon day, once a day; false 15:xx / held / before the day | PASS | unit `due once a day in the service hour…` |
| `serviceAttendees` keeps the flock on the faith's ground; drops sleepers, migrants, away believers | PASS | unit `the flock on the faith's ground…` |
| Save round-trip; malformed → null; absent fine | PASS | unit `round-trips in the save…` |
| Fresh save 16:00 → service open with Glade + ≥ 1 believer, all within ring 1 of the spot, gather ticker | PASS | e2e `at 16:00 the faithful gather at the sermon spot…` (15:30 → no service) |
| Reload keeps the faith (preacher, believers, `lastServiceDay`) | PASS | same spec |
| Build / vitest / playwright green | PASS | above |

**Bugs found:** none.
**Recommendation:** APPROVE.
