import Phaser from 'phaser';
import type { NPCBrain, NPCContext, Reply } from '../ai/brain';
import { seededPersonality, type Personality } from '../ai/personality';

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
  readonly sprite: Phaser.GameObjects.Rectangle;
  readonly label: Phaser.GameObjects.Text;
  private readonly brain: NPCBrain;

  constructor(scene: Phaser.Scene, x: number, y: number, cfg: DinoConfig) {
    this.name = cfg.name;
    this.species = cfg.species;
    this.personality = cfg.personality;
    this.traits = cfg.traits ?? seededPersonality(cfg.name);
    this.brain = cfg.brain;

    this.sprite = scene.add.rectangle(x, y, TILE - 6, TILE - 6, cfg.color ?? 0x8a4a3a);
    this.sprite.setStrokeStyle(2, 0x2a1010);

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

  async greet(): Promise<Reply> {
    const ctx: NPCContext = {
      name: this.name,
      species: this.species,
      personality: this.personality,
      traits: this.traits,
    };
    return this.brain.respond(ctx, { kind: 'player_greet' });
  }
}
