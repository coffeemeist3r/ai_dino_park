import Phaser from 'phaser';
import { makeBrain, replyPrefix, type BrainKind, type NPCBrain } from '../ai/brain';
import { currentModel, isCoarsePointer, MODELS } from '../ai/deviceProbe';
import {
  MINDS_CONSENT_KEY,
  brainKind,
  allowAmbient,
  convoCooldownSteps,
  consentLines,
  mindsOffLines,
  mindsLabel,
  mindsStatusLine,
} from '../ai/governor';
import { loadProgress, hasCachedModel, deleteCachedModel } from '../ai/webllmBrain';
import { chirpParams, distressParams, type ChirpParams } from '../audio/chirp';
import { chorusOrder, DAWN_HOUR, type ChorusEntry } from '../audio/chorus';
import { wokeHungry, wakeHungryLine, wakeHungryMemory } from '../world/wake';
import { unlockAudio, audioState, playChirp, playThunk, soundMuted, setSoundMuted } from '../audio/voice';
import { Dino } from '../entities/dino';
import { hasArt, hasKeeperArt, makeKeeperArt, bakeTileMap, bakeTerrainMap, bakePropArt, hasPropArt, hasTileArt } from '../art/bake';
import { ROSTER } from '../entities/roster';
import { DialogBox } from '../ui/DialogBox';
import { getWorldClock, cooldownReady, type GameTime } from '../world/clock';
import { fastForward } from '../world/away';
import { homecoming, type Homecoming } from '../world/homecoming';
import { repairGain, repairLine, repairMemory } from '../world/repair';
import { comforter, comfortLine, comfortMemory, recordGratitude, COMFORT_BOND, type Gratitude } from '../world/comfort';
import { tintFor, dayPhase, type DayPhase } from '../world/dayNight';
import {
  rollSkyEvent,
  atGather,
  skyExpired,
  gazeRing,
  stargazingPairs,
  SHARED_WONDER_BOND,
  SKY_GATHER_TILE,
  SKY_EVENTS,
  SKY_ROLL_INTERVAL_MS,
  type SkyEvent,
  type SkyEventId,
} from '../world/skyEvent';
import { buildMessages } from '../ai/webllmBrain';
import { SAVE_VERSION, serialize, type SaveData } from '../world/saveGame';
import { BOWL_ID, GROVE_ID, FERNREACH_ID, ZONES, type Edge, atMigrationEdge, atWater, crossEntryTile, crossing, edgeIndicators, linkedZone, migrationStepTarget, nearLinkEdge, occupiedZones, otherZone, setZone, zoneById, zoneChain, zoneNeighbors, zoneOf, zonePopulations, zoneTileAt, zoneTint, zoneWaterTile } from '../world/zones';
import { bumpTenure, resetTenure, tenureOf, isSettled, resistsMigration, settledLine, type Tenure } from '../world/belonging';
import { homesickDest, homesickMemory } from '../world/homesick';
import { INTENT_NOTES, forageCuriosity, fromDraft, rerollStay, socializeChanceFor, ticAfterFor, type DinoIntent, type IntentKind } from '../ai/intent';
import { activeIntent, planShape, proceduralPlan, type DayPlan } from '../ai/plan';
import { proceduralPersona, upgradePersona, type Persona } from '../ai/persona';
import { spreadGroveWord, groveNewsMemory, groveWordLine, pondSwap, pondSwapMemory, POND_BOND } from '../world/groveword';
import { FETCH_BOND, FETCH_STEPS, FETCH_GLYPH, fetchEventLine, fetchLine, fetchedMemory, fetcher, fetcherMemory, missingTheMeal, type Escort } from '../world/fetch';
import { grovePull } from '../world/curiosity';
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
import { KEEPERS, DEFAULT_KEEPER_ID, keeperById, keeperBonus, keeperFit, keeperAddress } from '../keeper/keepers';
import { canScan, scanLines, scanRefusal, type ScanSubject } from '../keeper/scan';
import { INSPECT_TTL, inspector, inspectLine, inspectMemory } from '../keeper/firstContact';
import { seasonFor, seasonTurned, SEASON_TINT, turnLine, turnMemory, type Season } from '../world/seasons';
import { HUDDLE_THRESHOLD, huddleThreshold, inHuddleWindow } from '../world/huddle';
import { sleptCold, coldShiver, coldMemory, WARM_BONUS, warmGain, warmLine, warmMemory, neglectMemory, spreadColdWord, coldWordLine, spreadWarmWord, warmWordLine, sympathyVisit, sympathyLine, SYMPATHY_BOND, selfCorrect, reliefLine, spreadReliefWord, reliefMemory, clearedName, gratefulLine, GRATEFUL_BOND, gratefulMemory, whoClearedMyName } from '../world/cold';
import { DISTRESS_STEPS, mostDistressed, hearLine, heardMemory } from '../world/distress';
import { wanderStep, stepToward } from '../world/movement';
import { isCarnivore, dietOf } from '../world/diet';
import { nearestPrey, fleeStep, huntCaught, huntSucceeds, recentHunter, fearsHunter, foodwebStanding, WARY_RANGE } from '../world/foodweb';
import { pickMurmurMemory, murmurLine } from '../world/murmur';
import { recordMeet, pairKey, type Meetings } from '../social/meetings';
import { remember, recall, reflect, forget, type MemoryStore } from '../ai/memory';
import { firstGroveArrival, groveArrivalMemory, groveArrivalLine, firstPondSight, pondSightMemory, pondSightLine } from '../world/arrival';
import { isLoner, LONER_FLOOR, LONER_BONUS, MOPE_GLYPH, MOPE_CHANCE, edgeTarget, perkUpLine, liftsLoner, foundFriendMemory, foundFriendLine, comfortsLoner, comfortFoodMemory, comfortFoodLine } from '../world/loner';
import { advanceNeeds, pressingNeed, satisfy, needSeeks, isStarving, NEED_GLYPH, type Needs, type NeedKind } from '../world/needs';
import { spreadGossip, RUMOR_MARK } from '../social/gossip';
import { nextLens, bondedPairs, tickerLines, bookLines, zoneMapModel, zoneWant, LENS_LABEL, type Lens, type BookRow, type ZoneMapEntry } from '../ui/lenses';
import { deriveRole, settleRole, ROLE_ICON, type Role } from '../ai/roles';
import { GLASS, cornerRadius, rimRects, edgeBands, glarePolys, toPoints } from '../ui/glass';
import { reactionFor, startleStep, type StartleReaction } from '../world/startle';
import { reactionToFood, feedStep, reachedFood, foodLanding, yieldFoodTo, gobblerAmong, standsGround, slunkOffMemory, sharedMeal, SHARED_MEAL_BOND, SWARM_RADIUS } from '../world/feeding';
import { bankFood, takeFood, pickFoodToSpend, pickFoodCarry, courierMemory, courierLine, storesFedLine, storesFedMemory, type FoodPile } from '../world/foodstore';
import { signatureTic, undisturbed, inventsTic, ticStep, ticMemory, bashfulOpener, caughtMemory, fondOfBeingCaught, fondOpener, fondCaughtMemory, griefEdge, griefAnchor, griefTicMemory, GRIEF_BOND_FLOOR, TIC_AFTER_STEPS, TIC_AFTER_STEPS_HOMESICK, TIC_COMPANY_RANGE, aloneInStrangeZone, type Tic } from '../world/tic';
import { zoneProsperity, prosperityTier, prosperityBadge, type ZoneSignals, type ProsperityTier } from '../world/prosperity';
import {
  noticeResource,
  resourceLanding,
  RESOURCE_SPAWN_CHANCE,
  pickKind,
  bankResource,
  atCap,
  stockpileLine,
  canCraft,
  CAIRN_GLYPH,
  SHELTER_GLYPH,
  THATCH_GLYPH,
  canBuildShelter,
  buildStructureFor,
  zoneStructure,
  structureRecipe,
  pressuredCarry,
  takeResource,
  barterSwap,
  resourceFetchable,
  RESOURCE_GRACE_STEPS,
  RESOURCE_GLYPH,
  type ResourceKind,
  type Stockpile,
} from '../world/resource';
import { regrowYield, rollResourceAt, depleteYield, YIELD_MAX } from '../world/regrowth';
import { dinoActivity, ACTIVITY_GLYPH, type Activity } from '../world/activity';
import { fidget, moodFidget, reliefFlourish, type Mood } from '../world/fidget';
import { cropStage, plotAdjacent, cropOf, stageGlyph, ripeRigKey, PLOT_TILE_BY_ZONE, type CropStage } from '../world/plot';
import { FOODS, favoriteFood, foodReaction, seasonCraving, type Food } from '../world/foods';
import { maxGeneration, plaqueLines, zoneTallyLine, zoneStoresLine } from '../ui/plaque';
import { HELP_CHIP, helpLines, holdingLine } from '../ui/controlsHelp';
import { hudAlpha, isIdle } from '../world/idle';
import {
  STICK,
  stickVector,
  inCircle,
  inRect,
  actionButtons,
  sheetRows,
  menuChips,
  type Vec2,
} from '../input/touch';
import { strengthen, bondPoints, closestFriend, type Bonds } from '../social/bonds';
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

/**
 * Dino migration (BACKLOG-274) rolls on a real-time cadence (like the sky event), NOT in-game hours, so
 * offline catch-up / per-minute clock advances never retroactively migrate the cast, and a short headless
 * test never waits this long. Paced by a real-time cooldown (BACKLOG-333) — the old ≤1/in-game-day cap was
 * ≤1/24 real hr at the 1× default, so the grove never filled; tests drive migration via `__migrate`.
 */
const MIGRATE_ROLL_INTERVAL_MS = 90_000;
const MIGRATE_CHANCE = 0.15;
const MIGRATE_COOLDOWN_MS = 60_000; // BACKLOG-333: real-time floor between ambient migrations
const HUNT_COOLDOWN_MS = 30_000; // BACKLOG-367: after an empty hunt a carnivore rests before stalking again
const BARTER_COOLDOWN_MS = 45_000; // BACKLOG-358: real-time floor between edge-meet barters (paces the beat)
const EDGE_DWELL = 2; // BACKLOG-358: force-steps a dino must linger at the edge column to count as *meeting* (not transiting)

/**
 * Wander cadence (BACKLOG-333) — `forceStep` runs on this real-time timer instead of the in-game-minute
 * clock, so the bowl mills about at a watchable pace at any time scale (at 1× an in-game minute is 60 real
 * seconds, so the old "every 5 in-game minutes" was one step per ~5 real minutes — the park looked frozen).
 */
const WANDER_STEP_MS = 3_000;

/** How long a recovered dino's idle quirk reads perkier after a flourish (BACKLOG-325), in real ms. */
const LIFT_WINDOW_MS = 8_000;

// Night sleeping huddle (BACKLOG-041): bonded dinos gather at the den after dark.
// The bond bar + window are season-conditional since BACKLOG-171 (see world/huddle.ts).
const HUDDLE_TILE = { tileX: 10, tileY: 11 };
const BOND_PER_MEET = 4;
/** Bond a generous feeder gains with the friend it yields a meal to (BACKLOG-375) — kindness deepens the tie. */
const GENEROUS_BOND_BUMP = 5;

/** How often a huddling dino murmurs a 💭 sleep-line per step (BACKLOG-181) — sparse, so the den isn't a wall of 💭. */
const MURMUR_CHANCE = 0.2;

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;
  /** Anim key of the current keeper avatar, or null when the observer is still the amber square. */
  private keeperArtKey: string | null = null;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private dinos: Dino[] = [];
  /** The keeper's current zone (BACKLOG-143). Persisted; the grove starts empty (population is -274). */
  private zoneId: string = BOWL_ID;
  /** The single depth-0 floor image, re-textured/re-tinted per zone (BACKLOG-294). */
  private floorImage?: Phaser.GameObjects.Image;
  /** Flat-checker floor used only if the grass rig is missing (BACKLOG-294 fallback). */
  private floorFallback?: Phaser.GameObjects.Graphics;
  /** Which zone each dino lives in (BACKLOG-143 occupancy API). Defaults to the bowl; -274 migrates. */
  private dinoZones: Record<string, string> = {};
  /** Per-dino residence tenure in its current zone (BACKLOG-341) — rolls since it last crossed; settles a home. Persisted. */
  private tenure: Tenure = {};
  /** Wall-clock ms of the last ambient migration (BACKLOG-333) — paces it by a real-time cooldown. */
  private lastMigrationMs = 0;
  /** Wall-clock ms of the last edge-meet barter (BACKLOG-358) — paces the ambient trade by a real-time cooldown. */
  private lastBarterMs = 0;
  /** Consecutive steps each dino has lingered at a linking edge (BACKLOG-358) — a meet needs two *parked* dinos, not a crosser transiting through. Transient. */
  private edgeDwell: Record<string, number> = {};
  /**
   * Solitary-tic bookkeeping (BACKLOG-405). All transient (re-derived from live solitude, never saved):
   * how many consecutive force-steps a dino has been undisturbed, the tile it anchored its ritual on, the
   * ritual's step phase, and whether it has invented the tic this solitary stretch (so the memory files once).
   */
  private soloSteps: Record<string, number> = {};
  private ticAnchor: Record<string, { tileX: number; tileY: number }> = {};
  private ticPhase: Record<string, number> = {};
  private ticInvented = new Set<string>();
  /** BACKLOG-414: the departed friend a dino is grieving this stretch (its tic aims at the edge they left by),
   *  or absent when the tic is a plain 405 in-place ritual. Transient, cleared by resetTic. */
  private ticGrief: Record<string, string | null> = {};
  /** BACKLOG-431: when true, the wall-clock background timers (wander/sky/migration rolls) no-op — set by the
   *  `__pauseAmbient` dev hook from the e2e boot() so 300+ parallel specs don't race the ambient world tick.
   *  Never set in normal play (defaults false); explicit dev hooks (`__stepWorld` etc.) bypass it. */
  private ambientPaused = false;
  /** Caught mid-tic (BACKLOG-408): the dino this greet caught mid-ritual (bashful reply), + a once-per-stretch
   *  memory guard. Both transient — cleared by resetTic (company/need ends the stretch) and on greet cancel. */
  private caughtTic: string | null = null;
  private ticCaughtFiled = new Set<string>();
  /** Dinos mid zone-crossing (BACKLOG-334): walking to their linked edge before the home zone flips. Transient. */
  private migrating = new Set<string>();
  /**
   * Each migrant's chosen crossing (BACKLOG-378): the destination zone + the edge it walks to, fixed when the
   * migration starts so a multi-neighbour zone (the grove now borders both the bowl and the Fernreach) doesn't
   * oscillate its target mid-walk. Keyed by name, cleared on arrival. Transient (companion to `migrating`).
   */
  private migrationCross: Record<string, { dest: string; edge: Edge }> = {};
  /** Each dino's settled, durable role (BACKLOG-032). Persisted; accrues via roleOf, never reverts to wanderer. */
  private roles: Record<string, Role> = {};
  private dialog!: DialogBox;
  private dialogOpen = false;
  private clockHud!: Phaser.GameObjects.Text;
  private nightOverlay!: Phaser.GameObjects.Rectangle;
  private heartsPanel!: Phaser.GameObjects.Text;
  private friendship: Friendship = {};
  private npcBrain!: NPCBrain;
  private giftHud!: Phaser.GameObjects.Text;
  private heldItemIndex = 0;
  /** Controls help (HUD overhaul): the [?] chip and the panel it toggles. */
  private helpChip!: Phaser.GameObjects.Text;
  private helpPanel!: Phaser.GameObjects.Text;
  private brainHud!: Phaser.GameObjects.Text;
  private meetings: Meetings = {};
  private memory: MemoryStore = {};
  private bonds: Bonds = {};
  private lastAwayDigest: string[] = [];
  private lastHomecoming: Homecoming | null = null;
  private liveBubbles = new Set<string>();
  /** The jealous runner-up awaiting a make-up greet (BACKLOG-125); transient, one-shot, not persisted. */
  private pendingRepair: string | null = null;
  /** The last recovery flourish fired (BACKLOG-318), for the dev hook; transient, not persisted. */
  private lastMoodLift: string | null = null;
  /** Per-dino wall-clock ms until which a recovered dino idles perkier (BACKLOG-325); transient. */
  private liftedUntil: Record<string, number> = {};
  /** The last dino-to-dino comfort beat (BACKLOG-130): who consoled whom, or null. Transient. */
  private lastComfort: { comforter: string; sulker: string } | null = null;

  /** The last comfort-food beat (BACKLOG-374): a loner soothed by its favorite, or null. Transient. */
  private lastComfortFood: { name: string; food: string } | null = null;
  /** The last generous-feed beat (BACKLOG-375): who gave up a meal to whom, or null. Transient. */
  private lastYield: { giver: string; eater: string } | null = null;
  /** The last greedy-gobble beat (BACKLOG-387): who shouldered past whom for a kept drop, or null. Transient. */
  private lastGobble: { winner: string; gobbler: string } | null = null;
  /** The last stand-up beat (BACKLOG-390): a bold winner that held its food against a gobbler, or null. Transient. */
  private lastStand: { winner: string; gobbler: string } | null = null;
  /** The last grateful-nuzzle beat (BACKLOG-386): who threw a 💛 at whom on a yield, or null. Transient. */
  private lastNuzzle: { from: string; to: string } | null = null;
  /** Who each dino remembers being fed by (BACKLOG-385): a live per-session ledger of generosity owed
   *  back, biasing a later yield toward a benefactor. The durable trace is the persisted memory (as 375). */
  private owesFood: Record<string, string[]> = {};
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
  /** First-contact inspection (BACKLOG-161): armed by a real keeper change. Transient, one-shot. */
  private pendingInspect: { name: string; ttl: number } | null = null;
  private lastInspection: { name: string; keeperId: string } | null = null;
  /** Seasons (BACKLOG-159): derived from the clock day — only the live-turn tracker is state. */
  private seasonOverlay!: Phaser.GameObjects.Rectangle;
  private lastSeasonDay = 1;
  private seasonTurns = 0;
  /** Dawn chorus (BACKLOG-192): transient — the last in-game day a dawn fired (0 = none yet). */
  private lastDawnDay = 0;
  private dawnCount = 0;
  /** Woke hungry (BACKLOG-376): transient — who woke over the hunger bar at the last dawn. Never persisted. */
  private lastWokeHungry: string[] = [];
  private lastChorus: ChorusEntry[] | null = null;
  private eggs: Egg[] = [];
  private born: BornDino[] = [];
  private eggSprites = new Map<string, Phaser.GameObjects.Text>();
  private sleepMarks: Phaser.GameObjects.Text[] = [];
  /** Per-dino current-activity glyph (BACKLOG-295), index-aligned with `dinos`; live-derived, not saved. */
  private activityMarks: Phaser.GameObjects.Text[] = [];
  private activityById: Record<string, Activity> = {};
  /** Cold-night shiver (BACKLOG-179): the night's season, the morning-edge window tracker, and
   *  the last morning's cold sleepers (the dinos too loosely bonded for the den, for the hook). */
  private wasInHuddleWindow = false;
  private nightSeason: Season = 'spring';
  private lastColdSleepers: string[] = [];
  /** Keeper's warmth (BACKLOG-184): who still carries the cold funk (transient day-state,
   *  never persisted — like pendingRepair) and its 🥶 marks, index-aligned like sleepMarks. */
  private coldPending = new Set<string>();
  private coldMarks: Phaser.GameObjects.Text[] = [];
  /** The loner (BACKLOG-135): the 🥀 mope mark, index-aligned like sleepMarks. Loner status itself is
   *  derived live from the bond graph (no persisted state — the bonds are already saved). */
  private mopeMarks: Phaser.GameObjects.Text[] = [];
  /** The loner finds a friend (BACKLOG-369): dinos that have already fired the one-shot "not so alone"
   *  beat. Transient — the memory it files is the persistent record, so a reload won't re-fire (the
   *  loner→friend transition can't recur once the bond is already saved above the floor). */
  private lonerFriended = new Set<string>();
  /** Need-drive spine (BACKLOG-371): each dino's hunger/thirst, persisted additively; the 🍖/💧 marks
   *  are index-aligned like sleepMarks. */
  private needs: Needs = {};
  /** Food web (BACKLOG-367): wall-clock ms until a carnivore may hunt again after an empty hunt. */
  private huntCooldownUntil: Record<string, number> = {};
  /** Food web (BACKLOG-367): the last forceStep's {hunter → prey} pairing — exposed via `__stalkTargets`. */
  private lastStalk: Record<string, string> = {};
  /** Food web (BACKLOG-442): the last forceStep's resolved {prey → hunter it flees} — active stalks plus
   *  personal-fear startles. Exposed via `__fleeFrom`. */
  private lastFlee: Record<string, string> = {};
  private needMarks: Phaser.GameObjects.Text[] = [];
  /** Distress call (BACKLOG-194): the last cry (diegetic — recorded even muted) and the
   *  responder mid-walk toward the caller. Both transient, never persisted. */
  private lastDistress: { name: string; trigger: 'startle' | 'cold'; params: ChirpParams } | null = null;
  private pendingRespond: { name: string; caller: string; steps: number } | null = null;
  /** Brought to the hatch (BACKLOG-381): the live escort — a friend walking out to a withdrawn loner and
   *  then walking it back to the food. One at a time, transient, never persisted (the `pendingRespond` shape). */
  private escort: Escort | null = null;
  private roleTags: Phaser.GameObjects.Text[] = [];
  private lens: Lens = 'off';
  private bookPanel!: Phaser.GameObjects.Text;
  private bondGfx!: Phaser.GameObjects.Graphics;
  private tickerPanel!: Phaser.GameObjects.Text;
  /** Zone map lens (BACKLOG-425): boxes/connectors/keeper dot + one label per zone. */
  private mapGfx!: Phaser.GameObjects.Graphics;
  private mapLabels: Phaser.GameObjects.Text[] = [];
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
  /** One raw resource per zone (BACKLOG-314, was a single global slot 146/308). Each inhabited zone
   *  grows + holds its own; keyed by zone id. `zone` on the value mirrors the key for the 308 checks. */
  private resourceByZone: Record<string, { kind: ResourceKind; tileX: number; tileY: number; zone: string }> = {};
  private resourceSpriteByZone: Record<string, Phaser.GameObjects.Text | Phaser.GameObjects.Image> = {};
  /** World steps since each zone's resource spawned (BACKLOG-297/314) — gates the per-zone fetch grace. */
  private resourceAgeByZone: Record<string, number> = {};
  /** Per-zone gather yield (BACKLOG-384, 0..1) — a pickup thins it, each tick regrows it; scales the spawn roll.
   *  Transient (not persisted): absent → YIELD_MAX (a reload starts each zone fresh-full). */
  private yieldByZone: Record<string, number> = {};
  /** Per-dino gathered-resource tally (BACKLOG-146). Persisted; absent → 0. */
  private gathered: Record<string, number> = {};
  /** Per-zone per-kind stockpile gathering banks into (BACKLOG-285 shared → BACKLOG-328 per-zone). Persisted; absent → {}. */
  private stockpileByZone: Record<string, Stockpile> = {};
  /** The (lazily-created) pile for a zone — each zone banks, caps, and spends its own gathering (BACKLOG-328). */
  private pileFor(zone: string): Stockpile {
    return (this.stockpileByZone[zone] ??= {});
  }
  /** Crafted cairns (BACKLOG-286). Persisted; absent → []. `zone`: BACKLOG-308 (old saves → bowl). */
  private cairns: { tileX: number; tileY: number; zone: string }[] = [];
  private cairnSprites: (Phaser.GameObjects.Text | Phaser.GameObjects.Image)[] = [];
  /** Dino-built shelters (BACKLOG-315) — the larger landmark beyond the cairn. Persisted; absent → []. Zone-scoped (308). */
  private shelters: { tileX: number; tileY: number; zone: string }[] = [];
  private shelterSprites: (Phaser.GameObjects.Text | Phaser.GameObjects.Image)[] = [];
  /** Woven frond thatches (BACKLOG-417) — the Fernreach's own landmark. Persisted; absent → []. Zone-scoped (308). */
  private thatches: { tileX: number; tileY: number; zone: string }[] = [];
  private thatchSprites: (Phaser.GameObjects.Text | Phaser.GameObjects.Image)[] = [];
  /** Dinos that have ever set foot in the grove (BACKLOG-339). Persisted; absent → []. Gates the once-ever arrival beat. */
  private groveVisited: string[] = [];
  /** Dinos pausing to look around on a first grove arrival (BACKLOG-339) — transient, one forceStep hold. */
  private arriving = new Set<string>();
  /** Dinos that have ever seen the grove pond (BACKLOG-359). Persisted; absent → []. Gates the once-ever pond-sight beat. */
  private pondSeen: string[] = [];
  /** The planted plot per zone (BACKLOG-145/349), or null when empty. Stores the in-game day it was planted. */
  private plotByZone: Record<string, { plantedDay: number } | null> = { [BOWL_ID]: null, [GROVE_ID]: null, [FERNREACH_ID]: null };
  private plotSpriteByZone: Record<string, Phaser.GameObjects.Text | Phaser.GameObjects.Image | null> = {};
  /** Lifetime crop harvest tally (BACKLOG-145). Persisted; absent → 0. Shared across both plots. */
  private harvested = 0;
  /** Per-zone crop harvest tally (BACKLOG-428) — the prosperity index's farming term. Persisted; absent → {}. */
  private harvestedByZone: Record<string, number> = {};
  /** Per-zone banked food (BACKLOG-446) — the food twin of `stockpileByZone`: a share of each harvest banks
   *  here by food id, capped, read on the zone-map lens. Persisted; absent → {}. */
  private foodPileByZone: Record<string, FoodPile> = {};
  /** The (lazily-created) food pile for a zone (BACKLOG-446) — twin of `pileFor`. */
  private foodStoreFor(zone: string): FoodPile {
    return (this.foodPileByZone[zone] ??= {});
  }
  /** The last dino to eat + when (BACKLOG-373) — the anchor a shared meal pairs against. Transient (a live
   *  moment, not saved state). */
  private lastMeal: { name: string; at: number } | null = null;
  /** Last plot stage drawn per zone — so the ripen note fires once, on the edge into ripe. */
  private plotStageShownByZone: Record<string, CropStage | 'empty'> = { [BOWL_ID]: 'empty', [GROVE_ID]: 'empty', [FERNREACH_ID]: 'empty' };
  /** The active world-scale night event (BACKLOG-144), or null. Transient — only its memory persists. */
  private activeSky: SkyEvent | null = null;
  private skyStartAbsMin = 0;
  /** In-game day of the last sky event — caps the spectacle at one per day. */
  private skyFiredDay = -1;
  private skyGazers = new Set<string>();
  /** Where each gazer settled to watch (BACKLOG-288) — pairs of adjacent watchers bond when the event ends. */
  private skyGazerTiles = new Map<string, { tileX: number; tileY: number }>();
  private skyOverlay!: Phaser.GameObjects.Rectangle;
  private skyTween?: Phaser.Tweens.Tween;
  private convoCooldown = 0;
  private convoInFlight = false;
  private lastConversation: { speaker: string; text: string; source?: string } | null = null;
  /** Touch controls (BACKLOG-189): live drag vector, the dragging pointer, and the UI layer. */
  private touchEnabled = false;
  private touchVec: Vec2 = { x: 0, y: 0 };
  private stickPointerId = -1;
  private touchObjects: Phaser.GameObjects.GameObject[] = [];
  private stickThumb: Phaser.GameObjects.Arc | null = null;
  private stickGroup: Phaser.GameObjects.GameObject[] = [];
  private actionGroup: Phaser.GameObjects.GameObject[] = [];
  private sheetGroup: Phaser.GameObjects.GameObject[] = [];
  private chipGroups: Array<{ id: string; objs: Phaser.GameObjects.GameObject[] }> = [];
  private sheetOpen = false;
  /** Minds policy + inference governor (BACKLOG-107): which brain runs, and when ambient may think. */
  private coarsePointer = false;
  private brainKindNow: BrainKind = 'webllm';
  /** Which minds dialog is up: enable-consent, the off/keep/delete choice, or none. */
  private mindsConfirm: 'enable' | 'disable' | null = null;
  private tabHidden = false;
  private batteryLevel: number | undefined;
  private lastCacheAction: 'deleted' | 'error' | null = null;
  /** Audio spine (BACKLOG-191): last sound INTENT — recorded even when the context can't play. */
  private lastSound: { kind: 'chirp' | 'thunk'; name?: string; params?: ChirpParams } | null = null;
  /** Active intent per dino (BACKLOG-393): the current day-phase's lean. Transient — re-derived when the phase or day turns. */
  private intents: Record<string, DinoIntent> = {};
  /** The day-phase the cached active intent was derived for (BACKLOG-012) — a new phase re-derives from the plan. */
  private intentPhase: Record<string, DayPhase> = {};
  /** Persona-shaped daily plan (BACKLOG-012): the day's shape per dino. Transient — recomputed each in-game day, never persisted. */
  private plans: Record<string, { day: number; plan: DayPlan }> = {};
  /** Generate-once personas (BACKLOG-103): cached selves, persisted in the save. */
  private personas: Record<string, Persona> = {};
  /** Edge indicators (BACKLOG-398): the current zone's neighbour labels, rebuilt per zone change. */
  private edgeLabelTexts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super('World');
  }

  create(): void {
    this.drawFloor();
    this.drawDen(); // drawn before dinos so they nap on top of it

    this.renderKeeperAvatar(); // the chosen observer's pixel rig, or the amber square if undrawn

    // One shared brain across all dinos — five WebLLM engines would mean five model downloads.
    // Phones boot on the canned stub unless the keeper opted in (governor policy): a GB-class
    // model download never starts itself on a phone.
    this.coarsePointer = isCoarsePointer();
    this.brainKindNow = brainKind({ coarse: this.coarsePointer, consent: this.readMindsConsent() });
    this.npcBrain = makeBrain(this.brainKindNow);
    this.setupGovernor();
    for (const spawn of ROSTER) this.spawnDino(spawn);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D') as Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.dialog = new DialogBox(this);

    // E is the primary interact key; Z kept as an alias.
    this.interactKey.on('down', () => this.handleInteract());
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z).on('down', () => this.handleInteract());

    // Arrow keys page an open dialog (movement is frozen while one is up anyway).
    this.cursors.right.on('down', () => { if (this.dialogOpen) this.dialog.next(); });
    this.cursors.left.on('down', () => { if (this.dialogOpen) this.dialog.prev(); });
    // any: dev-only Playwright hook — current dialog page/pages/text
    (window as any).__dialogPage = () => this.dialog.pageInfo();
    // dev-only: did the Gen3 pixel dialog frame bake? (BACKLOG-036)
    (window as any).__dialogFrameBaked = () => this.textures.exists('dialog_frame');

    // 1/2/3 pick a greeting tone (BACKLOG-142) — or, while the keeper picker is up (BACKLOG-155),
    // choose an observer. onNumberKey routes to whichever overlay is open.
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE).on('down', () => this.onNumberKey(1));
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO).on('down', () => this.onNumberKey(2));
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.THREE).on('down', () => this.onNumberKey(3));

    // K opens the keeper picker (BACKLOG-155): choose which time-traveling observer you are.
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.K).on('down', () => this.openKeeperPicker());

    // B is LUMEN-3's Field Scan (BACKLOG-157): read the nearest dino's mind — Lux only.
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.B).on('down', () => this.toggleScan());

    // M toggles the bowl's sound (BACKLOG-191); the touch sheet has the same switch.
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M).on('down', () => setSoundMuted(!soundMuted()));

    this.addControlsHint();

    this.setupClock();
    this.setupDayNight();
    this.setupSeasons();
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
    this.setupPlot();
    this.setupSkyEvent();
    this.setupMigration();
    this.setupPlaque();
    this.setupScan();
    this.setupIdle();
    this.setupTouchControls();

    // BACKLOG-431: freeze/thaw the wall-clock ambient timers (wander/sky/migration rolls) so parallel e2e
    // specs don't race the background world tick. boot() pauses; ambient-beat specs step explicitly anyway.
    (window as any).__pauseAmbient = () => { this.ambientPaused = true; };
    (window as any).__resumeAmbient = () => { this.ambientPaused = false; };
    (window as any).__ambientPaused = () => this.ambientPaused;

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
      // Every keydown/pointerdown lands here — the one true first-gesture seam,
      // so this is where the AudioContext is allowed to exist (BACKLOG-191).
      unlockAudio();
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
      zone: zoneById(this.zoneId).name,
      stockpile: this.zoneStores(),
      zoneTally: this.zoneTally(),
    });
    // dev-only Playwright hooks — current zone + a jump (BACKLOG-143)
    (window as any).__zone = () => this.zoneId;
    (window as any).__setZone = (id: string) => {
      this.zoneId = id;
      this.refreshPlaque();
      this.applyZoneVisibility();
      this.applyObjectVisibility();
      this.drawFloor();
    };
    // dev-only hook — the current zone's rendered edge labels (BACKLOG-398), west→east order.
    (window as any).__edgeLabels = () => this.edgeLabelTexts.map((t) => t.text);
    // dev-only hooks — brain-biased intent (BACKLOG-393): read today's intent (authoring it on
    // first read, same path the step loop takes — deterministic either way); force one for e2e.
    (window as any).__intent = (name: string) => {
      const d = this.dinos.find((x) => x.name === name);
      return d ? this.ensureIntent(d) : (this.intents[name] ?? null);
    };
    (window as any).__setIntent = (name: string, kind: IntentKind) => {
      const now = getWorldClock().now();
      this.intents[name] = { kind, note: INTENT_NOTES[kind], until: now.day };
      this.intentPhase[name] = dayPhase(now.hour); // pin the phase so ensureIntent honours the forced lean
      return this.intents[name];
    };
    // dev-only hook — daily plan (BACKLOG-012): read a dino's day shape (one lean per day-phase),
    // computing it on first read the same deterministic path the step loop takes.
    (window as any).__plan = (name: string) => {
      const d = this.dinos.find((x) => x.name === name);
      return d ? this.ensurePlan(d, getWorldClock().now().day) : (this.plans[name]?.plan ?? null);
    };
    // dev-only hooks — persona (BACKLOG-103): read a dino's persona (authoring it on first read,
    // the same generate-once path every brain call site takes) + the whole cached store.
    (window as any).__persona = (name: string) => {
      const d = this.dinos.find((x) => x.name === name);
      return d ? this.ensurePersona(d) : (this.personas[name] ?? null);
    };
    (window as any).__personas = () => ({ ...this.personas });
    // dev-only hook — which ground tiles the pixel pipeline draws (BACKLOG-033 path/water render check).
    (window as any).__hasTileArt = (name: string) => hasTileArt(name);
    // dev-only hook — the active floor render (BACKLOG-294): zone, texture key, and whether tinted.
    (window as any).__floorInfo = () => ({
      zone: this.zoneId,
      key: this.floorImage?.texture.key ?? null,
      tinted: this.floorImage?.isTinted ?? false,
    });
  }

  private refreshPlaque(): void {
    if (!this.plaque) return;
    this.plaque.setText(
      plaqueLines({
        population: this.dinos.length,
        day: getWorldClock().now().day,
        generations: maxGeneration(this.born),
        zone: zoneById(this.zoneId).name,
        stockpile: this.zoneStores(),
        zoneTally: this.zoneTally(),
      }).join('\n'),
    );
  }

  /** Per-zone population readout (BACKLOG-316): each zone's resident count, '▸' on the keeper's active zone. */
  private zoneTally(): string {
    return zoneTallyLine(
      zonePopulations(this.dinoZones, this.dinos.map((d) => d.name), BOWL_ID),
      this.zoneId,
    );
  }

  /** Both-zone stores readout (BACKLOG-357/378): each zone's pile glyphs, '▸' on the keeper's active zone, so the
   *  player can watch the economies diverge without crossing. Over every zone now (a third can hold a pile too);
   *  empty zones drop out (see zoneStoresLine). */
  private zoneStores(): string {
    return zoneStoresLine(
      Object.fromEntries(ZONES.map((z) => [z.id, stockpileLine(this.pileFor(z.id))])),
      this.zoneId,
    );
  }

  /** Tap the glass (BACKLOG-057): a click raps the bowl; nearby dinos react by temperament. */
  private setupTap(): void {
    // Touches that land on the control layer (stick/buttons/chips) are input, not raps.
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      // The [?] chip / open help panel eats its tap: toggling help is not a rap.
      if (this.helpUiOwns(p.x, p.y)) {
        this.toggleHelp();
        return;
      }
      if (this.touchUiOwns(p.x, p.y)) {
        this.dispatchTouchTap(p.x, p.y);
        return;
      }
      this.tapGlass(p.worldX, p.worldY);
    });
    // dev-only Playwright hook — tap at a pixel, returns each dino's reaction
    (window as any).__tapGlass = (px: number, py: number) => this.tapGlass(px, py);
  }

  /** Rap the glass at a pixel; ripple, then every dino flees/approaches/ignores by bravery. */
  private tapGlass(px: number, py: number): Array<{ name: string; reaction: StartleReaction }> {
    if (!soundMuted()) {
      this.lastSound = { kind: 'thunk' };
      playThunk(); // the knock you'd hear from outside the bowl (BACKLOG-191)
    }
    this.spawnRipple(px, py);
    const tap = {
      tileX: Math.max(0, Math.min(COLS - 1, Math.round((px - TILE / 2) / TILE))),
      tileY: Math.max(0, Math.min(ROWS - 1, Math.round((py - TILE / 2) / TILE))),
    };

    const out: Array<{ name: string; reaction: StartleReaction }> = [];
    const bolters: Array<{ name: string; level: number }> = [];
    for (const d of this.dinos) {
      const cur = this.tileOf(d);
      const dist = Math.hypot(cur.tileX - tap.tileX, cur.tileY - tap.tileY);
      const reaction = reactionFor(d.traits.bravery, dist);
      out.push({ name: d.name, reaction });
      if (reaction === 'ignore') continue;
      if (reaction === 'bolt') bolters.push({ name: d.name, level: d.traits.bravery });

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
    // One tap, one cry (BACKLOG-194): the most frightened bolter calls out in distress.
    const crier = mostDistressed(bolters);
    if (crier) {
      const d = this.dinoByName(crier);
      if (d) this.cryDistress(d, 'startle');
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
    // BACKLOG-374: comfort food. Last comfort beat (a loner soothed by its favorite) or null; a named dino
    // eats the food in play (deterministic eater for the swarm race).
    (window as any).__lastComfortFood = () => (this.lastComfortFood ? { ...this.lastComfortFood } : null);
    (window as any).__eat = (name: string) => {
      const d = this.dinos.find((x) => x.name === name);
      if (d && this.food) this.eatFood(d);
    };
    // BACKLOG-375: the last generous-feed beat (who gave up a meal to whom) or null, + a deterministic
    // placement hook so a test can stand the winner + a hungry friend at chosen tiles before a drop.
    (window as any).__yieldFood = () => (this.lastYield ? { ...this.lastYield } : null);
    // BACKLOG-387: the last greedy-gobble beat (who shouldered past whom) + a trait setter so a test can
    // make a dino prickly/hungry-greedy deterministically (no existing trait-mutation hook).
    (window as any).__gobbleFood = () => (this.lastGobble ? { ...this.lastGobble } : null);
    // BACKLOG-390: the last stand-up beat (a bold winner that held its ground against a gobbler) or null.
    (window as any).__standFood = () => (this.lastStand ? { ...this.lastStand } : null);
    // BACKLOG-386/385: the last grateful-nuzzle beat, and the live "who owes whom a meal back" ledger.
    (window as any).__nuzzle = () => (this.lastNuzzle ? { ...this.lastNuzzle } : null);
    (window as any).__owesFood = () => JSON.parse(JSON.stringify(this.owesFood)) as Record<string, string[]>;
    (window as any).__setTrait = (name: string, key: string, v: number) => {
      const d = this.dinos.find((x) => x.name === name);
      if (d) (d.traits as any)[key] = v;
      return !!d;
    };
    (window as any).__placeDino = (name: string, tileX: number, tileY: number) => {
      const d = this.dinos.find((x) => x.name === name);
      if (d) d.setPosition(tileX * TILE + TILE / 2, tileY * TILE + TILE / 2);
      return !!d;
    };
    // BACKLOG-405: a dino's solitary-tic state — its solo-step count, whether it has invented the tic this
    // stretch, and its (deterministic) signature ritual — so a test can watch a lone dino fall into it.
    (window as any).__tic = (name: string) => {
      const d = this.dinos.find((x) => x.name === name);
      if (!d) return null;
      // BACKLOG-410: `strange` = alone in a strange zone (fresh + no in-zone friend); reported so the e2e can
      // prove the shortened onset. Computed the same way the wander branch does (settled + zone-mate friend read).
      const strange = aloneInStrangeZone(
        isSettled(tenureOf(this.tenure, name)),
        closestFriend(name, this.bonds, this.zoneMates(d), GRIEF_BOND_FLOOR) !== null,
      );
      return { solo: this.soloSteps[name] ?? 0, invented: this.ticInvented.has(name), tic: signatureTic(d.traits), strange };
    };
    // BACKLOG-414: the grief a dino's tic carries — its computed grief (closest cross-zone friend + edge), the
    // anchor its ritual settled on, and the friend it's grieving this stretch — so the e2e can prove the aim.
    (window as any).__griefTic = (name: string) => {
      const d = this.dinos.find((x) => x.name === name);
      if (!d) return null;
      return { grief: this.griefFor(d), anchor: this.ticAnchor[name] ?? null, grieved: this.ticGrief[name] ?? null };
    };
    // BACKLOG-408: force a dino into its invented-tic state (mid-ritual) so the caught-mid-tic greet is
    // deterministic — no 20-step solitude loop a stray wanderer could perturb. Mirrors what forceStep does.
    (window as any).__inventTic = (name: string) => {
      const d = this.dinos.find((x) => x.name === name);
      if (!d) return false;
      this.soloSteps[name] = TIC_AFTER_STEPS;
      this.ticInvented.add(name);
      this.ticAnchor[name] ??= this.tileOf(d);
      return true;
    };
    // any: dev-only Playwright hooks — the resource in play / per-dino gather tally / deterministic spawn (BACKLOG-146)
    // BACKLOG-314: the active zone's resource, else any present one (so cross-zone queries still read).
    (window as any).__resource = () => {
      const r = this.resourceByZone[this.zoneId] ?? Object.values(this.resourceByZone)[0];
      return r ? { ...r } : null;
    };
    (window as any).__gathered = () => ({ ...this.gathered });
    (window as any).__yield = (zone: string) => this.yieldByZone[zone] ?? YIELD_MAX; // BACKLOG-384: a zone's gather yield

    (window as any).__stockpile = () => ({ ...this.pileFor(this.zoneId) }); // BACKLOG-328: the keeper's active-zone pile
    (window as any).__zoneStockpile = (z: string) => ({ ...this.pileFor(z) }); // BACKLOG-328: a named zone's pile
    (window as any).__zoneFoodPile = (z: string) => ({ ...this.foodStoreFor(z) }); // BACKLOG-446: a named zone's banked food
    // BACKLOG-444: seed a zone's banked food so the e2e can watch the stores feed a starving resident.
    (window as any).__setZoneFoodPile = (zone: string, pile: Record<string, number>) => {
      this.foodPileByZone[zone] = { ...pile };
      return { ...this.foodStoreFor(zone) };
    };
    // BACKLOG-358: seed a zone's pile + run a barter between two named dinos deterministically (edge-meet trade).
    (window as any).__setZonePile = (zone: string, pile: Record<string, number>) => {
      this.stockpileByZone[zone] = { ...pile };
      return { ...this.pileFor(zone) };
    };
    // BACKLOG-358: run the ambient edge-meet scan deterministically (like __maybeMigrate) — dwell accumulates
    // per call on the dinos' current tiles, so a test can park two at a shared edge and prove the scan fires.
    (window as any).__maybeBarter = () => this.maybeBarter();
    (window as any).__edgeBarter = (a: string, b: string) => {
      const da = this.dinoByName(a);
      const db = this.dinoByName(b);
      if (!da || !db) return null;
      const za = zoneOf(this.dinoZones, a, BOWL_ID);
      const zb = zoneOf(this.dinoZones, b, BOWL_ID);
      const traded = this.doBarter(da, za, db, zb);
      return { traded, a: { ...this.pileFor(za) }, b: { ...this.pileFor(zb) } };
    };
    (window as any).__cairns = () => this.cairns.map((c) => ({ ...c })); // BACKLOG-286: crafted cairns
    (window as any).__canCraft = () => canCraft(this.pileFor(this.zoneId)); // BACKLOG-286
    (window as any).__shelters = () => this.shelters.map((s) => ({ ...s })); // BACKLOG-315: dino-built shelters
    // BACKLOG-344: the first shelter's baked texture key (or null if it fell back to the 🛖 glyph).
    (window as any).__shelterArt = () =>
      this.shelterSprites[0] instanceof Phaser.GameObjects.Image ? this.shelterSprites[0].texture.key : null;
    (window as any).__canBuildShelter = () => canBuildShelter(this.pileFor(this.zoneId)); // BACKLOG-315
    (window as any).__thatches = () => this.thatches.map((t) => ({ ...t })); // BACKLOG-417: woven frond thatches
    // BACKLOG-417: is the first thatch drawn from the stashed pixel rig (BACKLOG-427) rather than the 🥻 glyph?
    (window as any).__thatchIsArt = () =>
      this.thatchSprites.length > 0 && this.thatchSprites[0] instanceof Phaser.GameObjects.Image;
    (window as any).__zoneStructure = (z?: string) => zoneStructure(z ?? this.zoneId); // BACKLOG-377: the zone's landmark type
    // BACKLOG-308: which world-object sprites are currently drawn — the zone-scoping render check.
    (window as any).__objVisible = () => ({
      resource: this.resourceSpriteByZone[this.zoneId]?.visible ?? false,
      plot: this.plotSpriteByZone[this.zoneId]?.visible ?? false,
      // BACKLOG-349: per-zone plot visibility — each zone's plot draws only while the keeper is in it.
      plotByZone: Object.fromEntries(
        Object.keys(this.plotSpriteByZone).map((z) => [z, this.plotSpriteByZone[z]?.visible ?? false]),
      ),
      cairns: this.cairnSprites.map((s) => s.visible),
      shelters: this.shelterSprites.map((s) => s.visible), // BACKLOG-315
    });
    // BACKLOG-339: which dinos have ever been to the grove / are pausing on a fresh arrival.
    (window as any).__groveVisited = () => [...this.groveVisited];
    (window as any).__arriving = () => [...this.arriving];
    // BACKLOG-359: which dinos have ever seen the pond; __seePond drives the once-ever beat for the e2e
    // by dropping a dino into the grove beside the pond water and running the check.
    (window as any).__pondSeen = () => [...this.pondSeen];
    (window as any).__seePond = (name: string) => {
      const d = this.dinoByName(name);
      if (d) {
        setZone(this.dinoZones, name, GROVE_ID);
        d.setPosition(16 * TILE + TILE / 2, 5 * TILE + TILE / 2); // one tile south of the NE pond block
        this.checkPondSight();
      }
      return [...this.pondSeen];
    };
    (window as any).__spawnResource = (
      kind: ResourceKind,
      tileX: number,
      tileY: number,
      fresh = false,
      zone: string = this.zoneId, // BACKLOG-314: default the active zone (existing specs spawn in the bowl)
    ) => {
      // fresh=true starts the BACKLOG-297 grace at 0 (to test the linger); default → already fetchable,
      // so the existing gather/craft/stockpile e2e keep their immediate single-step pickup.
      this.spawnResource(kind, tileX, tileY, zone);
      this.resourceAgeByZone[zone] = fresh ? 0 : RESOURCE_GRACE_STEPS;
    };
    (window as any).__favoriteFood = (name: string, season?: Season) => {
      const d = this.dinos.find((x) => x.name === name);
      return d ? { ...favoriteFood(d.traits, season ?? this.currentSeason()) } : null;
    };
    // BACKLOG-296: pixel props. __hasPropArt = a rig exists; __resourceIsArt/__cairnIsArt = the live
    // sprite is the baked image (not the emoji fallback) — lets the e2e prove the swap without pixels.
    // BACKLOG-348: prove the production bundle wires the per-zone resource bias through pickKind.
    (window as any).__biasKind = (zone: string, r: number) => pickKind(() => r, zone);
    (window as any).__hasPropArt = (name: string) => hasPropArt(name);
    (window as any).__resourceIsArt = () =>
      this.resourceSpriteByZone[this.zoneId] instanceof Phaser.GameObjects.Image;
    (window as any).__cairnIsArt = () =>
      this.cairnSprites.length > 0 && this.cairnSprites[0] instanceof Phaser.GameObjects.Image;
  }

  /**
   * Plantable plot (BACKLOG-145): one fixed plot. Press P adjacent to plant a seed; it grows over
   * realtime-clock days; press P adjacent again once ripe to harvest the crop into the feeding loop.
   */
  private setupPlot(): void {
    for (const z of Object.keys(PLOT_TILE_BY_ZONE)) this.drawPlotSprite(z, 'empty');
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.P).on('down', () => this.handlePlot());
    this.refreshPlot();

    // any: dev-only Playwright hooks (BACKLOG-145/349). Each takes an optional zone (default = the active
    // zone, so existing bowl-default calls are byte-identical). __plot reports stage off the live clock day.
    (window as any).__plot = (zone?: string) => {
      const p = this.plotByZone[zone ?? this.zoneId];
      return p ? { plantedDay: p.plantedDay, stage: cropStage(getWorldClock().now().day - p.plantedDay) } : null;
    };
    (window as any).__harvested = () => this.harvested;
    (window as any).__lastMeal = () => this.lastMeal; // BACKLOG-373: the last-eaten anchor a shared meal pairs against
    (window as any).__plantPlot = (zone?: string) => {
      this.plant(zone ?? this.zoneId);
      return (window as any).__plot(zone);
    };
    (window as any).__harvestPlot = (zone?: string) => {
      this.harvest(zone ?? this.zoneId);
      return this.harvested;
    };
    // BACKLOG-317: the baked crop texture key when a stage rig renders, else null (emoji fallback).
    (window as any).__plotArt = (zone?: string) => {
      const s = this.plotSpriteByZone[zone ?? this.zoneId];
      return s instanceof Phaser.GameObjects.Image ? s.texture.key : null;
    };
    // BACKLOG-418: the plot's glyph marker (a Text sprite), so the per-zone ripe crop marker is assertable.
    (window as any).__plotGlyph = (zone?: string) => {
      const s = this.plotSpriteByZone[zone ?? this.zoneId];
      return s instanceof Phaser.GameObjects.Text ? s.text : null;
    };
  }

  /** Draw a zone's plot sprite for a stage: a baked crop prop where a rig exists (BACKLOG-317), else the
   *  emoji glyph (graceful fallback). Recreated only on a stage change, so it's not rebuilt per tick. */
  private drawPlotSprite(zone: string, stage: CropStage | 'empty'): void {
    this.plotSpriteByZone[zone]?.destroy();
    const tile = PLOT_TILE_BY_ZONE[zone];
    const px = tile.tileX * TILE + TILE / 2;
    const py = tile.tileY * TILE + TILE / 2;
    // BACKLOG-317/418/434: seed/sprout share the soil-mound rig; the ripe stage bakes the zone crop's OWN
    // ripe rig (berries → `crop_ripe`, the grove's greens → `crop_ripe_greens`), falling back to the crop
    // glyph only when no rig is stashed for that crop yet — so a rig-less crop still reads as its own marker.
    const propKey = stage === 'empty' ? null : stage === 'ripe' ? ripeRigKey(cropOf(zone).food) : `crop_${stage}`;
    const tex = propKey && hasPropArt(propKey) ? bakePropArt(this, propKey) : null;
    this.plotSpriteByZone[zone] = tex
      ? this.add.image(px, py, tex).setOrigin(0.5).setDepth(2)
      : this.add.text(px, py, stageGlyph(zone, stage), { fontSize: '16px' }).setOrigin(0.5).setDepth(2);
  }

  /** P press: plant the active zone's empty plot, harvest its ripe one, or note a growing one — only
   *  when adjacent (BACKLOG-308/349: each zone has its own plot; a zone without one ignores P). */
  private handlePlot(): void {
    const z = this.zoneId;
    const tile = PLOT_TILE_BY_ZONE[z];
    if (!tile) return; // this zone has no plot
    if (!plotAdjacent(this.playerTile(), tile)) return;
    const plot = this.plotByZone[z];
    if (!plot) {
      this.plant(z);
    } else if (cropStage(getWorldClock().now().day - plot.plantedDay) === 'ripe') {
      this.harvest(z);
    } else {
      this.logEvent('🌿 the crop is not ready yet');
    }
  }

  /** Plant a seed in a zone's empty plot, stamping today as the planted day. */
  private plant(zone: string): void {
    if (this.plotByZone[zone]) return;
    this.plotByZone[zone] = { plantedDay: getWorldClock().now().day };
    this.logEvent('🌱 you planted a seed in the plot');
    this.refreshPlot();
    void this.saveGame();
  }

  /**
   * Harvest a zone's ripe plot: release the crop as a food drop at the plot column (reusing the feeding
   * hatch so the swarm + favorites loop apply), clear the plot, and bump the harvest tally.
   */
  private harvest(zone: string): void {
    const plot = this.plotByZone[zone];
    if (!plot || cropStage(getWorldClock().now().day - plot.plantedDay) !== 'ripe') return;
    const crop = cropOf(zone); // BACKLOG-418: each zone yields its own crop into the feeding loop
    this.dropFood(PLOT_TILE_BY_ZONE[zone].tileX, crop.food); // no-ops if a piece is already in play — retry later
    this.plotByZone[zone] = null;
    this.harvested++;
    this.harvestedByZone[zone] = (this.harvestedByZone[zone] ?? 0) + 1; // BACKLOG-428: per-zone farming term
    // BACKLOG-446: a share of the harvest banks into the zone's food store (capped) — the drop above still
    // feeds the loop; this is the stored surplus 444/447 spend and ferry, read on the zone-map lens.
    this.foodPileByZone[zone] = bankFood(this.foodStoreFor(zone), crop.food);
    this.logEvent(`${crop.ripe} you harvested the crop`);
    this.refreshPlot();
    void this.saveGame();
  }

  /** Redraw each zone's plot marker for its current stage; log the ripen note once, on the edge into ripe.
   *  Each plot draws only in its own zone (BACKLOG-308/349). */
  private refreshPlot(): void {
    for (const z of Object.keys(PLOT_TILE_BY_ZONE)) {
      const plot = this.plotByZone[z];
      const stage: CropStage | 'empty' = plot ? cropStage(getWorldClock().now().day - plot.plantedDay) : 'empty';
      if (stage !== this.plotStageShownByZone[z]) this.drawPlotSprite(z, stage); // BACKLOG-317: swap to the stage's prop
      this.plotSpriteByZone[z]?.setVisible(this.zoneId === z);
      if (stage === 'ripe' && this.plotStageShownByZone[z] !== 'ripe') {
        this.logEvent(`${cropOf(z).ripe} the crop ripened — press P beside the plot to harvest`); // BACKLOG-418
      }
      this.plotStageShownByZone[z] = stage;
    }
  }

  /** forceStep tail: advance each plot's visible stage as realtime days pass (BACKLOG-145/349). */
  private checkPlot(): void {
    if (this.plotByZone[BOWL_ID] || this.plotByZone[GROVE_ID]) this.refreshPlot();
  }

  /**
   * First sight of the pond (BACKLOG-359): a grove dino that comes within sight of the pond water for
   * the first time ever stops wide-eyed — a 💧 memory + bubble, once per dino. Distinct from the
   * grove-entry beat (339): keyed on pond proximity + its own `pondSeen` set, not zone entry.
   */
  private checkPondSight(): void {
    for (const d of this.dinos) {
      const zone = zoneOf(this.dinoZones, d.name, BOWL_ID);
      if (firstPondSight(this.pondSeen, d.name, zone, this.tileOf(d), COLS, ROWS)) {
        this.pondSeen.push(d.name);
        this.memory = remember(this.memory, d.name, pondSightMemory());
        this.showBubble(d, pondSightLine());
        void this.saveGame();
      }
    }
  }

  /** The season the bowl is living in right now, off the live clock day (BACKLOG-170). */
  private currentSeason(): Season {
    return seasonFor(getWorldClock().now().day);
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
    this.startEscort(landing, kind);
    return landing;
  }

  /**
   * Brought to the hatch (BACKLOG-381) — on a drop, look for the dino the meal is going to miss.
   *
   * A withdrawn loner (135) at the wall is exactly the dino that won't rush: it's too far, or too listless,
   * and nothing in the park has ever been able to reach it. So the closest thing it has to a friend goes
   * and gets it. The rush read here is the *same* `reactionToFood` call `stepDinos` makes, so the gate can
   * never disagree with what the dino actually does. If nobody clears the floor, no escort starts and the
   * loner stands at the edge while the park eats — which is the read the whole beat is for.
   */
  private startEscort(landing: { tileX: number; tileY: number }, kind: Food): void {
    if (this.escort) return; // one escort at a time — a second drop doesn't restart it
    const inView = this.dinos.filter((d) => this.inView(d));
    const rushes = (d: Dino): boolean => {
      const dist = Math.hypot(this.tileOf(d).tileX - landing.tileX, this.tileOf(d).tileY - landing.tileY);
      const isFav = kind.id === favoriteFood(d.traits, this.currentSeason()).id;
      return reactionToFood(d.traits.energy, dist, isFav) === 'rush';
    };
    const names = this.dinoNames();
    // Deterministic pick (lexicographic, the topBy convention) — no RNG, so the beat is testable.
    const stranded = inView
      .filter((d) => missingTheMeal(isLoner(this.bonds, d.name, names, LONER_FLOOR), rushes(d)))
      .map((d) => d.name)
      .sort()[0];
    if (!stranded) return;
    const friend = fetcher(stranded, this.bonds, inView.map((d) => d.name).filter((n) => n !== stranded));
    if (!friend) return; // nobody comes
    this.escort = { friend, loner: stranded, phase: 'to-loner', steps: FETCH_STEPS };
  }

  /**
   * Where the pair is headed (BACKLOG-381): the food still on the ground, or — once the swarm has eaten it —
   * the hatch it landed at. The errand deliberately outlives the meal. A fetch takes ~20 steps and the cast
   * clears a drop in about three, so cancelling on an empty ground would mean the nudge almost never fired
   * and the beat would exist only on paper. The loner still gets walked in from the wall; it just may find
   * the food gone. Being brought to the hatch was never a guarantee of a meal — only of a chance at one.
   */
  private escortTarget(): { tileX: number; tileY: number } {
    return this.food ?? { tileX: Math.floor(COLS / 2), tileY: Math.floor(ROWS * 0.45) };
  }

  /**
   * Resolve the escort once per world step (BACKLOG-381), beside `stepResponder` and built the same way:
   * adjacency ends the outward leg, arrival or the step budget ends everything.
   *
   * Note it never re-reads `isLoner`. The nudge strengthens the pair's bond, which can lift the loner out
   * of loner status at the moment of contact — re-checking would cancel the beat exactly when it lands.
   */
  private stepEscort(): void {
    if (!this.escort) return;
    const friend = this.dinoByName(this.escort.friend);
    const loner = this.dinoByName(this.escort.loner);
    if (!friend || !loner) {
      this.escort = null; // a dino left the zone — nobody left to walk with
      return;
    }
    if (this.escort.phase === 'to-loner') {
      if (Math.abs(friend.x - loner.x) <= TILE * 1.01 && Math.abs(friend.y - loner.y) <= TILE * 1.01) {
        this.showBubble(friend, fetchLine(friend.name, loner.name));
        this.logEvent(fetchEventLine(friend.name, loner.name));
        this.memory = remember(this.memory, loner.name, fetchedMemory(friend.name));
        this.memory = remember(this.memory, friend.name, fetcherMemory(loner.name));
        this.bonds = strengthen(this.bonds, friend.name, loner.name, FETCH_BOND);
        this.flashFeed(loner, FETCH_GLYPH);
        this.escort = { ...this.escort, phase: 'to-food' };
      }
    } else if (reachedFood(this.tileOf(loner), this.escortTarget())) {
      this.escort = null; // it made it in — the errand is done, the meal is its own affair
      return;
    }
    this.escort = { ...this.escort, steps: this.escort.steps - 1 };
    if (this.escort.steps <= 0) this.escort = null;
  }

  /** First dino standing on (or beside) the landed food eats it. */
  private checkFeeding(): void {
    if (!this.food || !this.foodLanded) return;
    const food = this.food;
    const eater = this.dinos.find((d) => this.inView(d) && reachedFood(this.tileOf(d), food));
    if (!eater) return;
    // BACKLOG-375: a well-fed winner standing beside a hungrier high-bond friend in the swarm gives up
    // the meal and lets the friend eat first — the need-drive (371) shaping kindness between dinos.
    const eaterHunger = this.needs[eater.name]?.hunger ?? 0;
    const candidates = this.dinos
      .filter((d) => this.inView(d) && this.chebyTiles(this.tileOf(d), food) <= SWARM_RADIUS)
      .map((d) => ({
        name: d.name,
        hunger: this.needs[d.name]?.hunger ?? 0,
        bond: bondPoints(this.bonds, eater.name, d.name),
        agreeableness: d.traits.agreeableness,
      }));
    // BACKLOG-385: the winner repays a benefactor it remembers being fed by at a relaxed bond bar.
    const friendName = yieldFoodTo(eater.name, eaterHunger, candidates, new Set(this.owesFood[eater.name] ?? []));
    if (friendName) {
      const friend = this.dinos.find((d) => d.name === friendName)!;
      this.lastYield = { giver: eater.name, eater: friendName };
      this.lastGobble = null;
      this.lastStand = null;
      this.bonds = strengthen(this.bonds, eater.name, friendName, GENEROUS_BOND_BUMP); // kindness deepens the tie
      this.memory = remember(this.memory, eater.name, `you stepped back and let ${friendName} eat first`);
      this.flashFeed(eater, '🤝');
      this.logEvent(`🤝 ${eater.name} let ${friendName} eat first`);
      // BACKLOG-385: if this very yield repays a debt (the friend once fed the winner), the ledger closes —
      // a one-shot, so kindness keeps cycling rather than locking one pair forever.
      if ((this.owesFood[eater.name] ?? []).includes(friendName)) {
        this.owesFood[eater.name] = this.owesFood[eater.name].filter((n) => n !== friendName);
        this.memory = remember(this.memory, eater.name, `you repaid ${friendName}'s kindness at the hatch`);
      }
      // ...and the fed friend now remembers the winner as a benefactor to repay later.
      this.owesFood[friendName] = [...new Set([...(this.owesFood[friendName] ?? []), eater.name])];
      // BACKLOG-386: the fed friend throws a grateful 💛 toward its benefactor as it eats.
      this.lastNuzzle = { from: friendName, to: eater.name };
      this.flashFeed(friend, '💛');
      this.logEvent(`💛 ${friendName} nuzzled ${eater.name} in thanks`);
      this.eatFood(friend);
      return;
    }
    this.lastYield = null;
    this.lastNuzzle = null;
    // BACKLOG-387: the winner is keeping its food — but a hungry, prickly dino beside it in the swarm
    // won't wait its turn and shoulders past to eat first (the selfish inverse of the 375 yield).
    const gobblerName = gobblerAmong(eater.name, eaterHunger, candidates);
    if (gobblerName && standsGround(eater.traits.bravery)) {
      // BACKLOG-390: the winner is bold — it holds its tile and the gobbler backs down (😠), so who gets
      // pushed around at the hatch is a bravery read (the timid cede, the bold don't). The winner eats.
      this.lastStand = { winner: eater.name, gobbler: gobblerName };
      this.lastGobble = null;
      this.memory = remember(this.memory, eater.name, `you stood your ground and kept your food from ${gobblerName}`);
      this.flashFeed(eater, '😠');
      this.logEvent(`😠 ${eater.name} held its ground against ${gobblerName}`);
      // BACKLOG-394: the denied gobbler slinks off (😖) and remembers who wouldn't budge — the failed grab
      // has a visible cost. The bold winner still eats; no bond change (395 owns the social ripple).
      const gobbler = this.dinos.find((d) => d.name === gobblerName)!;
      this.memory = remember(this.memory, gobblerName, slunkOffMemory(eater.name));
      this.flashFeed(gobbler, '😖');
      this.logEvent(`😖 ${gobblerName} slunk off — ${eater.name} wouldn't budge`);
      this.eatFood(eater);
    } else if (gobblerName) {
      const gobbler = this.dinos.find((d) => d.name === gobblerName)!;
      this.lastStand = null;
      this.lastGobble = { winner: eater.name, gobbler: gobblerName };
      this.memory = remember(this.memory, gobblerName, `you shouldered past ${eater.name} and snatched the food first`);
      this.flashFeed(gobbler, '😤');
      this.logEvent(`😤 ${gobblerName} shouldered past ${eater.name} to the food`);
      this.eatFood(gobbler);
    } else {
      this.lastStand = null;
      this.lastGobble = null;
      this.eatFood(eater);
    }
  }

  /** Chebyshev distance in tiles (king's-move). Used by the feeding swarm (BACKLOG-375). */
  private chebyTiles(a: { tileX: number; tileY: number }, b: { tileX: number; tileY: number }): number {
    return Math.max(Math.abs(a.tileX - b.tileX), Math.abs(a.tileY - b.tileY));
  }

  private eatFood(d: Dino): void {
    const kind = this.foodKind;
    const r = foodReaction(kind!, d.traits, this.currentSeason());
    this.foodSprite?.destroy();
    this.foodSprite = null;
    this.food = null;
    this.foodKind = null;
    this.foodLanded = false;
    this.needs = satisfy(this.needs, d.name, 'hunger'); // BACKLOG-371: a meal sates hunger
    // A meal mends a cold funk too (BACKLOG-184): the food's gain plus the warm bonus.
    const warming = this.coldPending.has(d.name);
    this.friendship = bumpPoints(this.friendship, d.name, r.gain + (warming ? WARM_BONUS : 0));
    this.memory = remember(
      this.memory,
      d.name,
      r.favorite
        ? `you snapped up the food at the hatch — your favorite ${kind!.label}!`
        : 'you scrambled to the hatch and snapped up the food',
    );
    if (warming) {
      this.memory = remember(this.memory, d.name, warmMemory());
      this.clearColdFunk(d.name, true);
    }
    this.flashFeed(d, r.emoji);
    // BACKLOG-374: a moping loner soothed by its *favorite* food gets a quiet solace beat a plain meal never
    // gives. The 🥀 itself only lifts when a real bond forms (369) — this is a momentary per-palate comfort.
    const comforted = comfortsLoner(r.favorite, isLoner(this.bonds, d.name, this.dinoNames(), LONER_FLOOR));
    this.lastComfortFood = comforted ? { name: d.name, food: kind!.id } : null;
    if (comforted) {
      this.memory = remember(this.memory, d.name, comfortFoodMemory(kind!.label));
      this.showBubble(d, comfortFoodLine(d.name));
    }
    this.logEvent(
      `🍖 ${d.name} snapped up the food at the hatch${r.favorite ? ` — its favorite ${kind!.label}!` : ''}`,
    );
    // BACKLOG-373: two *different* dinos eating within a short window shared a meal — communal feeding warms
    // the pair a notch and each remembers it. A gentle tie (SHARED_MEAL_BOND < a meet). `lastMeal` re-anchors
    // on every meal so the next eater pairs against this one.
    const now = Date.now();
    if (sharedMeal(this.lastMeal, d.name, now)) {
      const other = this.lastMeal!.name;
      this.bonds = strengthen(this.bonds, other, d.name, SHARED_MEAL_BOND);
      this.memory = remember(this.memory, d.name, `you ate alongside ${other}`);
      this.memory = remember(this.memory, other, `you ate alongside ${d.name}`);
      this.flashFeed(d, '🍽');
      this.logEvent(`🍽 ${other} and ${d.name} ate together`);
    }
    this.lastMeal = { name: d.name, at: now };
    this.refreshHeartsPanel();
    void this.saveGame();
  }

  /** Mood lifts the motion (BACKLOG-318): a recovering dino flashes a brightened flourish of its
   *  signature quirk — a beat parallel to the repair/warm bubble, so recovery reads in motion. */
  private liftMood(d: Dino): void {
    this.lastMoodLift = reliefFlourish(d.traits);
    this.flashFeed(d, this.lastMoodLift);
    this.liftedUntil[d.name] = Date.now() + LIFT_WINDOW_MS; // BACKLOG-325: idle perkier for a while after
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

  /** The distinct zones with resident dinos (BACKLOG-314) — each rolls + holds its own resource. */
  private residentZones(): string[] {
    return occupiedZones(this.dinoZones, BOWL_ID, this.dinos.map((d) => d.name));
  }

  /**
   * A raw resource appears now and then (BACKLOG-146), now once per inhabited zone (BACKLOG-314): each
   * occupied zone rolls into its own empty slot, so the grove grows resources even while the keeper is
   * in the bowl (waiting, grace already elapsed, when you cross over).
   */
  private maybeSpawnResource(): void {
    for (const zone of this.residentZones()) {
      // BACKLOG-384: a zone's yield regrows a little each tick (even while a resource waits or the keeper's away),
      // and the spawn roll is scaled by it — a worked-out zone spawns rarer until it rests, a full zone unchanged.
      this.yieldByZone[zone] = regrowYield(this.yieldByZone[zone] ?? YIELD_MAX);
      if (this.resourceByZone[zone] || !rollResourceAt(RESOURCE_SPAWN_CHANCE, this.yieldByZone[zone])) continue;
      // BACKLOG-297: a natural spawn starts the fetch-grace clock; announce only the keeper's own zone.
      const landing = resourceLanding(COLS, ROWS);
      const kind = pickKind(Math.random, zone); // BACKLOG-348: each zone leans its own resource mix
      this.spawnResource(kind, landing.tileX, landing.tileY, zone);
      this.resourceAgeByZone[zone] = 0;
      if (zone === this.zoneId) this.logEvent(`${RESOURCE_GLYPH[kind]} a ${kind} fell`);
    }
  }

  /** Place a resource in a zone and draw its glyph. Shared by the roll + the dev hook (deterministic). */
  private spawnResource(kind: ResourceKind, tileX: number, tileY: number, zone: string = this.zoneId): void {
    // BACKLOG-308/314: a resource belongs to its zone, drawn + gatherable only there; one slot per zone.
    this.resourceByZone[zone] = { kind, tileX, tileY, zone };
    this.resourceSpriteByZone[zone]?.destroy();
    const px = tileX * TILE + TILE / 2;
    const py = tileY * TILE + TILE / 2;
    // BACKLOG-296: a baked pixel prop where one exists, else the emoji glyph (graceful fallback).
    const tex = bakePropArt(this, kind);
    const sprite = tex
      ? this.add.image(px, py, tex).setOrigin(0.5).setDepth(2)
      : this.add.text(px, py, RESOURCE_GLYPH[kind], { fontSize: '16px' }).setOrigin(0.5).setDepth(2);
    sprite.setVisible(zone === this.zoneId); // only the keeper's zone shows its resource
    this.resourceSpriteByZone[zone] = sprite;
  }

  /** The first dino to reach the active zone's resource picks it up — its tally rises, it's gone. */
  private checkGather(): void {
    const res = this.resourceByZone[this.zoneId]; // BACKLOG-308/314: only the active zone's is in play
    if (!res || !resourceFetchable(this.resourceAgeByZone[this.zoneId] ?? 0)) return; // 297: respect grace
    const taker = this.dinos.find((d) => this.inView(d) && reachedFood(this.tileOf(d), res));
    if (!taker) return;
    const kind = res.kind;
    this.resourceSpriteByZone[this.zoneId]?.destroy();
    delete this.resourceSpriteByZone[this.zoneId];
    delete this.resourceByZone[this.zoneId];
    // BACKLOG-384: working this zone thins its yield — over-gathering here slows its future spawns until it regrows.
    this.yieldByZone[this.zoneId] = depleteYield(this.yieldByZone[this.zoneId] ?? YIELD_MAX);
    this.gathered[taker.name] = (this.gathered[taker.name] ?? 0) + 1;
    // BACKLOG-328: a dino banks into its *own* home zone's pile (split from the old shared park total).
    const zone = zoneOf(this.dinoZones, taker.name, BOWL_ID);
    // BACKLOG-309: at the per-kind cap (now per zone), the pickup is consumed but banks nothing — the
    // first economy constraint. The stall surfaces as a beat so the pressure to spend (craft) reads in-world.
    if (atCap(this.pileFor(zone), kind)) {
      this.logEvent(`${RESOURCE_GLYPH[kind]} stores full — ${taker.name} drops the ${kind}`);
    } else {
      this.stockpileByZone[zone] = bankResource(this.pileFor(zone), kind); // BACKLOG-328: into this zone's pile
    }
    this.refreshPlaque();
    this.flashFeed(taker, RESOURCE_GLYPH[kind]);
    this.logEvent(`${RESOURCE_GLYPH[kind]} ${taker.name} picked up a ${kind}`);
    // BACKLOG-377/417: the dino that just banked builds the structure its *zone's* bias (348) favors,
    // spending its zone's pile — the stone-rich bowl stacks 🗿 cairns (286), the branch-rich grove raises
    // 🛖 lean-tos (315), the frond-rich Fernreach weaves 🥻 thatches (417). Each zone builds one landmark
    // type, so all three skylines diverge. `buildStructureFor` spends whatever `structureRecipe(zone)`
    // costs (cairn/shelter math byte-identical), then place by kind — else the pile is still climbing.
    const built = buildStructureFor(this.pileFor(zone), zone);
    if (built) {
      this.stockpileByZone[zone] = built;
      const kind = zoneStructure(zone);
      if (kind === 'thatch') this.placeThatch(this.tileOf(taker), taker);
      else if (kind === 'shelter') this.placeShelter(this.tileOf(taker), taker);
      else this.placeCairn(this.tileOf(taker), taker);
      this.refreshPlaque();
    }
    void this.saveGame();
  }

  /** Draw a cairn glyph at a tile (BACKLOG-286). Same depth/shape as a resource glyph. */
  private drawCairn(c: { tileX: number; tileY: number; zone: string }): void {
    const px = c.tileX * TILE + TILE / 2;
    const py = c.tileY * TILE + TILE / 2;
    // BACKLOG-296: a baked pixel cairn where one exists, else the 🗿 glyph (graceful fallback).
    const tex = bakePropArt(this, 'cairn');
    const sprite = tex
      ? this.add.image(px, py, tex).setOrigin(0.5).setDepth(2)
      : this.add.text(px, py, CAIRN_GLYPH, { fontSize: '16px' }).setOrigin(0.5).setDepth(2);
    sprite.setVisible(c.zone === this.zoneId); // BACKLOG-308: a cairn shows only in its own zone
    this.cairnSprites.push(sprite);
  }

  /** Record + render a freshly crafted cairn and mark the moment on the crafter (BACKLOG-286). */
  private placeCairn(tile: { tileX: number; tileY: number }, crafter: Dino): void {
    // BACKLOG-308: the cairn belongs to the zone the crafter built it in.
    const c = { ...tile, zone: zoneOf(this.dinoZones, crafter.name, BOWL_ID) };
    this.cairns.push(c);
    this.drawCairn(c);
    this.flashFeed(crafter, CAIRN_GLYPH);
    this.memory = remember(this.memory, crafter.name, 'stacked the first cairn from gathered branches and stones');
    this.logEvent(`${CAIRN_GLYPH} ${crafter.name} stacked a cairn`);
  }

  /** Draw a shelter at a tile (BACKLOG-315). Mirror of drawCairn — a baked lean-to prop (BACKLOG-344) where
   *  the rig exists, else the 🛖 glyph (graceful fallback). */
  private drawShelter(s: { tileX: number; tileY: number; zone: string }): void {
    const px = s.tileX * TILE + TILE / 2;
    const py = s.tileY * TILE + TILE / 2;
    const tex = bakePropArt(this, 'shelter'); // BACKLOG-344: pixel lean-to where one exists
    const sprite = tex
      ? this.add.image(px, py, tex).setOrigin(0.5).setDepth(2)
      : this.add.text(px, py, SHELTER_GLYPH, { fontSize: '16px' }).setOrigin(0.5).setDepth(2);
    sprite.setVisible(s.zone === this.zoneId); // BACKLOG-308: a shelter shows only in its own zone
    this.shelterSprites.push(sprite);
  }

  /** Record + render a freshly raised lean-to and mark the moment on the builder (BACKLOG-315). */
  private placeShelter(tile: { tileX: number; tileY: number }, crafter: Dino): void {
    // BACKLOG-308: the shelter belongs to the zone the crafter raised it in — a landmark of that zone.
    const s = { ...tile, zone: zoneOf(this.dinoZones, crafter.name, BOWL_ID) };
    this.shelters.push(s);
    this.drawShelter(s);
    this.flashFeed(crafter, SHELTER_GLYPH);
    this.memory = remember(this.memory, crafter.name, 'raised a lean-to from gathered branches and stones');
    this.logEvent(`${SHELTER_GLYPH} ${crafter.name} raised a lean-to`);
  }

  /** Draw a thatch at a tile (BACKLOG-417). Mirror of drawShelter — the baked 🥻 frond-thatch prop
   *  (stashed BACKLOG-427) where the rig exists, else the 🥻 glyph (graceful fallback). */
  private drawThatch(t: { tileX: number; tileY: number; zone: string }): void {
    const px = t.tileX * TILE + TILE / 2;
    const py = t.tileY * TILE + TILE / 2;
    const tex = bakePropArt(this, 'thatch'); // BACKLOG-427: the stashed frond-thatch rig
    const sprite = tex
      ? this.add.image(px, py, tex).setOrigin(0.5).setDepth(2)
      : this.add.text(px, py, THATCH_GLYPH, { fontSize: '16px' }).setOrigin(0.5).setDepth(2);
    sprite.setVisible(t.zone === this.zoneId); // BACKLOG-308: a thatch shows only in its own zone
    this.thatchSprites.push(sprite);
  }

  /** Record + render a freshly woven frond thatch and mark the moment on the weaver (BACKLOG-417). */
  private placeThatch(tile: { tileX: number; tileY: number }, crafter: Dino): void {
    // BACKLOG-308: the thatch belongs to the zone the crafter wove it in — the Fernreach's own landmark.
    const t = { ...tile, zone: zoneOf(this.dinoZones, crafter.name, BOWL_ID) };
    this.thatches.push(t);
    this.drawThatch(t);
    this.flashFeed(crafter, THATCH_GLYPH);
    this.memory = remember(this.memory, crafter.name, 'wove a frond thatch from gathered fronds');
    this.logEvent(`${THATCH_GLYPH} ${crafter.name} wove a frond thatch`);
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
    this.time.addEvent({ delay: SKY_ROLL_INTERVAL_MS, loop: true, callback: () => { if (!this.ambientPaused) this.maybeStartSky(); } }); // BACKLOG-431

    // dev-only Playwright hooks
    (window as any).__skyEvent = () => this.activeSky?.id ?? null;
    (window as any).__skyGazers = () => [...this.skyGazers];
    // BACKLOG-150: each dino's gaze ring + its current tile, so the e2e can assert it halts at its ring.
    (window as any).__skyRings = () =>
      this.dinos.map((d) => ({ name: d.name, ring: gazeRing(d.traits), ...this.tileOf(d) }));
    // BACKLOG-288: which gazers settled side by side (read before the event ends, when tiles are still held).
    (window as any).__skyCompanions = () =>
      stargazingPairs([...this.skyGazerTiles].map(([name, t]) => ({ name, ...t })));
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
    this.skyGazerTiles.clear();
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
    this.knitStargazers(); // BACKLOG-288: adjacent watchers come away a little closer
    // Persist the memories the gazers filed while watching + the companion bonds just knit.
    void this.saveGame();
  }

  /**
   * BACKLOG-288: when a sky event ends, every pair of gazers that settled side by side (Chebyshev ≤ 1)
   * gains a one-time shared-wonder bond bump and each files a "watched the sky together" memory naming
   * the other. A lone edge-watcher with no neighbour gets nothing. Clears the tiles so a second endSky
   * (idempotent guard) knits nothing.
   */
  private knitStargazers(): void {
    const gazers = [...this.skyGazerTiles].map(([name, t]) => ({ name, ...t }));
    for (const [a, b] of stargazingPairs(gazers)) {
      this.bonds = strengthen(this.bonds, a, b, SHARED_WONDER_BOND);
      this.memory = remember(this.memory, a, `watched the sky together with ${b}`);
      this.memory = remember(this.memory, b, `watched the sky together with ${a}`);
    }
    this.skyGazerTiles.clear();
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
      // BACKLOG-150: each dino presses in only to its own ring — bold/curious crowd under the spectacle
      // (ring 0), timid ones halt at the cluster's edge (ring 2). Same event, a different read per dino.
      const ring = gazeRing(d.traits);
      const cur = this.tileOf(d);
      const next = atGather(cur, SKY_GATHER_TILE, ring) ? cur : stepToward(cur, SKY_GATHER_TILE, COLS, ROWS);
      d.setPosition(next.tileX * TILE + TILE / 2, next.tileY * TILE + TILE / 2);
      if (atGather(next, SKY_GATHER_TILE, ring) && !this.skyGazers.has(d.name)) {
        this.skyGazers.add(d.name);
        this.skyGazerTiles.set(d.name, next); // BACKLOG-288: remember where it settled to watch
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
    this.dinoZones[cfg.name] ??= BOWL_ID;
    dino.sprite.setVisible(this.inView(dino));
    dino.label.setVisible(this.inView(dino));
    this.sleepMarks.push(
      this.add.text(0, 0, '💤', { fontSize: '12px' }).setOrigin(0.5, 1).setDepth(12).setVisible(false),
    );
    this.activityMarks.push(
      this.add.text(0, 0, '', { fontSize: '12px' }).setOrigin(0.5, 1).setDepth(12).setVisible(false),
    );
    this.coldMarks.push(
      this.add.text(0, 0, '🥶', { fontSize: '12px' }).setOrigin(0.5, 1).setDepth(12).setVisible(false),
    );
    this.mopeMarks.push(
      this.add.text(0, 0, MOPE_GLYPH, { fontSize: '12px' }).setOrigin(0.5, 1).setDepth(12).setVisible(false),
    );
    this.needMarks.push(
      this.add.text(0, 0, '', { fontSize: '12px' }).setOrigin(0.5, 1).setDepth(12).setVisible(false),
    );
    this.needs[cfg.name] ??= { hunger: 0, thirst: 0 };
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
    (window as any).__bondPair = (a: string, b: string, amount?: number) => {
      const before = this.bonds;
      this.bonds = strengthen(this.bonds, a, b, amount ?? HUDDLE_THRESHOLD);
      this.checkLonerLift(a, before); // BACKLOG-369: drive the loner→friend beat deterministically in tests
      this.checkLonerLift(b, before);
      return bondPoints(this.bonds, a, b);
    };
    (window as any).__huddlers = () => this.dinos.filter((d) => this.isHuddling(d)).map((d) => d.name);
    (window as any).__activity = (name: string) => this.activityById[name] ?? null; // BACKLOG-295
    // BACKLOG-298: a dino's signature idle quirk, and the glyph currently rendered above it.
    (window as any).__fidget = (name: string) => {
      const d = this.dinoByName(name);
      return d ? { ...fidget(d.traits) } : null;
    };
    // BACKLOG-310: the signature quirk shaded by a transient mood (sulk/cold). No mood → signature.
    (window as any).__moodFidget = (name: string, mood?: Mood) => {
      const d = this.dinoByName(name);
      return d ? { ...moodFidget(d.traits, mood) } : null;
    };
    // BACKLOG-318: the recovery flourish a dino would throw, and the last one actually fired.
    (window as any).__moodLift = (name: string) => {
      const d = this.dinoByName(name);
      return d ? reliefFlourish(d.traits) : null;
    };
    (window as any).__lastMoodLift = () => this.lastMoodLift;
    // BACKLOG-325: is a dino in its post-recovery perk window, and a hook to force one for tests.
    (window as any).__lifted = (name: string) => Date.now() < (this.liftedUntil[name] ?? 0);
    (window as any).__liftMood = (name: string) => {
      const d = this.dinoByName(name);
      if (d) this.liftMood(d);
      return this.lastMoodLift;
    };
    (window as any).__activityMark = (name: string) => {
      const i = this.dinos.findIndex((d) => d.name === name);
      return i >= 0 && this.activityMarks[i] ? this.activityMarks[i].text : null;
    };
    // dev-only: the live huddle verdict (BACKLOG-171) — season, bond bar, and window state now.
    (window as any).__huddleInfo = () => {
      const season = this.currentSeason();
      return {
        season,
        threshold: huddleThreshold(season),
        inWindow: inHuddleWindow(getWorldClock().now().hour, season),
      };
    };
    // dev-only: sleep murmurs (BACKLOG-181) — the deterministic line a dino would dream now, and a hook
    // to force a murmur past the sparse roll (returns the line shown, or null if no eligible sleeper).
    (window as any).__murmur = (name: string) => murmurLine(pickMurmurMemory(recall(this.memory, name)));
    (window as any).__forceMurmur = (name?: string) => {
      const d = name ? this.dinoByName(name) : this.pickMurmurer();
      if (!d || !this.isHuddling(d) || !this.inView(d)) return null;
      const line = murmurLine(pickMurmurMemory(recall(this.memory, d.name)));
      this.showBubble(d, line);
      return line;
    };
    // dev-only: cold-night shiver (BACKLOG-179) — who slept cold at the last morning resolution.
    (window as any).__coldSleepers = () => [...this.lastColdSleepers];
    // dev-only: keeper's warmth (BACKLOG-184) — who still carries the cold funk.
    (window as any).__coldPending = () => [...this.coldPending];
    // dev-only: the loner (BACKLOG-135) + need-drive spine (BACKLOG-371).
    (window as any).__loners = () =>
      this.dinoNames().filter((n) => isLoner(this.bonds, n, this.dinoNames(), LONER_FLOOR));
    (window as any).__isLoner = (name: string) => isLoner(this.bonds, name, this.dinoNames(), LONER_FLOOR);
    (window as any).__needs = () => JSON.parse(JSON.stringify(this.needs));
    (window as any).__pressingNeed = (name: string) => pressingNeed(this.needs[name]);
    // BACKLOG-367 (food web): the last forceStep's {hunter → prey} pairing, and a dino's diet.
    (window as any).__stalkTargets = () => ({ ...this.lastStalk });
    (window as any).__fleeFrom = () => ({ ...this.lastFlee }); // BACKLOG-442: prey → the hunter it flees
    (window as any).__diet = (species: string) => dietOf(species);
    (window as any).__advanceNeeds = (steps = 1) => {
      this.needs = advanceNeeds(this.needs, this.dinos.map((d) => ({ name: d.name, traits: d.traits })), steps);
      this.refreshNeedMarks();
      return JSON.parse(JSON.stringify(this.needs));
    };
    (window as any).__setNeed = (name: string, which: 'hunger' | 'thirst', v: number) => {
      const base = this.needs[name] ?? { hunger: 0, thirst: 0 };
      this.needs = { ...this.needs, [name]: { ...base, [which]: v } };
      this.refreshNeedMarks();
      return this.needs[name];
    };
    // Run the needs tick in place (advance + drink-at-pond) without moving any dino — lets the e2e drop
    // a thirsty dino at the pond (via __seePond) and watch it drink deterministically.
    (window as any).__checkNeeds = () => {
      this.checkNeeds();
      return JSON.parse(JSON.stringify(this.needs));
    };
    // BACKLOG-436: where a pressing need leans this dino (hatch/pond), or null (no pressing need, or thirst
    // with no reachable water). __needStep applies one forced seek step (bypassing the lean gate) so the
    // e2e can watch the body pulled toward relief deterministically.
    (window as any).__needTarget = (name: string) => {
      const d = this.dinoByName(name);
      if (!d) return null;
      const need = pressingNeed(this.needs[name]);
      return need ? this.needTargetFor(d, need) : null;
    };
    (window as any).__needStep = (name: string) => {
      const d = this.dinoByName(name);
      if (!d) return null;
      const need = pressingNeed(this.needs[name]);
      const target = need ? this.needTargetFor(d, need) : null;
      if (target) {
        const nxt = stepToward(this.tileOf(d), target, COLS, ROWS);
        d.setPosition(nxt.tileX * TILE + TILE / 2, nxt.tileY * TILE + TILE / 2);
      }
      return this.tileOf(d);
    };
    // dev-only: distress call (BACKLOG-194) — the last cry, the responder mid-walk, and a
    // staging trigger so e2e can fire the beat deterministically (the __triggerSky convention).
    (window as any).__lastDistress = () => (this.lastDistress ? { ...this.lastDistress } : null);
    (window as any).__distressResponder = () => (this.pendingRespond ? { ...this.pendingRespond } : null);
    // BACKLOG-381: the live escort — who is fetching whom, and which leg of the walk.
    (window as any).__escort = () => (this.escort ? { ...this.escort } : null);
    (window as any).__cryDistress = (name: string) => {
      const d = this.dinoByName(name);
      if (d) this.cryDistress(d, 'startle');
      return this.lastDistress ? { ...this.lastDistress } : null;
    };

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
    return inHuddleWindow(getWorldClock().now().hour, this.currentSeason()) && this.nearDen(d);
  }

  private refreshSleepMarks(): void {
    this.dinos.forEach((d, i) => {
      const mark = this.sleepMarks[i];
      if (!mark) return;
      mark.setVisible(this.isHuddling(d) && this.inView(d)).setPosition(d.x, d.y - TILE);
    });
    this.refreshColdMarks();
  }

  /** The cold funk's 🥶 (BACKLOG-184) — above the 💤 slot so a dusk overlap can't stack glyphs. */
  private refreshColdMarks(): void {
    this.dinos.forEach((d, i) => {
      const mark = this.coldMarks[i];
      if (!mark) return;
      mark.setVisible(this.coldPending.has(d.name) && this.inView(d)).setPosition(d.x, d.y - TILE * 1.4);
    });
    this.refreshMopeMarks();
    this.refreshNeedMarks();
  }

  private dinoNames(): string[] {
    return this.dinos.map((d) => d.name);
  }

  /** The loner's 🥀 (BACKLOG-135): live off the bond graph, beside the cold slot (rarely co-occurs). */
  private refreshMopeMarks(): void {
    const names = this.dinoNames();
    this.dinos.forEach((d, i) => {
      const mark = this.mopeMarks[i];
      if (!mark) return;
      const lonely = isLoner(this.bonds, d.name, names, LONER_FLOOR);
      mark.setVisible(lonely && this.inView(d)).setPosition(d.x, d.y - TILE * 1.4);
    });
  }

  /**
   * The loner finds a friend (BACKLOG-369): if strengthening a bond just lifted `name` out of loner status
   * (its first bond over the floor, per the pre-strengthen snapshot `before`), file the one-shot "not so
   * alone now" memory + float a 🌱 perk-up. The 🥀 stops drawing on its own (refreshMopeMarks reads the
   * live graph). Fires once ever per dino.
   */
  private checkLonerLift(name: string, before: Bonds): void {
    if (this.lonerFriended.has(name)) return;
    if (!liftsLoner(before, this.bonds, name, this.dinoNames(), LONER_FLOOR)) return;
    this.lonerFriended.add(name);
    this.memory = remember(this.memory, name, foundFriendMemory());
    const d = this.dinoByName(name);
    if (d) this.showBubble(d, foundFriendLine(name));
  }

  /** The need-drive 🍖/💧 (BACKLOG-371): the more pressing need, above the cold/mope slot. */
  private refreshNeedMarks(): void {
    this.dinos.forEach((d, i) => {
      const mark = this.needMarks[i];
      if (!mark) return;
      const need = pressingNeed(this.needs[d.name]);
      mark.setText(need ? NEED_GLYPH[need] : '').setVisible(!!need && this.inView(d)).setPosition(d.x, d.y - TILE * 1.7);
    });
  }

  /**
   * Need-drive spine (BACKLOG-371) — forceStep tail. Every dino's hunger/thirst builds one step at its
   * trait-shaped rate; a dino at its own zone's water drinks (thirst → 0). Deathless: needs only
   * ever build and resolve, nothing dies. Hunger resolves at the hatch (see `eatFood`).
   *
   * BACKLOG-445: the drink check is per-zone now — the bowl's waterhole and the Fernreach's creek slake
   * thirst the same way the grove pond always has. (`nearPond` stays grove-only for the 359 sight beat.)
   */
  private checkNeeds(): void {
    this.needs = advanceNeeds(this.needs, this.dinos.map((d) => ({ name: d.name, traits: d.traits })));
    for (const d of this.dinos) {
      const zone = zoneOf(this.dinoZones, d.name, BOWL_ID);
      if (atWater(zone, this.tileOf(d), COLS, ROWS)) this.needs = satisfy(this.needs, d.name, 'thirst');
    }
    this.feedFromStores();
    this.refreshNeedMarks();
  }

  /**
   * A carrier feeds the hungry (BACKLOG-444) — the zone's banked food (446) spent on its own starving
   * resident. The last resort, not the competition: a keeper drop in play always wins (a dino mid-rush to
   * real food is never intercepted), and only a dino past STARVING (well above the 🍖 tell's 0.6, so the
   * band 376/436 live in survives) is fed. A zone with an empty store feeds no one — which is the read.
   * Deathless: an unfed dino just stays starving. Takes from the dino's *home* zone, not the viewed one.
   */
  private feedFromStores(): void {
    if (this.food) return;
    for (const d of this.dinos) {
      if (!isStarving(this.needs[d.name])) continue;
      const zone = zoneOf(this.dinoZones, d.name, BOWL_ID);
      const pile = this.foodStoreFor(zone);
      const id = pickFoodToSpend(pile, favoriteFood(d.traits, this.currentSeason()).id);
      if (!id) continue;
      const emoji = FOODS.find((f) => f.id === id)?.emoji ?? NEED_GLYPH.hunger;
      const zoneName = zoneById(zone).name;
      this.foodPileByZone[zone] = takeFood(pile, id);
      this.needs = satisfy(this.needs, d.name, 'hunger');
      this.memory = remember(this.memory, d.name, storesFedMemory(zoneName));
      this.flashFeed(d, emoji);
      this.logEvent(storesFedLine(zoneName, d.name, emoji));
      void this.saveGame();
    }
  }

  /**
   * Where a pressing need leans a dino (BACKLOG-436): hunger → the hatch feeding zone (centre column, the
   * `foodLanding` row where dropped food settles), thirst → its own zone's water. Until BACKLOG-445 the
   * thirst arm returned null anywhere but the grove — the need-pull was a no-op in two zones out of three.
   * Every zone answers for itself now (an unknown zone id still returns null and the dino just wanders).
   */
  private needTargetFor(d: Dino, need: NeedKind): { tileX: number; tileY: number } | null {
    if (need === 'hunger') return { tileX: Math.floor(COLS / 2), tileY: Math.floor(ROWS * 0.45) };
    return zoneWaterTile(zoneOf(this.dinoZones, d.name, BOWL_ID), COLS, ROWS);
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

  /**
   * A dino's role: derived from how it has actually behaved, then *settled* so an emerged role is
   * durable (BACKLOG-032) — once found it never reverts to wanderer. The settled role is the single
   * source for the lens, the book, and `__roles`, and is persisted in the save.
   */
  private roleOf(name: string): Role {
    const derived = deriveRole({ meetings: this.meetingsOf(name), rumorsHeard: this.rumorsOf(name), topBond: this.maxBond(name) });
    const settled = settleRole(this.roles[name], derived);
    this.roles[name] = settled;
    return settled;
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
      quirk: fidget(d.traits).label, // BACKLOG-303: signature idle quirk, in step with the live mark
      intent: this.intents[d.name]?.note, // BACKLOG-393: today's lean, the mind made legible
      plans: planShape(this.ensurePlan(d, getWorldClock().now().day)), // BACKLOG-012: the day's shape, dawn→night
      home: isSettled(tenureOf(this.tenure, d.name)) // BACKLOG-341: where it's settled, once it belongs
        ? settledLine(zoneById(zoneOf(this.dinoZones, d.name, BOWL_ID)).name)
        : undefined,
      foodweb: foodwebStanding(dietOf(d.species, d.name), recall(this.memory, d.name)) ?? undefined, // BACKLOG-443
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
    // Zone map lens (BACKLOG-425): boxes + connectors + keeper dot, one floating label per zone.
    this.mapGfx = this.add.graphics().setDepth(13).setVisible(false);
    this.mapLabels = ZONES.map(() =>
      this.add
        .text(0, 0, '', {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#ffffff',
          align: 'center',
        })
        .setOrigin(0.5, 0.5)
        .setDepth(14)
        .setVisible(false),
    );
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
    // dev-only Playwright hook — the zone map model (BACKLOG-425): chain order, counts, keeper flag
    (window as any).__zoneMap = () => this.zoneMapEntries();
    // BACKLOG-428: a zone's prosperity read — the folded signals, score, and tier the map lens shows.
    (window as any).__zoneProsperity = (zone: string) => {
      const signals = this.zoneSignals(zone);
      const score = zoneProsperity(signals);
      return { signals, score, tier: prosperityTier(score) };
    };
    (window as any).__bookRows = () => this.bookRows();
    // dev-only hook — the rendered collection-book text (BACKLOG-303: the quirk line shows here)
    (window as any).__bookText = () => bookLines(this.bookRows()).join('\n');
    // dev-only Playwright hook — the persisted settled-role store (BACKLOG-032)
    (window as any).__roleStore = () => ({ ...this.roles });

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
    this.mapGfx.setVisible(L === 'map');
    this.mapLabels.forEach((t) => t.setVisible(L === 'map'));

    // role tags float over each dino only in the roles lens
    this.roleTags.forEach((tag, i) => {
      const d = this.dinos[i];
      const show = L === 'roles' && !!d && this.inView(d);
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
        if (!a || !b || !this.inView(a) || !this.inView(b)) continue;
        this.bondGfx.lineStyle(Math.max(1, Math.round(p.points / 18)), 0xff6fae, 0.6);
        this.bondGfx.lineBetween(a.x, a.y, b.x, b.y);
      }
    } else if (L === 'map') {
      this.drawZoneMap();
    }
  }

  /**
   * A zone's prosperity signals (BACKLOG-428) — the four live per-zone reads the index folds: banked
   * resources, built landmarks, resident heads, and crops harvested from the zone's plot. Pure gather;
   * `zoneProsperity` does the math.
   */
  private zoneSignals(id: string): ZoneSignals {
    const pile = this.pileFor(id);
    const stockpile = Object.values(pile).reduce((sum, n) => sum + (n ?? 0), 0);
    const structures = [...this.cairns, ...this.shelters, ...this.thatches].filter((s) => s.zone === id).length;
    const heads = zonePopulations(this.dinoZones, this.dinos.map((d) => d.name), BOWL_ID)[id] ?? 0;
    const harvested = this.harvestedByZone[id] ?? 0;
    return { stockpile, structures, heads, harvested };
  }

  /** The prosperity tier of each zone (BACKLOG-428) — the map lens's per-zone read, keyed by zone id. */
  private zoneTiers(): Record<string, ProsperityTier> {
    const tiers: Record<string, ProsperityTier> = {};
    for (const id of zoneChain()) tiers[id] = prosperityTier(zoneProsperity(this.zoneSignals(id)));
    return tiers;
  }

  /** The live zone-map model (BACKLOG-425 + 428 tier) — the single source the lens draws and `__zoneMap` returns. */
  private zoneMapEntries(): ZoneMapEntry[] {
    return zoneMapModel(
      zoneChain(),
      zonePopulations(this.dinoZones, this.dinos.map((d) => d.name), BOWL_ID),
      this.zoneId,
      this.zoneTiers(),
      this.harvestedByZone, // BACKLOG-433: each zone's farming tally, read on its own on the lens
      this.foodPileByZone, // BACKLOG-446: each zone's banked food, read as a glyph line on the lens
    );
  }

  /**
   * Draw the zone map (BACKLOG-425): the chain as a centered horizontal row of labelled boxes
   * (name + head count), a connector between neighbours, and a dot marking the keeper's zone.
   * Pure model in, chrome out — redrawn on every lens refresh so counts and the dot stay live.
   */
  private drawZoneMap(): void {
    const entries = this.zoneMapEntries();
    const boxW = 118;
    const boxH = 92; // BACKLOG-428/438: prosperity + want lines; BACKLOG-446: room for the banked-food line
    const gap = 26;
    const totalW = entries.length * boxW + (entries.length - 1) * gap;
    const x0 = ((TILE * COLS) - totalW) / 2;
    const y = 44;
    this.mapGfx.clear();
    entries.forEach((e, i) => {
      const x = x0 + i * (boxW + gap);
      if (i > 0) {
        this.mapGfx.lineStyle(2, 0xffffff, 0.5);
        this.mapGfx.lineBetween(x - gap, y + boxH / 2, x, y + boxH / 2);
      }
      this.mapGfx.fillStyle(0x000000, 0.85);
      this.mapGfx.fillRect(x, y, boxW, boxH);
      this.mapGfx.lineStyle(2, e.keeper ? 0xffe0a0 : 0xffffff, 0.9);
      this.mapGfx.strokeRect(x, y, boxW, boxH);
      if (e.keeper) {
        this.mapGfx.fillStyle(0xffe0a0, 1);
        this.mapGfx.fillCircle(x + boxW / 2, y + boxH - 9, 4);
      }
      // BACKLOG-428: name + head count + prosperity badge (○/◐/● quiet/growing/thriving).
      // BACKLOG-433: the zone's own harvest tally (🌾N) reads beside the folded tier.
      // BACKLOG-438: a fourth line names what the zone wants from a neighbour, only when it has a demand.
      let txt = `${e.name}\n${e.count} 🦕\n${prosperityBadge(e.tier)}  🌾${e.harvested}`;
      if (e.want) txt += `\nwants ${e.want.glyph}◂${e.want.fromName}`;
      if (e.banked) txt += `\n${e.banked}`; // BACKLOG-446: the zone's banked food, only when it has some
      this.mapLabels[i]?.setText(txt).setPosition(x + boxW / 2, y + boxH / 2 - 5);
    });
    // A roster bigger than ZONES can't happen (labels are per-zone), but hide any spare label anyway.
    for (let i = entries.length; i < this.mapLabels.length; i++) this.mapLabels[i].setVisible(false);
  }

  private setupMovement(): void {
    // BACKLOG-333: wander on a real-time timer, not the in-game clock, so the park mills about at a
    // watchable pace whatever the time scale (at 1× an in-game minute is 60 real seconds).
    this.time.addEvent({ delay: WANDER_STEP_MS, loop: true, callback: () => { if (!this.ambientPaused) this.forceStep(); } }); // BACKLOG-431

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
    // BACKLOG-355: append a raw memory (lets the e2e age a grove telling toward the back of the ring).
    (window as any).__remember = (name: string, event: string) => {
      this.memory = remember(this.memory, name, event);
    };
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
    // dev-only: word of the cold (BACKLOG-185) — a cold-slept speaker leads with the cold news.
    (window as any).__spreadColdWord = (a: string, b: string) => {
      const g = spreadColdWord(this.memory, a, b);
      this.memory = g.store;
      return g.rumor;
    };
    (window as any).__coldWord = (speaker: string) => coldWordLine(speaker);
    // dev-only: word of the grove (BACKLOG-342) — a just-returned speaker leads with grove news.
    (window as any).__spreadGroveWord = (a: string, b: string) => {
      const g = spreadGroveWord(this.memory, a, b);
      this.memory = g.store;
      return g.rumor;
    };
    (window as any).__groveWord = (speaker: string) => groveWordLine(speaker);
    // dev-only: pond-swappers (BACKLOG-346) — two grove-visited dinos trade pond notes (applies it).
    (window as any).__pondSwap = (a: string, b: string) => this.pondSwapBeat(a, b);
    // dev-only: word of the warmth (BACKLOG-223) — a warmed speaker leads with the good news.
    (window as any).__spreadWarmWord = (a: string, b: string) => {
      const g = spreadWarmWord(this.memory, a, b);
      this.memory = g.store;
      return g.rumor;
    };
    (window as any).__warmWord = (speaker: string) => warmWordLine(speaker);
    // dev-only: word of the relief (BACKLOG-235) — a corrector leads with the all-clear it carries.
    (window as any).__spreadReliefWord = (a: string, b: string) => {
      const g = spreadReliefWord(this.memory, a, b);
      this.memory = g.store;
      return g.rumor;
    };
    // dev-only: secondhand sympathy visit (BACKLOG-217) — the carrier of a cold word comes to find
    // the sufferer; applies the bump + memory and returns {visitor, sufferer, memory} or null.
    (window as any).__sympathyVisit = (a: string, b: string) => {
      const v = sympathyVisit(this.memory, a, b);
      if (v) {
        this.memory = remember(this.memory, v.sufferer, v.memory);
        this.bonds = strengthen(this.bonds, v.visitor, v.sufferer, SYMPATHY_BOND);
      }
      return v;
    };
    (window as any).__bond = (a: string, b: string) => bondPoints(this.bonds, a, b);
    // dev-only: the bowl self-corrects (BACKLOG-234) — a carrier drops a recovered sufferer's
    // cold word with relief; applies the forget + relief memory and returns the correction or null.
    (window as any).__selfCorrect = (a: string, b: string) => {
      const c = selfCorrect(this.memory, a, b);
      if (c) {
        this.memory = forget(this.memory, c.corrector, c.dropped);
        this.memory = remember(this.memory, c.corrector, c.memory);
      }
      return c;
    };
    // dev-only: plant a first-hand cold memory without staging a winter night.
    (window as any).__rememberCold = (name: string) => {
      this.memory = remember(this.memory, name, coldMemory());
    };
    // dev-only: plant a first-hand warm memory without staging a warming.
    (window as any).__rememberWarm = (name: string) => {
      this.memory = remember(this.memory, name, warmMemory());
    };
    // dev-only: plant a "<clearer> cleared my name" memory (BACKLOG-247) without staging the gossip arc.
    (window as any).__rememberGrateful = (sufferer: string, clearer: string) => {
      this.memory = remember(this.memory, sufferer, gratefulMemory(clearer));
    };
    // dev-only: grateful to the one who cleared your name (BACKLOG-243) — a recovered sufferer warms
    // to the carrier of its first-hand all-clear; applies the bump + memory, returns the result or null.
    (window as any).__clearedName = (a: string, b: string) => {
      const t = clearedName(this.memory, a, b);
      if (t) {
        this.memory = remember(this.memory, t.sufferer, t.memory);
        this.bonds = strengthen(this.bonds, t.sufferer, t.clearer, GRATEFUL_BOND);
      }
      return t;
    };
    // dev-only: plant a first-hand relief memory (`saw <sufferer> came through it fine`) on the clearer.
    (window as any).__rememberRelief = (name: string, sufferer: string) => {
      this.memory = remember(this.memory, name, reliefMemory(sufferer));
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

  /** Is another dino in `d`'s own zone within tic-company range (BACKLOG-405)? Company breaks the solitude. */
  private companyNear(d: Dino): boolean {
    const zone = zoneOf(this.dinoZones, d.name, BOWL_ID);
    const cur = this.tileOf(d);
    return this.dinos.some(
      (o) =>
        o !== d &&
        zoneOf(this.dinoZones, o.name, BOWL_ID) === zone &&
        this.chebyTiles(this.tileOf(o), cur) <= TIC_COMPANY_RANGE,
    );
  }

  /** Company or a need returned (BACKLOG-405): drop the solitary streak so the ritual can re-form fresh later. */
  private resetTic(name: string): void {
    this.soloSteps[name] = 0;
    this.ticInvented.delete(name);
    delete this.ticAnchor[name];
    delete this.ticPhase[name];
    delete this.ticGrief[name]; // BACKLOG-414: the grief re-derives fresh next stretch

    this.ticCaughtFiled.delete(name); // BACKLOG-408: the stretch ended — a later one can be caught (+ remembered) afresh
    if (this.caughtTic === name) this.caughtTic = null;
  }

  /**
   * BACKLOG-414: the ache a lone dino carries into its ritual — its *closest* friend (013, above the
   * grief floor) and the edge that friend crossed away by, or null when that friend shares its zone (no
   * departure to grieve) or it has no real friend at all. A solitude with a direction.
   */
  /** BACKLOG-410: the names of the *other* dinos residing in `d`'s current zone (any distance) — the pool
   *  `closestFriend` searches to decide whether `d` has a friend at home in its strange new zone. */
  private zoneMates(d: Dino): string[] {
    const zone = zoneOf(this.dinoZones, d.name, BOWL_ID);
    return this.dinos
      .filter((o) => o.name !== d.name && zoneOf(this.dinoZones, o.name, BOWL_ID) === zone)
      .map((o) => o.name);
  }

  private griefFor(d: Dino): { edge: Edge; friend: string } | null {
    const friend = closestFriend(d.name, this.bonds, this.dinoNames(), GRIEF_BOND_FLOOR);
    if (!friend) return null;
    const dz = zoneOf(this.dinoZones, d.name, BOWL_ID);
    const fz = zoneOf(this.dinoZones, friend, BOWL_ID);
    const edge = griefEdge(dz, fz);
    return edge ? { edge, friend } : null;
  }

  /**
   * Perform the tic (BACKLOG-405): the first time a dino falls into its ritual this solitary stretch, float
   * the glyph, log it, and file the one-time memory (which the greeting/reflection path can later surface).
   * Afterward it re-floats the glyph every few steps so an ongoing ritual stays visible without spamming.
   */
  private performTic(d: Dino, tic: Tic): void {
    if (!this.ticInvented.has(d.name)) {
      this.ticInvented.add(d.name);
      // BACKLOG-414: a dino grieving a departed friend files the directional ache; else the plain 405 ritual.
      const grieved = this.ticGrief[d.name];
      this.memory = remember(this.memory, d.name, grieved ? griefTicMemory(tic.label, grieved) : ticMemory(tic.label));
      this.flashFeed(d, tic.glyph);
      this.logEvent(`${tic.glyph} ${d.name} ${grieved ? `${tic.label} at the edge ${grieved} left by` : tic.label}`);
    } else if ((this.soloSteps[d.name] ?? 0) % 6 === 0) {
      this.flashFeed(d, tic.glyph);
    }
  }

  /** One wander + meeting step for every dino (used by the throttled tick and the dev hook). */
  private forceStep(): void {
    if (this.convoCooldown > 0) this.convoCooldown--;

    // A world-scale night event (BACKLOG-144) overrides all wandering: the whole cast gathers to
    // gawp at the sky. When it ends (duration/dawn) stepSky returns false and ordinary life resumes.
    if (this.stepSky()) {
      for (const d of this.dinos) this.activityById[d.name] = 'gazing'; // BACKLOG-295
      this.refreshSleepMarks();
      this.refreshActivityMarks();
      return;
    }

    // BACKLOG-297/314: age every zone's resource so each zone's fetch grace can elapse (a grove resource
    // is past its grace and ready when the keeper crosses in).
    for (const z of Object.keys(this.resourceByZone)) this.resourceAgeByZone[z] = (this.resourceAgeByZone[z] ?? 0) + 1;

    const season = this.currentSeason();
    const denTime = inHuddleWindow(getWorldClock().now().hour, season);

    // Food web (BACKLOG-367): pair each hungry, in-view carnivore off cooldown with the nearest in-view
    // herbivore — the bowl's first hunt. Built once per step (before the movement ladder) so the hunter
    // and its prey read the same pairing whichever is processed first. Deathless; resolution below.
    const now = Date.now();
    const stalkTargets: Record<string, string> = {};
    const fleeFrom: Record<string, string> = {};
    const herbivores = this.dinos.filter((h) => this.inView(h) && !isCarnivore(h.species, h.name));
    for (const d of this.dinos) {
      if (!isCarnivore(d.species, d.name) || !this.inView(d)) continue;
      if ((this.huntCooldownUntil[d.name] ?? 0) > now) continue;
      if (pressingNeed(this.needs[d.name]) !== 'hunger') continue;
      const prey = nearestPrey(
        this.tileOf(d),
        herbivores.map((h) => ({ name: h.name, tile: this.tileOf(h) })),
      );
      if (prey) {
        stalkTargets[d.name] = prey;
        fleeFrom[prey] = d.name; // a prey chased by two hunters flees the nearer-scanned one; harmless either way
      }
    }
    this.lastStalk = stalkTargets;

    // The hunter's reputation (BACKLOG-442): fear turns personal. A herbivore chased by the *same* carnivore
    // WARY_CHASES+ times startles when that specific hunter comes within WARY_RANGE — even off an active hunt
    // (the hunter sated, on cooldown, just passing). It reuses the flee branch below; only prey not already
    // fleeing an active stalker are considered, and the nearest feared hunter wins.
    for (const h of herbivores) {
      if (fleeFrom[h.name]) continue;
      const mem = recall(this.memory, h.name);
      const ht = this.tileOf(h);
      let feared: string | null = null;
      let fearedDist = Infinity;
      for (const c of this.dinos) {
        if (c.name === h.name || !isCarnivore(c.species, c.name) || !this.inView(c)) continue;
        if (!fearsHunter(mem, c.name)) continue;
        const dist = this.chebyTiles(ht, this.tileOf(c));
        if (dist <= WARY_RANGE && dist < fearedDist) { fearedDist = dist; feared = c.name; }
      }
      if (feared) fleeFrom[h.name] = feared;
    }
    this.lastFlee = fleeFrom;

    for (const d of this.dinos) {
      const cur = this.tileOf(d);

      // First contact (BACKLOG-161): the armed inspector beelines for the new watcher,
      // ignoring food and friends until it gets its look (or loses interest — ttl below).
      if (this.pendingInspect?.name === d.name) {
        const step = stepToward(cur, this.playerTile(), COLS, ROWS);
        d.setPosition(step.tileX * TILE + TILE / 2, step.tileY * TILE + TILE / 2);
        this.activityById[d.name] = 'inspecting'; // BACKLOG-295
        continue;
      }

      // Distress response (BACKLOG-194): the friend that heard the cry walks toward the
      // caller's LIVE tile (it may have bolted as it cried). Below inspection in priority.
      if (this.pendingRespond?.name === d.name) {
        const caller = this.dinoByName(this.pendingRespond.caller);
        if (caller) {
          const step = stepToward(cur, this.tileOf(caller), COLS, ROWS);
          d.setPosition(step.tileX * TILE + TILE / 2, step.tileY * TILE + TILE / 2);
          this.activityById[d.name] = 'responding'; // BACKLOG-295
          continue;
        }
      }

      // Visible zone crossing (BACKLOG-334): a migrating dino is on a committed journey — it walks to its
      // zone's linked edge and crosses, rather than teleporting (the old `relocate`). Above food/huddle (a
      // crossing dino ignores snacks), below inspection/response (a startle can still pre-empt). The home
      // zone flips only on arrival, so the dino stays visible in its origin zone for the whole walk.
      if (this.migrating.has(d.name)) {
        const home = zoneOf(this.dinoZones, d.name, BOWL_ID);
        const edge = this.migrationCross[d.name]?.edge; // BACKLOG-378: the chosen crossing's edge (grove → bowl|Fernreach)
        if (atMigrationEdge(home, cur, COLS, edge)) {
          this.crossDino(d);
        } else {
          const step = stepToward(cur, migrationStepTarget(home, cur.tileY, COLS, edge), COLS, ROWS);
          d.setPosition(step.tileX * TILE + TILE / 2, step.tileY * TILE + TILE / 2);
          this.activityById[d.name] = 'wandering'; // BACKLOG-295: the journey reads in motion, not a glyph
        }
        continue;
      }

      // First steps in the grove (BACKLOG-339): a dino fresh across pauses one step to look around (the
      // 🌿 bubble crossDino floated still hangs) before it resumes wandering — arrival as a beat.
      if (this.arriving.has(d.name)) {
        this.arriving.delete(d.name);
        this.activityById[d.name] = 'wandering';
        continue;
      }

      // Brought to the hatch (BACKLOG-381): the escort outranks the food rush — that's the whole visible
      // oddity, one dino walking *away* from the meal while everyone else converges on it — and it outranks
      // the moping branch below, so the fetched loner follows instead of withdrawing. It sits under the
      // sleeping/crossing/fleeing/stalking branches above: a hunt or a migration still beats a social errand.
      if (this.escort) {
        const partner = this.escort.phase === 'to-loner' ? this.dinoByName(this.escort.loner) : null;
        const target =
          d.name === this.escort.friend
            ? partner
              ? this.tileOf(partner)
              : this.escortTarget()
            : d.name === this.escort.loner && this.escort.phase === 'to-food'
              ? this.escortTarget()
              : null;
        if (target) {
          const step = stepToward(cur, target, COLS, ROWS);
          d.setPosition(step.tileX * TILE + TILE / 2, step.tileY * TILE + TILE / 2);
          this.activityById[d.name] = this.escort.phase === 'to-loner' && d.name === this.escort.friend ? 'responding' : 'feeding';
          continue;
        }
      }

      // Food on the ground pulls eager, nearby dinos toward it (BACKLOG-059) — overrides
      // wandering. A dino rushes its favorite harder: wider range, lower bar (BACKLOG-061).
      if (this.food && this.foodLanded) {
        const dist = Math.hypot(cur.tileX - this.food.tileX, cur.tileY - this.food.tileY);
        const isFav = !!this.foodKind && this.foodKind.id === favoriteFood(d.traits, this.currentSeason()).id;
        if (reactionToFood(d.traits.energy, dist, isFav) === 'rush') {
          const step = feedStep(cur, this.food, COLS, ROWS);
          d.setPosition(step.tileX * TILE + TILE / 2, step.tileY * TILE + TILE / 2);
          this.activityById[d.name] = 'feeding'; // BACKLOG-295
          continue;
        }
      }

      // Food web (BACKLOG-367): the hunt overrides ordinary life but yields to a sure meal (above). A
      // hungry carnivore stalks (🎯); its quarry flees (💨). Deathless — reaching the prey ends the hunt
      // empty, not fatal: the quarry escapes, the hunter rests on cooldown, and each keeps a memory.
      const preyName = stalkTargets[d.name];
      if (preyName) {
        const prey = this.dinoByName(preyName);
        if (prey) {
          const preyTile = this.tileOf(prey);
          if (huntCaught(cur, preyTile)) {
            // The catch resolves (BACKLOG-437). The quarry ALWAYS slips away (deathless — 💨 + memory in
            // both outcomes); only the hunter's luck differs. An occasional success feeds it (hunger sated,
            // the take modelled as a direct `satisfy`, not a spawned drop); most stalks still come up empty.
            this.huntCooldownUntil[d.name] = Date.now() + HUNT_COOLDOWN_MS;
            this.flashFeed(prey, '💨');
            this.memory = remember(this.memory, preyName, `you slipped ${d.name}'s hunt`);
            if (huntSucceeds(Math.random())) {
              this.needs = satisfy(this.needs, d.name, 'hunger'); // BACKLOG-437: hunger resolves through hunting
              this.flashFeed(d, '🍖');
              this.logEvent(`🦖 ${d.name} made its catch — a lean meal`);
              this.memory = remember(this.memory, d.name, `you brought down a meal`);
            } else {
              this.logEvent(`🦖 the hunt came up empty — ${preyName} slipped away from ${d.name}`);
              this.memory = remember(this.memory, d.name, `your hunt for ${preyName} came up empty`);
            }
          } else {
            const step = stepToward(cur, preyTile, COLS, ROWS);
            d.setPosition(step.tileX * TILE + TILE / 2, step.tileY * TILE + TILE / 2);
          }
          this.activityById[d.name] = 'stalking';
          continue;
        }
      }
      const hunterName = fleeFrom[d.name];
      if (hunterName) {
        const hunter = this.dinoByName(hunterName);
        if (hunter) {
          const step = fleeStep(cur, this.tileOf(hunter), COLS, ROWS);
          d.setPosition(step.tileX * TILE + TILE / 2, step.tileY * TILE + TILE / 2);
          this.activityById[d.name] = 'fleeing';
          continue;
        }
      }

      const other = this.nearestOther(d);
      // Brain-biased intent (BACKLOG-393): today's lean scales the rolls below — never the order.
      const intent = this.ensureIntent(d);
      // BACKLOG-314: a dino fetches the resource in its own home zone (each zone has its own slot now).
      const dz = zoneOf(this.dinoZones, d.name, BOWL_ID);
      const dres = this.resourceByZone[dz];
      const resDist = dres ? Math.hypot(cur.tileX - dres.tileX, cur.tileY - dres.tileY) : Infinity;
      // Decide the branch once (mutually exclusive), then both move and label off the same flags so the
      // glyph the player sees can never disagree with what the dino actually did this step (BACKLOG-295).
      // Winter opens the huddle window at dusk and lowers the bar; summer waits until late.
      const huddling = denTime && this.maxBond(d.name) >= huddleThreshold(season);
      const gathering =
        !huddling &&
        !!dres &&
        resourceFetchable(this.resourceAgeByZone[dz] ?? 0) && // BACKLOG-297: ignore it until the grace elapses
        noticeResource(forageCuriosity(d.traits.curiosity, intent), resDist) === 'fetch'; // BACKLOG-393: a forage day looks wider
      // The loner (BACKLOG-135): a dino with no real friend withdraws to the edge instead of drifting to
      // the cluster. Below huddle/gather (it'll still come in from the cold / chase a snack), above
      // socializing (loneliness IS the not-socializing). Probabilistic so a loner still mills enough to
      // meet someone and grow out of it (no all-unbonded deadlock). Activity stays 'wandering' — the 🥀
      // mark rides loner status, not this roll, so the tell shows the whole time.
      const moping =
        !huddling && !gathering && isLoner(this.bonds, d.name, this.dinoNames(), LONER_FLOOR) && Math.random() < MOPE_CHANCE;
      const socializing = !huddling && !gathering && !moping && !!other && Math.random() < socializeChanceFor(intent); // BACKLOG-393
      // Need pulls the body (BACKLOG-436): a pressing 🍖/💧 leans the wander toward relief (hatch/pond),
      // but only below every ritual above (they still win) and gated so it's a lean, not a compulsion.
      // No reachable target (thirst outside the grove) → seekTarget null → the dino just wanders.
      const need = pressingNeed(this.needs[d.name]);
      const seekTarget =
        !huddling && !gathering && !moping && !socializing && need ? this.needTargetFor(d, need) : null;
      const seeking = !!seekTarget && needSeeks(Math.random());
      // Solitary tic (BACKLOG-405): a dino truly alone — nothing pressing, nobody in its zone within range,
      // and nothing to do (not huddling/gathering) — accrues a solitary streak and, past TIC_AFTER_STEPS,
      // falls into a small ritual of its own. Only *company or a need* breaks the streak (`resetTic`); moping
      // and pointless socializing toward a far cross-zone dino don't — a lonely dino at the edge is still
      // alone, and its tic forms on the next calm step. Ranks above socializing (a real ritual beats drifting
      // toward someone a whole zone away) but below moping, so the loner's withdrawal still reads first.
      // (foodRush is already handled by an earlier `continue`, so it's false here.)
      const aloneNow =
        !huddling && !gathering && undisturbed(!!pressingNeed(this.needs[d.name]), false, this.companyNear(d));
      if (aloneNow) this.soloSteps[d.name] = (this.soloSteps[d.name] ?? 0) + 1;
      else this.resetTic(d.name);
      // BACKLOG-410: a dino freshly moved *alone* into a friendless zone (not settled + no in-zone bonded
      // friend) falls into its tic sooner — take the min with the 393 solitary-day threshold so the two
      // shorteners compose. The onset only shortens; the ritual + its memory (plain 405 / grief 414) are unchanged.
      const strange = aloneInStrangeZone(
        isSettled(tenureOf(this.tenure, d.name)),
        closestFriend(d.name, this.bonds, this.zoneMates(d), GRIEF_BOND_FLOOR) !== null,
      );
      let ticAfter = ticAfterFor(intent, TIC_AFTER_STEPS); // BACKLOG-393: a solitary day settles into the ritual sooner
      if (strange) ticAfter = Math.min(ticAfter, TIC_AFTER_STEPS_HOMESICK);
      const ticcing = aloneNow && !moping && inventsTic(this.soloSteps[d.name] ?? 0, ticAfter);
      let next;
      if (huddling) {
        next = stepToward(cur, HUDDLE_TILE, COLS, ROWS); // sleep beats gathering
      } else if (gathering) {
        next = stepToward(cur, dres!, COLS, ROWS); // a curious dino fetches it (BACKLOG-146)
      } else if (moping) {
        next = stepToward(cur, edgeTarget(cur, COLS, ROWS), COLS, ROWS); // withdraw to the nearest wall
      } else if (ticcing) {
        // BACKLOG-414: on the first ticcing step, if this dino's closest friend has crossed to another zone,
        // aim the ritual at the edge they left by (walked toward, below); else settle where the ritual began (405).
        if (this.ticAnchor[d.name] === undefined) {
          const grief = this.griefFor(d);
          this.ticGrief[d.name] = grief?.friend ?? null;
          this.ticAnchor[d.name] = grief ? griefAnchor(grief.edge, cur.tileY, COLS) : cur;
        }
        const anchor = this.ticAnchor[d.name];
        const tic = signatureTic(d.traits);
        this.ticPhase[d.name] = (this.ticPhase[d.name] ?? 0) + 1;
        const atAnchor = cur.tileX === anchor.tileX && cur.tileY === anchor.tileY;
        // Walk to the grief edge first (the ache with a direction), then perform the ritual there. For a
        // plain 405 tic the anchor IS the current tile, so atAnchor is true immediately — byte-identical.
        next = atAnchor ? ticStep(tic.kind, anchor, this.ticPhase[d.name], COLS, ROWS) : stepToward(cur, anchor, COLS, ROWS);
        this.performTic(d, tic);
      } else if (socializing) {
        next = stepToward(cur, this.tileOf(other!), COLS, ROWS); // drift to cluster + converse
      } else if (seeking) {
        next = stepToward(cur, seekTarget!, COLS, ROWS); // BACKLOG-436: lean toward the hatch (hunger) / pond (thirst)
      } else {
        // BACKLOG-393: a restless day re-rolls a "stay" pick once — moves more, never forbidden to rest.
        const dir = rerollStay(intent, Math.floor(Math.random() * 5), () => Math.floor(Math.random() * 5));
        next = wanderStep(cur, dir, COLS, ROWS);
      }
      d.setPosition(next.tileX * TILE + TILE / 2, next.tileY * TILE + TILE / 2);
      this.activityById[d.name] = dinoActivity({
        gazing: false,
        inspecting: false,
        responding: false,
        feeding: false,
        huddling,
        gathering,
        socializing,
      });
    }

    for (let i = 0; i < this.dinos.length; i++) {
      for (let j = i + 1; j < this.dinos.length; j++) {
        const a = this.dinos[i];
        const b = this.dinos[j];
        if (Math.abs(a.x - b.x) <= TILE * 1.01 && Math.abs(a.y - b.y) <= TILE * 1.01) {
          this.meetings = recordMeet(this.meetings, a.name, b.name);
          const beforeMeet = this.bonds;
          this.bonds = strengthen(this.bonds, a.name, b.name, BOND_PER_MEET); // meeting (and huddling) deepens the bond
          // The loner finds a friend (BACKLOG-369): if this meeting lifted either dino out of loner status
          // (its first bond over the floor), mark the moment once.
          this.checkLonerLift(a.name, beforeMeet);
          this.checkLonerLift(b.name, beforeMeet);
          this.flashMeet(a, b);
          // Governor (BACKLOG-107): ambient chatter yields when nobody watches or power is low.
          if (
            this.convoCooldown <= 0 &&
            !this.convoInFlight &&
            allowAmbient({ hidden: this.tabHidden, battery: this.batteryLevel })
          )
            void this.converse(a, b);
        }
      }
    }

    this.stepInspection();
    this.stepResponder();
    this.stepEscort(); // BACKLOG-381: the fetch's two legs resolve beside the distress walk

    // Cold-night shiver (BACKLOG-179): note the season the night belongs to; when the night's
    // huddle window closes in the morning, resolve who slept cold. `denTime` is the live window.
    if (denTime) {
      // Dusk thaws any funk the keeper never mended (BACKLOG-184). Fires once, on the window's
      // opening edge. Nobody came (BACKLOG-208): each still-funked dino files the colder note
      // *before* the funk clears — neglect as legible as care; it compounds with the morning's
      // cold memory and tinges the next greeting. Silent in-world: a memory, not a beat.
      if (!this.wasInHuddleWindow && this.coldPending.size) {
        for (const name of this.coldPending) this.memory = remember(this.memory, name, neglectMemory());
        this.coldPending.clear();
        this.refreshColdMarks();
        void this.saveGame();
      }
      this.nightSeason = season;
    } else if (this.wasInHuddleWindow) this.resolveColdMorning();
    this.wasInHuddleWindow = denTime;

    this.refreshSleepMarks();
    this.refreshActivityMarks();
    this.maybeMurmur();
    this.checkFeeding();
    this.checkPlot();
    this.checkPondSight(); // BACKLOG-359: a grove dino reaching the pond for the first time
    this.checkNeeds(); // BACKLOG-371: hunger/thirst build; a dino at the pond drinks
    this.maybeSpawnResource();
    this.checkGather();
    this.maybeBarter(); // BACKLOG-358: two dinos meeting at a shared zone edge trade what each other's zone needs
    this.maybeLayEggs();
    this.checkHatch();
  }

  /**
   * Edge-meet barter (BACKLOG-358) — the ambient scan. Two dinos who *linger* at their zones' shared edge
   * (each parked on the literal edge column for `EDGE_DWELL` steps, facing the other's zone) trade — the
   * converse of one-way carry (329), both piles flowing toward each other's shortfall. The dwell + exact-edge
   * gate is deliberate: an arriving crosser sits at the entry tile for a frame, and must NOT be mistaken for a
   * meet (else it would immediately barter back the resource it just carried). Near-inert unless two dinos
   * actually settle at a boundary with tradeable stock. Dwell is tracked every step; the cooldown only paces firing.
   */
  private maybeBarter(): void {
    const facing: Record<string, string | null> = {};
    for (const d of this.dinos) {
      const to = this.migrating.has(d.name)
        ? null
        : nearLinkEdge(zoneOf(this.dinoZones, d.name, BOWL_ID), this.tileOf(d), COLS, 0); // band 0: the edge column itself
      facing[d.name] = to;
      this.edgeDwell[d.name] = to === null ? 0 : (this.edgeDwell[d.name] ?? 0) + 1;
    }
    if (!cooldownReady(Date.now(), this.lastBarterMs, BARTER_COOLDOWN_MS)) return;
    const parked = this.dinos.filter((d) => facing[d.name] && (this.edgeDwell[d.name] ?? 0) >= EDGE_DWELL);
    for (const a of parked) {
      const za = zoneOf(this.dinoZones, a.name, BOWL_ID);
      const b = parked.find(
        (y) => y !== a && zoneOf(this.dinoZones, y.name, BOWL_ID) === facing[a.name] && facing[y.name] === za,
      );
      if (!b) continue;
      if (this.doBarter(a, za, b, zoneOf(this.dinoZones, b.name, BOWL_ID))) {
        this.lastBarterMs = Date.now();
        return; // one barter per scan
      }
    }
  }

  /**
   * Apply an edge-meet barter (BACKLOG-358): each zone hands the other the kind it's short of for its own
   * structure (`barterSwap` = `directedCarry` both ways). Conserved + cap-safe via the same lossless
   * `takeResource`→`bankResource` path carry uses; no bond change (the economic beat only — the social
   * ripple is the Lore-smith's). Returns whether anything actually traded (so the scan doesn't burn its
   * cooldown on an empty meet).
   */
  private doBarter(a: Dino, zoneA: string, b: Dino, zoneB: string): boolean {
    const swap = barterSwap(this.pileFor(zoneA), this.pileFor(zoneB), structureRecipe(zoneA), structureRecipe(zoneB));
    if (!swap.aGives && !swap.bGives) return false; // nothing tradeable — no phantom beat
    if (swap.aGives) {
      this.stockpileByZone[zoneA] = takeResource(this.pileFor(zoneA), swap.aGives);
      this.stockpileByZone[zoneB] = bankResource(this.pileFor(zoneB), swap.aGives);
    }
    if (swap.bGives) {
      this.stockpileByZone[zoneB] = takeResource(this.pileFor(zoneB), swap.bGives);
      this.stockpileByZone[zoneA] = bankResource(this.pileFor(zoneA), swap.bGives);
    }
    for (const d of [a, b]) if (this.inView(d)) this.flashFeed(d, '🔄');
    this.memory = remember(this.memory, a.name, `bartered with ${b.name} at the ${zoneById(zoneB).name} edge`);
    this.memory = remember(this.memory, b.name, `bartered with ${a.name} at the ${zoneById(zoneA).name} edge`);
    this.logEvent(`🔄 ${a.name} and ${b.name} bartered at the ${zoneById(zoneA).name}–${zoneById(zoneB).name} edge`);
    this.refreshPlaque();
    void this.saveGame();
    return true;
  }

  /**
   * Sleep murmurs (BACKLOG-181): on a sparse roll, a huddling, in-view dino floats a 💭 line drawn from its
   * strongest memory of the day, so the den has an audible-on-screen inner life. Deterministic (no model);
   * out-of-view huddlers (the other zone) stay silent. The LLM-coloured murmur is a 181 follow-up.
   */
  private maybeMurmur(): void {
    if (Math.random() >= MURMUR_CHANCE) return;
    const d = this.pickMurmurer();
    if (d) this.showBubble(d, murmurLine(pickMurmurMemory(recall(this.memory, d.name))));
  }

  /** A random huddling, in-view dino (BACKLOG-181), or null when the den is empty / out of view. */
  private pickMurmurer(): Dino | undefined {
    const sleepers = this.dinos.filter((d) => this.isHuddling(d) && this.inView(d));
    return sleepers[Math.floor(Math.random() * sleepers.length)];
  }

  /** Show each awake dino's current-activity glyph (BACKLOG-295). The 💤 sleep mark owns the sleeping state. */
  private refreshActivityMarks(): void {
    this.dinos.forEach((d, i) => {
      const mark = this.activityMarks[i];
      if (!mark) return;
      const show = !this.isHuddling(d) && this.inView(d);
      mark.setVisible(show).setPosition(d.x, d.y - TILE);
      if (show) {
        const act = this.activityById[d.name] ?? 'wandering';
        // Idle fidgets (BACKLOG-298): a goalless wanderer shows its trait-derived signature quirk
        // instead of the generic 🚶, so five idle dinos read as five individuals. Other 295 states
        // keep their glyph; activityById is untouched (the 295 __activity hook still reads 'wandering').
        // BACKLOG-310: a jealous sulk (pendingRepair) shades that idle glyph to 😒 — mood over motion.
        // Cold keeps its signature glyph (the floating 🥶 mark already signals the cold funk).
        const mood: Mood | undefined = this.pendingRepair === d.name ? 'sulk' : undefined;
        // BACKLOG-325: a just-recovered dino (no current mood) idles with the brightened flourish glyph
        // for a short window before settling back to its plain signature quirk.
        const lifted = !mood && Date.now() < (this.liftedUntil[d.name] ?? 0);
        const wanderGlyph = lifted ? reliefFlourish(d.traits) : moodFidget(d.traits, mood).glyph;
        mark.setText(act === 'wandering' ? wanderGlyph : ACTIVITY_GLYPH[act]);
      }
    });
  }

  /**
   * The morning a night window closes: every dino too loosely bonded for the den — its strongest
   * bond below the season's huddle bar, the same gate cycle-171 used to *seek* the den — slept
   * cold (winter only; `sleptCold` is inert in the warm seasons). It shivers where it stands and
   * files a memory that rides the existing store into its next greeting. Once per night, on the edge.
   */
  private resolveColdMorning(): void {
    const bar = huddleThreshold(this.nightSeason);
    const cold: string[] = [];
    const lonely: Array<{ name: string; level: number }> = [];
    for (const d of this.dinos) {
      const best = this.maxBond(d.name);
      const huddled = best >= bar;
      if (!sleptCold(huddled, this.nightSeason)) continue;
      this.showBubble(d, coldShiver());
      this.memory = remember(this.memory, d.name, coldMemory());
      cold.push(d.name);
      lonely.push({ name: d.name, level: best });
    }
    this.lastColdSleepers = cold;
    // Every cold sleeper carries the funk until the keeper mends it or dusk thaws it (BACKLOG-184).
    this.coldPending = new Set(cold);
    this.refreshColdMarks();
    // The loneliest shiver finds a voice (BACKLOG-194): one cold cry per morning.
    const crier = mostDistressed(lonely);
    if (crier) {
      const d = this.dinoByName(crier);
      if (d) this.cryDistress(d, 'cold');
    }
    if (cold.length) void this.saveGame();
  }

  private playerTile(): { tileX: number; tileY: number } {
    return { tileX: Math.floor(this.player.x / TILE), tileY: Math.floor(this.player.y / TILE) };
  }

  /**
   * Resolve the armed first contact once per world step: arrival lands the 👀 beat + memory,
   * the ttl running out means the player outran a dino's curiosity. Runs after the movement
   * loop so the arrival check sees the inspector's new position.
   */
  private stepInspection(): void {
    if (!this.pendingInspect) return;
    const d = this.dinoByName(this.pendingInspect.name);
    if (!d) {
      this.pendingInspect = null;
      return;
    }
    if (Math.abs(d.x - this.player.x) <= TILE * 1.01 && Math.abs(d.y - this.player.y) <= TILE * 1.01) {
      const keeper = keeperById(this.keeperId);
      this.showBubble(d, inspectLine(d.name));
      this.memory = remember(this.memory, d.name, inspectMemory(keeper.name));
      this.lastInspection = { name: d.name, keeperId: keeper.id };
      this.pendingInspect = null;
      return;
    }
    this.pendingInspect = { ...this.pendingInspect, ttl: this.pendingInspect.ttl - 1 };
    if (this.pendingInspect.ttl <= 0) this.pendingInspect = null;
  }

  /**
   * Resolve the distress response once per world step (BACKLOG-194): adjacency to the
   * caller ends the walk; otherwise the step budget drains and the responder gives up.
   * Sits beside stepInspection, so a sky event freezes it the same way.
   */
  private stepResponder(): void {
    if (!this.pendingRespond) return;
    const friend = this.dinoByName(this.pendingRespond.name);
    const caller = this.dinoByName(this.pendingRespond.caller);
    if (!friend || !caller) {
      this.pendingRespond = null;
      return;
    }
    if (Math.abs(friend.x - caller.x) <= TILE * 1.01 && Math.abs(friend.y - caller.y) <= TILE * 1.01) {
      this.pendingRespond = null;
      return;
    }
    this.pendingRespond = { ...this.pendingRespond, steps: this.pendingRespond.steps - 1 };
    if (this.pendingRespond.steps <= 0) this.pendingRespond = null;
  }

  /** One dino remarks on meeting another — a floating speech bubble via the shared brain. */
  private async converse(a: Dino, b: Dino): Promise<void> {
    if (this.convoInFlight) return;
    this.convoInFlight = true;
    // Protect the single shared engine; phones chatter at a third the rate (governor).
    this.convoCooldown = convoCooldownSteps(this.coarsePointer);
    try {
      const now = getWorldClock().now();
      // Snapshot before this meeting plants anything: the sympathy visit (BACKLOG-217) keys off
      // word carried in from a PRIOR meeting, so this meeting's fresh cold word can't self-trigger.
      const snapshot = this.memory;
      const reply = await this.npcBrain.respond(
        {
          name: a.name,
          species: a.species,
          personality: this.ensurePersona(a).text, // BACKLOG-103: the stored self, not the roster one-liner
          traits: a.traits,
          timeOfDay: dayPhase(now.hour),
        },
        { kind: 'npc_meet', detail: `${b.name} the ${b.species} wanders up` },
      );
      this.lastConversation = { speaker: a.name, text: reply.text, source: reply.source };
      this.memory = remember(this.memory, a.name, `you ran into ${b.name} the ${b.species}`);
      // Gossip: the speaker passes news to the listener (BACKLOG-019). A dino that just dropped a
      // false alarm leads with the all-clear (BACKLOG-235), else a dino the keeper warmed leads with
      // the word of the warmth (BACKLOG-223), else a cold-slept dino leads with the word of the cold
      // (BACKLOG-185), else the generic most-recent retelling. Relief is checked first so the bowl
      // un-tells a stale worry the way it once told it; warm before cold because a warm memory also
      // matches the cold token. Each `?:` only fires when an earlier rung didn't, so the log else-if
      // order tracks the cascade order.
      const relief = spreadReliefWord(this.memory, a.name, b.name);
      const warm = relief.rumor ? relief : spreadWarmWord(this.memory, a.name, b.name);
      const cold = warm.rumor ? warm : spreadColdWord(this.memory, a.name, b.name);
      // Tell of the grove (BACKLOG-342): a just-returned dino leads with grove news — below cold (a
      // worry outranks scenery), above the generic retelling (news of a place beats an ordinary rumor).
      const grove = cold.rumor ? cold : spreadGroveWord(this.memory, a.name, b.name);
      const gossip = grove.rumor ? grove : spreadGossip(this.memory, a.name, b.name);
      this.memory = gossip.store;
      if (relief.rumor) this.logEvent(`😌 ${b.name} heard the all-clear from ${a.name}`);
      else if (warm.rumor) this.logEvent(`😊 ${b.name} heard the keeper warmed ${a.name}`);
      else if (cold.rumor) this.logEvent(`🥶 ${b.name} heard about ${a.name}'s cold night`);
      else if (grove.rumor) this.logEvent(`🌿 ${b.name} heard about the grove from ${a.name}`);
      else if (gossip.rumor) this.logEvent(`🗣️ ${b.name} heard news about ${a.name}`);
      this.chirpFor(a); // the speaker calls in its own voice (BACKLOG-191)
      this.showBubble(a, `${replyPrefix(reply.source)}${reply.text}`);
      // The bowl self-corrects (BACKLOG-234): if a carrier meets the dino it heard slept cold and
      // finds it recovered, it drops the now-false worry with relief — and the stale pity visit is
      // suppressed. Higher precedence than the sympathy visit, same pre-meeting snapshot.
      const correction = selfCorrect(snapshot, a.name, b.name);
      if (correction) {
        this.memory = forget(this.memory, correction.corrector, correction.dropped);
        this.memory = remember(this.memory, correction.corrector, correction.memory);
        const cDino = this.dinos.find((d) => d.name === correction.corrector);
        if (cDino) this.showBubble(cDino, reliefLine(correction.corrector, correction.sufferer));
        this.logEvent(`😌 ${correction.corrector} sees ${correction.sufferer} came through it fine`);
      } else if (clearedName(snapshot, a.name, b.name)) {
        // Grateful to the one who cleared your name (BACKLOG-243): a recovered sufferer meets the
        // dino carrying its first-hand all-clear and warms to it — the giving side of relief, the
        // symmetric twin of the sympathy visit below. Outranks the visit; reads the pre-meeting
        // snapshot so a relief filed THIS meeting can't grant gratitude until a later one.
        const thanks = clearedName(snapshot, a.name, b.name)!;
        this.memory = remember(this.memory, thanks.sufferer, thanks.memory);
        this.bonds = strengthen(this.bonds, thanks.sufferer, thanks.clearer, GRATEFUL_BOND);
        const sDino = this.dinos.find((d) => d.name === thanks.sufferer);
        if (sDino) this.showBubble(sDino, gratefulLine(thanks.sufferer, thanks.clearer));
        this.logEvent(`💛 ${thanks.sufferer} thanks ${thanks.clearer} for clearing their name`);
      } else {
        // Secondhand sympathy (BACKLOG-217): if either dino already carried the other's cold word,
        // the carrier crosses over to keep it company — a sub-floor bond bump + a memory it keeps.
        const visit = sympathyVisit(snapshot, a.name, b.name);
        if (visit) {
          this.memory = remember(this.memory, visit.sufferer, visit.memory);
          this.bonds = strengthen(this.bonds, visit.visitor, visit.sufferer, SYMPATHY_BOND);
          const vDino = this.dinos.find((d) => d.name === visit.visitor);
          const sDino = this.dinos.find((d) => d.name === visit.sufferer);
          if (vDino && sDino) {
            const step = stepToward(this.tileOf(vDino), this.tileOf(sDino), COLS, ROWS);
            vDino.setPosition(step.tileX * TILE + TILE / 2, step.tileY * TILE + TILE / 2);
            this.showBubble(vDino, sympathyLine(visit.visitor, visit.sufferer));
          }
          this.logEvent(`🫂 ${visit.visitor} came to find ${visit.sufferer} after hearing`);
        }
      }
      // Pond-swappers (BACKLOG-346): if both dinos have been to the grove, they trade pond notes — a
      // small shared-place bond + a memory each. Independent of the cold/grove cascade above, so it can
      // fire alongside any of it; the grove's version of stargazing companions (288).
      this.pondSwapBeat(a.name, b.name);
    } finally {
      this.convoInFlight = false;
    }
  }

  /** Pond-swap (BACKLOG-346): two grove-visited dinos trade pond notes — a memory each + a small bond. */
  private pondSwapBeat(a: string, b: string): boolean {
    if (!pondSwap(this.groveVisited, a, b)) return false;
    this.memory = remember(this.memory, a, pondSwapMemory(b));
    this.memory = remember(this.memory, b, pondSwapMemory(a));
    this.bonds = strengthen(this.bonds, a, b, POND_BOND);
    this.logEvent(`🌿 ${a} and ${b} compared notes on the grove`);
    return true;
  }

  /** Fold the homecoming's memories into the store: the homecomer's, plus a near-tied runner-up's sulk (BACKLOG-120). */
  private applyHomecomingMemory(hc: Homecoming): void {
    this.memory = remember(this.memory, hc.name, hc.memory);
    if (hc.jealous) this.memory = remember(this.memory, hc.jealous.name, hc.jealous.memory);
  }

  /** Float the welcome-back line over the closest dino; if a near-tied rival is jealous, float its sulk too (BACKLOG-112/120). */
  /** A dino's signature idle quirk label (BACKLOG-306) — the same `fidget()` read the book/live glyph use. */
  private dinoQuirkLabel(name: string): string | undefined {
    const d = this.dinos.find((x) => x.name === name);
    return d ? fidget(d.traits).label : undefined;
  }

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
    if (!this.inView(d)) return; // a dino in another zone speaks off-screen, not into this one
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

    // The full key reference lives in a toggled panel: the old one-line hint was
    // wider than the canvas itself and ran under the gift HUD and the plaque.
    this.helpPanel = this.add
      .text((TILE * COLS) / 2, (TILE * ROWS) / 2, helpLines().join('\n'), {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
        align: 'left',
        backgroundColor: '#000000e6',
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(14)
      .setVisible(false);

    this.helpChip = this.add
      .text(TILE * COLS - 6, TILE * ROWS - 6, HELP_CHIP, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#ffffff',
        backgroundColor: '#000000aa',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(1, 1)
      .setDepth(11);

    // ? and / share a physical key on most layouts; 191 is that key's code.
    this.input.keyboard!.addKey(191).on('down', () => this.toggleHelp());

    // Fade these with the rest of the HUD in ambient mode.
    this.hudElements.push(buildText, this.helpChip);

    // any: dev-only Playwright hook — is the help panel up?
    (window as any).__helpOpen = () => this.helpPanel.visible;
  }

  private toggleHelp(): void {
    this.helpPanel.setVisible(!this.helpPanel.visible);
  }

  /** True when a screen point lands on the [?] chip or the open help panel. */
  private helpUiOwns(px: number, py: number): boolean {
    if (this.helpChip?.visible && this.helpChip.getBounds().contains(px, py)) return true;
    if (this.helpPanel?.visible && this.helpPanel.getBounds().contains(px, py)) return true;
    return false;
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
    const refresh = () => {
      if (this.brainKindNow === 'stub') {
        this.brainHud.setText('🧠 off'); // minds not enabled on this device (governor)
        return;
      }
      const s = this.npcBrain.status?.() ?? '';
      // A GB-class download must not read as a frozen "thinking…" — show the fetch %.
      const text =
        s === 'loading' && loadProgress() > 0
          ? `🧠 downloading ${Math.round(loadProgress() * 100)}%`
          : (label[s] ?? '🧠 —');
      this.brainHud.setText(text);
    };
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
          gratitude: whoClearedMyName(this.memory, d.name) ?? undefined,
          keeperName: keeperAddress(keeperById(this.keeperId), heartsFromPoints(this.friendship[d.name] ?? 0)),
        },
        { kind: 'player_greet' },
      );
      return msgs[0].content;
    };
  }

  // ────────────── Minds policy + inference governor (BACKLOG-107) ──────────────

  private readMindsConsent(): boolean | null {
    try {
      const v = localStorage.getItem(MINDS_CONSENT_KEY);
      return v === 'on' ? true : v === 'off' ? false : null;
    } catch {
      return null; // storage denied — treat as never-asked
    }
  }

  /** Visibility + battery listeners feeding the ambient gate, plus the dev hooks. */
  private setupGovernor(): void {
    document.addEventListener('visibilitychange', () => {
      this.tabHidden = document.hidden;
    });
    const nav = navigator as unknown as {
      getBattery?: () => Promise<{ level: number; addEventListener(ev: string, fn: () => void): void }>;
    };
    void nav.getBattery?.().then((b) => {
      this.batteryLevel = b.level;
      b.addEventListener('levelchange', () => (this.batteryLevel = b.level));
    });

    // The bowl's voicebox (BACKLOG-191): a dino calls in its own trait-derived voice.
    // Intent is recorded here (not in voice.ts) so headless tests never depend on playback.
    // any: dev-only Playwright hooks for the audio spine
    (window as any).__lastSound = () => this.lastSound;
    (window as any).__soundMuted = () => soundMuted();
    (window as any).__audioState = () => audioState();

    // any: dev-only Playwright hooks — which brain runs, and the live ambient verdict
    (window as any).__brainKind = () => this.brainKindNow;
    (window as any).__mindsConfirmOpen = () => this.mindsConfirm !== null;
    (window as any).__mindsConfirmMode = () => this.mindsConfirm;
    (window as any).__mindsCache = () => this.lastCacheAction;
    (window as any).__governor = () => ({
      coarse: this.coarsePointer,
      consent: this.readMindsConsent(),
      hidden: this.tabHidden,
      battery: this.batteryLevel,
      ambientAllowed: allowAmbient({ hidden: this.tabHidden, battery: this.batteryLevel }),
      cooldownSteps: convoCooldownSteps(this.coarsePointer),
    });
  }

  /** A dino speaks in its own voice — chirp params derived from its traits (BACKLOG-191). */
  private chirpFor(d: Dino): void {
    if (soundMuted()) return;
    const params = chirpParams(d.traits);
    this.lastSound = { kind: 'chirp', name: d.name, params };
    playChirp(params);
  }

  /**
   * A dino cries out in distress (BACKLOG-194) and its closest friend — picked by the
   * exact cycle-33/34 consolation rules — turns toward the sound. The cry is diegetic:
   * the dinos hear it whether or not the keeper's device is muted, so the social beat
   * (responder, bubble, memory, walk) always fires; mute gates only playback intent.
   */
  private cryDistress(d: Dino, trigger: 'startle' | 'cold'): void {
    const params = distressParams(d.traits);
    this.lastDistress = { name: d.name, trigger, params };
    if (!soundMuted()) {
      this.lastSound = { kind: 'chirp', name: d.name, params };
      playChirp(params);
    }
    const who = comforter(d.name, this.bonds, this.dinos.map((x) => x.name), this.gratitude);
    if (!who) return; // no friend over the floor — the cry hangs unanswered
    const friend = this.dinoByName(who);
    if (!friend) return;
    this.pendingRespond = { name: who, caller: d.name, steps: DISTRESS_STEPS };
    this.showBubble(friend, hearLine(d.name));
    this.memory = remember(this.memory, who, heardMemory(d.name));
  }

  /** Swap the shared brain in place; every dino picks it up on its next line. */
  private setBrain(kind: BrainKind): void {
    if (kind === this.brainKindNow) return;
    this.brainKindNow = kind;
    this.npcBrain = makeBrain(kind);
    if (kind === 'webllm') {
      // Start the download now, while the keeper is looking at the progress HUD —
      // not on the first greet minutes later. init is WebLLM-specific, hence optional.
      void (this.npcBrain as { init?: () => Promise<void> }).init?.();
    }
  }

  /**
   * The 🧠 row in the More sheet. Off → consent dialog (notes when the weights are
   * already cached). On → if weights are cached, the off/keep/delete choice
   * (phone storage is small — operator, 2026-06-11); nothing cached → straight off.
   */
  private async onMindsButton(): Promise<void> {
    this.sheetOpen = false;
    if (this.brainKindNow === 'webllm') {
      const status = mindsStatusLine(this.npcBrain.status?.(), loadProgress());
      if (await hasCachedModel()) {
        this.mindsConfirm = 'disable';
        this.dialogOpen = true;
        this.dialog.show(`${status}\n${mindsOffLines('tiny')}`);
        return;
      }
      // Consent is on but nothing is cached — the load failed or never ran.
      // Show what happened rather than silently flipping off (operator: "is it really on?").
      this.turnMindsOff();
      this.dialog.show(`${status}\n${mindsLabel(false)} — the dinos speak from memory now.`);
      this.dialogOpen = true;
      return;
    }
    const saveData = (navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData;
    const cached = await hasCachedModel();
    this.mindsConfirm = 'enable';
    this.dialogOpen = true;
    // Phones are clamped to the smallest model, so the consent dialog quotes exactly it.
    this.dialog.show(consentLines(MODELS.tiny.label, 'tiny', saveData, cached));
  }

  private turnMindsOff(): void {
    try {
      localStorage.setItem(MINDS_CONSENT_KEY, 'off');
    } catch { /* storage denied — the swap still applies this session */ }
    this.setBrain('stub');
  }

  private confirmMinds(): void {
    this.mindsConfirm = null;
    try {
      localStorage.setItem(MINDS_CONSENT_KEY, 'on');
    } catch { /* storage denied — enable for this session anyway */ }
    this.setBrain('webllm');
    this.dialog.show(`${mindsLabel(true)} — downloading. The 🧠 up top shows progress; lines upgrade when it lands.`);
    this.dialogOpen = true;
  }

  /** The off/keep/delete choice: [1] keep the cache, [2] free the storage. */
  private confirmMindsOff(deleteCache: boolean): void {
    this.mindsConfirm = null;
    this.turnMindsOff();
    if (!deleteCache) {
      this.dialog.show(`${mindsLabel(false)} — download kept, re-enable is instant.`);
      this.dialogOpen = true;
      return;
    }
    this.dialog.show(`${mindsLabel(false)} — deleting the download…`);
    this.dialogOpen = true;
    void deleteCachedModel().then((ok) => {
      this.lastCacheAction = ok ? 'deleted' : 'error';
      // Update the line only if the keeper is still looking at this dialog.
      if (this.dialogOpen && !this.mindsConfirm) {
        this.dialog.show(
          ok
            ? `${mindsLabel(false)} — download deleted, storage freed. (Fully unloads from memory on next launch.)`
            : `${mindsLabel(false)} — minds are off, but the delete failed. Clearing site data also removes it.`,
        );
      }
    });
  }

  private closeMindsConfirm(): void {
    this.mindsConfirm = null;
    this.dialog.hide();
    this.dialogOpen = false;
  }

  // ─────────────────── Touch controls (BACKLOG-189) ───────────────────

  /** Build the control layer on coarse-pointer devices; `__setTouch` lets e2e force it. */
  private setupTouchControls(): void {
    // pointer:coarse = the PRIMARY input is a finger (phone/tablet). Deliberately not
    // maxTouchPoints — a touch-capable laptop with a mouse keeps the desktop view.
    const coarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
    if (coarse) this.enableTouch();

    // any: dev-only Playwright hooks — force the layer on/off, read the drag vector/layout
    (window as any).__setTouch = (on: boolean) => (on ? this.enableTouch() : this.disableTouch());
    (window as any).__touchEnabled = () => this.touchEnabled;
    (window as any).__touchOwns = (x: number, y: number) => this.touchUiOwns(x, y);
    (window as any).__touchVec = () => ({ ...this.touchVec });
    (window as any).__touchLayout = () => ({
      stick: { ...STICK },
      buttons: actionButtons(this.scale.width, this.scale.height),
      sheet: sheetRows(this.scale.width),
      chips: menuChips(this.scale.width, this.scale.height, true),
    });
  }

  private enableTouch(): void {
    if (this.touchEnabled) return;
    this.touchEnabled = true;
    this.input.addPointer(2); // stick + a button in the same moment

    const W = this.scale.width;
    const H = this.scale.height;
    const vis = (o: Phaser.GameObjects.GameObject) => o as unknown as { setVisible(v: boolean): void };

    // Stick: an oversized invisible grab ring so thumbs land easily, base + thumb visuals.
    const grab = this.add.circle(STICK.x, STICK.y, STICK.grab, 0xffffff, 0.001).setInteractive();
    const base = this.add.circle(STICK.x, STICK.y, STICK.r, 0x10241c, 0.4).setStrokeStyle(2, 0x8fd14f, 0.5);
    this.stickThumb = this.add.circle(STICK.x, STICK.y, STICK.thumb, 0x8fd14f, 0.55);
    this.stickGroup = [grab, base, this.stickThumb];

    grab.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.stickPointerId = p.id;
      this.dragStick(p.x, p.y);
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.touchEnabled && p.id === this.stickPointerId) this.dragStick(p.x, p.y);
    });
    const release = (p: Phaser.Input.Pointer) => {
      if (p.id !== this.stickPointerId) return;
      this.stickPointerId = -1;
      this.touchVec = { x: 0, y: 0 };
      this.stickThumb?.setPosition(STICK.x, STICK.y);
    };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);

    // Buttons/sheet/chips carry NO per-object handlers: a per-object pointerdown
    // and the scene-level pointerdown both fire for one tap, and a handler that
    // mutates dialog state mid-tap makes the second dispatch misread the target
    // (the ◀ chip's prev() was instantly undone by a body-tap next()). All taps
    // resolve once, from pre-tap state, in dispatchTouchTap().
    this.actionGroup = [];
    for (const b of actionButtons(W, H)) {
      const c = this.add.circle(b.x, b.y, b.r, 0x10241c, 0.5).setStrokeStyle(2, 0x8fd14f, 0.6);
      const t = this.add
        .text(b.x, b.y, b.label, { fontFamily: 'monospace', fontSize: '18px', color: '#e8e8d6' })
        .setOrigin(0.5);
      this.actionGroup.push(c, t);
    }

    this.sheetGroup = [];
    for (const r of sheetRows(W)) {
      const rect = this.add.rectangle(r.x, r.y, r.w, r.h, 0x10241c, 0.85).setStrokeStyle(1, 0x8fd14f, 0.5);
      const t = this.add
        .text(r.x - r.w / 2 + 8, r.y, r.label, { fontFamily: 'monospace', fontSize: '13px', color: '#e8e8d6' })
        .setOrigin(0, 0.5);
      this.sheetGroup.push(rect, t);
    }

    this.chipGroups = [];
    for (const chip of menuChips(W, H, true)) {
      const rect = this.add
        .rectangle(chip.x, chip.y, chip.w, chip.h, 0x10241c, 0.85)
        .setStrokeStyle(2, 0x8fd14f, 0.7);
      const t = this.add
        .text(chip.x, chip.y, chip.label, { fontFamily: 'monospace', fontSize: '16px', color: '#e8e8d6' })
        .setOrigin(0.5);
      this.chipGroups.push({ id: chip.id, objs: [rect, t] });
    }

    this.touchObjects = [
      ...this.stickGroup,
      ...this.actionGroup,
      ...this.sheetGroup,
      ...this.chipGroups.flatMap((c) => c.objs),
    ];
    for (const o of this.touchObjects) {
      (o as unknown as { setScrollFactor(n: number): void }).setScrollFactor(0);
      (o as unknown as { setDepth(n: number): void }).setDepth(20);
    }
    for (const o of this.sheetGroup) vis(o).setVisible(false);

    // Keyboard chrome makes no sense under a thumb: hide the [?] chip + panel,
    // and move the held-item line out of the stick's bottom-left corner.
    this.helpChip?.setVisible(false);
    this.helpPanel?.setVisible(false);
    this.layoutGiftHud();

    this.syncTouchUi();
  }

  private disableTouch(): void {
    if (!this.touchEnabled) return;
    this.touchEnabled = false;
    this.stickPointerId = -1;
    this.touchVec = { x: 0, y: 0 };
    this.sheetOpen = false;
    for (const o of this.touchObjects) o.destroy();
    this.touchObjects = [];
    this.stickGroup = [];
    this.actionGroup = [];
    this.sheetGroup = [];
    this.chipGroups = [];
    this.stickThumb = null;
    this.helpChip?.setVisible(true);
    this.layoutGiftHud();
  }

  private dragStick(px: number, py: number): void {
    this.touchVec = stickVector(px, py);
    this.stickThumb?.setPosition(
      STICK.x + this.touchVec.x * (STICK.r - 8),
      STICK.y + this.touchVec.y * (STICK.r - 8),
    );
  }

  private onTouchButton(id: string): void {
    switch (id) {
      case 'talk': this.handleInteract(); break;
      case 'feed': this.dropFood(); break;
      case 'more': this.sheetOpen = !this.sheetOpen; this.syncTouchUi(); break;
      case 'minds': void this.onMindsButton(); break;
      case 'sound': setSoundMuted(!soundMuted()); break;
      case 'gift': this.giveGift(); break;
      case 'item': this.cycleItem(1); break;
      case 'lens': this.cycleLens(); break;
      case 'hearts': this.toggleHearts(); break;
      case 'keeper': this.sheetOpen = false; this.openKeeperPicker(); break;
      case 'scan': this.toggleScan(); break;
      case 'time': this.toggleScale(); break;
      case 'export': this.sheetOpen = false; this.exportSave(); break;
      case 'pick1': this.onNumberKey(1); break;
      case 'pick2': this.onNumberKey(2); break;
      case 'pick3': this.onNumberKey(3); break;
      case 'back': this.dialog.prev(); break;
      case 'close': this.dismissDialog(); break; // ✕ always closes, even mid-pages
    }
  }

  /**
   * Swap the layer with dialog state: stick + buttons while playing, [1][2][3][✕]
   * chips while a dialog is up (numbers only when a 1/2/3 menu is actually open).
   */
  private syncTouchUi(): void {
    if (!this.touchEnabled) return;
    const vis = (o: Phaser.GameObjects.GameObject) => o as unknown as { setVisible(v: boolean): void };
    const dialogUp = this.dialogOpen;
    for (const o of [...this.stickGroup, ...this.actionGroup]) vis(o).setVisible(!dialogUp);
    for (const o of this.sheetGroup) vis(o).setVisible(!dialogUp && this.sheetOpen);
    const numbered = this.toneMenuOpen || this.keeperPickerOpen || this.mindsConfirm !== null;
    const paged = dialogUp && this.dialog.pageInfo().page > 0;
    for (const { id, objs } of this.chipGroups) {
      const show = dialogUp && (id === 'close' || (id === 'back' ? paged : numbered));
      for (const o of objs) vis(o).setVisible(show);
    }
    // A dialog opening mid-drag releases the stick — update() stops moving the player anyway.
    if (dialogUp && this.stickPointerId !== -1) {
      this.stickPointerId = -1;
      this.touchVec = { x: 0, y: 0 };
      this.stickThumb?.setPosition(STICK.x, STICK.y);
    }
  }

  /** The currently-visible chip at (px,py), if any. */
  private chipIdAt(px: number, py: number): string | null {
    if (!this.touchEnabled || !this.dialogOpen) return null;
    const numbered = this.toneMenuOpen || this.keeperPickerOpen || this.mindsConfirm !== null;
    const paged = this.dialog.pageInfo().page > 0;
    const hit = menuChips(this.scale.width, this.scale.height, true).find(
      (c) => (c.id === 'close' || (c.id === 'back' ? paged : numbered)) && inRect(c, px, py),
    );
    return hit?.id ?? null;
  }

  /** Resolve a UI-owned tap to its action — ONCE, from pre-tap state. */
  private dispatchTouchTap(px: number, py: number): void {
    if (this.dialogOpen) {
      const chip = this.chipIdAt(px, py);
      if (chip) this.onTouchButton(chip);
      else this.dialog.next(); // a tap on the dialog body is the GBA A-button
      return;
    }
    const button = actionButtons(this.scale.width, this.scale.height).find((b) =>
      inCircle(b.x, b.y, b.r, px, py),
    );
    if (button) {
      this.onTouchButton(button.id);
      return;
    }
    if (this.sheetOpen) {
      const row = sheetRows(this.scale.width).find((r) => inRect(r, px, py));
      if (row) this.onTouchButton(row.id);
    }
    // Anything else owned (the stick grab ring) is handled by the stick's own listener.
  }

  /** Does a pointer at canvas (px,py) land on the control layer? Guards the glass tap. */
  private touchUiOwns(px: number, py: number): boolean {
    if (!this.touchEnabled) return false;
    // A dialog is modal on touch: EVERY tap belongs to the UI while one is up.
    // Taps on the dialog text (e.g. "[1] Warm") were falling through to the glass,
    // startling nearby dinos on every menu pick (operator phone session).
    if (this.dialogOpen) return true;
    if (inCircle(STICK.x, STICK.y, STICK.grab, px, py)) return true;
    if (actionButtons(this.scale.width, this.scale.height).some((b) => inCircle(b.x, b.y, b.r, px, py))) return true;
    return this.sheetOpen && sheetRows(this.scale.width).some((r) => inRect(r, px, py));
  }

  update(): void {
    // Runs before the dialog early-return: the chips/stick swap tracks dialog state.
    this.syncTouchUi();
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

    const touching = this.touchVec.x !== 0 || this.touchVec.y !== 0;
    if (touching) {
      this.player.x += this.touchVec.x * speed;
      this.player.y += this.touchVec.y * speed;
    }

    // Held movement keys don't refire keydown events, so count them as activity here.
    if (left || right || up || down || touching) {
      this.lastInputAt = this.time.now;
      if (this.ambientActive) this.exitAmbient();
    }

    // BACKLOG-143: walking off a linked edge crosses to the adjacent zone instead of clamping there.
    if (this.tryCrossZone()) {
      this.applyIdle();
      return;
    }

    this.player.x = Phaser.Math.Clamp(this.player.x, TILE / 2, TILE * COLS - TILE / 2);
    this.player.y = Phaser.Math.Clamp(this.player.y, TILE / 2, TILE * ROWS - TILE / 2);

    this.applyIdle();
  }

  /**
   * If the keeper has stepped off a linked edge, cross into the neighbour zone (repositioned to the
   * far side) and return true; otherwise false so the caller clamps normally. (BACKLOG-143)
   */
  /**
   * A dino's daily plan (BACKLOG-012) — the day's shape, one lean per day-phase. Recomputed once
   * per in-game day from name+day+traits (deterministic floor, never persisted); cached so the hot
   * step loop pays nothing after the first read of the day.
   */
  private ensurePlan(d: Dino, day: number): DayPlan {
    const cached = this.plans[d.name];
    if (cached && cached.day === day) return cached.plan;
    const plan = proceduralPlan(d.name, day, d.traits);
    this.plans[d.name] = { day, plan };
    return plan;
  }

  /**
   * The active intent for a dino (BACKLOG-393 + BACKLOG-012) — the current day-phase's lean pulled
   * from today's plan (the deterministic floor: full sim with zero model). Cached until the phase or
   * day turns, then re-derived so behaviour shifts across the day. Where a brain can author (`intend`
   * present, ambient inference allowed by the governor), fire-and-forget an upgrade — exactly the
   * `converse` shape — coloring the active note via `fromDraft` only if the phase hasn't turned.
   * The model leans on the day; it never decides a step.
   */
  private ensureIntent(d: Dino): DinoIntent {
    const now = getWorldClock().now();
    const day = now.day;
    const phase = dayPhase(now.hour);
    const cached = this.intents[d.name];
    if (cached && cached.until >= day && this.intentPhase[d.name] === phase) return cached;
    const fresh = activeIntent(this.ensurePlan(d, day), phase, day);
    this.intents[d.name] = fresh;
    this.intentPhase[d.name] = phase;
    if (this.npcBrain.intend && allowAmbient({ hidden: this.tabHidden, battery: this.batteryLevel })) {
      void this.npcBrain
        .intend({ name: d.name, species: d.species, personality: this.ensurePersona(d).text, traits: d.traits })
        .then((draft) => {
          // Color the active note only if the same phase-intent is still current (day+phase unturned).
          if (this.intents[d.name]?.until === day && this.intentPhase[d.name] === phase)
            this.intents[d.name] = fromDraft(draft, fresh);
        })
        .catch(() => {});
    }
    return fresh;
  }

  /**
   * A dino's persona (BACKLOG-103) — the cached self if it has one (generate-once: an 'llm'
   * persona is settled forever), else the deterministic procedural persona cached immediately.
   * Where a ready brain can author (`author` present, ambient inference allowed), fire-and-forget
   * an upgrade — `upgradePersona` keeps it one-shot and never regresses an authored self. The
   * hourly save persists whatever the cache holds; a phone loading a save pays nothing.
   */
  private ensurePersona(d: Dino): Persona {
    const cached = this.personas[d.name];
    if (cached) return cached;
    const fresh = proceduralPersona(d.name, d.species, d.personality, d.traits);
    this.personas[d.name] = fresh;
    if (this.npcBrain.author && allowAmbient({ hidden: this.tabHidden, battery: this.batteryLevel })) {
      void this.npcBrain
        .author({ name: d.name, species: d.species, personality: d.personality, traits: d.traits })
        .then((draft) => {
          this.personas[d.name] = upgradePersona(this.personas[d.name] ?? fresh, draft);
        })
        .catch(() => {});
    }
    return fresh;
  }

  private tryCrossZone(): boolean {
    const edge = crossing(this.player.x, COLS, TILE);
    const link = edge ? linkedZone(this.zoneId, edge, this.player.y, COLS, TILE) : null;
    if (!link) return false;
    this.zoneId = link.zoneId;
    this.player.setPosition(link.entry.x, link.entry.y);
    this.refreshPlaque();
    this.applyZoneVisibility();
    this.applyObjectVisibility();
    this.drawFloor();
    return true;
  }

  /** True when a dino lives in the keeper's current zone (and so should be drawn). */
  private inView(d: Dino): boolean {
    return zoneOf(this.dinoZones, d.name, BOWL_ID) === this.zoneId;
  }

  /** Show only the current zone's dinos; their marks/tags AND-gate on inView each tick. */
  private applyZoneVisibility(): void {
    for (const d of this.dinos) {
      const v = this.inView(d);
      d.sprite.setVisible(v);
      d.label.setVisible(v);
    }
  }

  /**
   * BACKLOG-308: world objects (resource, cairns, plot) draw only in their home zone, so the grove's
   * own floor isn't overlaid with bowl-built props seen through the zone switch. Interaction is gated
   * at the source (checkGather on `resource.zone`, handlePlot on the active zone); this is the render half.
   */
  private applyObjectVisibility(): void {
    // BACKLOG-314: each zone's resource sprite shows only while the keeper stands in that zone.
    for (const z of Object.keys(this.resourceSpriteByZone)) this.resourceSpriteByZone[z].setVisible(z === this.zoneId);
    this.cairnSprites.forEach((s, i) => s.setVisible(this.cairns[i]?.zone === this.zoneId));
    this.shelterSprites.forEach((s, i) => s.setVisible(this.shelters[i]?.zone === this.zoneId)); // BACKLOG-315
    this.thatchSprites.forEach((s, i) => s.setVisible(this.thatches[i]?.zone === this.zoneId)); // BACKLOG-417
    // BACKLOG-308/349: each zone's plot draws only while the keeper stands in that zone.
    for (const z of Object.keys(this.plotSpriteByZone)) this.plotSpriteByZone[z]?.setVisible(z === this.zoneId);
  }

  /**
   * Dino migration (BACKLOG-274) — the grove fills by dinos wandering into it, not at spawn (spawn stays
   * byte-identical, so every bowl-targeting spec is intact). A sparse real-time roll, capped ≤1/in-game-day.
   */
  private setupMigration(): void {
    this.time.addEvent({ delay: MIGRATE_ROLL_INTERVAL_MS, loop: true, callback: () => { if (!this.ambientPaused) this.maybeMigrate(); } }); // BACKLOG-431
    // dev-only Playwright hook — migrate a named dino to a zone INSTANTLY (teleport); returns its new zone.
    // Kept instant (BACKLOG-274 semantics) so the cycle-068/069 migration specs + the save-restore path are
    // byte-identical; the *ambient* roll is what became a visible walk (BACKLOG-334).
    (window as any).__migrate = (name: string, zoneId: string) => {
      const d = this.dinoByName(name);
      if (d) this.relocate(d, zoneId);
      return zoneOf(this.dinoZones, name, BOWL_ID);
    };
    // BACKLOG-334: drive + observe the visible crossing from Playwright.
    (window as any).__startMigration = (name: string) => {
      const d = this.dinoByName(name);
      if (d) this.startMigration(d);
      return zoneOf(this.dinoZones, name, BOWL_ID);
    };
    // BACKLOG-378: start a visible crossing toward a *chosen* neighbour (deterministic), so a test can prove a
    // grove dino migrates east into the Fernreach (not only west to the bowl) — migration generalized past two.
    (window as any).__startMigrationTo = (name: string, dest: string) => {
      const d = this.dinoByName(name);
      if (d) this.startMigration(d, dest);
      return zoneOf(this.dinoZones, name, BOWL_ID);
    };
    // BACKLOG-345: run the migrant *pick* deterministically (bypassing cooldown/chance) — returns the
    // chosen name, so a test can prove grove news pulls a curious newcomer over a coin-flip.
    (window as any).__maybeMigrate = () => {
      const d = this.pickMigrant();
      if (d) this.startMigration(d);
      return d?.name ?? null;
    };
    (window as any).__migrating = () => [...this.migrating];
    // BACKLOG-340: run the homesick decision + crossing for a named dino deterministically; returns the
    // destination zone it set off toward (or null when it isn't homesick). Drives the exact production path.
    (window as any).__homesickMigrate = (name: string) => {
      const d = this.dinos.find((x) => x.name === name);
      return d && this.tryHomesick(d) ? this.migrationCross[name]?.dest ?? null : null;
    };
    // BACKLOG-333: the real-time cadences (regression guard — a return to clock-gating fails these).
    (window as any).__wanderStepMs = () => WANDER_STEP_MS;
    (window as any).__migrateCooldownMs = () => MIGRATE_COOLDOWN_MS;
    // BACKLOG-341: drive + observe home-zone settling from Playwright (tenure accrues one roll per tick).
    (window as any).__settleTick = () => this.bumpTenures();
    (window as any).__tenure = (name: string) => tenureOf(this.tenure, name);
    (window as any).__settled = (name: string) => isSettled(tenureOf(this.tenure, name));
  }

  /** Accrue home-zone tenure (BACKLOG-341) for every settled-in-place dino, on the migration cadence. */
  private bumpTenures(): void {
    for (const d of this.dinos) if (!this.migrating.has(d.name)) this.tenure = bumpTenure(this.tenure, d.name);
  }

  /** A dino's homesickness (BACKLOG-340): the neighbour zone + friend to head toward, or null. */
  private homesickOf(d: Dino): { dest: string; friend: string } | null {
    return homesickDest(
      d.name,
      zoneOf(this.dinoZones, d.name, BOWL_ID),
      this.bonds,
      this.dinoNames(),
      (n) => zoneOf(this.dinoZones, n, BOWL_ID),
      tenureOf(this.tenure, d.name),
    );
  }

  /**
   * BACKLOG-340: if a dino is homesick, start its crossing back toward its closest friend, file the one-time
   * memory, and float the beat. Returns true when it fired (so the caller skips the ambient path). Shared by
   * `maybeMigrate` and the `__homesickMigrate` dev hook so production and test drive the exact same path.
   */
  private tryHomesick(d: Dino): boolean {
    const h = this.homesickOf(d);
    if (!h) return false;
    this.startMigration(d, h.dest);
    this.memory = remember(this.memory, d.name, homesickMemory(h.friend));
    this.logEvent(`🧭 ${d.name} misses ${h.friend} — drifts back toward ${zoneById(h.dest).name}`);
    return true;
  }

  private maybeMigrate(): void {
    this.bumpTenures(); // BACKLOG-341: home-zone tenure accrues on the migrate cadence, migration or not
    // BACKLOG-333: pace by a real-time cooldown, not the in-game day (which is 24 real hours at 1×).
    if (!cooldownReady(Date.now(), this.lastMigrationMs, MIGRATE_COOLDOWN_MS)) return;
    if (Math.random() >= MIGRATE_CHANCE) return;
    const d = this.pickMigrant();
    if (!d) return;
    // BACKLOG-340: homesickness overrules scenery — a dino aching for a friend a zone away crosses toward it,
    // ignoring the 341 settle-resist. Checked before the resist gate so a *settled* lonely dino still leaves.
    if (this.tryHomesick(d)) {
      this.lastMigrationMs = Date.now();
      return;
    }
    // BACKLOG-341: a dino settled into its home zone resists the ambient wander (stays put this roll).
    if (isSettled(tenureOf(this.tenure, d.name)) && resistsMigration(true)) return;
    // BACKLOG-378: pick which neighbour to head for. A single-neighbour zone has one choice; the grove now
    // borders two (bowl + Fernreach), so the ambient roll spreads dinos across the whole chain over time.
    const home = zoneOf(this.dinoZones, d.name, BOWL_ID);
    const neighbors = zoneNeighbors(home).map((l) => l.to);
    const dest = neighbors[Math.floor(Math.random() * neighbors.length)] ?? otherZone(home);
    this.startMigration(d, dest);
    this.lastMigrationMs = Date.now();
  }

  /**
   * Pick the next migrant (BACKLOG-334 pick + BACKLOG-345 nudge + BACKLOG-355 grading): a dino not
   * already crossing, *preferring* the one the grove pulls hardest. A dino freshly told to its face
   * (pull 2) outranks one whose grove news has gone to ambient background (pull 1), which outranks a
   * coin-flip. With no grove-curious dino at all, it's the old uniform random (345 behavior preserved).
   */
  private pickMigrant(): Dino | null {
    const candidates = this.dinos.filter((d) => !this.migrating.has(d.name));
    // BACKLOG-340: a dino homesick for a friend a zone away is the first the wander picks up (company > scenery).
    const homesick = candidates.filter((d) => this.homesickOf(d));
    if (homesick.length) return homesick[Math.floor(Math.random() * homesick.length)];
    const pull = (d: Dino) =>
      grovePull(recall(this.memory, d.name), this.groveVisited, d.name, zoneOf(this.dinoZones, d.name, BOWL_ID));
    const told = candidates.filter((d) => pull(d) === 2);
    const curious = candidates.filter((d) => pull(d) >= 1);
    const pool = told.length ? told : curious.length ? curious : candidates;
    return pool[Math.floor(Math.random() * pool.length)] ?? null;
  }

  /**
   * Begin a visible crossing (BACKLOG-334/378): fix the destination + the edge to walk to, then mark the dino
   * migrating; the forceStep walk + `crossDino` do the rest. `dest` defaults to the home zone's primary
   * neighbour (`otherZone`), so the old single-neighbour callers (the `__startMigration` hook) are byte-identical.
   */
  private startMigration(d: Dino, dest?: string): void {
    const home = zoneOf(this.dinoZones, d.name, BOWL_ID);
    const to = dest ?? otherZone(home);
    const neighbors = zoneNeighbors(home);
    const link = neighbors.find((l) => l.to === to) ?? neighbors[0];
    this.migrationCross[d.name] = { dest: to, edge: link?.edge ?? 'east' };
    this.migrating.add(d.name);
  }

  /** Arrival (BACKLOG-334): flip the home zone, drop the dino at the far zone's opposite edge, refresh + persist. */
  private crossDino(d: Dino): void {
    const home = zoneOf(this.dinoZones, d.name, BOWL_ID);
    const cross = this.migrationCross[d.name];
    const dest = cross?.dest ?? otherZone(home); // BACKLOG-378: the destination fixed at startMigration
    const row = this.tileOf(d).tileY;
    setZone(this.dinoZones, d.name, dest);
    this.tenure = resetTenure(this.tenure, d.name); // BACKLOG-341: a fresh zone starts fresh — no longer "at home"
    const entry = crossEntryTile(home, row, COLS, cross?.edge);
    d.setPosition(entry.tileX * TILE + TILE / 2, entry.tileY * TILE + TILE / 2);
    this.migrating.delete(d.name);
    delete this.migrationCross[d.name];
    this.applyZoneVisibility();
    this.logEvent(
      `🌿 ${d.name} ${dest === BOWL_ID ? 'crossed back to the bowl' : `crossed into ${zoneById(dest).name}`}`,
    );
    // Carry between zones (BACKLOG-329): the crossing dino ferries one banked resource from the pile it
    // leaves into the pile it enters — the first link between the two per-zone economies (328). Only the
    // visible crossing carries; the instant __migrate/relocate path does not. Empty source or a capped
    // destination → nothing moves (directedCarry returns null), so nothing is ever lost.
    // Directed carry (BACKLOG-356): ferry the kind `dest` is short of for its next craft, not a random
    // spare — so the trade route actively balances the diverging piles (falls back to a spare otherwise).
    // BACKLOG-377: aim at the destination zone's *own* structure recipe (a grove short of stone for its
    // lean-to pulls stone; a bowl short of branch for its cairn pulls branch).
    // BACKLOG-429: under carry pressure (leaving a zone over its soft cap toward a lighter neighbour) the
    // crosser sheds the glut — up to PRESSURE_CARRY kinds — instead of a single directed kind, so banked
    // resources flow toward need. Not over cap / heavier dest → one kind, byte-identical to 356/377.
    const carried = pressuredCarry(this.pileFor(home), this.pileFor(dest), structureRecipe(dest));
    for (const carry of carried) {
      this.stockpileByZone[home] = takeResource(this.pileFor(home), carry);
      this.stockpileByZone[dest] = bankResource(this.pileFor(dest), carry);
    }
    if (carried.length) {
      const glyphs = carried.map((k) => RESOURCE_GLYPH[k]).join('');
      this.logEvent(`${glyphs} ${d.name} carried ${carried.length} to ${zoneById(dest).name}`);
    }
    // Food flows between zones (BACKLOG-447): the food twin of the resource carry above. The crossing dino
    // also ferries one banked *food* unit from the zone it leaves toward the lighter neighbour it enters,
    // aimed at the demand read (438's zoneWant) so the "wants what it can't grow" line becomes a mover.
    // ponytail: one unit per crossing (a lean, like the non-pressured resource carry) — a pressured
    // multi-unit food shed can follow if a zone visibly stays glutted.
    const wantId = zoneWant(dest, this.harvestedByZone)?.food;
    const foodCarry = pickFoodCarry(this.foodStoreFor(home), this.foodStoreFor(dest), wantId);
    if (foodCarry) {
      this.foodPileByZone[home] = takeFood(this.foodStoreFor(home), foodCarry);
      this.foodPileByZone[dest] = bankFood(this.foodStoreFor(dest), foodCarry);
      const emoji = FOODS.find((f) => f.id === foodCarry)?.emoji ?? '';
      const destName = zoneById(dest).name;
      this.logEvent(`${emoji} ${d.name} carried food to ${destName}`);
      // The courier's pride (BACKLOG-451): the carrier shows a 📦 beat and keeps the memory, which rides
      // the store into `recall` → the next greeting reads a beat prouder. Only fires when a unit actually
      // moved (dest was genuinely short), so a no-op crossing earns no false pride. Mirrors the 339 beat.
      this.memory = remember(this.memory, d.name, courierMemory(destName, emoji));
      this.showBubble(d, courierLine());
    }
    // First steps in the grove (BACKLOG-339): the first time this dino ever crosses *into* the grove,
    // arrival is a beat — a 🌿 look-around bubble, a "first time across" memory (rides the existing store,
    // surfaces in a later greeting), and a one-step pause (the arriving Set) before it wanders on.
    if (firstGroveArrival(this.groveVisited, d.name, dest)) {
      this.groveVisited.push(d.name);
      this.memory = remember(this.memory, d.name, groveArrivalMemory());
      this.showBubble(d, groveArrivalLine());
      this.arriving.add(d.name);
    }
    // Tell of the grove (BACKLOG-342): a dino crossing *back* to the bowl carries grove news, which it
    // leads its next meeting with (the gossip cascade). Only the return crossing files it.
    if (dest === BOWL_ID) {
      this.memory = remember(this.memory, d.name, groveNewsMemory());
    }
    this.refreshPlaque(); // BACKLOG-316: the per-zone tally is live the moment a dino changes zones
    void this.saveGame();
  }

  /** Move a dino to a zone: flip its home zone, drop it on an interior tile there, refresh + persist. */
  private relocate(d: Dino, destZoneId: string): void {
    setZone(this.dinoZones, d.name, destZoneId);
    this.tenure = resetTenure(this.tenure, d.name); // BACKLOG-341: a new zone starts fresh (mirrors crossDino)
    // an interior tile, away from the linked east/west edges so it doesn't instantly read as a crossing
    const tileX = Phaser.Math.Between(2, COLS - 3);
    const tileY = Phaser.Math.Between(2, ROWS - 3);
    d.setPosition(tileX * TILE + TILE / 2, tileY * TILE + TILE / 2);
    this.applyZoneVisibility();
    this.logEvent(
      `🌿 ${d.name} ${destZoneId === GROVE_ID ? `wandered into ${zoneById(GROVE_ID).name}` : 'wandered back to the bowl'}`,
    );
    void this.saveGame();
  }

  private handleInteract(): void {
    // GBA-style paging: with more text to read, E/Z turns the page first; the
    // dismiss/cancel below only fires from the last page. (The ✕ chip skips this.)
    if (this.dialogOpen && this.dialog.next()) return;
    if (this.dialogOpen) {
      this.dismissDialog();
      return;
    }

    const target = this.nearestDino();
    if (!target) return;

    // Greeting is now a choice (BACKLOG-142): open the tone menu; the reply comes after a pick.
    this.openToneMenu(target);
  }

  /** Open the Warm/Tease/Honest menu for a dino, showing the remembered last-tone trace. */
  private openToneMenu(target: Dino): void {
    // Caught mid-tic (BACKLOG-408): if the dino is deep in its solitary ritual (405) when greeted, it
    // startles the instant the greet opens — a 😳 over it, and its reply comes out bashful (see pickTone).
    // The player isn't a dino, so approaching never counts as the company that would break the tic.
    this.caughtTic = this.ticInvented.has(target.name) ? target.name : null;
    if (this.caughtTic) {
      // BACKLOG-413: the same catch reads opposite by bond — a fond dino is *pleased* (😊), not bashful (😳).
      const fond = fondOfBeingCaught(heartsFromPoints(this.friendship[target.name] ?? 0));
      this.flashFeed(target, fond ? '😊' : '😳');
    }

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
    this.caughtTic = null; // a cancelled greet mustn't leak the bashful frame into the next dino (BACKLOG-408)
    this.dialog.hide();
    this.dialogOpen = false;
  }

  /** Resolve a tone pick: apply the affinity delta + memory + trace, then show the reply. Returns the shown line. */
  private async pickTone(id: ToneId): Promise<string> {
    if (!this.toneMenuOpen || !this.toneTarget) return '';
    const target = this.toneTarget;
    this.toneMenuOpen = false;
    this.toneMenuText = '';

    this.recordTone(target.name, id, target.traits);

    // Reply path is unchanged from the old greet flow (tone-coloured reply is BACKLOG-148).
    this.dialog.show(`${target.name}: ...`);
    const now = getWorldClock().now();
    const reply = await target.greet({
      personality: this.ensurePersona(target).text, // BACKLOG-103: the stored self feeds the prompt
      timeOfDay: dayPhase(now.hour),
      affection: heartsFromPoints(this.friendship[target.name] ?? 0),
      recentMemory: recall(this.memory, target.name),
      // A just-cleared dino names who set its record straight (BACKLOG-247).
      gratitude: whoClearedMyName(this.memory, target.name) ?? undefined,
      // A fond dino names the chosen observer (BACKLOG-276); the closest of all uses the nickname (BACKLOG-278).
      keeperName: keeperAddress(keeperById(this.keeperId), heartsFromPoints(this.friendship[target.name] ?? 0)),
      // Hunger you can hear (BACKLOG-368): a dino over the need threshold lets it slip into its line.
      hungry: pressingNeed(this.needs[target.name]) === 'hunger',
      // Rattled after the chase (BACKLOG-440): a prey with a fresh "slipped X's hunt" memory names its chaser.
      rattled: recentHunter(recall(this.memory, target.name)) ?? undefined,
    });
    this.chirpFor(target); // it answers in its own voice (BACKLOG-191)
    // Caught mid-tic (BACKLOG-408): a dino greeted mid-ritual sounds bashful — a deterministic frame prefixed
    // to whatever the brain/stub returned (never asks the model to be bashful; the NPCBrain boundary is intact).
    // It files the caught memory once per solitary stretch (cleared by resetTic when the stretch ends).
    const caught = this.caughtTic === target.name;
    // BACKLOG-413: a fond caught dino leads with a warm opener + files a glad memory; a non-fond one stays bashful (408).
    const fond = caught && fondOfBeingCaught(heartsFromPoints(this.friendship[target.name] ?? 0));
    const text = caught ? `${fond ? fondOpener() : bashfulOpener()} ${reply.text}` : reply.text;
    if (caught && !this.ticCaughtFiled.has(target.name)) {
      const label = signatureTic(target.traits).label;
      this.memory = remember(this.memory, target.name, fond ? fondCaughtMemory(label) : caughtMemory(label));
      this.ticCaughtFiled.add(target.name);
    }
    this.caughtTic = null;
    const line = `${replyPrefix(reply.source)}${target.name}: ${text}`;
    this.dialog.show(line);
    this.toneTarget = null;
    return line;
  }

  // --- Keeper select (BACKLOG-155) ---------------------------------------------------------

  /** Route 1/2/3: choose an observer while the keeper picker is open, else pick a greeting tone. */
  /** Close/cancel whatever dialog is up, regardless of remaining pages (✕ semantics). */
  private dismissDialog(): void {
    if (this.mindsConfirm) {
      this.closeMindsConfirm();
      return;
    }
    // While the keeper picker is up, this dismisses it (1/2/3 choose). BACKLOG-155.
    if (this.keeperPickerOpen) {
      this.closeKeeperPicker();
      return;
    }
    // While the tone menu is up, this cancels it (1/2/3 choose); a normal dialog closes.
    if (this.toneMenuOpen) {
      this.closeToneMenu();
      return;
    }
    this.dialog.hide();
    this.dialogOpen = false;
  }

  private onNumberKey(n: number): void {
    if (this.mindsConfirm === 'enable') {
      if (n === 1) this.confirmMinds();
      return; // 2/3 mean nothing to a yes/no dialog
    }
    if (this.mindsConfirm === 'disable') {
      if (n === 1) this.confirmMindsOff(false);
      if (n === 2) this.confirmMindsOff(true);
      return; // 3 means nothing here
    }
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
    const changed = keeper.id !== this.keeperId;
    this.keeperId = keeper.id;
    if (changed) this.renderKeeperAvatar(); // swap to the new observer's face in place
    this.keeperPickerOpen = false;
    this.dialog.show(`You are ${keeper.name}, from ${keeper.era}.\n${keeper.ability.label}: ${keeper.ability.desc}`);
    this.dialogOpen = true; // a normal dialog the next E/Z closes
    void this.saveGame();
    // A real change of watcher draws first contact (BACKLOG-161); a re-pick or the save-restore
    // path (which assigns keeperId directly) never arms it.
    if (changed) this.armInspection();
  }

  /**
   * (Re)build the player avatar for the current observer (BACKLOG-158). Destroys the old object
   * and rebuilds in place — preserving position + depth — so a keeper switch or a save restore
   * swaps the sprite without disturbing movement. An undrawn observer renders the amber square.
   */
  private renderKeeperAvatar(): void {
    const x = this.player ? this.player.x : TILE * 3 + TILE / 2;
    const y = this.player ? this.player.y : TILE * 3 + TILE / 2;
    const depth = this.player ? this.player.depth : 0;
    if (this.player) this.player.destroy();
    const { obj, artKey } = makeKeeperArt(this, x, y, this.keeperId);
    this.player = obj;
    this.player.setDepth(depth);
    this.keeperArtKey = artKey;
  }

  /** Arm the first-contact beat: the best-fitting dino comes to size up the new observer. */
  private armInspection(): void {
    const name = inspector(keeperById(this.keeperId), this.dinos);
    this.pendingInspect = name ? { name, ttl: INSPECT_TTL } : null;
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
    this.scanPanel.setText(scanLines(this.scanSubject(target), this.currentSeason()).join('\n'));
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
      return d ? scanLines(this.scanSubject(d), this.currentSeason()) : [];
    };
    // any: dev-only Playwright hook — stand the player on a named dino (key-press tests; the
    // overlap keeps it nearest even if a wander tick fires between the warp and the key press)
    (window as any).__warpTo = (name: string) => {
      const d = this.dinoByName(name);
      if (d) this.player.setPosition(d.x, d.y);
      return !!d;
    };
    // any: dev-only Playwright hook — who the keeper would interact with right now (the zone-gated
    // nearest dino, BACKLOG-274), or null when none is in range/zone.
    (window as any).__nearestDino = () => this.nearestDino()?.name ?? null;
  }

  /**
   * Tone-aware twin of recordGreet (BACKLOG-142): applies the personality-fit tone delta, files
   * a tone memory, and records the last-tone trace. The BACKLOG-125 repair seam wins over the
   * tone delta — a make-up greet still earns the outsized repair bump and its 😊 beat.
   */
  private recordTone(name: string, id: ToneId, traits?: Dino['traits']): void {
    const repairing = this.pendingRepair === name;
    // Warming a cold-funked dino (BACKLOG-184): the repair shape, repair itself still winning.
    const warming = !repairing && this.coldPending.has(name);
    // The loner (BACKLOG-135): a tone pick to a friendless dino lands extra-hard too.
    const lonely = !repairing && !warming && isLoner(this.bonds, name, this.dinoNames(), LONER_FLOOR);
    const gain = repairing
      ? repairGain(traits)
      : warming
        ? warmGain(traits)
        : toneReaction(toneById(id), traits).delta + this.applyKeeperBonus(traits) + (lonely ? LONER_BONUS : 0);
    this.friendship = bumpPoints(this.friendship, name, gain);
    this.memory = remember(
      this.memory,
      name,
      repairing ? repairMemory(name) : warming ? warmMemory() : toneById(id).memory,
    );
    this.lastTone = { ...this.lastTone, [name]: id };
    if (lonely) {
      const dino = this.dinoByName(name);
      if (dino) this.showBubble(dino, perkUpLine(name));
    }
    if (repairing) {
      this.pendingRepair = null;
      const dino = this.dinos.find((d) => d.name === name);
      if (dino) {
        this.showBubble(dino, repairLine(name));
        this.liftMood(dino); // BACKLOG-318: the make-up greet bounces its signature quirk back
      }
    }
    if (repairing || warming) this.clearColdFunk(name, warming);
    void this.saveGame();
    this.refreshHeartsPanel();
  }

  /** Raise a dino's affinity from a greet, persist, and refresh the panel. */
  private recordGreet(name: string, traits?: Dino['traits']): void {
    // A make-up greet to the jealous runner-up (BACKLOG-125): outsized bump, 😊, one-shot.
    const repairing = this.pendingRepair === name;
    // Warming a cold-funked dino (BACKLOG-184): the repair shape, repair itself still winning.
    const warming = !repairing && this.coldPending.has(name);
    // The loner (BACKLOG-135): the keeper's notice lands extra-hard on a dino with no dino-friends.
    const lonely = !repairing && !warming && isLoner(this.bonds, name, this.dinoNames(), LONER_FLOOR);
    const gain = repairing
      ? repairGain(traits)
      : warming
        ? warmGain(traits)
        : greetGain(traits) + this.applyKeeperBonus(traits) + (lonely ? LONER_BONUS : 0);
    this.friendship = bumpPoints(this.friendship, name, gain);
    this.memory = remember(
      this.memory,
      name,
      repairing ? repairMemory(name) : warming ? warmMemory() : 'the human stopped by to say hello',
    );
    if (lonely) {
      const dino = this.dinoByName(name);
      if (dino) this.showBubble(dino, perkUpLine(name));
    }
    if (repairing) {
      this.pendingRepair = null;
      const dino = this.dinos.find((d) => d.name === name);
      if (dino) {
        this.showBubble(dino, repairLine(name));
        this.liftMood(dino); // BACKLOG-318: the make-up greet bounces its signature quirk back
      }
    }
    if (repairing || warming) this.clearColdFunk(name, warming);
    void this.saveGame();
    this.refreshHeartsPanel();
  }

  /** One-shot thaw (BACKLOG-184): drop the funk; a true warming also gets its 😊 beat. */
  private clearColdFunk(name: string, withBeat: boolean): void {
    if (!this.coldPending.delete(name)) return;
    this.refreshColdMarks();
    if (withBeat) {
      const dino = this.dinoByName(name);
      if (dino) {
        this.showBubble(dino, warmLine(name));
        this.liftMood(dino); // BACKLOG-318: thawing the cold funk brightens its signature quirk
      }
    }
  }

  private nearestDino(): Dino | null {
    let best: Dino | null = null;
    let bestDist = TILE * 2;
    for (const d of this.dinos) {
      if (!this.inView(d)) continue; // BACKLOG-274: only a dino in the keeper's zone is interactable
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
    return `Day ${t.day} — ${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')} ·${scale}× · ${seasonFor(t.day)}`;
  }

  // --- Seasons (BACKLOG-159): the turning year ---------------------------------------------

  private setupSeasons(): void {
    const clock = getWorldClock();
    const tint = SEASON_TINT[seasonFor(clock.now().day)];
    // Depth 4: above the grass, below the day/night overlay (5) — the sun still owns the light.
    this.seasonOverlay = this.add
      .rectangle((TILE * COLS) / 2, (TILE * ROWS) / 2, TILE * COLS, TILE * ROWS, tint.color, tint.alpha)
      .setDepth(4);
    this.lastSeasonDay = clock.now().day;

    clock.onHour((t) => this.checkSeasonTurn(t));
    // Dawn chorus (BACKLOG-192) — its own live-only onHour listener, separate from the season
    // turn and the hour-6 reflection so neither is disturbed. onHour never fires on clock.set().
    clock.onHour((t) => this.checkDawnChorus(t));

    // any: dev-only Playwright hooks — seasons (BACKLOG-159)
    (window as any).__season = () => seasonFor(getWorldClock().now().day);
    (window as any).__seasonCraving = (s: Season) => seasonCraving(s).id;
    (window as any).__seasonTint = () => ({
      color: this.seasonOverlay.fillColor,
      alpha: this.seasonOverlay.fillAlpha,
    });
    (window as any).__seasonTurns = () => this.seasonTurns;
    // any: dev-only Playwright hooks — dawn chorus (BACKLOG-192)
    (window as any).__lastChorus = () => this.lastChorus;
    (window as any).__dawnCount = () => this.dawnCount;
    (window as any).__dawnHour = () => DAWN_HOUR;
    // any: dev-only Playwright hook — woke hungry (BACKLOG-376): who woke over the bar at the last dawn.
    (window as any).__wokeHungry = () => [...this.lastWokeHungry];
    (window as any).__chorusOrder = () => chorusOrder(this.dinos);
    // any: dev-only Playwright hook — stage the clock like a restore (sync, repaint, NO beat)
    (window as any).__setClock = (day: number, hour: number, minute: number) => {
      getWorldClock().set({ day, hour, minute });
      this.syncSeason();
      this.applyTint(getWorldClock().now());
      this.clockHud.setText(this.fmtClock(getWorldClock().now()));
      return getWorldClock().now();
    };
  }

  /** Re-derive the season from the clock without a beat — restore/away/jump paths. */
  private syncSeason(): void {
    const day = getWorldClock().now().day;
    this.lastSeasonDay = day;
    const tint = SEASON_TINT[seasonFor(day)];
    this.seasonOverlay.setFillStyle(tint.color, tint.alpha);
  }

  /** Live-observed turn only: a day boundary the clock actually ticked across. */
  private checkSeasonTurn(t: GameTime): void {
    const turned = seasonTurned(this.lastSeasonDay, t.day);
    this.lastSeasonDay = t.day;
    if (!turned) return;
    const tint = SEASON_TINT[turned];
    this.seasonOverlay.setFillStyle(tint.color, tint.alpha);
    this.clockHud.setText(this.fmtClock(t));
    this.logEvent(`🍂 ${turnLine(turned)}`);
    for (const d of this.dinos) this.memory = remember(this.memory, d.name, turnMemory(turned));
    this.seasonTurns++;
    const banner = this.add
      .text(TILE * COLS * 0.5, 24, turnLine(turned), {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffffff',
        align: 'center',
        backgroundColor: '#000000aa',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5, 0)
      .setDepth(12);
    this.tweens.add({ targets: banner, alpha: 0, delay: 4000, duration: 2500, onComplete: () => banner.destroy() });
    void this.saveGame();
  }

  /**
   * Dawn chorus (BACKLOG-192) — the cast greets the day each in its own voice, staggered by
   * energy. Live-only (onHour never fires on a restore/away clock.set) and at most once per
   * in-game day. Playback rides chirpFor, which self-guards mute + the unlocked context, so a
   * muted bowl still computes the order but stays silent.
   */
  private checkDawnChorus(t: GameTime): void {
    if (t.hour !== DAWN_HOUR) return;
    if (t.day === this.lastDawnDay) return; // once per day; a fresh day re-arms
    this.lastDawnDay = t.day;
    const order = chorusOrder(this.dinos);
    this.lastChorus = order;
    this.dawnCount++;
    this.logEvent('🌅 dawn');
    for (const { name, delayMs } of order) {
      this.time.delayedCall(delayMs, () => {
        const d = this.dinoByName(name);
        if (d) this.chirpFor(d);
      });
    }
    this.checkWakeHungry();
  }

  /**
   * Woke hungry (BACKLOG-376) — the dinos that went to bed hungry break the morning's uniform chirp with a
   * visible 🍖 stir, a temperament-shaded line, and a memory that can colour their next greeting. Called
   * from the tail of the dawn chorus so it inherits both of that beat's guards (once per in-game day; live
   * crossings only — a restore/away `clock.set` fires no onHour). Synchronous on purpose: the chorus chirps
   * are staggered through delayedCall, but this beat must be readable the instant dawn breaks.
   */
  private checkWakeHungry(): void {
    this.lastWokeHungry = [];
    for (const d of this.dinos) {
      if (!wokeHungry(this.needs[d.name])) continue;
      this.lastWokeHungry.push(d.name);
      this.memory = remember(this.memory, d.name, wakeHungryMemory());
      this.flashFeed(d, NEED_GLYPH.hunger);
      this.logEvent(wakeHungryLine(d.name, d.traits));
    }
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
      personas: this.personas, // BACKLOG-103: generate-once selves ride the save
      keeperId: this.keeperId,
      zoneId: this.zoneId,
      roles: this.roles,
      dinoZones: this.dinoZones,
      tenure: this.tenure, // BACKLOG-341: per-dino home-zone tenure (settling persists across a reload)
      gathered: this.gathered,
      needs: this.needs, // BACKLOG-371: hunger/thirst per dino

      stockpile: this.pileFor(BOWL_ID), // BACKLOG-328: legacy field kept = bowl pile (back-compat for old readers + tests)
      stockpileByZone: this.stockpileByZone, // BACKLOG-328: the full per-zone map
      cairns: this.cairns,
      shelters: this.shelters,
      thatches: this.thatches, // BACKLOG-417: the Fernreach's frond-thatch landmarks
      groveVisited: this.groveVisited,
      pondSeen: this.pondSeen, // BACKLOG-359
      plot: this.plotByZone[BOWL_ID], // BACKLOG-349: bowl plot kept under the legacy `plot` field (back-compat)
      grovePlot: this.plotByZone[GROVE_ID], // BACKLOG-349: grove plot, additive
      fernreachPlot: this.plotByZone[FERNREACH_ID], // BACKLOG-432: Fernreach plot, additive
      harvested: this.harvested,
      harvestedByZone: this.harvestedByZone, // BACKLOG-428: per-zone farming term (additive)
      foodPileByZone: this.foodPileByZone as Record<string, Record<string, number>>, // BACKLOG-446: per-zone banked food (additive)
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
      this.personas = (save.personas ?? {}) as Record<string, Persona>; // BACKLOG-103: selves restore
      this.keeperId = save.keeperId ?? DEFAULT_KEEPER_ID;
      this.zoneId = save.zoneId ?? BOWL_ID; // BACKLOG-143: old saves load into the bowl
      this.roles = (save.roles ?? {}) as Record<string, Role>; // BACKLOG-032: durable roles restore
      this.dinoZones = save.dinoZones ?? {}; // BACKLOG-274: home-zone restore (absent → all bowl via fallback)
      this.tenure = save.tenure ?? {}; // BACKLOG-341: home-zone tenure restore (absent → settle from scratch)
      this.gathered = save.gathered ?? {}; // BACKLOG-146: gathered tally restore
      // BACKLOG-371: needs restore (absent → {}); any spawned dino missing an entry backfills to sated.
      this.needs = save.needs ?? {};
      for (const d of this.dinos) this.needs[d.name] ??= { hunger: 0, thirst: 0 };
      // BACKLOG-328: per-zone piles restore; an older save's single global `stockpile` migrates into the bowl pile.
      this.stockpileByZone = (save.stockpileByZone as Record<string, Stockpile>)
        ?? (save.stockpile && Object.keys(save.stockpile).length ? { [BOWL_ID]: save.stockpile as Stockpile } : {});
      // BACKLOG-286 restore; BACKLOG-308: backfill a home zone for cairns from saves before 308 (→ bowl).
      this.cairns = (save.cairns ?? []).map((c) => ({ ...c, zone: c.zone ?? BOWL_ID }));
      for (const c of this.cairns) this.drawCairn(c);
      // BACKLOG-315: dino-built shelters restore (additive; new field, so old saves load none).
      this.shelters = (save.shelters ?? []).map((s) => ({ ...s, zone: s.zone ?? BOWL_ID }));
      for (const s of this.shelters) this.drawShelter(s);
      // BACKLOG-417: frond thatches restore (additive; new field, so old saves load none). Mirrors shelters.
      this.thatches = (save.thatches ?? []).map((t) => ({ ...t, zone: t.zone ?? BOWL_ID }));
      for (const t of this.thatches) this.drawThatch(t);
      this.groveVisited = save.groveVisited ?? []; // BACKLOG-339: who's already been to the grove (absent → none)
      this.pondSeen = save.pondSeen ?? []; // BACKLOG-359: who's already seen the pond (absent → none)
      // BACKLOG-145/349: per-zone plots restore (bowl from the legacy `plot`, grove from `grovePlot`; old saves → grove-empty).
      this.plotByZone = { [BOWL_ID]: save.plot ?? null, [GROVE_ID]: save.grovePlot ?? null, [FERNREACH_ID]: save.fernreachPlot ?? null };
      this.harvested = save.harvested ?? 0;
      this.harvestedByZone = (save.harvestedByZone as Record<string, number>) ?? {}; // BACKLOG-428 (absent → {})
      this.foodPileByZone = (save.foodPileByZone as Record<string, FoodPile>) ?? {}; // BACKLOG-446 (absent → {})
      this.plotStageShownByZone = { [BOWL_ID]: 'empty', [GROVE_ID]: 'empty', [FERNREACH_ID]: 'empty' };
      this.refreshPlot();
      this.applyObjectVisibility(); // BACKLOG-308: hide off-zone props if we restored into the grove
      this.renderKeeperAvatar(); // restore re-renders the saved observer at the restored position
      this.lastAwayDigest = away.digest;
      // Respawn dinos born in a previous session, then redraw any pending eggs.
      this.born = save.born ?? [];
      for (const b of this.born) this.spawnDino(b);
      this.eggs = save.eggs ?? [];
      for (const e of this.eggs) this.drawEgg(e);
      this.applyZoneVisibility(); // a save restored into the grove must not show the bowl's dinos
      this.clockHud.setText(this.fmtClock(clock.now()));
      this.applyTint(clock.now());
      this.syncSeason(); // restore re-derives the season; never a turn beat (BACKLOG-159)
      this.refreshHeartsPanel();
      if (away.minutes > 0) {
        this.dialogOpen = true;
        this.dialog.show('While you were away…\n' + away.digest.join('\n'));
      }
      // After a long absence, your closest dino notices you came back (BACKLOG-112).
      // Friendship is assigned above, so the homecomer reads the restored hearts.
      this.lastHomecoming = homecoming(this.friendship, away.minutes, (name) => this.dinoQuirkLabel(name));
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
      this.lastHomecoming = homecoming(this.friendship, away.minutes, (name) => this.dinoQuirkLabel(name));
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
    // any: dev-only — the baked anim key of the current observer avatar, or null (amber square)
    (window as any).__keeperArt = () => this.keeperArtKey;
    // dev-only: the keeper rectangle-fallback control (cycle 047-art) — with the whole roster
    // drawn, the undrawn-subject guarantee is pinned on a genuine no-art id (the pterodactyl
    // convention): hasKeeperArt(false) is what routes makeKeeperArt to the amber square.
    (window as any).__hasKeeperArt = (id: string) => hasKeeperArt(id);
    // any: dev-only — the Gen3 floor (BACKLOG-033). True once the ground texture is baked; the size hook
    // proves it spans the whole zone (COLS×ROWS world tiles). BACKLOG-445 gave the bowl its own terrain,
    // so these read the *live* floor texture rather than the hardcoded grass key — every zone bakes a
    // different one now, and "is the ground there" is the question these were always really asking.
    (window as any).__groundReady = () => !!this.floorImage?.texture.key;
    (window as any).__groundSize = () => {
      const img = this.floorImage?.texture.getSourceImage() as { width: number; height: number } | undefined;
      return img ? [img.width, img.height] : [0, 0];
    };
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
    // any: dev-only Playwright hooks — first-contact inspection (BACKLOG-161)
    (window as any).__inspection = () => (this.pendingInspect ? { ...this.pendingInspect } : null);
    (window as any).__lastInspection = () => (this.lastInspection ? { ...this.lastInspection } : null);
    // any: the current observer's raw personality fit for a named dino
    (window as any).__keeperFit = (name: string) => {
      const d = this.dinoByName(name);
      return d ? keeperFit(keeperById(this.keeperId), d.traits) : 0;
    };
    // any: dev-only Playwright hook — current player position
    (window as any).__playerPos = () => ({ x: this.player.x, y: this.player.y });
    // dev-only Playwright hooks — place the keeper + run the zone-crossing check once, deterministically
    // (no dependence on rAF frame-count, which throttles under parallel CI load). (BACKLOG-143)
    (window as any).__setPlayer = (x: number, y: number) => this.player.setPosition(x, y);
    (window as any).__tryCross = () => this.tryCrossZone();
    // any: dev-only Playwright hook — first dino's seeded personality traits
    (window as any).__dinoTraits = () => this.dinos[0]?.traits;
    // any: dev-only Playwright hook — roster size + names
    (window as any).__dinoCount = () => this.dinos.length;
    // any: dev-only Playwright hook — every dino's name
    (window as any).__dinoNames = () => this.dinos.map((d) => d.name);
    // any: dev-only Playwright hook — names of dinos currently drawn (in the keeper's zone) (BACKLOG-143)
    (window as any).__visibleDinos = () =>
      this.dinos.filter((d) => d.sprite.visible).map((d) => d.name);
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

    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.C).on('down', () => this.toggleHearts());

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
    // any: dev-only Playwright hook — set a dino's hearts exactly (points = hearts×10) for deterministic tests
    (window as any).__setHearts = (name: string, hearts: number) => {
      this.friendship = { ...this.friendship, [name]: hearts * 10 };
      this.refreshHeartsPanel();
      return heartsFromPoints(this.friendship[name] ?? 0);
    };
    // any: dev-only Playwright hook — is the hearts panel showing
    (window as any).__heartsPanelVisible = () => this.heartsPanel.visible;
  }

  private toggleHearts(): void {
    this.heartsPanel.setVisible(!this.heartsPanel.visible);
    if (this.heartsPanel.visible) this.refreshHeartsPanel();
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
    this.giftHud.setText(holdingLine(GIFTS[this.heldItemIndex].label));
  }

  /** Bottom-left on desktop; tucked under the build stamp on touch (the stick owns bottom-left). */
  private layoutGiftHud(): void {
    if (!this.giftHud) return;
    if (this.touchEnabled) this.giftHud.setPosition(6, 34).setOrigin(0, 0);
    else this.giftHud.setPosition(6, TILE * ROWS - 6).setOrigin(0, 1);
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

  /**
   * Draw the active zone's floor (BACKLOG-294). The bowl is the untinted Gen3 grass (unchanged from the
   * old drawGrassMap, BACKLOG-033); the grove bakes its own terrain layout (groveTileAt) under a cool
   * GROVE_TINT so it reads as a different place. One held `floorImage` (depth 0) is re-textured/re-tinted
   * on every zone change rather than stacking images. Falls back to the flat two-green checker if the
   * grass rig is ever missing (STYLE-GUIDE: undrawn → flat).
   */
  /**
   * Edge indicators (BACKLOG-398): a small label at each linked edge naming the neighbour zone, so
   * the chain is legible before you cross. Rebuilt on every floor draw (create, __setZone, keeper
   * cross) from the adjacency table — a fourth zone labels itself with zero changes here.
   */
  private drawEdgeLabels(): void {
    for (const t of this.edgeLabelTexts) t.destroy();
    this.edgeLabelTexts = edgeIndicators(this.zoneId).map((ind) => {
      const west = ind.edge === 'west';
      return this.add
        .text(west ? 6 : COLS * TILE - 6, (ROWS * TILE) / 2, ind.text, {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#ffe9c0',
          shadow: { offsetX: 1, offsetY: 1, color: '#000000', fill: true },
        })
        .setOrigin(west ? 0 : 1, 0.5)
        .setAlpha(0.85)
        .setDepth(7); // chrome: over the night overlay, under HUD/dialog
    });
  }

  private drawFloor(): void {
    this.drawEdgeLabels(); // BACKLOG-398: every floor redraw is a zone change (or boot) — relabel the edges
    // BACKLOG-399: dispatch on the zone's terrain layout — grove/Fernreach bake their own ground, the bowl
    // (null) bakes plain grass. The probe at (0,0) is non-null exactly for zones that have a layout.
    const tileAt = (x: number, y: number) => zoneTileAt(this.zoneId, x, y, COLS, ROWS);
    const key =
      tileAt(0, 0) !== null
        ? bakeTerrainMap(this, `terrain_${this.zoneId}_${COLS}x${ROWS}`, COLS, ROWS, TILE, (x, y) => tileAt(x, y)!)
        : bakeTileMap(this, 'grass', COLS, ROWS, TILE);
    if (key) {
      if (!this.floorImage) this.floorImage = this.add.image(0, 0, key).setOrigin(0).setDepth(0);
      else this.floorImage.setTexture(key);
      this.floorImage.setTint(zoneTint(this.zoneId)); // BACKLOG-378: grove cool, Fernreach warm, bowl untinted
      this.floorImage.setVisible(true);
      this.floorFallback?.setVisible(false);
      return;
    }
    if (!this.floorFallback) {
      const g = this.add.graphics().setDepth(0);
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const shade = (x + y) % 2 === 0 ? 0x3a6a3a : 0x2f5e2f;
          g.fillStyle(shade, 1);
          g.fillRect(x * TILE, y * TILE, TILE, TILE);
        }
      }
      this.floorFallback = g;
    }
    this.floorFallback.setVisible(true);
  }
}
