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

export const MODELS: Record<ModelTier, ModelInfo> = {
  tiny: { tier: 'tiny', id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', label: 'Qwen2.5 0.5B' },
  small: { tier: 'small', id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', label: 'Qwen2.5 1.5B' },
  medium: { tier: 'medium', id: 'Qwen2.5-3B-Instruct-q4f16_1-MLC', label: 'Qwen2.5 3B' },
};

export function pickTier(caps: DeviceCaps): ModelTier {
  const mem = caps.deviceMemory ?? 0;
  const buf = caps.maxBufferBytes ?? 0;
  const score = (mem >= 8 ? 2 : mem >= 4 ? 1 : 0) + (buf >= 1_000_000_000 ? 1 : 0);
  if (score >= 3) return 'medium';
  if (score === 2) return 'small';
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
