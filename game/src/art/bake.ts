import Phaser from 'phaser';
import { walkFrames, SPECIES_ART, type Shape } from './dinoArt';
import { PIXEL_SPECIES } from './pixelArt';
import { KEEPER_RIGS } from './keeperArt';
import { TILE_RIGS } from './tileArt';
import { DIALOG_FRAME } from './frameArt';
import { PROP_RIGS } from './propArt';

/**
 * The "convert to procedural Canvas" half of the art pipeline: take the pure vector
 * shapes from dinoArt.ts and bake them into Phaser textures + a looping walk anim.
 * Thin glue only — all the art lives in dinoArt.ts so it stays Node-testable.
 */

const SIZE = 40; // baked at display size so the flat vector edges stay crisp under pixelArt
const FRAMES = 4;

function drawShape(g: Phaser.GameObjects.Graphics, s: Shape): void {
  g.fillStyle(s.fill, 1);
  if (s.kind === 'ellipse') {
    g.fillEllipse(s.x! * SIZE, s.y! * SIZE, s.rx! * 2 * SIZE, s.ry! * 2 * SIZE);
    if (s.stroke !== undefined) {
      g.lineStyle(2, s.stroke, 1);
      g.strokeEllipse(s.x! * SIZE, s.y! * SIZE, s.rx! * 2 * SIZE, s.ry! * 2 * SIZE);
    }
  } else if (s.kind === 'circle') {
    g.fillCircle(s.x! * SIZE, s.y! * SIZE, s.r! * SIZE);
  } else {
    const pts = s.points!.map(([px, py]) => new Phaser.Math.Vector2(px * SIZE, py * SIZE));
    g.fillPoints(pts, true);
    if (s.stroke !== undefined) {
      g.lineStyle(2, s.stroke, 1);
      g.strokePoints(pts, true, true);
    }
  }
}

/**
 * Bake a pixel-grid rig (CHARTER v4): one fillRect per pixel at an integer scale, hard edges.
 * Texture keys follow the same `${animKey}_${i}` convention the vector path uses, so the
 * factory's `_0` base-texture contract holds for both pipelines.
 */
function ensurePixelWalk(scene: Phaser.Scene, species: string, baseColor: number): string | null {
  const rig = PIXEL_SPECIES[species];
  if (!rig) return null;
  const animKey = `${rig.prefix}_walk_${baseColor.toString(16)}`;
  if (scene.anims.exists(animKey)) return animKey;

  const scale = Math.max(1, Math.floor(SIZE / rig.size));
  const pal = rig.palette(baseColor);
  const texKeys = rig.frames.map((grid, i) => {
    const key = `${animKey}_${i}`;
    if (!scene.textures.exists(key)) {
      const g = scene.add.graphics();
      grid.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          const ch = row[x];
          if (ch === '.') continue;
          g.fillStyle(pal[ch], 1);
          g.fillRect(x * scale, y * scale, scale, scale);
        }
      });
      g.generateTexture(key, rig.size * scale, rig.size * scale);
      g.destroy();
    }
    return key;
  });

  scene.anims.create({
    key: animKey,
    frames: rig.sequence.map((i) => ({ key: texKeys[i] })),
    frameRate: 6,
    repeat: -1,
  });
  return animKey;
}

/**
 * Ensure a walk animation exists for `species` in `baseColor`; returns the anim key,
 * or null if the species has no rig. Idempotent and colour-keyed, so every dino of a
 * species+colour reuses one bake. A pixel rig (CHARTER v4) overrides the legacy vector rig.
 */
export function ensureWalk(scene: Phaser.Scene, species: string, baseColor: number): string | null {
  const pixel = ensurePixelWalk(scene, species, baseColor);
  if (pixel) return pixel;
  const art = SPECIES_ART[species];
  if (!art) return null;
  const animKey = `${art.prefix}_walk_${baseColor.toString(16)}`;
  if (scene.anims.exists(animKey)) return animKey;

  const frames = walkFrames(baseColor, FRAMES, art.pose).map((shapes, i) => {
    const key = `${animKey}_${i}`;
    if (!scene.textures.exists(key)) {
      const g = scene.add.graphics();
      for (const shape of shapes) drawShape(g, shape);
      g.generateTexture(key, SIZE, SIZE);
      g.destroy();
    }
    return { key };
  });

  scene.anims.create({ key: animKey, frames, frameRate: 6, repeat: -1 });
  return animKey;
}

/** Species the procedural pipeline can render today; others fall back to a flat rectangle. */
export function hasArt(species: string): boolean {
  return species in PIXEL_SPECIES || species in SPECIES_ART;
}

const KEEPER_SCALE = 2; // 16×20 grid → 32×40, same integer-scale nearest-neighbour bake as dinos

/**
 * Bake a keeper avatar's idle+walk anim (BACKLOG-158). Non-square grid (width≠height), keyed by
 * keeper id rather than a roster colour — robots carry a fixed palette, not a colour-keyed ramp.
 */
function ensureKeeperWalk(scene: Phaser.Scene, id: string): string | null {
  const rig = KEEPER_RIGS[id];
  if (!rig) return null;
  const animKey = `keeper_${id}_walk`;
  if (scene.anims.exists(animKey)) return animKey;

  const texKeys = rig.frames.map((grid, i) => {
    const key = `${animKey}_${i}`;
    if (!scene.textures.exists(key)) {
      const g = scene.add.graphics();
      grid.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          const ch = row[x];
          if (ch === '.') continue;
          g.fillStyle(rig.palette[ch], 1);
          g.fillRect(x * KEEPER_SCALE, y * KEEPER_SCALE, KEEPER_SCALE, KEEPER_SCALE);
        }
      });
      g.generateTexture(key, rig.width * KEEPER_SCALE, rig.height * KEEPER_SCALE);
      g.destroy();
    }
    return key;
  });

  scene.anims.create({
    key: animKey,
    frames: rig.sequence.map((i) => ({ key: texKeys[i] })),
    frameRate: 6,
    repeat: -1,
  });
  return animKey;
}

/** Observers the procedural pipeline can render today; others fall back to the amber square. */
export function hasKeeperArt(id: string): boolean {
  return id in KEEPER_RIGS;
}

/** Build the player avatar — a baked observer sprite where art exists, else the original square. */
export function makeKeeperArt(
  scene: Phaser.Scene,
  x: number,
  y: number,
  id: string,
): { obj: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle; artKey: string | null } {
  const animKey = ensureKeeperWalk(scene, id);
  if (animKey) {
    const sprite = scene.add.sprite(x, y, `${animKey}_0`);
    sprite.play(animKey);
    return { obj: sprite, artKey: animKey };
  }
  const TILE = 32;
  const rect = scene.add.rectangle(x, y, TILE - 4, TILE - 4, 0xe8c878);
  rect.setStrokeStyle(2, 0x6a4020);
  return { obj: rect, artKey: null };
}

/** Ground tiles the pixel pipeline can render today; others fall back to the flat checker. */
export function hasTileArt(name: string): boolean {
  return name in TILE_RIGS;
}

/**
 * Bake a full `cols × rows` ground from a tile rig (BACKLOG-033) into ONE static texture — the
 * variants alternate like the classic checker. Per-pixel `fillRect` at an integer scale, then
 * `generateTexture` once, so the floor is a single static image with zero per-frame cost (the
 * old flat checker was a live Graphics re-rendered every frame). Idempotent; returns the texture
 * key, or null if the rig is unknown (WorldScene then keeps the flat fallback).
 */
export function bakeTileMap(
  scene: Phaser.Scene,
  name: string,
  cols: number,
  rows: number,
  tile: number,
): string | null {
  const rig = TILE_RIGS[name];
  if (!rig) return null;
  const key = `tilemap_${name}_${cols}x${rows}`;
  if (scene.textures.exists(key)) return key;

  const scale = Math.max(1, Math.floor(tile / rig.size));
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const grid = rig.variants[(cx + cy) % rig.variants.length];
      for (let py = 0; py < rig.size; py++) {
        const row = grid[py];
        for (let px = 0; px < row.length; px++) {
          g.fillStyle(rig.palette[row[px]], 1);
          g.fillRect(cx * tile + px * scale, cy * tile + py * scale, scale, scale);
        }
      }
    }
  }
  g.generateTexture(key, cols * tile, rows * tile);
  g.destroy();
  return key;
}

/**
 * Bake a mixed-terrain ground (BACKLOG-294) into ONE static texture: like `bakeTileMap`, but each cell's
 * rig is chosen by `kindAt(cx, cy)`, falling back to the grass rig for any kind whose pixel rig doesn't
 * exist yet (path/water until the Artist ships them, BACKLOG-033). Returns null only if even the grass
 * rig is missing (WorldScene then keeps the flat fallback). Idempotent — keyed by the caller's `key`.
 */
export function bakeTerrainMap(
  scene: Phaser.Scene,
  key: string,
  cols: number,
  rows: number,
  tile: number,
  kindAt: (cx: number, cy: number) => string,
): string | null {
  const fallback = TILE_RIGS.grass;
  if (!fallback) return null;
  if (scene.textures.exists(key)) return key;

  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const rig = TILE_RIGS[kindAt(cx, cy)] ?? fallback;
      const scale = Math.max(1, Math.floor(tile / rig.size));
      const grid = rig.variants[(cx + cy) % rig.variants.length];
      for (let py = 0; py < rig.size; py++) {
        const row = grid[py];
        for (let px = 0; px < row.length; px++) {
          g.fillStyle(rig.palette[row[px]], 1);
          g.fillRect(cx * tile + px * scale, cy * tile + py * scale, scale, scale);
        }
      }
    }
  }
  g.generateTexture(key, cols * tile, rows * tile);
  g.destroy();
  return key;
}

/** The baked 9-slice corner inset in display px — the fixed corner size NineSlice must use. */
export const DIALOG_FRAME_SLICE = DIALOG_FRAME.inset * 2;

/**
 * Bake the Gen3 dialog frame (BACKLOG-036) into one 9-slice source texture — per-pixel `fillRect`
 * at ×2 (transparent cells skipped, so the rounded corners read), then `generateTexture` once.
 * Idempotent; returns the texture key. DialogBox stretches it with a Phaser NineSlice.
 */
export function bakeDialogFrame(scene: Phaser.Scene): string {
  const key = 'dialog_frame';
  if (scene.textures.exists(key)) return key;
  const rig = DIALOG_FRAME;
  const scale = 2;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  for (let py = 0; py < rig.size; py++) {
    const row = rig.grid[py];
    for (let px = 0; px < row.length; px++) {
      const color = rig.palette[row[px]];
      if (color === undefined) continue; // '.' → transparent (the rounded step)
      g.fillStyle(color, 1);
      g.fillRect(px * scale, py * scale, scale, scale);
    }
  }
  g.generateTexture(key, rig.size * scale, rig.size * scale);
  g.destroy();
  return key;
}

const PROP_SCALE = 2; // 16×16 grid → 32×32, the tile footprint, same nearest-neighbour bake

/** Props the pixel pipeline can render today (BACKLOG-296); others keep their emoji glyph. */
export function hasPropArt(name: string): boolean {
  return name in PROP_RIGS;
}

/**
 * Bake a static prop (resource / cairn) into one texture — per-pixel `fillRect` at ×2 (transparent
 * cells skipped), then `generateTexture` once. Idempotent; returns the texture key, or null if the
 * prop has no rig (WorldScene then keeps the emoji text fallback). Mirrors bakeDialogFrame.
 */
export function bakePropArt(scene: Phaser.Scene, name: string): string | null {
  const rig = PROP_RIGS[name];
  if (!rig) return null;
  const key = `prop_${name}`;
  if (scene.textures.exists(key)) return key;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  for (let py = 0; py < rig.size; py++) {
    const row = rig.grid[py];
    for (let px = 0; px < row.length; px++) {
      const color = rig.palette[row[px]];
      if (color === undefined) continue; // '.' → transparent
      g.fillStyle(color, 1);
      g.fillRect(px * PROP_SCALE, py * PROP_SCALE, PROP_SCALE, PROP_SCALE);
    }
  }
  g.generateTexture(key, rig.size * PROP_SCALE, rig.size * PROP_SCALE);
  g.destroy();
  return key;
}

/** Build the visible game object for a dino — a baked sprite where art exists, else a rectangle. */
export function makeDinoArt(
  scene: Phaser.Scene,
  x: number,
  y: number,
  species: string,
  baseColor: number,
): { obj: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle; artKey: string | null } {
  const animKey = ensureWalk(scene, species, baseColor);
  if (animKey) {
    const sprite = scene.add.sprite(x, y, `${animKey}_0`);
    sprite.play(animKey);
    return { obj: sprite, artKey: animKey };
  }
  const TILE = 32;
  const rect = scene.add.rectangle(x, y, TILE - 6, TILE - 6, baseColor);
  rect.setStrokeStyle(2, 0x2a1010);
  return { obj: rect, artKey: null };
}
