/**
 * Inference governor (BACKLOG-107 + the mobile minds policy, 2026-06-11) — pure
 * decisions about WHEN the model may run and WHICH brain/model a device gets.
 * No Phaser, no WebLLM: the scene and the device probe feed inputs in.
 *
 * Policy (operator-ratified):
 *  - Phones (primary pointer is coarse) boot on the canned StubBrain. The model
 *    is OPT-IN — a GB-class download must never start itself on a phone.
 *  - Consent persists per device in localStorage (not the save — it's a device
 *    capability choice, not world state).
 *  - Phones that opt in are clamped to the smallest model tier regardless of
 *    reported RAM — deviceMemory says 8GB, thermals say otherwise.
 *  - Ambient dino↔dino chatter pauses while the tab is hidden or the battery is
 *    low, and runs on a sparser cadence on phones. Player interaction is never
 *    gated — a tapped greet always may think.
 */

import type { ModelTier } from './deviceProbe';

/** localStorage key for the per-device minds opt-in: 'on' | 'off' (absent = never asked). */
export const MINDS_CONSENT_KEY = 'dino.minds';

/** Below this battery fraction, ambient inference yields to the canned path. */
export const LOW_BATTERY = 0.2;

/** Ambient convo cooldown in wander steps: phones chatter at a third the desktop rate. */
export const CONVO_COOLDOWN_DESKTOP = 8;
export const CONVO_COOLDOWN_COARSE = 24;

export interface MindsEnv {
  /** Primary pointer is a finger (phone/tablet). */
  coarse: boolean;
  /** Persisted opt-in; null = never asked. */
  consent: boolean | null;
}

export interface AmbientEnv {
  /** document.hidden — nobody is watching the bowl. */
  hidden?: boolean;
  /** Battery fraction 0..1; undefined = unknown (desktops, denied API). */
  battery?: number;
}

/** Which brain this device boots (or swaps to when consent changes). */
export function brainKind(env: MindsEnv): 'webllm' | 'stub' {
  return env.coarse && env.consent !== true ? 'stub' : 'webllm';
}

/** May ambient (dino↔dino) inference fire right now? */
export function allowAmbient(env: AmbientEnv): boolean {
  if (env.hidden) return false;
  if (env.battery !== undefined && env.battery < LOW_BATTERY) return false;
  return true;
}

export function convoCooldownSteps(coarse: boolean): number {
  return coarse ? CONVO_COOLDOWN_COARSE : CONVO_COOLDOWN_DESKTOP;
}

/** Phones always take the smallest model, whatever the RAM proxy claims. */
export function clampTier(tier: ModelTier, coarse: boolean): ModelTier {
  return coarse ? 'tiny' : tier;
}

/** Rough one-time download size per tier, for the consent dialog. */
const TIER_SIZE: Record<ModelTier, string> = {
  tiny: '~0.4 GB',
  small: '~1 GB',
  medium: '~1.9 GB',
};

/** The consent dialog body. Pure so the wording is pinned by unit tests. */
export function consentLines(modelLabel: string, tier: ModelTier, saveData?: boolean, cached?: boolean): string {
  if (cached) {
    return (
      `Give the dinos real minds?\n` +
      `${modelLabel} is already downloaded — enables instantly, no data used.\n` +
      `[1] enable    [✕] not now`
    );
  }
  const warn = saveData ? '\n⚠ Data Saver is on — best to wait for Wi-Fi.' : '';
  return (
    `Give the dinos real minds?\n` +
    `Downloads ${modelLabel} (${TIER_SIZE[tier]}) once; cached after that. Wi-Fi recommended.${warn}\n` +
    `[1] download & enable    [✕] not now`
  );
}

/**
 * Turning minds off while the weights are cached: keeping them makes re-enabling
 * instant; deleting frees the storage. Pure so the wording is pinned by tests.
 */
export function mindsOffLines(tier: ModelTier): string {
  return (
    `Turn the dino minds off?\n` +
    `The downloaded model (${TIER_SIZE[tier]}) can stay cached for an instant re-enable, or go to free the space.\n` +
    `[1] off, keep download    [2] off + delete download    [✕] cancel`
  );
}

/** The More-sheet row label reflects the current state. */
export function mindsLabel(on: boolean): string {
  return on ? '🧠 minds: on' : '🧠 minds: off';
}
