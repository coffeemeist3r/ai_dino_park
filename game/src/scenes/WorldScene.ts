import Phaser from 'phaser';
import { makeBrain, replyPrefix, type NPCBrain } from '../ai/brain';
import { currentModel } from '../ai/deviceProbe';
import { Dino } from '../entities/dino';
import { hasArt } from '../art/bake';
import { ROSTER } from '../entities/roster';
import { DialogBox } from '../ui/DialogBox';
import { getWorldClock, type GameTime } from '../world/clock';
import { fastForward } from '../world/away';
import { homecoming, type Homecoming } from '../world/homecoming';
import { repairGain, repairLine, repairMemory } from '../world/repair';
import { comforter, comfortLine, comfortMemory, recordGratitude, COMFORT_BOND, type Gratitude } from '../world/comfort';
import { tintFor, dayPhase } from '../world/dayNight';
import {
  rollSkyEvent,
  atGather,
  skyExpired,
  SKY_GATHER_TILE,
  SKY_EVENTS,
  SKY_ROLL_INTERVAL_MS,
  type SkyEvent,
  type SkyEventId,
} from '../world/skyEvent';
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
import { TONES, toneById, toneReaction, lastToneLine, type ToneId } from '../social/tones';
import { KEEPERS, DEFAULT_KEEPER_ID, keeperById, keeperBonus } from '../keeper/keepers';
import { canScan, scanLines, scanRefusal, type ScanSubject } from '../keeper/scan';
import { wanderStep, stepToward } from '../world/movement';
import { recordMeet, pairKey, type Meetings } from '../social/meetings';
import { remember, recall, reflect, type MemoryStore } from '../ai/memory';
import { spreadGossip, RUMOR_MARK } from '../social/gossip';
import { nextLens, bondedPairs, tickerLines, bookLines, LENS_LABEL, type Lens, type BookRow } from '../ui/lenses';
import { deriveRole, ROLE_ICON, type Role } from '../ai/roles';
import { GLASS, cornerRadius, rimRects, edgeBands, glarePolys, toPoints } from '../ui/glass';
import { reactionFor, startleStep, type StartleReaction } from '../world/startle';
import { reactionToFood, feedStep, reachedFood, foodLanding } from '../world/feeding';
import { FOODS, favoriteFood, foodReaction, type Food } from '../world/foods';
import { maxGeneration, plaqueLines } from '../ui/plaque';
import { hudAlpha, isIdle } from '../world/idle';
import { strengthen, bondPoints, type Bonds } from '../social/bonds';
import {
  shouldLay,
  makeEgg,
  isHatched,
  hatch,
  childName,
  EGG_BOND_THRESHOLD,
  MAX_POPULATION,
  type Egg,
  type BornDino,
} from '../social/breeding';

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
  private lastAwayDigest: string[] = [];
  private lastHomecoming: Homecoming | null = null;
  private liveBubbles = new Set<string>();
  /** The jealous runner-up awaiting a make-up greet (BACKLOG-125); transient, one-shot, not persisted. */
  private pendingRepair: string | null = null;
  /** The last dino-to-dino comfort beat (BACKLOG-130): who consoled whom, or null. Transient. */
  private lastComfort: { comforter: string; sulker: string } | null = null;
  /** Who each dino owes a consolation back to (BACKLOG-132); persisted, drives the gratitude echo. */
  private gratitude: Gratitude = {};
  /** Tone menu state (BACKLOG-142): open flag, the dino being greeted, and the live menu text. */
  private toneMenuOpen = false;
  private toneTarget: Dino | null = null;
  private toneMenuText = '';
  /** Each dino's last greeting tone (BACKLOG-142); persisted, surfaced as a remembered trace. */
  private lastTone: Record<string, ToneId> = {};
  /** The chosen observer (BACKLOG-155); persisted. Its affinity-fit bonus colours every player gain. */
  private keeperId: string = DEFAULT_KEEPER_ID;
  /** Keeper picker overlay state (BACKLOG-155): open via K, number keys 1/2/3 choose. */
  private keeperPickerOpen = false;
  /** Field Scan panel (BACKLOG-157): LUMEN-3's dossier readout. Transient, never persisted. */
  private scanPanel!: Phaser.GameObjects.Text;
  private scanOpen = false;
  private eggs: Egg[] = [];
  private born: BornDino[] = [];
  private eggSprites = new Map<string, Phaser.GameObjects.Text>();
  private sleepMarks: Phaser.GameObjects.Text[] = [];
  private roleTags: Phaser.GameObjects.Text[] = [];
  private lens: Lens = 'off';
  private bookPanel!: Phaser.GameObjects.Text;
  private bondGfx!: Phaser.GameObjects.Graphics;
  private tickerPanel!: Phaser.GameObjects.Text;
  private lensLabel!: Phaser.GameObjects.Text;
  private plaque!: Phaser.GameObjects.Text;
  private eventLog: string[] = [];
  private hudElements: Array<{ setAlpha: (a: number) => unknown }> = [];
  private lastInputAt = 0;
  private ambientActive = false;
  private ambientTween?: Phaser.Tweens.Tween;
  private readonly denCenter = { x: HUDDLE_TILE.tileX * TILE + TILE / 2, y: HUDDLE_TILE.tileY * TILE + TILE / 2 };
  private food: { tileX: number; tileY: number } | null = null;
  private foodKind: Food | null = null;
  private foodLanded = false;
  private foodSprite: Phaser.GameObjects.Text | null = null;
  private moveTicks = 0;
  /** The active world-scale night event (BACKLOG-144), or null. Transient — only its memory persists. */
  private activeSky: SkyEvent | null = null;
  private skyStartAbsMin = 0;
  /** In-game day of the last sky event — caps the spectacle at one per day. */
  private skyFiredDay = -1;
  private skyGazers = new Set<string>();
  private skyOverlay!: Phaser.GameObjects.Rectangle;
  private skyTween?: Phaser.Tweens.Tween;
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
    for (const spawn of ROSTER) this.spawnDino(spawn);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D') as Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.dialog = new DialogBox(this);

    // E is the primary interact key; Z kept as an alias.
    this.interactKey.on('down', () => this.handleInteract());
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z).on('down', () => this.handleInteract());

    // 1/2/3 pick a greeting tone (BACKLOG-142) — or, while the keeper picker is up (BACKLOG-155),
    // choose an observer. onNumberKey routes to whichever overlay is open.
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE).on('down', () => this.onNumberKey(1));
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO).on('down', () => this.onNumberKey(2));
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.THREE).on('down', () => this.onNumberKey(3));

    // K opens the keeper picker (BACKLOG-155): choose which time-traveling observer you are.
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.K).on('down', () => this.openKeeperPicker());

    // B is LUMEN-3's Field Scan (BACKLOG-157): read the nearest dino's mind — Lux only.
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.B).on('down', () => this.toggleScan());

    this.addControlsHint();

    this.setupClock();
    this.setupDayNight();
    this.setupSave();
    this.setupHearts();
    this.setupGifts();
    this.setupBrainHud();
    this.setupMovement();
    this.setupHuddle();
    this.setupLenses();
    this.setupGlass();
    this.setupTap();
    this.setupFeeding();
    this.setupSkyEvent();
    this.setupPlaque();
    this.setupScan();
    this.setupIdle();

    // Readiness flag: all dev hooks are now attached. e2e boot() waits on this to
    // avoid the parallel-load flake of reading a hook before create() finishes.
    (window as any).__ready = true;
  }

  /** Idle / ambient mode (BACKLOG-060): fade the HUD + breathe the camera after a still spell. */
  private setupIdle(): void {
    this.lastInputAt = this.time.now;
    // The always-on HUD that fades when the keeper steps away (panels toggled by keys are excluded).
    this.hudElements.push(this.clockHud, this.brainHud, this.giftHud, this.plaque, this.lensLabel);

    const markActive = () => {
      this.lastInputAt = this.time.now;
      if (this.ambientActive) this.exitAmbient();
    };
    this.input.keyboard!.on('keydown', markActive);
    this.input.on('pointerdown', markActive);

    // dev-only Playwright hooks
    (window as any).__idleAlpha = () => hudAlpha(this.time.now - this.lastInputAt);
    (window as any).__isAmbient = () => isIdle(this.time.now - this.lastInputAt);
    (window as any).__forceIdle = (ms: number) => {
      this.lastInputAt = this.time.now - ms;
      this.applyIdle();
      return hudAlpha(ms);
    };
    (window as any).__nudgeInput = () => {
      markActive();
      this.applyIdle();
      return hudAlpha(0);
    };
  }

  /** Fade the HUD to match how long we've been idle, and start/stop the camera breathing. */
  private applyIdle(): void {
    const idleMs = this.time.now - this.lastInputAt;
    const a = hudAlpha(idleMs);
    for (const el of this.hudElements) el.setAlpha(a);
    if (isIdle(idleMs)) this.enterAmbient();
  }

  private enterAmbient(): void {
    if (this.ambientActive) return;
    this.ambientActive = true;
    // Slow "breathing" zoom toward the centre of the bowl; yoyos forever until input.
    this.ambientTween = this.tweens.add({
      targets: this.cameras.main,
      zoom: 1.04,
      duration: 6_000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  private exitAmbient(): void {
    if (!this.ambientActive) return;
    this.ambientActive = false;
    this.ambientTween?.stop();
    this.ambientTween = undefined;
    this.cameras.main.setZoom(1);
    for (const el of this.hudElements) el.setAlpha(1);
  }

  /** The Plaque (BACKLOG-058): an engraved nameplate under the bowl with live vivarium stats. */
  private setupPlaque(): void {
    this.plaque = this.add
      .text((TILE * COLS) / 2, TILE * ROWS - 4, '', {
        fontFamily: 'serif',
        fontSize: '11px',
        color: '#f4d58d',
        align: 'center',
        backgroundColor: '#3a2a14e6',
        padding: { x: 10, y: 4 },
      })
      .setOrigin(0.5, 1)
      .setDepth(11);
    this.refreshPlaque();
    getWorldClock().onTick(() => this.refreshPlaque());

    // dev-only Playwright hook — current plaque stats
    (window as any).__plaque = () => ({
      population: this.dinos.length,
      day: getWorldClock().now().day,
      generations: maxGeneration(this.born),
    });
  }

  private refreshPlaque(): void {
    if (!this.plaque) return;
    this.plaque.setText(
      plaqueLines({
        population: this.dinos.length,
        day: getWorldClock().now().day,
        generations: maxGeneration(this.born),
      }).join('\n'),
    );
  }

  /** Tap the glass (BACKLOG-057): a click raps the bowl; nearby dinos react by temperament. */
  private setupTap(): void {
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.tapGlass(p.worldX, p.worldY));
    // dev-only Playwright hook — tap at a pixel, returns each dino's reaction
    (window as any).__tapGlass = (px: number, py: number) => this.tapGlass(px, py);
  }

  /** Rap the glass at a pixel; ripple, then every dino flees/approaches/ignores by bravery. */
  private tapGlass(px: number, py: number): Array<{ name: string; reaction: StartleReaction }> {
    this.spawnRipple(px, py);
    const tap = {
      tileX: Math.max(0, Math.min(COLS - 1, Math.round((px - TILE / 2) / TILE))),
      tileY: Math.max(0, Math.min(ROWS - 1, Math.round((py - TILE / 2) / TILE))),
    };

    const out: Array<{ name: string; reaction: StartleReaction }> = [];
    for (const d of this.dinos) {
      const cur = this.tileOf(d);
      const dist = Math.hypot(cur.tileX - tap.tileX, cur.tileY - tap.tileY);
      const reaction = reactionFor(d.traits.bravery, dist);
      out.push({ name: d.name, reaction });
      if (reaction === 'ignore') continue;

      // a startled dino jumps two tiles in its chosen direction
      let next = cur;
      for (let i = 0; i < 2; i++) next = startleStep(next, tap, reaction, COLS, ROWS);
      d.setPosition(next.tileX * TILE + TILE / 2, next.tileY * TILE + TILE / 2);

      this.flashStartle(d, reaction);
      this.memory = remember(
        this.memory,
        d.name,
        reaction === 'bolt' ? 'the glass shook and you bolted in fright' : 'the glass shook and you crept closer to look',
      );
    }
    return out;
  }

  private spawnRipple(px: number, py: number): void {
    const ring = this.add.circle(px, py, 6, 0xffffff, 0).setStrokeStyle(2, GLASS.rimColor, 0.9).setDepth(9);
    this.tweens.add({
      targets: ring,
      radius: TILE * 2,
      alpha: 0,
      duration: 500,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  private flashStartle(d: Dino, reaction: StartleReaction): void {
    const mark = this.add
      .text(d.x, d.y - TILE * 0.9, reaction === 'bolt' ? '❗' : '❓', { fontSize: '14px' })
      .setOrigin(0.5, 1)
      .setDepth(12);
    d.label.setColor(reaction === 'bolt' ? '#ff8080' : '#9fe8ff');
    this.time.delayedCall(700, () => {
      mark.destroy();
      d.label.setColor('#ffffff');
    });
  }

  /** Feeding hatch (BACKLOG-059): press H to drop food; the cast swarms it; first to reach eats. */
  private setupFeeding(): void {
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.H).on('down', () => this.dropFood());

    // dev-only Playwright hooks. __dropFood lands the food immediately so tests
    // skip the real-time fall tween; the H press uses the tween for the visual.
    // An optional foodId forces the kind (random when omitted).
    (window as any).__dropFood = (col?: number, foodId?: string) => {
      const tile = this.dropFood(col, foodId);
      if (this.food) this.foodLanded = true;
      return tile;
    };
    (window as any).__food = () =>
      this.food ? { ...this.food, foodId: this.foodKind?.id ?? null } : null;
    (window as any).__favoriteFood = (name: string) => {
      const d = this.dinos.find((x) => x.name === name);
      return d ? { ...favoriteFood(d.traits) } : null;
    };
  }

  /** Drop one piece of food through the hatch. One at a time; returns its landing tile. */
  private dropFood(col?: number, foodId?: string): { tileX: number; tileY: number } {
    if (this.food) return this.food; // already a piece in play — ignore the drop
    const kind = foodId
      ? FOODS.find((f) => f.id === foodId) ?? FOODS[0]
      : FOODS[Math.floor(Math.random() * FOODS.length)];
    const landing = foodLanding(COLS, ROWS, col);
    this.food = landing;
    this.foodKind = kind;
    this.foodLanded = false;
    const px = landing.tileX * TILE + TILE / 2;
    const landY = landing.tileY * TILE + TILE / 2;
    this.foodSprite = this.add.text(px, TILE * 0.4, kind.emoji, { fontSize: '18px' }).setOrigin(0.5).setDepth(2);
    this.tweens.add({
      targets: this.foodSprite,
      y: landY,
      duration: 600,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.foodLanded = true;
      },
    });
    this.logEvent(`${kind.emoji} food dropped from the hatch (${kind.label})`);
    return landing;
  }

  /** First dino standing on (or beside) the landed food eats it. */
  private checkFeeding(): void {
    if (!this.food || !this.foodLanded) return;
    const eater = this.dinos.find((d) => reachedFood(this.tileOf(d), this.food!));
    if (eater) this.eatFood(eater);
  }

  private eatFood(d: Dino): void {
    const kind = this.foodKind;
    const r = foodReaction(kind!, d.traits);
    this.foodSprite?.destroy();
    this.foodSprite = null;
    this.food = null;
    this.foodKind = null;
    this.foodLanded = false;
    this.friendship = bumpPoints(this.friendship, d.name, r.gain);
    this.memory = remember(
      this.memory,
      d.name,
      r.favorite
        ? `you snapped up the food at the hatch — your favorite ${kind!.label}!`
        : 'you scrambled to the hatch and snapped up the food',
    );
    this.flashFeed(d, r.emoji);
    this.logEvent(
      `🍖 ${d.name} snapped up the food at the hatch${r.favorite ? ` — its favorite ${kind!.label}!` : ''}`,
    );
    this.refreshHeartsPanel();
    void this.saveGame();
  }

  private flashFeed(d: Dino, emoji = '😋'): void {
    const mark = this.add
      .text(d.x, d.y - TILE * 0.9, emoji, { fontSize: '14px' })
      .setOrigin(0.5, 1)
      .setDepth(12);
    d.label.setColor('#a8ff80');
    this.time.delayedCall(700, () => {
      mark.destroy();
      d.label.setColor('#ffffff');
    });
  }

  /** Absolute in-game minute (since Day 1 00:00) — sky-event timing reads the same clock e2e advances. */
  private absMinNow(): number {
    const t = getWorldClock().now();
    return (t.day - 1) * 24 * 60 + t.hour * 60 + t.minute;
  }

  /**
   * World-scale night event (BACKLOG-144): on a rare clear night the sky lights up and the whole
   * cast gathers to watch. The overlay shimmer lives here; the gather movement + shared memory are
   * folded into forceStep so the spectacle overrides ordinary wandering.
   */
  private setupSkyEvent(): void {
    // depth 7: above the night tint (5) + bond lines (6), below the glass rim (8) and HUD (10+).
    this.skyOverlay = this.add
      .rectangle((TILE * COLS) / 2, (TILE * ROWS) / 2, TILE * COLS, TILE * ROWS, SKY_EVENTS[0].color, 0)
      .setDepth(7)
      .setVisible(false);

    // Roll on a real-time cadence (NOT in-game hours): offline catch-up and per-minute clock
    // advances must not retroactively spawn events, and a short headless test never waits this long.
    this.time.addEvent({ delay: SKY_ROLL_INTERVAL_MS, loop: true, callback: () => this.maybeStartSky() });

    // dev-only Playwright hooks
    (window as any).__skyEvent = () => this.activeSky?.id ?? null;
    (window as any).__skyGazers = () => [...this.skyGazers];
    // Force-start an event (default first, or by id), bypassing the roll — drives the e2e flow.
    (window as any).__triggerSky = (id?: SkyEventId) => {
      const ev = SKY_EVENTS.find((e) => e.id === id) ?? SKY_EVENTS[0];
      this.startSky(ev);
      return this.activeSky?.id ?? null;
    };
  }

  private maybeStartSky(): void {
    if (this.activeSky) return;
    if (getWorldClock().now().day === this.skyFiredDay) return; // at most one spectacle per in-game day
    const ev = rollSkyEvent({
      isClearNight: this.isClearNight(),
      active: false,
      chanceRoll: Math.random(),
      pickRoll: Math.random(),
    });
    if (ev) this.startSky(ev);
  }

  private startSky(ev: SkyEvent): void {
    this.activeSky = ev;
    this.skyStartAbsMin = this.absMinNow();
    this.skyFiredDay = getWorldClock().now().day;
    this.skyGazers.clear();
    this.skyOverlay.setFillStyle(ev.color, 0.18).setVisible(true);
    this.skyTween?.stop();
    this.skyTween = this.tweens.add({
      targets: this.skyOverlay,
      fillAlpha: 0.34,
      duration: 1400,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
    this.logEvent(`✨ the sky lit up — ${ev.label} over the bowl`);
  }

  private endSky(): void {
    if (!this.activeSky) return;
    this.activeSky = null;
    this.skyTween?.stop();
    this.skyTween = undefined;
    this.skyOverlay.setVisible(false).setFillStyle(SKY_EVENTS[0].color, 0);
    // Persist the memories the gazers filed while watching.
    void this.saveGame();
  }

  /**
   * Drive the active sky event one world-step: end it if expired or dawn has come, else pull every
   * dino toward the shared gather tile and, as each arrives, file the one shared memory + a ✨ bubble.
   * Returns true while an event is running so forceStep skips ordinary wandering this step.
   */
  private stepSky(): boolean {
    if (!this.activeSky) return false;
    if (!this.isNight() || skyExpired(this.absMinNow() - this.skyStartAbsMin, this.activeSky)) {
      this.endSky();
      return false;
    }
    for (const d of this.dinos) {
      const next = stepToward(this.tileOf(d), SKY_GATHER_TILE, COLS, ROWS);
      d.setPosition(next.tileX * TILE + TILE / 2, next.tileY * TILE + TILE / 2);
      if (atGather(next) && !this.skyGazers.has(d.name)) {
        this.skyGazers.add(d.name);
        this.memory = remember(this.memory, d.name, this.activeSky.memory);
        this.showBubble(d, this.activeSky.bubble);
      }
    }
    return true;
  }

  /** The Glass (BACKLOG-056): draw the vivarium bowl — edge shadow, glass rim, reflections. */
  private setupGlass(): void {
    const W = TILE * COLS;
    const H = TILE * ROWS;
    const r = cornerRadius(TILE);

    // depth 8: over the night overlay (5) and bond lines (6), under the HUD/labels (10+)
    const g = this.add.graphics().setDepth(8);

    // edge vignette — darken the rim inward; corners double up for a deeper bowl shadow
    g.fillStyle(GLASS.vignetteColor, GLASS.vignetteAlpha);
    for (const b of edgeBands(W, H)) g.fillRect(b.x, b.y, b.width, b.height);

    // crisp glass rim + faint inner highlight
    const rims = rimRects(W, H);
    g.lineStyle(GLASS.rim, GLASS.rimColor, 0.7);
    g.strokeRoundedRect(rims[0].x, rims[0].y, rims[0].width, rims[0].height, r);
    g.lineStyle(1, GLASS.innerColor, 0.25);
    g.strokeRoundedRect(rims[1].x, rims[1].y, rims[1].width, rims[1].height, r - 3);

    // reflection streaks catching the light off the curved glass
    g.fillStyle(GLASS.glareColor, GLASS.glareAlpha);
    for (const poly of glarePolys(W, H)) g.fillPoints(toPoints(poly), true);

    // curved highlight along the top rim — the catch of light on a bowl's lip
    g.lineStyle(2, GLASS.rimColor, 0.4);
    g.beginPath();
    g.arc(W / 2, H * 0.16, W * 0.46, Phaser.Math.DegToRad(205), Phaser.Math.DegToRad(335));
    g.strokePath();

    // dev-only Playwright hook — confirms the glass drew and reports its rim
    (window as any).__glass = () => ({ width: W, height: H, radius: r });
  }

  /** Spawn a dino (roster or born), keeping its 💤 sleep-mark index-aligned in `sleepMarks`. */
  private spawnDino(cfg: {
    name: string;
    species: string;
    personality: string;
    color: number;
    tileX: number;
    tileY: number;
    traits?: BornDino['traits'];
  }): Dino {
    const dino = new Dino(this, cfg.tileX * TILE + TILE / 2, cfg.tileY * TILE + TILE / 2, {
      name: cfg.name,
      species: cfg.species,
      personality: cfg.personality,
      color: cfg.color,
      traits: cfg.traits,
      brain: this.npcBrain,
    });
    this.dinos.push(dino);
    this.sleepMarks.push(
      this.add.text(0, 0, '💤', { fontSize: '12px' }).setOrigin(0.5, 1).setDepth(12).setVisible(false),
    );
    this.roleTags.push(
      this.add
        .text(0, 0, '', { fontFamily: 'monospace', fontSize: '9px', color: '#ffe0a0', backgroundColor: '#000000aa', padding: { x: 2, y: 1 } })
        .setOrigin(0.5, 1)
        .setDepth(12)
        .setVisible(false),
    );
    return dino;
  }

  private drawDen(): void {
    const g = this.add.graphics();
    g.fillStyle(0x4a3f5a, 0.55);
    g.fillEllipse(this.denCenter.x, this.denCenter.y, TILE * 3.4, TILE * 2.2);
    g.lineStyle(2, 0x6a5f7a, 0.7);
    g.strokeEllipse(this.denCenter.x, this.denCenter.y, TILE * 3.4, TILE * 2.2);
  }

  private setupHuddle(): void {
    // sleepMarks are created per-dino in spawnDino so born dinos get one too.

    // any: dev-only Playwright hooks
    (window as any).__bonds = () => ({ ...this.bonds });
    (window as any).__bondPair = (a: string, b: string) => {
      this.bonds = strengthen(this.bonds, a, b, HUDDLE_THRESHOLD);
      return bondPoints(this.bonds, a, b);
    };
    (window as any).__huddlers = () => this.dinos.filter((d) => this.isHuddling(d)).map((d) => d.name);

    // egg-phase hooks (BACKLOG-042)
    (window as any).__eggs = () => this.eggs.map((e) => ({ ...e }));
    (window as any).__population = () => this.dinos.length;
    // force a clutch from two parents (sets a high bond, then lays regardless of time)
    (window as any).__layEgg = (a: string, b: string) => {
      this.bonds = strengthen(this.bonds, a, b, EGG_BOND_THRESHOLD);
      return this.layEgg(a, b);
    };
    // hatch every pending egg now (independent of the clock)
    (window as any).__forceHatch = () => {
      for (const e of [...this.eggs]) this.hatchEgg(e);
      return this.dinos.length;
    };
  }

  /** A clear night for breeding. No weather yet (BACKLOG-028) — every night counts as clear. */
  private isClearNight(): boolean {
    return this.isNight();
  }

  private hasEggForPair(a: string, b: string): boolean {
    const key = pairKey(a, b);
    return this.eggs.some((e) => pairKey(e.parentA, e.parentB) === key);
  }

  /** Lay an egg from a bonded pair by the den. Returns the egg, or null if one is already pending. */
  private layEgg(a: string, b: string): Egg | null {
    if (this.hasEggForPair(a, b)) return null;
    const day = getWorldClock().now().day;
    const tile = { tileX: HUDDLE_TILE.tileX + 1, tileY: HUDDLE_TILE.tileY };
    const egg = makeEgg(a, b, day, tile);
    this.eggs.push(egg);
    this.drawEgg(egg);
    this.logEvent(`🥚 ${a} & ${b} nested by the den`);
    void this.saveGame();
    return egg;
  }

  private drawEgg(egg: Egg): void {
    const sprite = this.add
      .text(egg.tileX * TILE + TILE / 2, egg.tileY * TILE + TILE / 2, '🥚', { fontSize: '18px' })
      .setOrigin(0.5)
      .setDepth(2);
    this.eggSprites.set(egg.id, sprite);
  }

  /** Scan huddling pairs on a clear night; bonded enough → an egg appears by the den. */
  private maybeLayEggs(): void {
    if (!this.isClearNight()) return;
    const huddlers = this.dinos.filter((d) => this.isHuddling(d));
    for (let i = 0; i < huddlers.length; i++) {
      for (let j = i + 1; j < huddlers.length; j++) {
        const a = huddlers[i];
        const b = huddlers[j];
        if (
          shouldLay({
            bond: bondPoints(this.bonds, a.name, b.name),
            population: this.dinos.length + this.eggs.length,
            isClearNight: true,
            bothHuddling: true,
            hasEggForPair: this.hasEggForPair(a.name, b.name),
          })
        ) {
          this.layEgg(a.name, b.name);
        }
      }
    }
  }

  /** Hatch any egg whose day has come into a new blended dino. */
  private checkHatch(): void {
    const day = getWorldClock().now().day;
    for (const egg of [...this.eggs]) {
      if (isHatched(egg, day)) this.hatchEgg(egg);
    }
  }

  private hatchEgg(egg: Egg): void {
    // remove the clutch regardless of outcome so a missing parent can't wedge it forever
    this.eggs = this.eggs.filter((e) => e.id !== egg.id);
    this.eggSprites.get(egg.id)?.destroy();
    this.eggSprites.delete(egg.id);

    if (this.dinos.length >= MAX_POPULATION) return; // at cap — clutch is lost
    const pa = this.dinos.find((d) => d.name === egg.parentA);
    const pb = this.dinos.find((d) => d.name === egg.parentB);
    if (!pa || !pb) return; // a parent left the world

    const taken = new Set(this.dinos.map((d) => d.name));
    let name = childName(egg.parentA, egg.parentB);
    for (let i = 2; taken.has(name); i++) name = `${childName(egg.parentA, egg.parentB)}${i}`;

    const baby = hatch(
      egg,
      {
        traitsA: pa.traits,
        traitsB: pb.traits,
        speciesA: pa.species,
        speciesB: pb.species,
        colorA: pa.color,
        colorB: pb.color,
      },
      name,
    );
    this.born.push(baby);
    const dino = this.spawnDino(baby);
    this.showBubble(dino, `${name} hatches! 🐣`);
    this.logEvent(`🐣 ${name} hatched (${egg.parentA} + ${egg.parentB})`);
    void this.saveGame();
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

  // ── Observer lenses (BACKLOG-021 + 020): cycle V through ways of seeing the sim ──

  private logEvent(line: string): void {
    this.eventLog = [...this.eventLog, line].slice(-12);
  }

  private dinoByName(name: string): Dino | undefined {
    return this.dinos.find((d) => d.name === name);
  }

  /** Total meetings this dino has been part of (summed over its pairs). */
  private meetingsOf(name: string): number {
    let n = 0;
    for (const key of Object.keys(this.meetings)) {
      if (key.split('|').includes(name)) n += this.meetings[key];
    }
    return n;
  }

  private rumorsOf(name: string): number {
    return recall(this.memory, name).filter((e) => e.includes(RUMOR_MARK)).length;
  }

  /** A dino's emergent role, derived from how it has actually behaved. */
  private roleOf(name: string): Role {
    return deriveRole({ meetings: this.meetingsOf(name), rumorsHeard: this.rumorsOf(name), topBond: this.maxBond(name) });
  }

  private bookRows(): BookRow[] {
    const parentsOf = new Map(this.born.map((b) => [b.name, b.parents] as const));
    return this.dinos.map((d) => ({
      name: d.name,
      species: d.species,
      hearts: heartsFromPoints(this.friendship[d.name] ?? 0),
      topBond: this.maxBond(d.name),
      role: this.roleOf(d.name),
      parents: parentsOf.get(d.name),
      rumorsHeard: this.rumorsOf(d.name),
    }));
  }

  private setupLenses(): void {
    this.bondGfx = this.add.graphics().setDepth(6).setVisible(false); // over the night overlay, under HUD
    this.bookPanel = this.add
      .text((TILE * COLS) / 2, 30, '', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffffff',
        align: 'left',
        backgroundColor: '#000000e6',
        padding: { x: 10, y: 8 },
      })
      .setOrigin(0.5, 0)
      .setDepth(13)
      .setVisible(false);
    this.tickerPanel = this.add
      .text(6, 36, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#ffffff',
        align: 'left',
        backgroundColor: '#000000cc',
        padding: { x: 6, y: 4 },
      })
      .setOrigin(0, 0)
      .setDepth(13)
      .setVisible(false);
    this.lensLabel = this.add
      .text((TILE * COLS) / 2, 4, '', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffe0a0',
        shadow: { offsetX: 1, offsetY: 1, color: '#000000', fill: true },
      })
      .setOrigin(0.5, 0)
      .setDepth(13);

    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.V).on('down', () => this.cycleLens());
    getWorldClock().onTick(() => this.refreshLens());

    // dev-only Playwright hooks
    (window as any).__lens = () => this.lens;
    (window as any).__cycleLens = () => {
      this.cycleLens();
      return this.lens;
    };
    (window as any).__events = () => [...this.eventLog];
    (window as any).__roles = () => {
      const out: Record<string, string> = {};
      for (const d of this.dinos) out[d.name] = this.roleOf(d.name);
      return out;
    };
    (window as any).__bookRows = () => this.bookRows();

    this.refreshLens();
  }

  private cycleLens(): void {
    this.lens = nextLens(this.lens);
    this.refreshLens();
  }

  private refreshLens(): void {
    const L = this.lens;
    this.lensLabel.setText(LENS_LABEL[L] ? `[V] ${LENS_LABEL[L]}` : '');
    this.bookPanel.setVisible(L === 'book');
    this.tickerPanel.setVisible(L === 'ticker');
    this.bondGfx.setVisible(L === 'bonds');

    // role tags float over each dino only in the roles lens
    this.roleTags.forEach((tag, i) => {
      const d = this.dinos[i];
      const show = L === 'roles' && !!d;
      tag.setVisible(show);
      if (show) {
        const r = this.roleOf(d.name);
        tag.setText(`${ROLE_ICON[r]} ${r}`).setPosition(d.x, d.y - TILE * 1.15);
      }
    });

    if (L === 'book') {
      this.bookPanel.setText(bookLines(this.bookRows()).join('\n'));
    } else if (L === 'ticker') {
      const news = tickerLines(this.eventLog);
      this.tickerPanel.setText(['— Park News —', ...(news.length ? news : ['(quiet so far…)'])].join('\n'));
    } else if (L === 'bonds') {
      this.bondGfx.clear();
      for (const p of bondedPairs(this.bonds, HUDDLE_THRESHOLD)) {
        const a = this.dinoByName(p.a);
        const b = this.dinoByName(p.b);
        if (!a || !b) continue;
        this.bondGfx.lineStyle(Math.max(1, Math.round(p.points / 18)), 0xff6fae, 0.6);
        this.bondGfx.lineBetween(a.x, a.y, b.x, b.y);
      }
    }
  }

  private setupMovement(): void {
    getWorldClock().onTick(() => {
      // Wander every 5 in-game minutes so the park mills about without jittering.
      if (++this.moveTicks % 5 === 0) this.forceStep();
    });

    // any: dev-only Playwright hooks
    (window as any).__dinoPositions = () => this.dinos.map((d) => ({ name: d.name, x: d.x, y: d.y }));
    // any: dev-only Playwright hook — a dino's procedural-art anim key + whether it's playing
    (window as any).__dinoArt = (name: string) => {
      const d = this.dinos.find((x) => x.name === name);
      return d ? { artKey: d.artKey, animating: d.isAnimating() } : null;
    };
    // any: dev-only Playwright hook — does a species have a procedural rig? The art e2e use
    // this for the rectangle-fallback control now that every cast member is drawn (BACKLOG-034).
    (window as any).__hasArt = (species: string) => hasArt(species);
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
    // dev-only: tone state (BACKLOG-142) — friendship points, last-tone map, and live menu.
    (window as any).__friendship = () => ({ ...this.friendship });
    (window as any).__lastTone = () => ({ ...this.lastTone });
    (window as any).__toneMenuOpen = () => this.toneMenuOpen;
    (window as any).__toneMenuText = () => (this.toneMenuOpen ? this.toneMenuText : null);
    // dev-only: open the tone menu for a named dino, then pick a tone — drives the flow
    // without positioning the player. Returns the pickTone promise.
    (window as any).__pickTone = (name: string, id: ToneId) => {
      const d = this.dinos.find((x) => x.name === name);
      if (!d) return Promise.resolve();
      this.openToneMenu(d);
      return this.pickTone(id);
    };
    // dev-only: just open the menu for a named dino (to read the remembered-trace header)
    (window as any).__openToneMenu = (name: string) => {
      const d = this.dinos.find((x) => x.name === name);
      if (d) this.openToneMenu(d);
      return this.toneMenuText;
    };
    // dev-only: spread one piece of gossip speaker→listener, returns the planted rumor
    (window as any).__spreadGossip = (a: string, b: string) => {
      const g = spreadGossip(this.memory, a, b);
      this.memory = g.store;
      return g.rumor;
    };
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

    // A world-scale night event (BACKLOG-144) overrides all wandering: the whole cast gathers to
    // gawp at the sky. When it ends (duration/dawn) stepSky returns false and ordinary life resumes.
    if (this.stepSky()) {
      this.refreshSleepMarks();
      return;
    }

    const night = this.isNight();
    for (const d of this.dinos) {
      const cur = this.tileOf(d);

      // Food on the ground pulls eager, nearby dinos toward it (BACKLOG-059) — overrides
      // wandering. A dino rushes its favorite harder: wider range, lower bar (BACKLOG-061).
      if (this.food && this.foodLanded) {
        const dist = Math.hypot(cur.tileX - this.food.tileX, cur.tileY - this.food.tileY);
        const isFav = !!this.foodKind && this.foodKind.id === favoriteFood(d.traits).id;
        if (reactionToFood(d.traits.energy, dist, isFav) === 'rush') {
          const step = feedStep(cur, this.food, COLS, ROWS);
          d.setPosition(step.tileX * TILE + TILE / 2, step.tileY * TILE + TILE / 2);
          continue;
        }
      }

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
    this.checkFeeding();
    this.maybeLayEggs();
    this.checkHatch();
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
      // Gossip: the speaker passes a recent first-hand memory to the listener as news (BACKLOG-019).
      const gossip = spreadGossip(this.memory, a.name, b.name);
      this.memory = gossip.store;
      if (gossip.rumor) this.logEvent(`🗣️ ${b.name} heard news about ${a.name}`);
      this.showBubble(a, `${replyPrefix(reply.source)}${reply.text}`);
    } finally {
      this.convoInFlight = false;
    }
  }

  /** Fold the homecoming's memories into the store: the homecomer's, plus a near-tied runner-up's sulk (BACKLOG-120). */
  private applyHomecomingMemory(hc: Homecoming): void {
    this.memory = remember(this.memory, hc.name, hc.memory);
    if (hc.jealous) this.memory = remember(this.memory, hc.jealous.name, hc.jealous.memory);
  }

  /** Float the welcome-back line over the closest dino; if a near-tied rival is jealous, float its sulk too (BACKLOG-112/120). */
  private playHomecoming(): void {
    const hc = this.lastHomecoming;
    if (!hc) return;
    this.lastComfort = null;
    const dino = this.dinos.find((d) => d.name === hc.name);
    if (dino) this.showBubble(dino, hc.line);
    if (hc.jealous) {
      const rival = this.dinos.find((d) => d.name === hc.jealous!.name);
      if (rival) this.showBubble(rival, hc.jealous.line);
      // The slighted dino now waits for a make-up greet (BACKLOG-125).
      this.pendingRepair = hc.jealous.name;
      // ...and a friend crosses over to console it: a dino it once consoled comes first
      // (gratitude echo, BACKLOG-132), else its closest friend above the floor (BACKLOG-130).
      const who = comforter(hc.jealous.name, this.bonds, this.dinos.map((d) => d.name), this.gratitude);
      if (who) {
        const friend = this.dinos.find((d) => d.name === who);
        if (friend && rival) {
          // Nudge the friend a step toward the sulker so the 🫂 reads as consolation.
          const step = stepToward(this.tileOf(friend), this.tileOf(rival), COLS, ROWS);
          friend.setPosition(step.tileX * TILE + TILE / 2, step.tileY * TILE + TILE / 2);
        }
        if (friend) this.showBubble(friend, comfortLine(who, hc.jealous.name));
        this.bonds = strengthen(this.bonds, who, hc.jealous.name, COMFORT_BOND);
        this.memory = remember(this.memory, hc.jealous.name, comfortMemory(who));
        // The consoled dino files who came for it, so it can echo the favor later (BACKLOG-132).
        this.gratitude = recordGratitude(this.gratitude, hc.jealous.name, who);
        this.lastComfort = { comforter: who, sulker: hc.jealous.name };
      }
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
    this.liveBubbles.add(text);
    this.time.delayedCall(3500, () => {
      bubble.destroy();
      this.liveBubbles.delete(text);
    });
  }

  private addControlsHint(): void {
    // Build stamp — short HH:MM:SS of the running build so a restart is visible in-game.
    const stamp = typeof __BUILD_TIME__ === 'string' ? __BUILD_TIME__.slice(11, 19) : '?';
    const buildText = this.add
      .text(6, 20, `build ${stamp}`, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#7fa',
        shadow: { offsetX: 1, offsetY: 1, color: '#000000', fill: true },
      })
      .setDepth(11);

    const hintText = this.add
      .text(TILE * COLS - 6, TILE * ROWS - 6, 'WASD move · E talk · F give · H feed · [ ] item · C friends · V lens · K observer · B scan · O export', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#ffffff',
        align: 'right',
        backgroundColor: '#000000aa',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(1, 1)
      .setDepth(11);

    // Fade these with the rest of the HUD in ambient mode.
    this.hudElements.push(buildText, hintText);
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
    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;
    if (left) this.player.x -= speed;
    if (right) this.player.x += speed;
    if (up) this.player.y -= speed;
    if (down) this.player.y += speed;

    // Held movement keys don't refire keydown events, so count them as activity here.
    if (left || right || up || down) {
      this.lastInputAt = this.time.now;
      if (this.ambientActive) this.exitAmbient();
    }

    this.player.x = Phaser.Math.Clamp(this.player.x, TILE / 2, TILE * COLS - TILE / 2);
    this.player.y = Phaser.Math.Clamp(this.player.y, TILE / 2, TILE * ROWS - TILE / 2);

    this.applyIdle();
  }

  private handleInteract(): void {
    // While the keeper picker is up, E/Z dismisses it (1/2/3 choose). BACKLOG-155.
    if (this.keeperPickerOpen) {
      this.closeKeeperPicker();
      return;
    }
    // While the tone menu is up, E/Z cancels it (1/2/3 choose); a normal dialog closes.
    if (this.toneMenuOpen) {
      this.closeToneMenu();
      return;
    }
    if (this.dialogOpen) {
      this.dialog.hide();
      this.dialogOpen = false;
      return;
    }

    const target = this.nearestDino();
    if (!target) return;

    // Greeting is now a choice (BACKLOG-142): open the tone menu; the reply comes after a pick.
    this.openToneMenu(target);
  }

  /** Open the Warm/Tease/Honest menu for a dino, showing the remembered last-tone trace. */
  private openToneMenu(target: Dino): void {
    this.toneTarget = target;
    this.toneMenuOpen = true;
    this.dialogOpen = true;
    const options = TONES.map((t, i) => `[${i + 1}] ${t.label}`).join('  ');
    const trace = lastToneLine(this.lastTone[target.name]);
    this.toneMenuText = `Greet ${target.name} — ${options}` + (trace ? `\n${trace}` : '');
    this.dialog.show(this.toneMenuText);
  }

  private closeToneMenu(): void {
    this.toneMenuOpen = false;
    this.toneTarget = null;
    this.toneMenuText = '';
    this.dialog.hide();
    this.dialogOpen = false;
  }

  /** Resolve a tone pick: apply the affinity delta + memory + trace, then show the reply. */
  private async pickTone(id: ToneId): Promise<void> {
    if (!this.toneMenuOpen || !this.toneTarget) return;
    const target = this.toneTarget;
    this.toneMenuOpen = false;
    this.toneMenuText = '';

    this.recordTone(target.name, id, target.traits);

    // Reply path is unchanged from the old greet flow (tone-coloured reply is BACKLOG-148).
    this.dialog.show(`${target.name}: ...`);
    const now = getWorldClock().now();
    const reply = await target.greet({
      timeOfDay: dayPhase(now.hour),
      affection: heartsFromPoints(this.friendship[target.name] ?? 0),
      recentMemory: recall(this.memory, target.name),
    });
    this.dialog.show(`${replyPrefix(reply.source)}${target.name}: ${reply.text}`);
    this.toneTarget = null;
  }

  // --- Keeper select (BACKLOG-155) ---------------------------------------------------------

  /** Route 1/2/3: choose an observer while the keeper picker is open, else pick a greeting tone. */
  private onNumberKey(n: number): void {
    if (this.keeperPickerOpen) {
      this.pickKeeperIndex(n - 1);
      return;
    }
    void this.pickTone((['warm', 'tease', 'honest'] as const)[n - 1]);
  }

  /** The chosen observer's affinity bonus for a dino's temperament — added to normal player gains. */
  private applyKeeperBonus(traits?: Dino['traits']): number {
    return keeperBonus(keeperById(this.keeperId), traits);
  }

  /** Open the "choose your observer" overlay (modeled on the tone menu). */
  private openKeeperPicker(): void {
    // The keeper picker and the tone menu are mutually exclusive — close any open greet first.
    if (this.toneMenuOpen) this.closeToneMenu();
    this.keeperPickerOpen = true;
    this.dialogOpen = true;
    const lines = KEEPERS.map(
      (k, i) => `[${i + 1}] ${k.name} — ${k.ability.label}: ${k.ability.desc}`,
    ).join('\n');
    const current = keeperById(this.keeperId).name;
    this.dialog.show(`Choose your observer  (now: ${current})\n${lines}`);
  }

  /** Commit a keeper choice from the picker: persist it and confirm. Out-of-range index is ignored. */
  private pickKeeperIndex(i: number): void {
    if (!this.keeperPickerOpen) return;
    const keeper = KEEPERS[i];
    if (!keeper) return;
    this.keeperId = keeper.id;
    this.keeperPickerOpen = false;
    this.dialog.show(`You are ${keeper.name}, from ${keeper.era}.\n${keeper.ability.label}: ${keeper.ability.desc}`);
    this.dialogOpen = true; // a normal dialog the next E/Z closes
    void this.saveGame();
  }

  private closeKeeperPicker(): void {
    this.keeperPickerOpen = false;
    this.dialog.hide();
    this.dialogOpen = false;
  }

  /**
   * A non-blocking, one-time invite on a brand-new game: a fading line that says "press K to
   * choose your observer". It captures no input and sets no modal flag, so boot stays clean and
   * every existing interaction (and e2e spec) is unaffected.
   */
  private showKeeperInvite(): void {
    const t = this.add
      .text(TILE * COLS * 0.5, 24, 'A traveler arrives to watch the bowl — press K to choose your observer', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffffff',
        align: 'center',
        backgroundColor: '#000000aa',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5, 0)
      .setDepth(12);
    this.tweens.add({ targets: t, alpha: 0, delay: 4000, duration: 2500, onComplete: () => t.destroy() });
  }

  // --- Field Scan (BACKLOG-157): LUMEN-3's distinct ability -------------------------------

  private scanSubject(d: Dino): ScanSubject {
    return { name: d.name, species: d.species, traits: d.traits, role: this.roleOf(d.name) };
  }

  /**
   * B toggles the dossier. Only LUMEN-3 carries the sensors: other observers get an in-character
   * refusal as a fading bubble (NOT a dialog — it must never set dialogOpen, or it would eat the
   * next E press).
   */
  private toggleScan(): void {
    if (this.scanOpen) {
      this.scanOpen = false;
      this.scanPanel.setVisible(false);
      return;
    }
    const target = this.nearestDino();
    if (!target) return;
    const keeper = keeperById(this.keeperId);
    if (!canScan(keeper)) {
      this.showBubble(target, scanRefusal(keeper));
      return;
    }
    this.scanPanel.setText(scanLines(this.scanSubject(target)).join('\n'));
    this.scanPanel.setVisible(true);
    this.scanOpen = true;
  }

  private setupScan(): void {
    this.scanPanel = this.add
      .text(6, 22, '', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
        align: 'left',
        backgroundColor: '#000000cc',
        padding: { x: 6, y: 4 },
      })
      .setOrigin(0, 0)
      .setDepth(11)
      .setVisible(false);

    // any: dev-only Playwright hooks — Field Scan (BACKLOG-157)
    (window as any).__scanOpen = () => this.scanOpen;
    (window as any).__canScan = () => canScan(keeperById(this.keeperId));
    (window as any).__scanLines = (name?: string) => {
      const d = name ? this.dinoByName(name) : this.nearestDino();
      return d ? scanLines(this.scanSubject(d)) : [];
    };
    // any: dev-only Playwright hook — stand the player on a named dino (key-press tests; the
    // overlap keeps it nearest even if a wander tick fires between the warp and the key press)
    (window as any).__warpTo = (name: string) => {
      const d = this.dinoByName(name);
      if (d) this.player.setPosition(d.x, d.y);
      return !!d;
    };
  }

  /**
   * Tone-aware twin of recordGreet (BACKLOG-142): applies the personality-fit tone delta, files
   * a tone memory, and records the last-tone trace. The BACKLOG-125 repair seam wins over the
   * tone delta — a make-up greet still earns the outsized repair bump and its 😊 beat.
   */
  private recordTone(name: string, id: ToneId, traits?: Dino['traits']): void {
    const repairing = this.pendingRepair === name;
    const gain = repairing
      ? repairGain(traits)
      : toneReaction(toneById(id), traits).delta + this.applyKeeperBonus(traits);
    this.friendship = bumpPoints(this.friendship, name, gain);
    this.memory = remember(this.memory, name, repairing ? repairMemory(name) : toneById(id).memory);
    this.lastTone = { ...this.lastTone, [name]: id };
    if (repairing) {
      this.pendingRepair = null;
      const dino = this.dinos.find((d) => d.name === name);
      if (dino) this.showBubble(dino, repairLine(name));
    }
    void this.saveGame();
    this.refreshHeartsPanel();
  }

  /** Raise a dino's affinity from a greet, persist, and refresh the panel. */
  private recordGreet(name: string, traits?: Dino['traits']): void {
    // A make-up greet to the jealous runner-up (BACKLOG-125): outsized bump, 😊, one-shot.
    const repairing = this.pendingRepair === name;
    const gain = repairing ? repairGain(traits) : greetGain(traits) + this.applyKeeperBonus(traits);
    this.friendship = bumpPoints(this.friendship, name, gain);
    this.memory = remember(
      this.memory,
      name,
      repairing ? repairMemory(name) : 'the human stopped by to say hello',
    );
    if (repairing) {
      this.pendingRepair = null;
      const dino = this.dinos.find((d) => d.name === name);
      if (dino) this.showBubble(dino, repairLine(name));
    }
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
    const scale = getWorldClock().getScale();
    return `Day ${t.day} — ${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')} ·${scale}×`;
  }

  /** Cycle the realtime multiplier: 1× (24 real-hour day) ⇄ 60× (active watching). */
  private toggleScale(): void {
    const clock = getWorldClock();
    clock.setScale(clock.getScale() === 1 ? 60 : 1);
    this.clockHud.setText(this.fmtClock(clock.now()));
  }

  private setupClock(): void {
    const clock = getWorldClock();

    // Wall-clock source with a dev-controllable offset so e2e can advance real
    // time deterministically (prod offset stays 0 → plain Date.now()).
    let wallOffset = 0;
    clock.setNowSource(() => Date.now() + wallOffset);

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

    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.T).on('down', () => this.toggleScale());

    // any: dev-only Playwright hook — not exposed in production builds
    (window as any).__clockNow = clock.now.bind(clock);
    // any: dev-only Playwright hook — current realtime multiplier
    (window as any).__clockScale = () => clock.getScale();
    // any: dev-only Playwright hook — the canvas-rendered clock HUD text
    (window as any).__clockHudText = () => this.clockHud.text;
    // any: dev-only Playwright hook — advance the wall clock n real ms, then pump
    (window as any).__advanceWall = (ms: number) => {
      wallOffset += ms;
      clock.update();
      return clock.now();
    };

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
      gratitude: this.gratitude,
      lastTone: this.lastTone,
      keeperId: this.keeperId,
      eggs: this.eggs,
      born: this.born,
      savedAt: Date.now(),
      scale: getWorldClock().getScale(),
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
      if (!save) {
        // Brand-new game: keep the default observer, but invite a choice (non-blocking).
        this.showKeeperInvite();
        return;
      }
      // Resume at the saved rate, then fast-forward the world over the real gap
      // since the save (BACKLOG-106). clock.set re-anchors at now, so the live
      // pump counts forward from the post-catch-up moment — no double-advance.
      if (save.scale) clock.setScale(save.scale);
      const away = fastForward(
        { time: save.time, savedAt: save.savedAt, scale: save.scale, bonds: save.bonds, memory: save.memory },
        Date.now(),
      );
      clock.set(away.time);
      this.player.setPosition(save.player.x, save.player.y);
      this.friendship = save.friendship;
      this.memory = away.memory;
      this.bonds = away.bonds;
      this.gratitude = save.gratitude ?? {};
      this.lastTone = (save.lastTone ?? {}) as Record<string, ToneId>;
      this.keeperId = save.keeperId ?? DEFAULT_KEEPER_ID;
      this.lastAwayDigest = away.digest;
      // Respawn dinos born in a previous session, then redraw any pending eggs.
      this.born = save.born ?? [];
      for (const b of this.born) this.spawnDino(b);
      this.eggs = save.eggs ?? [];
      for (const e of this.eggs) this.drawEgg(e);
      this.clockHud.setText(this.fmtClock(clock.now()));
      this.applyTint(clock.now());
      this.refreshHeartsPanel();
      if (away.minutes > 0) {
        this.dialogOpen = true;
        this.dialog.show('While you were away…\n' + away.digest.join('\n'));
      }
      // After a long absence, your closest dino notices you came back (BACKLOG-112).
      // Friendship is assigned above, so the homecomer reads the restored hearts.
      this.lastHomecoming = homecoming(this.friendship, away.minutes);
      if (this.lastHomecoming) {
        this.applyHomecomingMemory(this.lastHomecoming);
        this.playHomecoming();
      }
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
    // any: dev-only Playwright hook — last "while you were away" digest
    (window as any).__awayDigest = () => [...this.lastAwayDigest];
    // any: dev-only Playwright hook — run offline catch-up for `realMs` of real time at the
    // current scale (savedAt 0 so elapsed === realMs, deterministic), apply + return the result.
    (window as any).__catchUp = (realMs: number) => {
      const away = fastForward(
        { time: clock.now(), savedAt: 0, scale: clock.getScale(), bonds: this.bonds, memory: this.memory },
        realMs,
      );
      clock.set(away.time);
      this.bonds = away.bonds;
      this.memory = away.memory;
      this.lastAwayDigest = away.digest;
      this.lastHomecoming = homecoming(this.friendship, away.minutes);
      if (this.lastHomecoming) {
        this.applyHomecomingMemory(this.lastHomecoming);
        this.playHomecoming();
      }
      this.refreshHeartsPanel();
      return {
        days: away.days,
        minutes: away.minutes,
        capped: away.capped,
        digest: away.digest,
        homecoming: this.lastHomecoming,
      };
    };
    // any: dev-only Playwright hook — last homecoming beat (or null)
    (window as any).__homecoming = () => this.lastHomecoming;
    // any: dev-only Playwright hook — strings of currently-alive speech bubbles
    (window as any).__bubbleTexts = () => [...this.liveBubbles];
    // any: dev-only Playwright hook — the jealous runner-up awaiting a make-up greet (or null)
    (window as any).__pendingRepair = () => this.pendingRepair;
    // any: dev-only Playwright hook — last dino-to-dino comfort beat {comforter, sulker} (or null)
    (window as any).__lastComfort = () => this.lastComfort;
    // any: dev-only Playwright hook — gratitude ledger (consoled → comforters it owes), BACKLOG-132
    (window as any).__gratitude = () => ({ ...this.gratitude });
    // any: dev-only Playwright hook — raw friendship points per dino (finer than hearts)
    (window as any).__friendshipPoints = () => ({ ...this.friendship });
    // any: dev-only Playwright hooks — keeper select (BACKLOG-155)
    (window as any).__keeper = () => this.keeperId;
    (window as any).__keepers = () =>
      KEEPERS.map((k) => ({ id: k.id, name: k.name, ability: k.ability.label }));
    (window as any).__keeperPickerOpen = () => this.keeperPickerOpen;
    (window as any).__openKeeperPicker = () => {
      this.openKeeperPicker();
      return this.keeperPickerOpen;
    };
    (window as any).__pickKeeper = (id: string) => {
      const i = KEEPERS.findIndex((k) => k.id === id);
      if (i < 0) return this.keeperId;
      this.keeperPickerOpen = true; // pickKeeperIndex guards on the open flag
      this.pickKeeperIndex(i);
      return this.keeperId;
    };
    // any: the current observer's affinity-fit bonus for a dino (0..+2)
    (window as any).__keeperBonus = (name: string) =>
      keeperBonus(keeperById(this.keeperId), this.dinos.find((d) => d.name === name)?.traits);
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
    this.friendship = bumpPoints(this.friendship, name, delta + this.applyKeeperBonus(traits));
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
