# Cycle 134 — Code Plan

Two tracks, no file overlap: 409 lives in `world/tic.ts` + `ui/lenses.ts` + `world/saveGame.ts` +
`WorldScene`; 486 lives in `playwright.config.ts` + `tests/e2e/helpers.ts`.

---

## Lore track — BACKLOG-409 (tics in the book)

**Prior art reused (no new module):**
- `world/manner.ts` / `world/pecking.ts` / `world/foodweb.ts` — the "book line or nothing" precedent: a pure
  function returning a string, an optional `BookRow` field, one `if (r.x) out.push(...)` in `bookLines`.
- `world/tic.ts` already owns `Tic`, `TIC_BY_AXIS`, `signatureTic`, `signatureAxis`, `echoedTic`. The new
  line belongs beside them; no fourth tic module.
- `WorldScene.ticFor(d)` already resolves echo-vs-own. The book reads the same resolution.

**Files**

1. `game/src/world/tic.ts` — add `ticBookLine(t: Tic, from?: string | null): string`. Renders
   `` `${t.glyph} ritual: ${t.label}` ``; with a `from` name appends `` ` — caught off ${from}` ``. Takes the
   **base** tic (never `echoedTic`'s reworded label), so the borrowed case reads once, not twice.
   Also export `ECHO_FROM_UNKNOWN = 'a friend'` so the pre-409-save fallback reads
   `— picked up from a friend` through the same one code path rather than a second branch.
2. `game/src/world/tic.test.ts` — cases for own / named source / `null` / `undefined` source.
3. `game/src/ui/lenses.ts` — `BookRow.tic?: string` (optional, so every existing literal still type-checks),
   rendered immediately after the 303 quirk line: `if (r.tic) out.push('  ' + r.tic);`.
4. `game/src/ui/lenses.test.ts` — a row with `tic` shows the line under the quirk; a row without it shows
   no `ritual:` anywhere.
5. `game/src/world/saveGame.ts` — two additive fields on `SaveGame`:
   - `ticsFormed?: string[]` — the dinos whose ritual has ever formed. Validated as an array of strings
     (the `zoneChain`-style array validation already in this file), absent → undefined.
   - `ticEchoFrom?: Record<string, string>` — echo-holder → the friend it was caught off. Validated as a
     string→string map beside `ticEchoes`, absent → undefined.
   Both added to the returned literal at the existing `ticEchoes,` line.
6. `game/src/world/saveGame.test.ts` — round-trip + rejection of a non-array / non-string-valued field, and
   a pre-409 payload (neither field) parsing clean.
7. `game/src/scenes/WorldScene.ts`:
   - fields `private ticsFormed = new Set<string>()` and `private ticEchoFrom: Record<string, string> = {}`.
     **`resetTic` does not touch either** — a stretch ends, a lifetime fact does not.
   - `performTic` invention branch: `this.ticsFormed.add(d.name)` alongside the existing memory file.
   - `watchTic` echo branch: `this.ticEchoFrom[o.name] = performer.name` and
     `this.ticsFormed.add(o.name)` next to the existing `ticEchoes[o.name] = …` — an adopted ritual is one
     the park announced on the ticker, so it is witnessed by construction.
   - `__inventTic` dev hook: add to `ticsFormed` too, so the hook produces the same state the real path does
     (it already mirrors `soloSteps` + `ticInvented`).
   - `bookRows()`: new `tic` field —
     `this.ticsFormed.has(d.name) ? ticBookLine(base, this.ticEchoFrom[d.name] ?? (echoed ? null : undefined)) : undefined`,
     where `base = axis ? TIC_BY_AXIS[axis] : signatureTic(d.traits)` (the un-reworded twin of `ticFor`).
   - save: `ticsFormed: [...this.ticsFormed]`, `ticEchoFrom: this.ticEchoFrom`.
   - load: `this.ticsFormed = new Set(save.ticsFormed ?? [])`, then **union in `Object.keys(ticEchoes)`** —
     the back-fill for pre-409 saves; `this.ticEchoFrom = save.ticEchoFrom ?? {}`.
8. `tests/e2e/cycle-134-tic-book.spec.ts` — new spec: a never-alone dino has no `ritual:` line; a dino driven
   through `__inventTic` shows one; a watcher driven through `__watchTic` three times shows
   `— caught off <performer>` while the performer shows no suffix; the line survives a reload.

**Blockers:** none anticipated.

---

## Structure track — BACKLOG-486 (the run, not the spec)

**Files**

1. `playwright.config.ts`:
   - `workers: Number(process.env.E2E_WORKERS) || 4` — an explicit cap, env-overridable, calibrated against
     the measured baseline recorded in the QA handoff (12 logical cores here, so Playwright's unset default
     was 6 browsers on one Vite dev server).
   - `timeout: 60_000` — the per-test budget, strictly above `helpers.ts`'s 30s boot ceiling, with a comment
     naming that relationship as the invariant. This is the actual defect: with both at 30s a
     slow-but-correct boot could only ever be reported as whatever assertion the clock landed on.
2. `tests/e2e/helpers.ts`:
   - keep `BOOT_TIMEOUT = 30_000`, document that it must stay strictly under the config `timeout`.
   - after `__ready`, wait one `requestAnimationFrame` in-page before the `__pauseAmbient` call, so the
     helper hands the spec a scene that has produced a frame rather than one that has merely set a flag.

**Not doing:** no `test.slow()`, no local `retries`, no skips, no assertion changes. A retry would make the
suite green by hiding exactly the signal this item exists to restore.

**Evidence to collect (QA):** baseline run (unset workers) wall time + victim, then three consecutive full
runs at the capped setting with wall times.


---

## Shipped (coder, 2026-08-18)

**409** — `world/tic.ts` (+`ticBookLine`, `ECHO_FROM_UNKNOWN`), `ui/lenses.ts` (`BookRow.tic`, rendered under
the 303 quirk line), `world/saveGame.ts` (`ticsFormed` + `ticEchoFrom`, validated, additive, version
unbumped), `scenes/WorldScene.ts` (`ticsFormed` set + `ticEchoFrom`, written in `performTic`'s invention
branch and `watchTic`'s echo branch and `__inventTic`, read by the new `ticBookEntry`, saved and restored with
the pre-409 echo back-fill). Tests: `tests/unit/cycle-134-tic-book.test.ts` (13), `tests/e2e/cycle-134-tic-book.spec.ts` (5).

**486** — `playwright.config.ts` (`workers: Number(process.env.E2E_WORKERS) || 4`, `timeout: 60_000`),
`tests/e2e/helpers.ts` (the invariant documented on `BOOT_TIMEOUT`, plus a one-frame settle after `__ready`).

`npm run build` clean. `npx vitest run` 1816/1816 (was 1803; +13). Boundary grep clean —
`@mlc-ai/web-llm` appears nowhere outside `game/src/ai/`. New e2e spec 5/5.

**Blocker:** none. **Note for QA:** the pre-change baseline e2e run collected during this fire is
*contaminated* — a `npm run build` and live source edits landed on the dev server mid-run, and it finished 4
failed / 518 passed in 9.7m. Do not report it as the honest baseline. Reproduce the old configuration
explicitly instead: `npx playwright test --workers=6 --timeout=30000` (the unset-`workers` default on this
12-core box, and the old per-test budget), then take the three evidence runs at the shipped defaults.
