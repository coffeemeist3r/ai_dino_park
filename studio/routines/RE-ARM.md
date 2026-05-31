# Schedule Management

## Current model (2026-05-31): one consolidated daily cycle

As of 2026-05-31 the studio runs as a **single daily job** that executes the whole pipeline
start-to-finish in one session — lore → designer → code-planner → coder → QA → validator →
artist — shipping one BACKLOG item per day. This replaced the old 7-jobs-across-Mon→Wed
layout (which only shipped ~1 item/week because stages were spread across days-of-week).

| Task ID                    | Schedule          | What it runs                                   |
|----------------------------|-------------------|------------------------------------------------|
| `dino-studio-daily-cycle`  | Daily 03:00 local | `studio/routines/0-daily-cycle.md` (full chain)|

- **Fully autonomous:** picks the work and ships it without asking; the human reads the
  chronicle entry afterward.
- **Intended model:** Opus 4.8 on high — set at the **app level** (scheduled tasks have no
  model field; the job runs on whatever model the app defaults to at fire time).
- **Caveat:** scheduled tasks only fire while Claude Code is open. 03:00 needs the app left
  running overnight; otherwise it fires on next launch.
- The old per-stage jobs `dino-1-lore-smith` … `dino-7-artist` are **disabled** (paused, not
  deleted) so they can be re-enabled if we ever want to split the chain across sessions again.

### Adding / removing a step
The pipeline is just the numbered files in `studio/routines/`. The daily job executes them in
numeric order, so to add a step, drop a new `studio/routines/N-<name>.md` (or insert
`3.5-<name>.md`) — it's picked up automatically next run. No new scheduled task needed.

### Changing cadence
Edit `cronExpression` on `dino-studio-daily-cycle` via `update_scheduled_task` or the sidebar
(5-field cron, local time). Twice daily → `0 3,15 * * *`. Weekdays only → `0 3 * * 1-5`.

---

## Legacy: the old 7-routine split (disabled)

The 7 routines lived at:

```
C:\Users\jorda\.claude\scheduled-tasks\dino-N-<routine>\SKILL.md
```

(Where `N` is 1..7.) They are now disabled; the consolidated daily job above supersedes them.

## Persistence

**Good news:** these tasks are persistent — they survive Claude Code restarts. No 7-day expiry. No weekly re-arm needed.

**Caveat:** scheduled tasks only fire when Claude Code is open. If Claude is closed at fire time, the task fires on next launch. So leaving Claude Code running on your machine maximizes on-time fires.

## Current schedule (user local time — CDT)

| Day | Time  | Task ID                | Routine        |
|-----|-------|------------------------|----------------|
| Mon | 07:09 | `dino-1-lore-smith`    | Lore-smith     |
| Mon | 10:20 | `dino-2-designer`      | Designer       |
| Mon | 14:28 | `dino-3-code-planner`  | Code-planner   |
| Mon | 18:46 | `dino-4-coder`         | Coder          |
| Tue | 09:13 | `dino-5-qa`            | QA             |
| Tue | 13:55 | `dino-6-validator`     | Validator      |
| Wed | 08:28 | `dino-7-artist`        | Artist         |

(Times include the small auto-jitter the scheduler applies to spread load.)

## Managing tasks

In Claude Code: open the "Scheduled" section in the sidebar to:
- See next run time
- Pause/resume a routine
- "Run now" to fire on demand
- Edit prompt or schedule

Or use the `/schedule` slash command in a Claude conversation.

## Changing cadence

Edit `cronExpression` on the task via `update_scheduled_task` or the sidebar. Standard 5-field cron in local time.

If you want it hotter (e.g., two cycles per week), reschedule routines into Thu/Fri slots in addition to Mon/Tue.

If you want it cooler, push the chain to fortnightly.

## Adding a new routine

1. Write `studio/routines/N-<name>.md` with the routine's prompt template
2. Call `create_scheduled_task` with a `dino-N-<name>` taskId, your cron, and a wrapper prompt that points at the routine file
3. Amend CHARTER.md if the routine is a new step in the chain (so existing routines know about it)

## Disabling

Pause a single routine via the sidebar (set `enabled: false`). Re-enable later. Useful when actively hand-iterating.
