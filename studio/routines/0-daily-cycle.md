# Routine 0 — Daily Full Cycle (consolidated)

You are firing the **AI Dino Park studio** for one complete daily cycle. Unlike the
old split-session routines (one stage per day-of-week), you run the **entire pipeline
start-to-finish in this single session**: lore → designer → code-planner → coder → QA →
validator → artist. One BACKLOG item ships per run.

Project root: `C:\Projects\ai_dino_park`

**Intended model:** Opus 4.8 on high. (Model is set at the app level, not in this file.)

## Autonomy

**Fully autonomous.** Pick the work yourself and ship it — do not stop to ask the human.
The human reads the chronicle entry afterward. Lean into emergence (per the Lore-smith
bias): items that let dinos surprise the player beat UI polish.

## The pipeline is the numbered files in `studio/routines/`

Execute each routine file **in numeric order**:

1. `1-lore-smith.md`
2. `1.5-structure-smith.md`
3. `2-designer.md`
4. `3-code-planner.md`
5. `4-coder.md`
6. `5-qa.md`
7. `6-validator.md`
8. `7-artist.md` (conditional — no-ops unless `artPipelineReady` + image-gen creds)

**Two tracks per cycle.** The Lore-smith picks a lore-track item (`state.currentItem`)
and the Structure-smith picks a structure-track item (`state.structureItem`). Routines
2–6 build **both** in the same fire (two sections per handoff: `## Lore track` /
`## Structure track`). The Validator judges each track independently.

If new routine files exist (e.g. `8-*.md`, or an inserted `3.5-*.md`), **include them in
numeric order automatically** — the pipeline is meant to be self-extending. A cycle may even
write a new routine file if the studio needs a new role; honor it on the next run.

## Read the canon ONCE (token discipline)

At session start, read the canon a single time: `CHARTER.md`, `studio/state.json`,
`studio/MILESTONE.md`, `BACKLOG.md` (open items only — closed live in
`BACKLOG-archive.md`), `studio/IDEABOX.md`, last ~50 lines of `studio/chronicle.md`,
and the latest verdict. Each routine file's "Read first" list is then **already
satisfied** — do NOT re-read a file per stage unless this session changed it and
you need the fresh content. The budget saved is budget for shipping.

## The milestone comes first

The cycle serves `studio/MILESTONE.md` (CHARTER v6). If no milestone is ACTIVE,
the smiths draft one before picking items. Both smiths pick checklist-advancing
items by default; an off-milestone pick needs a one-line justification.

## How to run the chain in ONE session

The individual routine files say "do NOT chain" and "no-op if phase mismatch" — those rules
exist for the OLD split-session model. **In this consolidated job you ARE the whole chain**,
so you DO chain: perform each step, commit it, advance `state.json.phase`, then immediately
move to the next step in the same session. Follow each routine file's actual work
instructions (what to read, what to write, commit message format), just don't stop between them.

Per stage: do the work → update `state.json` (phase + `lastFire`) → append chronicle →
`git commit` with that stage's message. Each stage is its own commit, exactly as before, so
the history still reads stage-by-stage and a future split run could resume cleanly.

## Quality bar (the Coder + QA + Validator must honor)

- `npm run build` clean (type-check passes).
- Full suite green: `npx vitest run` (unit) and `npx playwright test` (e2e).
  - Before e2e, free the port: `npx --yes kill-port 5173`.
  - Known parallel-load flake: if a single e2e spec fails, re-run it isolated; if it passes
    isolated and a fresh full run is green, treat it as flake (note it) — not a regression.
- Logic lives in pure, Node-testable modules; Phaser glue stays thin in `WorldScene`.
- **Boundary:** `@mlc-ai/web-llm` may be imported ONLY under `game/src/ai/`. Verify with grep.
- Additive save changes only (don't break old saves); never leave `main` red or the tree dirty.

## REWORK handling (stay in this session)

Verdicts are **per track**. If either track's verdict is REWORK, loop back to the
Designer step and re-attempt **only the failing track(s)** for the **same item(s)** —
up to **2 rework loops**. A track that already APPROVED is done; do not redo it. If a
track still fails after 2 loops, write an ABANDON verdict for that track (so it closes
cleanly) and move on. Never leave a track half-open. The cycle closes only when **both**
tracks have resolved (APPROVED or ABANDON).

## Housekeeping (once per cycle, before Finish)

- If BACKLOG.md carries closed (`[x]`/`[a]`) bullets in its body, move them to
  `BACKLOG-archive.md`. Keep the working backlog lean — every stage reads it.
- If a body section has zero open items left, move the whole section to the archive.

## Finish

- End with `state.json.phase = "lore-pending"` and a clean working tree.
- **Push to GitHub:** after the cycle is fully committed and the tree is clean, run
  `git push origin main` so the night's work lands on the remote (origin =
  https://github.com/coffeemeist3r/ai_dino_park.git, credential manager handles auth).
  If the push fails (offline / auth), don't fail the cycle — append a one-line chronicle
  note "push deferred: <reason>"; the next run will push the accumulated commits.
- The Validator's chronicle entry is the human-facing journal — make it a good read.
- If something blocks hard (e.g. build won't pass and can't be fixed), STOP gracefully: do not
  commit broken code to `main`; append a chronicle note explaining the block and leave state
  recoverable for the next run. Still `git push` whatever IS safely committed.
