import Phaser from 'phaser';
import type { NPCBrain, NPCContext, Reply } from '../ai/brain';
import { seededPersonality, type Personality } from '../ai/personality';
import { makeDinoArt } from '../art/bake';

const TILE = 32;

export interface DinoConfig {
  name: string;
  species: string;
  personality: string;
  traits?: Personality;
  color?: number;
  brain: NPCBrain;
}

export class Dino {
  readonly name: string;
  readonly species: string;
  readonly personality: string;
  readonly traits: Personality;
  readonly color: number;
  /** Procedural-art animation key, or null when this species falls back to a rectangle. */
  readonly artKey: string | null;
  readonly sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;
  readonly label: Phaser.GameObjects.Text;
  private readonly brain: NPCBrain;

  constructor(scene: Phaser.Scene, x: number, y: number, cfg: DinoConfig) {
    this.name = cfg.name;
    this.species = cfg.species;
    this.personality = cfg.personality;
    this.traits = cfg.traits ?? seededPersonality(cfg.name);
    this.color = cfg.color ?? 0x8a4a3a;
    this.brain = cfg.brain;

    const art = makeDinoArt(scene, x, y, cfg.species, this.color);
    this.sprite = art.obj;
    this.artKey = art.artKey;

    this.label = scene.add.text(x, y - TILE, cfg.name, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 2, y: 1 },
    });
    this.label.setOrigin(0.5, 1);
  }

  /** Move the dino (sprite + floating label) to a pixel position. */
  setPosition(x: number, y: number): void {
    this.sprite.setPosition(x, y);
    this.label.setPosition(x, y - TILE);
  }

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  /** True when this dino is a baked sprite playing its walk loop (proof the art pipeline ran). */
  isAnimating(): boolean {
    return this.sprite instanceof Phaser.GameObjects.Sprite && this.sprite.anims.isPlaying;
  }

  async greet(extra?: Partial<NPCContext>): Promise<Reply> {
    const ctx: NPCContext = {
      name: this.name,
      species: this.species,
      personality: this.personality,
      traits: this.traits,
      ...extra,
    };
    return this.brain.respond(ctx, { kind: 'player_greet' });
  }
}
