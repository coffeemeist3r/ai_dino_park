# Schedule Management

The 7 routines run as **persistent scheduled tasks** managed by Claude Code's scheduled-tasks system. They live at:

```
C:\Users\jorda\.claude\scheduled-tasks\dino-N-<routine>\SKILL.md
```

(Where `N` is 1..7.)

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
