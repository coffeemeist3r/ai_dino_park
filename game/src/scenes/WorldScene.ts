import Phaser from 'phaser';
import { makeBrain, replyPrefix, type NPCBrain } from '../ai/brain';
import { currentModel } from '../ai/deviceProbe';
import { Dino } from '../entities/dino';
import { ROSTER } from '../entities/roster';
import { DialogBox } from '../ui/DialogBox';
import { getWorldClock, type GameTime } from '../world/clock';
import { tintFor, dayPhase } from '../world/dayNight';
import { buildMessages } from '../ai/webllmBrain';
import { SAVE_VERSION, serialize, type SaveData } from '../world/saveGame';
import { loadFromDb, saveToDb } from '../world/saveStore';
import {
  bumpPoints,
  greetGain,
  heartString,
  heartsFromPoints,
  type Friendship,
} from '../social/friendship';
import { GIFTS, giftReaction, verdictPhrase, type GiftVerdict } from '../social/gifts';
import { wanderStep, stepToward } from '../world/movement';
import { recordMeet, type Meetings } from '../social/meetings';
import { remember, recall, reflect, type MemoryStore } from '../ai/memory';
import { strengthen, bondPoints, type Bonds } from '../social/bonds';

const TILE = 32;
const COLS = 20;
const ROWS = 15;

// Night sleeping huddle (BACKLOG-041): bonded dinos gather at the den after dark.
const HUDDLE_TILE = { tileX: 10, tileY: 11 };
const HUDDLE_THRESHOLD = 8; // min strongest-bond to seek the den
const BOND_PER_MEET = 4;

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private dinos: Dino[] = [];
  private dialog!: DialogBox;
  private dialogOpen = false;
  private clockHud!: Phaser.GameObjects.Text;
  private nightOverlay!: Phaser.GameObjects.Rectangle;
  private heartsPanel!: Phaser.GameObjects.Text;
  private friendship: Friendship = {};
  private npcBrain!: NPCBrain;
  private giftHud!: Phaser.GameObjects.Text;
  private heldItemIndex = 0;
  private brainHud!: Phaser.GameObjects.Text;
  private meetings: Meetings = {};
  private memory: MemoryStore = {};
  private bonds: Bonds = {};
  private sleepMarks: Phaser.GameObjects.Text[] = [];
  private readonly denCenter = { x: HUDDLE_TILE.tileX * TILE + TILE / 2, y: HUDDLE_TILE.tileY * TILE + TILE / 2 };
  private moveTicks = 0;
  private convoCooldown = 0;
  private convoInFlight = false;
  private lastConversation: { speaker: string; text: string; source?: string } | null = null;

  constructor() {
    super('World');
  }

  create(): void {
    this.drawGrassMap();
    this.drawDen(); // drawn before dinos so they nap on top of it

    this.player = this.add.rectangle(TILE * 3 + TILE / 2, TILE * 3 + TILE / 2, TILE - 4, TILE - 4, 0xe8c878);
    this.player.setStrokeStyle(2, 0x6a4020);

    // One shared brain across all dinos — five WebLLM engines would mean five model downloads.
    this.npcBrain = makeBrain('webllm');
    for (const spawn of ROSTER) {
      this.dinos.push(
        new Dino(this, spawn.tileX * TILE + TILE / 2, spawn.tileY * TILE + TILE / 2, {
          name: spawn.name,
          species: spawn.species,
          personality: spawn.personality,
          color: spawn.color,
          brain: this.npcBrain,
        }),
      );
    }

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D') as Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.dialog = new DialogBox(this);

    // E is the primary interact key; Z kept as an alias.
    this.interactKey.on('down', () => this.handleInteract());
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z).on('down', () => this.handleInteract());

    this.addControlsHint();

    this.setupClock();
    this.setupDayNight();
    this.setupSave();
    this.setupHearts();
    this.setupGifts();
    this.setupBrainHud();
    this.setupMovement();
    this.setupHuddle();
  }

  private drawDen(): void {
    const g = this.add.graphics();
    g.fillStyle(0x4a3f5a, 0.55);
    g.fillEllipse(this.denCenter.x, this.denCenter.y, TILE * 3.4, TILE * 2.2);
    g.lineStyle(2, 0x6a5f7a, 0.7);
    g.strokeEllipse(this.denCenter.x, this.denCenter.y, TILE * 3.4, TILE * 2.2);
  }

  private setupHuddle(): void {
    this.sleepMarks = this.dinos.map(() =>
      this.add.text(0, 0, '💤', { fontSize: '12px' }).setOrigin(0.5, 1).setDepth(12).setVisible(false),
    );

    // any: dev-only Playwright hooks
    (window as any).__bonds = () => ({ ...this.bonds });
    (window as any).__bondPair = (a: string, b: string) => {
      this.bonds = strengthen(this.bonds, a, b, HUDDLE_THRESHOLD);
      return bondPoints(this.bonds, a, b);
    };
    (window as any).__huddlers = () => this.dinos.filter((d) => this.isHuddling(d)).map((d) => d.name);
  }

  /** Strongest bond this dino has with any other. */
  private maxBond(name: string): number {
    let best = 0;
    for (const o of this.dinos) {
      if (o.name === name) continue;
      best = Math.max(best, bondPoints(this.bonds, name, o.name));
    }
    return best;
  }

  private isNight(): boolean {
    return dayPhase(getWorldClock().now().hour) === 'night';
  }

  private nearDen(d: Dino): boolean {
    return Math.abs(d.x - this.denCenter.x) <= TILE * 1.5 && Math.abs(d.y - this.denCenter.y) <= TILE * 1.5;
  }

  private isHuddling(d: Dino): boolean {
    return this.isNight() && this.nearDen(d);
  }

  private refreshSleepMarks(): void {
    this.dinos.forEach((d, i) => {
      const mark = this.sleepMarks[i];
      if (!mark) return;
      mark.setVisible(this.isHuddling(d)).setPosition(d.x, d.y - TILE);
    });
  }

  private setupMovement(): void {
    getWorldClock().onTick(() => {
      // Wander every 5 in-game minutes so the park mills about without jittering.
      if (++this.moveTicks % 5 === 0) this.forceStep();
    });

    // any: dev-only Playwright hooks
    (window as any).__dinoPositions = () => this.dinos.map((d) => ({ name: d.name, x: d.x, y: d.y }));
    (window as any).__meetings = () => ({ ...this.meetings });
    (window as any).__stepWorld = () => {
      this.forceStep();
      return this.dinos.map((d) => ({ name: d.name, x: d.x, y: d.y }));
    };
    // At dawn each dino folds its recent events into a one-line reflection.
    getWorldClock().onHour((t) => {
      if (t.hour !== 6) return;
      for (const d of this.dinos) {
        const events = recall(this.memory, d.name);
        if (events.length) this.memory = remember(this.memory, d.name, reflect(events));
      }
      void this.saveGame();
    });

    (window as any).__memory = () => ({ ...this.memory });
    (window as any).__lastConversation = () => this.lastConversation;
    (window as any).__forceConverse = async () => {
      if (this.dinos.length >= 2) {
        this.convoCooldown = 0;
        this.convoInFlight = false;
        await this.converse(this.dinos[0], this.dinos[1]);
      }
      return this.lastConversation;
    };
  }

  private tileOf(d: Dino): { tileX: number; tileY: number } {
    return { tileX: Math.round((d.x - TILE / 2) / TILE), tileY: Math.round((d.y - TILE / 2) / TILE) };
  }

  private nearestOther(d: Dino): Dino | null {
    let best: Dino | null = null;
    let bestDist = Infinity;
    for (const o of this.dinos) {
      if (o === d) continue;
      const dist = Phaser.Math.Distance.Between(d.x, d.y, o.x, o.y);
      if (dist < bestDist) {
        best = o;
        bestDist = dist;
      }
    }
    return best;
  }

  /** One wander + meeting step for every dino (used by the throttled tick and the dev hook). */
  private forceStep(): void {
    if (this.convoCooldown > 0) this.convoCooldown--;

    const night = this.isNight();
    for (const d of this.dinos) {
      const cur = this.tileOf(d);
      const other = this.nearestOther(d);
      let next;
      if (night && this.maxBond(d.name) >= HUDDLE_THRESHOLD) {
        // Night: bonded dinos head for the den to sleep together.
        next = stepToward(cur, HUDDLE_TILE, COLS, ROWS);
      } else if (other && Math.random() < 0.45) {
        // Day: ~45% of the time drift toward the nearest dino so the park clusters and converses.
        next = stepToward(cur, this.tileOf(other), COLS, ROWS);
      } else {
        next = wanderStep(cur, Math.floor(Math.random() * 5), COLS, ROWS);
      }
      d.setPosition(next.tileX * TILE + TILE / 2, next.tileY * TILE + TILE / 2);
    }

    for (let i = 0; i < this.dinos.length; i++) {
      for (let j = i + 1; j < this.dinos.length; j++) {
        const a = this.dinos[i];
        const b = this.dinos[j];
        if (Math.abs(a.x - b.x) <= TILE * 1.01 && Math.abs(a.y - b.y) <= TILE * 1.01) {
          this.meetings = recordMeet(this.meetings, a.name, b.name);
          this.bonds = strengthen(this.bonds, a.name, b.name, BOND_PER_MEET); // meeting (and huddling) deepens the bond
          this.flashMeet(a, b);
          if (this.convoCooldown <= 0 && !this.convoInFlight) void this.converse(a, b);
        }
      }
    }

    this.refreshSleepMarks();
  }

  /** One dino remarks on meeting another — a floating speech bubble via the shared brain. */
  private async converse(a: Dino, b: Dino): Promise<void> {
    if (this.convoInFlight) return;
    this.convoInFlight = true;
    this.convoCooldown = 8; // protect the single shared engine; space out NPC chatter
    try {
      const now = getWorldClock().now();
      const reply = await this.npcBrain.respond(
        {
          name: a.name,
          species: a.species,
          personality: a.personality,
          traits: a.traits,
          timeOfDay: dayPhase(now.hour),
        },
        { kind: 'npc_meet', detail: `${b.name} the ${b.species} wanders up` },
      );
      this.lastConversation = { speaker: a.name, text: reply.text, source: reply.source };
      this.memory = remember(this.memory, a.name, `you ran into ${b.name} the ${b.species}`);
      this.showBubble(a, `${replyPrefix(reply.source)}${reply.text}`);
    } finally {
      this.convoInFlight = false;
    }
  }

  private showBubble(d: Dino, text: string): void {
    const bubble = this.add
      .text(d.x, d.y - TILE * 1.4, text, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: TILE * 5 },
        backgroundColor: '#2a2a3acc',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setDepth(12);
    this.time.delayedCall(3500, () => bubble.destroy());
  }

  private addControlsHint(): void {
    // Build stamp — short HH:MM:SS of the running build so a restart is visible in-game.
    const stamp = typeof __BUILD_TIME__ === 'string' ? __BUILD_TIME__.slice(11, 19) : '?';
    this.add
      .text(6, 20, `build ${stamp}`, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#7fa',
        shadow: { offsetX: 1, offsetY: 1, color: '#000000', fill: true },
      })
      .setDepth(11);

    this.add
      .text(TILE * COLS - 6, TILE * ROWS - 6, 'WASD move · E talk · F give · [ ] item · C friends · O export', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#ffffff',
        align: 'right',
        backgroundColor: '#000000aa',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(1, 1)
      .setDepth(11);
  }

  private flashMeet(a: Dino, b: Dino): void {
    for (const d of [a, b]) {
      d.label.setColor('#ffe066');
      this.time.delayedCall(400, () => d.label.setColor('#ffffff'));
    }
  }

  private setupBrainHud(): void {
    this.brainHud = this.add
      .text(TILE * COLS - 6, 4, '', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#cfe8ff',
        align: 'right',
        shadow: { offsetX: 1, offsetY: 1, color: '#000000', fill: true },
      })
      .setOrigin(1, 0)
      .setDepth(11);

    const label: Record<string, string> = {
      idle: '🧠 zzz',
      loading: '🧠 thinking…',
      ready: '🧠 ready',
      fallback: '🧠 offline',
    };
    const refresh = () => this.brainHud.setText(label[this.npcBrain.status?.() ?? ''] ?? '🧠 —');
    refresh();
    getWorldClock().onTick(refresh);

    // any: dev-only Playwright hook — the model tier picked for this device
    (window as any).__modelInfo = () => currentModel();
    // any: dev-only Playwright hook — source of the most recent reply
    (window as any).__lastReplySource = () =>
      (this.npcBrain as { lastReplySource?: () => unknown }).lastReplySource?.() ?? null;
    // any: dev-only Playwright hook — the enriched system prompt for a named dino
    (window as any).__greetPrompt = (name: string) => {
      const d = this.dinos.find((x) => x.name === name);
      if (!d) return null;
      const now = getWorldClock().now();
      const msgs = buildMessages(
        {
          name: d.name,
          species: d.species,
          personality: d.personality,
          traits: d.traits,
          timeOfDay: dayPhase(now.hour),
          affection: heartsFromPoints(this.friendship[d.name] ?? 0),
          recentMemory: recall(this.memory, d.name),
        },
        { kind: 'player_greet' },
      );
      return msgs[0].content;
    };
  }

  update(): void {
    if (this.dialogOpen) return;

    const speed = 2;
    if (this.cursors.left.isDown || this.wasd.A.isDown) this.player.x -= speed;
    if (this.cursors.right.isDown || this.wasd.D.isDown) this.player.x += speed;
    if (this.cursors.up.isDown || this.wasd.W.isDown) this.player.y -= speed;
    if (this.cursors.down.isDown || this.wasd.S.isDown) this.player.y += speed;

    this.player.x = Phaser.Math.Clamp(this.player.x, TILE / 2, TILE * COLS - TILE / 2);
    this.player.y = Phaser.Math.Clamp(this.player.y, TILE / 2, TILE * ROWS - TILE / 2);
  }

  private async handleInteract(): Promise<void> {
    if (this.dialogOpen) {
      this.dialog.hide();
      this.dialogOpen = false;
      return;
    }

    const target = this.nearestDino();
    if (!target) return;

    this.recordGreet(target.name, target.traits);

    this.dialogOpen = true;
    this.dialog.show(`${target.name}: ...`);
    const now = getWorldClock().now();
    const reply = await target.greet({
      timeOfDay: dayPhase(now.hour),
      affection: heartsFromPoints(this.friendship[target.name] ?? 0),
      recentMemory: recall(this.memory, target.name),
    });
    this.dialog.show(`${replyPrefix(reply.source)}${target.name}: ${reply.text}`);
  }

  /** Raise a dino's affinity from a greet, persist, and refresh the panel. */
  private recordGreet(name: string, traits?: Dino['traits']): void {
    this.friendship = bumpPoints(this.friendship, name, greetGain(traits));
    this.memory = remember(this.memory, name, 'the human stopped by to say hello');
    void this.saveGame();
    this.refreshHeartsPanel();
  }

  private nearestDino(): Dino | null {
    let best: Dino | null = null;
    let bestDist = TILE * 2;
    for (const d of this.dinos) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, d.x, d.y);
      if (dist < bestDist) {
        best = d;
        bestDist = dist;
      }
    }
    return best;
  }

  private fmtClock(t: GameTime): string {
    return `Day ${t.day} — ${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`;
  }

  private setupClock(): void {
    const clock = getWorldClock();

    this.clockHud = this.add
      .text(6, 4, this.fmtClock(clock.now()), {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
        shadow: { offsetX: 1, offsetY: 1, color: '#000000', fill: true },
      })
      .setDepth(10);

    clock.onTick((t) => {
      this.clockHud.setText(this.fmtClock(t));
      // any: dev-only Playwright hook — not exposed in production builds
      (window as any).__clockNow = clock.now.bind(clock);
    });

    // any: dev-only Playwright hook — not exposed in production builds
    (window as any).__clockNow = clock.now.bind(clock);

    clock.start(this);
  }

  private setupDayNight(): void {
    const clock = getWorldClock();

    // Full-map overlay between the grass (depth 0) and the HUD (depth 10).
    const initial = tintFor(clock.now());
    this.nightOverlay = this.add
      .rectangle((TILE * COLS) / 2, (TILE * ROWS) / 2, TILE * COLS, TILE * ROWS, initial.color, initial.alpha)
      .setDepth(5);

    clock.onTick((t) => this.applyTint(t));

    // any: dev-only Playwright hooks — mirror the __clockNow pattern, not in production builds
    (window as any).__readTint = () => ({
      color: this.nightOverlay.fillColor,
      alpha: this.nightOverlay.fillAlpha,
    });
    // any: dev-only Playwright hook — drive the live overlay to a given hour
    (window as any).__forceHour = (h: number) => {
      this.applyTint({ day: 1, hour: h, minute: 0 });
      return { color: this.nightOverlay.fillColor, alpha: this.nightOverlay.fillAlpha };
    };
  }

  /** Paint the day/night overlay for a given time. Shared by the tick listener and save-restore. */
  private applyTint(t: GameTime): void {
    const tint = tintFor(t);
    this.nightOverlay.setFillStyle(tint.color, tint.alpha);
  }

  private currentSaveData(): SaveData {
    return {
      version: SAVE_VERSION,
      time: getWorldClock().now(),
      player: { x: this.player.x, y: this.player.y },
      friendship: this.friendship,
      memory: this.memory,
      bonds: this.bonds,
    };
  }

  private async saveGame(): Promise<void> {
    try {
      await saveToDb(this.currentSaveData());
    } catch (err) {
      // No silent failures (CHARTER §Quality bar) — surface to the console for the chronicle.
      console.error('[save] auto-save failed', err);
    }
  }

  private setupSave(): void {
    const clock = getWorldClock();

    // Restore on boot. create() has already built the HUD/overlay at the default
    // 08:00 and started the clock; loadFromDb resolves a beat later and overrides.
    void loadFromDb().then((save) => {
      if (!save) return;
      clock.set(save.time);
      this.player.setPosition(save.player.x, save.player.y);
      this.friendship = save.friendship;
      this.memory = save.memory;
      this.bonds = save.bonds;
      this.clockHud.setText(this.fmtClock(clock.now()));
      this.applyTint(clock.now());
      this.refreshHeartsPanel();
    });

    clock.onHour(() => void this.saveGame());

    // Export moved off E (now the interact key) to O.
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.O).on('down', () => this.exportSave());

    // any: dev-only Playwright hooks — mirror the __clockNow pattern, not in production builds
    (window as any).__saveNow = async () => {
      const data = this.currentSaveData();
      await saveToDb(data);
      return data;
    };
    // any: dev-only Playwright hook — serialized current state
    (window as any).__exportSave = () => serialize(this.currentSaveData());
    // any: dev-only Playwright hook — advance the clock n in-game minutes (fires tick/hour listeners)
    (window as any).__advanceMinutes = (n: number) => {
      for (let i = 0; i < n; i++) clock.tick();
      return clock.now();
    };
    // any: dev-only Playwright hook — current player position
    (window as any).__playerPos = () => ({ x: this.player.x, y: this.player.y });
    // any: dev-only Playwright hook — first dino's seeded personality traits
    (window as any).__dinoTraits = () => this.dinos[0]?.traits;
    // any: dev-only Playwright hook — roster size + names
    (window as any).__dinoCount = () => this.dinos.length;
    // any: dev-only Playwright hook — every dino's name
    (window as any).__dinoNames = () => this.dinos.map((d) => d.name);
    // any: dev-only Playwright hook — shared NPC brain load status
    (window as any).__brainStatus = () => this.npcBrain.status?.() ?? 'n/a';
  }

  private setupHearts(): void {
    this.heartsPanel = this.add
      .text(TILE * COLS - 6, 22, '', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
        align: 'right',
        backgroundColor: '#000000cc',
        padding: { x: 6, y: 4 },
      })
      .setOrigin(1, 0)
      .setDepth(11)
      .setVisible(false);
    this.refreshHeartsPanel();

    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.C).on('down', () => {
      this.heartsPanel.setVisible(!this.heartsPanel.visible);
      if (this.heartsPanel.visible) this.refreshHeartsPanel();
    });

    // any: dev-only Playwright hook — name → heart count for every dino
    (window as any).__hearts = () => {
      const out: Record<string, number> = {};
      for (const d of this.dinos) out[d.name] = heartsFromPoints(this.friendship[d.name] ?? 0);
      return out;
    };
    // any: dev-only Playwright hook — apply one greet's gain to a named dino
    (window as any).__greet = (name: string) => {
      const dino = this.dinos.find((d) => d.name === name);
      this.recordGreet(name, dino?.traits);
      return heartsFromPoints(this.friendship[name] ?? 0);
    };
    // any: dev-only Playwright hook — is the hearts panel showing
    (window as any).__heartsPanelVisible = () => this.heartsPanel.visible;
  }

  private refreshHeartsPanel(): void {
    if (!this.heartsPanel) return;
    const lines = this.dinos.map((d) => {
      const hearts = heartsFromPoints(this.friendship[d.name] ?? 0);
      return `${d.name.padEnd(9)} ${heartString(hearts)}`;
    });
    this.heartsPanel.setText(['— Friends —', ...lines].join('\n'));
  }

  private setupGifts(): void {
    this.giftHud = this.add
      .text(6, TILE * ROWS - 6, '', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
        backgroundColor: '#000000aa',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0, 1)
      .setDepth(11);
    this.refreshGiftHud();

    const kb = this.input.keyboard!;
    kb.addKey(Phaser.Input.Keyboard.KeyCodes.CLOSED_BRACKET).on('down', () => this.cycleItem(1));
    kb.addKey(Phaser.Input.Keyboard.KeyCodes.OPEN_BRACKET).on('down', () => this.cycleItem(-1));
    // F is the primary give key; G kept as an alias.
    kb.addKey(Phaser.Input.Keyboard.KeyCodes.F).on('down', () => this.giveGift());
    kb.addKey(Phaser.Input.Keyboard.KeyCodes.G).on('down', () => this.giveGift());

    // any: dev-only Playwright hooks — mirror the __clockNow pattern
    (window as any).__heldItem = () => GIFTS[this.heldItemIndex].id;
    (window as any).__cycleItem = () => {
      this.cycleItem(1);
      return GIFTS[this.heldItemIndex].id;
    };
    (window as any).__giveGift = (name: string) => {
      const target = this.dinos.find((d) => d.name === name);
      if (!target) return null;
      const verdict = this.applyGift(target.name, target.traits);
      return { verdict, hearts: heartsFromPoints(this.friendship[target.name] ?? 0) };
    };
  }

  private cycleItem(dir: number): void {
    this.heldItemIndex = (this.heldItemIndex + dir + GIFTS.length) % GIFTS.length;
    this.refreshGiftHud();
  }

  private refreshGiftHud(): void {
    if (!this.giftHud) return;
    this.giftHud.setText(`Holding: ${GIFTS[this.heldItemIndex].label}  ([ ] to switch, G to give)`);
  }

  /** Apply the held gift's reaction to a dino's affinity; returns the verdict. */
  private applyGift(name: string, traits?: Dino['traits']): GiftVerdict {
    const gift = GIFTS[this.heldItemIndex];
    const { verdict, delta } = giftReaction(gift, traits);
    this.friendship = bumpPoints(this.friendship, name, delta);
    this.memory = remember(this.memory, name, `the human gave you a ${gift.label}, and you ${verdict} it`);
    void this.saveGame();
    this.refreshHeartsPanel();
    return verdict;
  }

  private giveGift(): void {
    if (this.dialogOpen) return;
    const target = this.nearestDino();
    if (!target) return;
    const gift = GIFTS[this.heldItemIndex];
    const verdict = this.applyGift(target.name, target.traits);
    this.dialogOpen = true;
    this.dialog.show(`${target.name} ${verdictPhrase(verdict)} the ${gift.label}!`);
  }

  private exportSave(): void {
    const blob = new Blob([serialize(this.currentSaveData())], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dino-save.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  private drawGrassMap(): void {
    const g = this.add.graphics();
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const shade = (x + y) % 2 === 0 ? 0x3a6a3a : 0x2f5e2f;
        g.fillStyle(shade, 1);
        g.fillRect(x * TILE, y * TILE, TILE, TILE);
      }
    }
  }
}
