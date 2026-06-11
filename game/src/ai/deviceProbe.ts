/**
 * Device probe → model-size selection. Pure picker + a browser capability probe.
 *
 * Real GPU VRAM isn't exposed to the browser, so we proxy with
 * `navigator.deviceMemory` (RAM GB, Chrome-only, capped ~8) and the WebGPU
 * adapter's max storage-buffer size. Conservative: default to the tiny model.
 */

import { clampTier } from './governor';

export type ModelTier = 'tiny' | 'small' | 'medium';

export interface DeviceCaps {
  deviceMemory?: number; // GB
  maxBufferBytes?: number; // WebGPU adapter limit
}

export interface ModelInfo {
  tier: ModelTier;
  id: string;
  label: string;
}

// Qwen3.5 ladder (BACKLOG-102; gate passed 2026-06-11 — web-llm 0.2.84 ships all
// three prebuilt AND exposes extra_body.enable_thinking). 0.8B is MLC-flagged
// low_resource — the phone tier. Qwen3.5-9B stays reserved for native/desktop.
export const MODELS: Record<ModelTier, ModelInfo> = {
  tiny: { tier: 'tiny', id: 'Qwen3.5-0.8B-q4f16_1-MLC', label: 'Qwen3.5 0.8B' },
  small: { tier: 'small', id: 'Qwen3.5-2B-q4f16_1-MLC', label: 'Qwen3.5 2B' },
  medium: { tier: 'medium', id: 'Qwen3.5-4B-q4f16_1-MLC', label: 'Qwen3.5 4B' },
};

export function pickTier(caps: DeviceCaps): ModelTier {
  const mem = caps.deviceMemory ?? 0;
  const buf = caps.maxBufferBytes ?? 0;
  // The 3.5 ladder is heavier per tier than 2.5 (0.8/2/4B vs 0.5/1.5/3B), so the
  // top tier now also demands a 2GB storage-buffer bind — an 8GB machine with a
  // modest GPU gets the 2B, not a 4B OOM (BACKLOG-102 re-tune).
  if (mem >= 8 && buf >= 2_000_000_000) return 'medium';
  if (mem >= 8 || (mem >= 4 && buf >= 1_000_000_000)) return 'small';
  return 'tiny';
}

export function pickModel(caps: DeviceCaps): ModelInfo {
  return MODELS[pickTier(caps)];
}

/** Browser-only: read the capability proxies. Never throws. */
export async function probeDevice(): Promise<DeviceCaps> {
  const caps: DeviceCaps = {};
  if (typeof navigator !== 'undefined') {
    caps.deviceMemory = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
    try {
      const gpu = (navigator as unknown as { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
      const adapter = (await gpu?.requestAdapter()) as { limits?: { maxStorageBufferBindingSize?: number } } | null;
      caps.maxBufferBytes = adapter?.limits?.maxStorageBufferBindingSize;
    } catch {
      // no WebGPU adapter — leave undefined
    }
  }
  return caps;
}

/** Primary pointer is a finger — the signal the touch layer and the minds policy share. */
export function isCoarsePointer(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches
  );
}

export async function currentModel(): Promise<ModelInfo> {
  const tier = pickTier(await probeDevice());
  // Phones are clamped to the smallest model (governor policy) — deviceMemory
  // reports 8GB on phones that thermal-throttle a 3B model into the ground.
  return MODELS[clampTier(tier, isCoarsePointer())];
}
