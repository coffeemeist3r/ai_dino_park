import Phaser from 'phaser';
import { walkFrames, type Shape } from './dinoArt';

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
 * Ensure a triceratops walk animation exists for `baseColor`; returns the anim key.
 * Idempotent and colour-keyed, so every dino reuses one bake.
 */
export function ensureTriceratops(scene: Phaser.Scene, baseColor: number): string {
  const animKey = `tri_walk_${baseColor.toString(16)}`;
  if (scene.anims.exists(animKey)) return animKey;

  const frames = walkFrames(baseColor, FRAMES).map((shapes, i) => {
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
  return species === 'triceratops';
}

/** Build the visible game object for a dino — a baked sprite where art exists, else a rectangle. */
export function makeDinoArt(
  scene: Phaser.Scene,
  x: number,
  y: number,
  species: string,
  baseColor: number,
): { obj: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle; artKey: string | null } {
  if (hasArt(species)) {
    const animKey = ensureTriceratops(scene, baseColor);
    const sprite = scene.add.sprite(x, y, `${animKey}_0`);
    sprite.play(animKey);
    return { obj: sprite, artKey: animKey };
  }
  const TILE = 32;
  const rect = scene.add.rectangle(x, y, TILE - 6, TILE - 6, baseColor);
  rect.setStrokeStyle(2, 0x2a1010);
  return { obj: rect, artKey: null };
}
