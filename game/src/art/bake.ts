import Phaser from 'phaser';
import { walkFrames, SPECIES_ART, type Shape } from './dinoArt';
import { PIXEL_SPECIES } from './pixelArt';
import { KEEPER_RIGS } from './keeperArt';

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
