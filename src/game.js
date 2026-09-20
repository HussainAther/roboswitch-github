import {
  Music,
  playMusic,
  pauseMusic,
  resumeMusic,
  setMusicSettings,
  notifyMusicInteraction,
} from "./audio.js?v=47";
import { createTitleAtmosphere } from "./title-atmosphere.js?v=47";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const hudTop = document.querySelector("#hudTop");
const modeDock = document.querySelector("#modeDock");
const pauseButton = document.querySelector("#pauseButton");
const screenLayer = document.querySelector("#screenLayer");
const curtainTransition = document.querySelector("#curtainTransition");
const comboChip = document.querySelector("#comboChip");
const lockCursor = document.querySelector("#lockCursor");

const hpBar = document.querySelector("#hpBar");
const energyBar = document.querySelector("#energyBar");
const entropyBar = document.querySelector("#entropyBar");
const guardBar = document.querySelector("#guardBar");
const waveLabel = document.querySelector("#waveLabel");
const scoreLabel = document.querySelector("#scoreLabel");
const regimeLabel = document.querySelector("#regimeLabel");
const resultPanel = document.querySelector("#resultPanel");
const resultTitle = document.querySelector("#resultTitle");
const resultStats = document.querySelector("#resultStats");
const resultQuip = document.querySelector("#resultQuip");
const restartButton = document.querySelector("#restartButton");
const nextButton = document.querySelector("#nextButton");
const resultSelectButton = document.querySelector("#resultSelectButton");
const resultMenuButton = document.querySelector("#resultMenuButton");
const pulseButton = document.querySelector("#pulse-button");
const burstButton = document.querySelector("#burst-button");

const modeButtons = {
  pressure: document.querySelector("#mode-pressure"),
  control: document.querySelector("#mode-control"),
  chaos: document.querySelector("#mode-chaos"),
};

const TAU = Math.PI * 2;
const DPR_MAX = 2;
const SAVE_KEY = "roboswitch.save.v2";
const GUARD_COOLDOWN = 8.5;
const GUARD_DURATION = 1.25;
const LEVEL_START_DELAY = 1.35;
const PLAYER_START_INVULN = 2.35;
const WAVE_SPAWN_GRACE = 1.15;
const COMBO_TIMEOUT = 5.5;
const PIXEL_ART_DIR = "./assets/pixel/";
const ART_ASSET_DIR = "./assets/pixel/assets/";

function loadArtImage(relativePath) {
  const image = new Image();
  image.decoding = "async";
  image.src = `${ART_ASSET_DIR}${relativePath}`;
  return image;
}

const artAssets = {
  player: loadArtImage("robot/robo_protagonist_sheet.png"),
  pressureEnemy: loadArtImage("enemies/enemy_chunky_a_sheet.png"),
  chaosEnemy: loadArtImage("enemies/enemy_chunky_b_sheet.png"),
  notebook: loadArtImage("environment/notebook_background.png"),
  ui: loadArtImage("ui/ui_icons.png"),
  pressureMark: loadArtImage("effects/pressure_mark.png"),
  controlMark: loadArtImage("effects/control_mark.png"),
  chaosMark: loadArtImage("effects/chaos_mark.png"),
  spark1: loadArtImage("effects/spark_01.png"),
  spark2: loadArtImage("effects/spark_02.png"),
};

function artReady(image) {
  return Boolean(image && image.complete && image.naturalWidth);
}

function drawSheetFrame(image, frameSize, column, row, dx, dy, dw, dh, flipX = false, alpha = 1) {
  if (!artReady(image)) return false;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.imageSmoothingEnabled = false;
  ctx.translate(dx + dw / 2, dy + dh / 2);
  if (flipX) ctx.scale(-1, 1);
  ctx.drawImage(
    image,
    column * frameSize, row * frameSize, frameSize, frameSize,
    -dw / 2, -dh / 2, dw, dh,
  );
  ctx.restore();
  return true;
}
const STORY_ART_DIR = `${PIXEL_ART_DIR}revisions/story_art/`;
const COMIC_INK = "#040404";
const ARENA_REACTOR_MARK_SIZE = 64;
const MUSIC_BPM = 156;
const MUSIC_STEPS_PER_BAR = 16;
const MUSIC_TOTAL_STEPS = MUSIC_STEPS_PER_BAR * 8;
const MUSIC_STEP_SECONDS = 60 / MUSIC_BPM / 4;
const FX_PARAM = new URLSearchParams(window.location.search).get("fx") || "auto";
const REDUCED_MOTION_QUERY = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };

const MODES = {
  pressure: {
    label: "Pressure",
    color: "#e55b52",
    counters: "chaos",
  },
  control: {
    label: "Control",
    color: "#55a6c8",
    counters: "pressure",
  },
  chaos: {
    label: "Chaos",
    color: "#67b77a",
    counters: "control",
  },
};

const MODE_RGB = {
  pressure: "229, 91, 82",
  control: "85, 166, 200",
  chaos: "103, 183, 122",
};

const VISUAL_QUALITY = {
  reducedWidth: 620,
  reducedHeight: 520,
  reducedParticleScale: 0.34,
  fullParticleScale: 0.62,
};

const ENEMIES = {
  rusher: { family: "pressure", role: "pressure", label: "Rusher", hp: 32, radius: 14, score: 80, color: "#ff564f" },
  sprinter: { family: "pressure", role: "pressure", label: "Sprinter", hp: 20, radius: 11, score: 90, color: "#ff756f", speed: 1.55 },
  bruiser: { family: "pressure", role: "pressure", label: "Bruiser", hp: 78, radius: 21, score: 180, color: "#d93832", speed: 0.62, damage: 20 },
  rammer: { family: "pressure", role: "pressure", label: "Rammer", hp: 52, radius: 17, score: 145, color: "#ff3f35", dashScale: 1.45 },
  foreman: { family: "pressure", role: "pressure", label: "Foreman PX-7", hp: 180, radius: 27, score: 600, color: "#bd2722", elite: true, boss: true },
  colossus: { family: "pressure", role: "pressure", label: "Hydraulic Colossus", hp: 420, radius: 35, score: 1800, color: "#8f1714", boss: true },
  surge: { family: "pressure", role: "pressure", label: "Marshal Surge", hp: 470, radius: 36, score: 1950, color: "#b82520", boss: true },

  turret: { family: "control", role: "control", label: "Turret", hp: 42, radius: 17, score: 120, color: "#52bdff" },
  sniper: { family: "control", role: "control", label: "Sniper", hp: 30, radius: 14, score: 150, color: "#77ceff", range: 1.35 },
  shield: { family: "control", role: "control", label: "Shield Node", hp: 74, radius: 20, score: 190, color: "#2f9fdf", shield: true },
  medic: { family: "control", role: "control", label: "Repair Unit", hp: 38, radius: 15, score: 165, color: "#8ed9ff", medic: true },
  administrator: { family: "control", role: "control", label: "Administrator Unit", hp: 210, radius: 27, score: 650, color: "#1879b9", elite: true, boss: true },
  core: { family: "control", role: "control", label: "Curator Vector", hp: 460, radius: 36, score: 1900, color: "#075482", boss: true },

  wobbler: { family: "chaos", role: "chaos", label: "Wobbler", hp: 22, radius: 13, score: 55, color: "#48df80" },
  teleporter: { family: "chaos", role: "chaos", label: "Blinker", hp: 26, radius: 12, score: 125, color: "#75ef9d", teleport: true },
  bomber: { family: "chaos", role: "chaos", label: "Bomber", hp: 34, radius: 16, score: 145, color: "#20be62", bomber: true },
  spinner: { family: "chaos", role: "chaos", label: "Ricochet Spinner", hp: 44, radius: 17, score: 155, color: "#00a94e", spinner: true },
  prototype: { family: "chaos", role: "chaos", label: "Prototype C-13", hp: 190, radius: 26, score: 625, color: "#087a3a", elite: true, boss: true },
  anomaly: { family: "chaos", role: "chaos", label: "Jinx Parallax", hp: 440, radius: 35, score: 1850, color: "#045a2a", boss: true },
  lattice: { family: "control", role: "control", label: "Warden Lattice", hp: 500, radius: 37, score: 2050, color: "#246aa5", boss: true },
  crown: { family: "pressure", role: "pressure", label: "Furnace Crown", hp: 560, radius: 39, score: 2200, color: "#9e2f1d", boss: true },
  null: { family: "control", role: "control", label: "Director Null", hp: 690, radius: 32, score: 3000, color: "#dcecff", boss: true },
};

const LEVELS = [
  {
    id: "tutorial-loop",
    title: "Tutorial Loop",
    subtitle: "Learn the cycle: Pressure beats Chaos, Control beats Pressure, Chaos beats Control.",
    badge: "Training",
    mechanic: { type: "standard", label: "STANDARD TRAINING ARENA" },
    playerStart: { x: 0.5, y: 0.58 },
    obstacles: [
      { x: 0.28, y: 0.46, r: 0.055 },
      { x: 0.68, y: 0.42, r: 0.063 },
      { shape: "rect", x: 0.5, y: 0.72, w: 0.22, h: 0.045 },
    ],
    objective: { afterWave: 2, type: "key", label: "TRAINING KEY", puzzle: ["pressure", "control", "chaos"] },
    waves: [{ wobbler: 3, teleporter: 1 }, { rusher: 2, sprinter: 2 }, { turret: 1, sniper: 1, medic: 1 }, { prototype: 1 }],
  },
  {
    id: "pressure-front",
    title: "Pressure Front",
    subtitle: "Fast wave shapes force dashes, then punish overcommitment.",
    badge: "Burst",
    mechanic: { type: "maze", label: "MAINTENANCE MAZE" },
    playerStart: { x: 0.5, y: 0.62 },
    obstacles: [
      { shape: "rect", x: 0.18, y: 0.36, w: 0.30, h: 0.04 },
      { shape: "rect", x: 0.48, y: 0.28, w: 0.04, h: 0.22 },
      { shape: "rect", x: 0.72, y: 0.40, w: 0.34, h: 0.04 },
      { shape: "rect", x: 0.31, y: 0.56, w: 0.36, h: 0.04 },
      { shape: "rect", x: 0.65, y: 0.62, w: 0.04, h: 0.24 },
      { shape: "rect", x: 0.83, y: 0.73, w: 0.24, h: 0.04 },
      { shape: "rect", x: 0.40, y: 0.78, w: 0.32, h: 0.04 },
    ],
    objective: { afterWave: 2, type: "key", label: "IMPACT KEYCARD", puzzle: ["control", "pressure", "control"] },
    waves: [{ rusher: 3, sprinter: 3 }, { rammer: 2, bruiser: 1, sprinter: 3 }, { foreman: 1, rusher: 3 }, { surge: 1 }],
  },
  {
    id: "control-grid",
    title: "Control Grid",
    subtitle: "Predictive turrets turn bad routing into collapse risk.",
    badge: "Precision",
    mechanic: { type: "revolver", label: "REVOLVING REACTOR GATE", period: 5.6 },
    playerStart: { x: 0.5, y: 0.56 },
    obstacles: [
      { shape: "rect", x: 0.5, y: 0.35, w: 0.12, h: 0.18 },
      { shape: "rect", x: 0.5, y: 0.72, w: 0.12, h: 0.18 },
      { shape: "rect", x: 0.28, y: 0.53, w: 0.16, h: 0.045 },
      { shape: "rect", x: 0.72, y: 0.53, w: 0.16, h: 0.045 },
      { x: 0.5, y: 0.53, r: 0.035 },
    ],
    objective: { afterWave: 2, type: "key", label: "GRID AUTHORIZATION", puzzle: ["chaos", "control", "chaos"] },
    waves: [{ turret: 2, sniper: 1 }, { shield: 2, medic: 1, turret: 2 }, { administrator: 1, sniper: 2 }, { core: 1 }],
  },
  {
    id: "chaos-field",
    title: "Chaos Field",
    subtitle: "Erratic swarms make one-mode play feel brittle.",
    badge: "Drift",
    mechanic: { type: "blastDoors", label: "CYCLING BLAST DOORS", period: 4.8 },
    playerStart: { x: 0.48, y: 0.58 },
    obstacles: [
      { shape: "rect", x: 0.2, y: 0.48, w: 0.09, h: 0.26 },
      { shape: "rect", x: 0.8, y: 0.58, w: 0.09, h: 0.26 },
      { x: 0.41, y: 0.34, r: 0.04 },
      { x: 0.59, y: 0.72, r: 0.04 },
      { x: 0.5, y: 0.52, r: 0.03 },
    ],
    objective: { afterWave: 2, type: "key", label: "UNSTABLE ACCESS TOKEN", puzzle: ["pressure", "chaos", "pressure"] },
    waves: [{ wobbler: 5, teleporter: 3 }, { bomber: 3, spinner: 2, wobbler: 3 }, { prototype: 1, teleporter: 3 }, { anomaly: 1 }],
  },
  {
    id: "phase-boundary",
    title: "Phase Boundary",
    subtitle: "Mixed pressure, constraint, and disruption stack into regime shifts.",
    badge: "Mixed",
    mechanic: { type: "platforms", label: "RETRACTING PHASE PLATFORMS", period: 5.2 },
    playerStart: { x: 0.5, y: 0.57 },
    obstacles: [
      { shape: "rect", x: 0.5, y: 0.52, w: 0.22, h: 0.055 },
      { shape: "rect", x: 0.24, y: 0.34, w: 0.12, h: 0.16 },
      { shape: "rect", x: 0.76, y: 0.7, w: 0.12, h: 0.16 },
      { x: 0.26, y: 0.72, r: 0.042 },
      { x: 0.74, y: 0.33, r: 0.042 },
    ],
    objective: { afterWave: 2, type: "key", label: "PHASE-SEAM KEY", puzzle: ["control", "chaos", "pressure"] },
    waves: [
      { sprinter: 3, teleporter: 3, sniper: 1 },
      { bruiser: 1, shield: 1, bomber: 2, medic: 1 },
      { foreman: 1, administrator: 1, prototype: 1 },
      { lattice: 1 },
    ],
  },
  {
    id: "collapse-boss",
    title: "Collapse Run",
    subtitle: "A compact finale built to test your ability to cycle under stress.",
    badge: "Finale",
    mechanic: { type: "fireWalls", label: "FURNACE WALLS", period: 4.4 },
    playerStart: { x: 0.5, y: 0.6 },
    obstacles: [
      { shape: "rect", x: 0.5, y: 0.32, w: 0.3, h: 0.045 },
      { shape: "rect", x: 0.5, y: 0.76, w: 0.3, h: 0.045 },
      { shape: "rect", x: 0.28, y: 0.54, w: 0.08, h: 0.24 },
      { shape: "rect", x: 0.735, y: 0.51, w: 0.08, h: 0.2 },
      { x: 0.5, y: 0.54, r: 0.04 },
    ],
    objective: { afterWave: 2, type: "key", label: "REACTOR MASTER KEY", puzzle: ["pressure", "control", "chaos", "pressure"] },
    waves: [
      { rammer: 2, teleporter: 3, sniper: 2 },
      { foreman: 1, administrator: 1, prototype: 1 },
      { bruiser: 2, shield: 2, bomber: 3, medic: 1 },
      { crown: 1 },
    ],
  },
  {
    id: "signal-nexus",
    title: "Signal Nexus",
    subtitle: "Director Null synchronizes the city into one flawless, lifeless signal.",
    badge: "Final Signal",
    mechanic: { type: "nexus", label: "NULL SYNCHRONIZATION FIELD", period: 6.2 },
    playerStart: { x: 0.5, y: 0.64 },
    obstacles: [
      { shape: "rect", x: 0.5, y: 0.30, w: 0.28, h: 0.04 },
      { shape: "rect", x: 0.5, y: 0.76, w: 0.28, h: 0.04 },
      { x: 0.28, y: 0.52, r: 0.045 },
      { x: 0.72, y: 0.52, r: 0.045 },
    ],
    objective: { afterWave: 2, type: "key", label: "ADAPTIVE SIGNAL KEY", puzzle: ["chaos", "control", "pressure", "chaos"] },
    waves: [
      { shield: 2, sniper: 2, teleporter: 2 },
      { administrator: 1, foreman: 1, prototype: 1 },
      { lattice: 1 },
      { null: 1 },
    ],
  },
];

const SURVIVAL_LEVEL = {
  id: "survival",
  title: "Survival",
  subtitle: "Endless arena. Score hard, keep EBID low, do not collapse.",
  badge: "Arcade",
  endless: true,
  playerStart: { x: 0.5, y: 0.58 },
  obstacles: [
    { x: 0.29, y: 0.45, r: 0.055 },
    { shape: "rect", x: 0.68, y: 0.38, w: 0.22, h: 0.05 },
    { x: 0.57, y: 0.71, r: 0.052 },
    { shape: "rect", x: 0.28, y: 0.73, w: 0.16, h: 0.045 },
  ],
  waves: [{ wobbler: 7 }, { rusher: 5, wobbler: 3 }, { turret: 3, rusher: 3, wobbler: 2 }],
};

const INTRO_CUTSCENES = [
  {
    image: `${STORY_ART_DIR}intro_01.png`,
    kicker: "Archive 00 / 07",
    title: "Before the Switch",
    location: "North Array / public observation gallery",
    signal: "HISTORICAL RECORD",
    speaker: "MARA-7, archive custodian",
    body: "Before anyone called it PCC, the city treated every crisis as a choice between pushing harder and locking everything down. Both worked—briefly.",
    beat: "A school tour watches the old reactor turn beneath the glass. One child notices the warning light before the adults do.",
    cast: ["mara", "rsw", "drone"],
    actors: [
      { role: "mara", position: "left", pose: "watch" },
      { role: "rsw", position: "center", pose: "curious" },
    ],
  },
  {
    image: `${STORY_ART_DIR}intro_01.png`,
    kicker: "Archive 01 / 07",
    title: "The Drift",
    location: "North Array / twelve years later",
    signal: "REACTOR LOG",
    speaker: "MARA-7",
    body: "The reactor did not fail all at once. It drifted, one stable-looking loop at a time. The instruments stayed green because the instruments had learned to expect the mistake.",
    beat: "The room keeps moving while the record plays: fans turn, a cart crosses the gantry, and a technician quietly covers a cracked gauge with a clipboard.",
    cast: ["mara", "engineer", "drone"],
    actors: [
      { role: "mara", position: "left", pose: "concerned" },
      { role: "engineer", position: "right", pose: "watch" },
    ],
  },
  {
    image: `${STORY_ART_DIR}intro_02.png`,
    kicker: "Archive 02 / 07",
    title: "Pressure",
    location: "Emergency chamber / impact trial",
    signal: "FORCE TRACE",
    speaker: "DR. VALE, systems physicist",
    body: "Pressure is directed action: acceleration, commitment, the shove that breaks a deadlock. It saved the first chamber. Then the operators kept pressing after the chamber had nowhere left to move.",
    beat: "Vale demonstrates with three magnetic blocks. The red block wins the race, overshoots, and knocks his coffee into the console. He keeps talking while a drone cleans it up.",
    cast: ["vale", "rsw", "drone"],
    actors: [
      { role: "vale", position: "left", pose: "talk" },
      { role: "rsw", position: "right", pose: "brace" },
    ],
  },
  {
    image: `${STORY_ART_DIR}intro_03.png`,
    kicker: "Archive 03 / 07",
    title: "Control",
    location: "Prediction lab / model theater",
    signal: "GRID REPORT",
    speaker: "IONA, routing intelligence",
    body: "Control is constraint made useful: measurement, boundaries, repeatability. It made the damage legible. Then certainty became a cage, and the model rejected every route it had not already predicted.",
    beat: "A perfect blue route appears. R-SW-01 tries it, bumps into a maintenance stool that was not in the model, and looks back at Iona in silence.",
    cast: ["iona", "rsw", "drone"],
    actors: [
      { role: "rsw", position: "left", pose: "notice" },
      { role: "iona", position: "right", pose: "watch" },
    ],
  },
  {
    image: `${STORY_ART_DIR}intro_04.png`,
    kicker: "Archive 04 / 07",
    title: "Chaos",
    location: "Unmapped service district",
    signal: "DRIFT CAPTURE",
    speaker: "KIP, salvage runner",
    body: "Kip never called it Chaos. Kip called it \"the door you haven't tried yet.\" Three locked exits, one working key, and a service district that had stopped trusting its own map. Nobody in that district asked what Chaos was for. They asked which door.",
    beat: "Kip opens three doors at random. One is an exit, one is a broom closet, and one releases a flock of inspection drones. Nobody reacts quickly enough to look cool.",
    cast: ["kip", "rsw", "drone"],
    actors: [
      { role: "kip", position: "left", pose: "smirk" },
      { role: "rsw", position: "right", pose: "surprise" },
    ],
  },
  {
    image: `${STORY_ART_DIR}intro_05.png`,
    kicker: "Archive 05 / 07",
    title: "The PCC Loop",
    location: "Training rail / live demonstration",
    signal: "COUNTER CYCLE",
    speaker: "DR. VALE",
    body: "PCC is not three factions and it is not a personality quiz. It is a loop. Pressure disrupts unmanaged Chaos. Control redirects runaway Pressure. Chaos escapes rigid Control. Each regime becomes dangerous when mistaken for a permanent answer.",
    beat: "The three demonstration lights chase one another around the chamber. R-SW-01 reaches for the red switch, hesitates, and deliberately chooses blue instead.",
    cast: ["vale", "mara", "rsw"],
    actors: [
      { role: "vale", position: "left", pose: "talk" },
      { role: "rsw", position: "center", pose: "think" },
      { role: "mara", position: "right", pose: "watch" },
    ],
  },
  {
    image: `${STORY_ART_DIR}intro_05.png`,
    kicker: "Archive 06 / 07",
    title: "Why RoboSwitch",
    location: "Deployment lift / present day",
    signal: "UNIT MEMORY",
    speaker: "MARA-7",
    body: "Every specialized unit before R-SW-01 failed the exact same way, just at different speeds: each one kept doing the thing it was good at long after the room had stopped rewarding it. R-SW-01 shipped without a favored regime. The lab's paperwork still lists that under Known Defects. Nobody has corrected the paperwork.",
    beat: "The lift begins moving before Mara finishes. She steadies an old stack of paper records; R-SW-01 catches the one page she misses.",
    cast: ["mara", "rsw", "drone"],
    actors: [
      { role: "mara", position: "left", pose: "watch" },
      { role: "rsw", position: "center", pose: "notice" },
    ],
  },
  {
    image: `${STORY_ART_DIR}between_01_tutorial_loop.png`,
    kicker: "Deployment 01",
    title: "The First Chamber",
    location: "Training rail / breach alarm",
    signal: "LIVE INCIDENT",
    speaker: "IONA",
    body: "This was supposed to be a demonstration. A drift cluster has entered the chamber, the safety doors are sealing, and the old automatic defenses are classifying every moving object as a threat—including you.",
    beat: "The briefing display cuts out mid-sentence. Red light reaches the room one fixture at a time. R-SW-01 looks to Mara; Mara looks at the closing door; then both look toward the arena.",
    cast: ["iona", "mara", "rsw"],
    actors: [
      { role: "mara", position: "left", pose: "concerned" },
      { role: "rsw", position: "center", pose: "brace" },
      { role: "iona", position: "right", pose: "watch" },
    ],
  },
];

const LEVEL_CUTSCENE_IMAGES = [
  "between_01_tutorial_loop.png",
  "between_02_pressure_front.png",
  "between_03_control_grid.png",
  "between_04_chaos_field.png",
  "between_05_phase_boundary.png",
  "between_06_collapse_run.png",
  // signal-nexus (final level) has no dedicated panel yet and falls back to
  // collapse-boss's art below. Flagged in ART_NEEDED.md — draw between_07,
  // or replace this comment once the echo is confirmed intentional.
  "between_06_collapse_run.png",
];

const LEVEL_BRIEFS = [
  {
    callout: "First loop: learn the counter cycle before the lab asks for speed.",
    chamber: "Wide recovery pockets with one low barricade.",
    signal: "TRAINING RAIL",
    focus: "chaos",
  },
  {
    callout: "A pressure corridor that rewards decisive switches, then punishes tunnel vision.",
    chamber: "Offset cover creates two burst lanes.",
    signal: "IMPACT FRONT",
    focus: "pressure",
  },
  {
    callout: "Control sightlines turn the room into a measuring device.",
    chamber: "Cross braces split safe routing into quadrants.",
    signal: "SCAN GRID",
    focus: "control",
  },
  {
    callout: "Chaos drift makes the map feel slippery until you shape it back.",
    chamber: "Asymmetric posts break straight-line habits.",
    signal: "DRIFT MAP",
    focus: "chaos",
  },
  {
    callout: "Mixed signals stack until the player has to read the whole system.",
    chamber: "Central seam with diagonal recovery corners.",
    signal: "PHASE SEAM",
    focus: "control",
  },
  {
    callout: "The furnace tests commitment without surrendering judgment.",
    chamber: "A boxed reactor lane with four pressure gates.",
    signal: "COLLAPSE RUN",
    focus: "pressure",
  },
  {
    callout: "Final signal: listen, disrupt, stabilize, and act before perfect control becomes silence.",
    chamber: "The citywide synchronization chamber.",
    signal: "SIGNAL NEXUS",
    focus: "control",
  },
];

const INTRO_LEDGER = {
  "The Drift": {
    source: "Reactor log",
    clue: "Failure begins as ordinary-looking repetition.",
    next: "Pressure arrives first because action is the visible symptom.",
  },
  Pressure: {
    source: "Impact trace",
    clue: "Speed saves the bot, then corners it.",
    next: "Control enters when the lab tries to predict the damage.",
  },
  Control: {
    source: "Grid report",
    clue: "Measurement makes survival possible, then makes it too stiff.",
    next: "Chaos opens an exit through the overfit pattern.",
  },
  Chaos: {
    source: "Drift capture",
    clue: "Escape becomes scatter unless it is shaped.",
    next: "RoboSwitch learns to carry the loop instead of choosing one side.",
  },
  RoboSwitch: {
    source: "Unit memory",
    clue: "The bot is not Pressure, Control, or Chaos. It is the switch.",
    next: "Enter the chamber and prove the loop under stress.",
  },
};


const BOSS_STORIES = {
  "tutorial-loop": {
    name: "Prototype C-13", title: "The Unfinished Signal", type: "chaos",
    intro: "A training prototype wakes before its calibration finishes. Its movements arrive out of order, but its fear is perfectly clear.",
    boast: "NO PATTERN. NO CAGE. TRY TO KEEP UP.",
    defeat: "C-13 stops laughing long enough to watch RoboSwitch change modes. For the first time, it copies a choice instead of a glitch.",
    lesson: "Random motion can escape a cage. It cannot choose where to go next."
  },
  "pressure-front": {
    name: "Marshal Surge", title: "The Forward Signal", type: "pressure",
    intro: "Surge enters shoulder-first, hydraulic stacks already screaming. Even while standing still, every plate of his armor leans forward.",
    boast: "A signal that changes direction has already lost.",
    defeat: "Surge drops to one knee, vents a long breath of steam, and finally stops pushing. He offers RoboSwitch his hand.",
    lesson: "Force can break a deadlock. Wisdom knows when the obstacle has already moved."
  },
  "control-grid": {
    name: "Curator Vector", title: "The Predicted Signal", type: "control",
    intro: "Vector glides into a perfectly aligned grid. His narrow glass frame never wastes a movement; the room rotates to face him instead.",
    boast: "Your movements have been analyzed. The outcome is already known.",
    defeat: "One misaligned light remains in Vector's flawless model. He studies it, then RoboSwitch, and allows himself the smallest smile.",
    lesson: "A model that cannot admit surprise cannot learn."
  },
  "chaos-field": {
    name: "Jinx Parallax", title: "Nice To Finally Meet You", type: "chaos",
    intro: "Parallax appears upside down, vanishes mid-wave, and returns wearing a different shoulder plate. She is delighted to meet someone unpredictable.",
    boast: "You keep changing! Finally—someone interesting.",
    defeat: "Parallax falls over laughing, then goes quiet. She admits that endless possibility never gave her anywhere to arrive.",
    lesson: "Variation opens paths. Commitment makes one of them real."
  },
  "phase-boundary": {
    name: "Warden Lattice", title: "The Bounded Signal", type: "control",
    intro: "Lattice unfolds from the doors themselves: a tall rectangular body built from locks, rails, and luminous boundary lines.",
    boast: "Every signal has a permitted channel. Return to yours.",
    defeat: "The doors remain open behind her. Workers cross the old boundary, and Lattice watches without stopping them.",
    lesson: "A boundary can protect a life—or prevent it from moving."
  },
  "collapse-boss": {
    name: "Furnace Crown", title: "The Tempered Signal", type: "pressure",
    intro: "An ancient forge guardian rises from the heat. Molten seams glow beneath an iron crown; each slow step makes ash fall from the ceiling.",
    boast: "Heat reveals the structure beneath the shell.",
    defeat: "Crown lowers his hammer instead of dropping it. He bows, accepting that strength is tempered by change rather than proven by refusal.",
    lesson: "The strongest structure bends before it breaks."
  },
  "signal-nexus": {
    name: "Director Null", title: "The Silent Signal", type: "control",
    intro: "The music disappears. Null arrives at ordinary height, immaculate and almost weightless. He never walks; the entire chamber moves for him.",
    boast: "You have exceeded every prediction. That is why you cannot continue.",
    defeat: "Null asks why perfection failed. Fli lands on his shoulder for one quiet second. RoboSwitch answers: Because perfection never listens.",
    lesson: "Stability is not stillness. It is the ability to change without losing yourself."
  },
};

const BOSS_KIND_BY_LEVEL = {
  "tutorial-loop": "prototype",
  "pressure-front": "surge",
  "control-grid": "core",
  "chaos-field": "anomaly",
  "phase-boundary": "lattice",
  "collapse-boss": "crown",
  "signal-nexus": "null",
};

function bossStoryForLevel(level = state?.level) {
  return BOSS_STORIES[level?.id] || null;
}

function bossCutscene(level, phase = "intro") {
  const story = bossStoryForLevel(level);
  if (!story) return null;
  const isIntro = phase === "intro";
  const index = Math.max(0, LEVELS.findIndex((item) => item.id === level.id));
  return {
    image: `${STORY_ART_DIR}${LEVEL_CUTSCENE_IMAGES[index] || LEVEL_CUTSCENE_IMAGES.at(-1)}`,
    kicker: isIntro ? "BOSS SIGNAL DETECTED" : "SIGNAL RESTORED",
    title: `${story.name} — ${story.title}`,
    body: isIntro ? `${story.intro} “${story.boast}”` : `${story.defeat} ${story.lesson}`,
    signal: `${story.type.toUpperCase()} SIGNATURE`,
    location: `${level.title} / primary chamber`,
    speaker: isIntro ? story.name : "FLI / FIELD LINK",
    beat: isIntro
      ? "Fli's wings slow to a hover. She projects the boss signature, folds behind RoboSwitch's shoulder, and chirps once: ready."
      : "Fli draws a small circle of light between both machines. The arena's warning tone resolves into a warm three-note signal.",
    cast: ["rsw", "drone"],
    bossKind: BOSS_KIND_BY_LEVEL[level.id],
    bossPhase: phase,
    ledger: { source: story.name, clue: story.boast, next: story.lesson },
  };
}

function renderBossCutscenePortrait(scene) {
  if (!scene?.bossKind) return "";
  const kind = escapeHtml(scene.bossKind);
  const phase = escapeHtml(scene.bossPhase || "intro");
  return `
    <div class="boss-cutscene-portrait boss-${kind} boss-${phase}" aria-hidden="true">
      <div class="boss-signal-ring ring-a"></div>
      <div class="boss-signal-ring ring-b"></div>
      <div class="boss-figure">
        <span class="boss-head"><i></i><b></b></span>
        <span class="boss-torso"></span>
        <span class="boss-arm arm-left"></span>
        <span class="boss-arm arm-right"></span>
        <span class="boss-leg leg-left"></span>
        <span class="boss-leg leg-right"></span>
        <span class="boss-prop"></span>
      </div>
    </div>`;
}

const RESULT_QUIPS = {
  win: [
    "Resting switch face: achieved.",
    "Tiny robot status: quietly smug.",
    "Package delivered. Conveyor emotionally stable.",
    "The lab blinked twice. That is probably applause.",
    "Switch posture: heroic, but trying not to make it weird.",
  ],
  collapse: [
    "The bot calls that a rehearsal.",
    "Reset face: extremely professional.",
    "Small wheel squeak detected. Morale remains operational.",
    "The lab writes: good idea, wrong order.",
    "A tiny clipboard appears. It only says: again?",
  ],
};

const DEFAULT_DRAFT = {
  name: "Lab Arena",
  obstacles: [
    { x: 0.3, y: 0.45, r: 0.055 },
    { x: 0.68, y: 0.62, r: 0.06 },
  ],
  spawns: [
    { kind: "wobbler", x: 0.72, y: 0.34, wave: 1 },
    { kind: "rusher", x: 0.22, y: 0.72, wave: 2 },
    { kind: "turret", x: 0.78, y: 0.72, wave: 3 },
  ],
  waves: [{ wobbler: 4 }, { rusher: 3 }, { turret: 2 }, { wobbler: 4, rusher: 3, turret: 2 }],
  playerStart: { x: 0.5, y: 0.58 },
};

const keys = new Set();
const pointer = { down: false, seen: false, x: 0, y: 0, movedAt: 0 };
const arenaReactorMark = new Image();
arenaReactorMark.src = `${PIXEL_ART_DIR}revisions/arena_reactor_mark_v1.png`;
const terminalState = {
  timers: [],
  target: null,
  text: "",
  fullText: "",
  active: false,
  done: true,
};

// Newgrounds build: keep substantially more logical world space inside the
// same embed. The previous 0.68 scale effectively zoomed actors ~47% larger
// than a 1:1 logical canvas. 0.92 keeps the chunky readability while giving
// the player and enemies much better breathing room in a typical 960x540 NG embed.
const NEWGROUNDS_ARENA_SCALE = 0.92;
const PLAYER_SPEED_MULTIPLIER = 1.5;

let dpr = 1;
let width = 960;
let height = 540;
let lastTime = 0;
let animationFrame = 0;
let ambientTime = 0;
let screenBootTimer = 0;
let interfaceGlitchTimer = 0;
let obstacles = [];
let state = null;

const app = {
  screen: "menu",
  previousScreen: "menu",
  playMode: "campaign",
  levelIndex: 0,
  currentLevel: null,
  save: loadSave(),
  editorTool: "obstacle",
  editorDraft: null,
  editorCode: "",
  editorStatus: "",
  cutsceneQueue: [],
  cutsceneIndex: 0,
  cutsceneComplete: null,
  result: null,
  rebindingMode: null,
  controlBindStatus: "",
};

app.editorDraft = structuredCloneSafe(app.save.customLevel || DEFAULT_DRAFT);

const titleAtmosphereController = createTitleAtmosphere({
  reducedMotionQuery: REDUCED_MOTION_QUERY,
  getVisualQuality,
  getMusicOptions: () => app.save.options,
  getScreen: () => app.screen,
  rand,
  clamp,
});

const ngBridge = {
  unlockMedal(name) {
    if (window.RoboSwitchNG?.unlockMedal) window.RoboSwitchNG.unlockMedal(name);
  },
  postScore(board, score) {
    if (window.RoboSwitchNG?.postScore) window.RoboSwitchNG.postScore(board, score);
  },
};

const audio = {
  ctx: null,
  master: null,
  musicGain: null,
  sfxGain: null,
  cue: "",
  score: null,
  timer: 0,
  step: 0,
  nextStepTime: 0,
  lastSfx: {},
  noiseBuffer: null,
};


const FILE_SFX_DEFINITIONS = Object.freeze({
  switchSnap: "ui_switch_snap.ogg",
  switchCommit: "ui_confirm_clunk.ogg",
  mode: {
    pressure: "switch_pressure.ogg",
    control: "switch_control.ogg",
    chaos: "switch_chaos.ogg",
  },
  pulse: {
    pressure: "pulse_pressure_hit.ogg",
    control: "pulse_control_shot.ogg",
    chaos: "pulse_chaos_arc.ogg",
  },
  ability: {
    pressure: "burst_pressure_overdrive.ogg",
    control: "burst_control_lock.ogg",
    chaos: "burst_chaos_warp.ogg",
  },
  fli: {
    alert: "fli_chirp_alert.ogg",
    celebrate: "fli_chirp_happy.ogg",
    curious: "fli_chirp_think.ogg",
    default: "fli_chirp_think.ogg",
  },
  bossIntro: "boss_intro_latch.ogg",
  bossDefeat: "boss_defeat_release.ogg",
  terminalAccept: "terminal_accept.ogg",
  nullPing: "null_silence_ping.ogg",
});

const fileSfxCache = new Map();

// Fli voice-over is intentionally much rarer than her text/chirp cues. These
// Story lines mark memorable beats instead of becoming combat chatter.
const VOICE_DEFINITIONS = Object.freeze({
  doorMoved: "voice_did_that_door_just_move.ogg",
  loopStabilized: "voice_loop_stabilized.ogg",
  smooth: "voice_okay_that_was_smooth.ogg",
  bossLocked: "voice_boss_signal_locked.ogg",
  signalBroken: "voice_signal_broken_keep_going.ogg",
  signalRestored: "voice_signal_restored.ogg",
  systemCollapse: "voice_system_collapse.ogg",
  almostGotYou: "voice_that_one_almost_got_you.ogg",
  rhythm: "voice_read_the_rhythm_break_the_loop.ogg",
  triad: "voice_use_the_power_of_the_stability_triad.ogg",
  youOkay: "voice_you_okay_switch.ogg",
});

const voiceState = { lastAt: -Infinity, played: new Set() };
// Narration is seasoning, not combat chatter: only about 1 in 10 eligible
// scripted cues play, and spoken lines are always separated by 10 seconds.
const VOICE_MIN_GAP_MS = 10000;
const VOICE_PLAY_CHANCE = 0.10;

function playVoice(name, { once = null, volume = 0.9, force = false } = {}) {
  if (app.save.options.muted || Number(app.save.options.sfx) <= 0) return false;
  const filename = VOICE_DEFINITIONS[name];
  if (!filename) return false;
  const onceKey = once || name;
  if (onceKey && voiceState.played.has(onceKey)) return false;
  const now = performance.now();
  if (now - voiceState.lastAt < VOICE_MIN_GAP_MS) return false;
  // Even formerly "forced" story/boss/result cues participate in the rarity
  // gate so the player does not hear Fli every few beats.
  if (Math.random() > VOICE_PLAY_CHANCE) return false;

  let template = fileSfxCache.get(filename);
  if (!template) {
    template = new Audio(new URL(`../assets/music/${filename}`, import.meta.url).href);
    template.preload = "metadata";
    template.setAttribute("playsinline", "");
    fileSfxCache.set(filename, template);
  }
  const voice = template.cloneNode();
  voice.volume = clamp(Number(app.save.options.sfx) || 0, 0, 1) * clamp(volume, 0, 1);
  voice.play().catch(() => {});
  voiceState.lastAt = now;
  if (onceKey) voiceState.played.add(onceKey);
  return true;
}

function fileSfxName(name, detail = null) {
  const definition = FILE_SFX_DEFINITIONS[name];
  if (!definition) return null;
  if (typeof definition === "string") return definition;
  return definition[detail] || definition.default || null;
}

function playFileSfx(name, detail = null, volume = 1) {
  if (app.save.options.muted || Number(app.save.options.sfx) <= 0) return false;
  const filename = fileSfxName(name, detail);
  if (!filename) return false;
  let template = fileSfxCache.get(filename);
  if (!template) {
    template = new Audio(new URL(`../assets/music/${filename}`, import.meta.url).href);
    template.preload = "auto";
    template.setAttribute("playsinline", "");
    fileSfxCache.set(filename, template);
  }
  const voice = template.cloneNode();
  voice.volume = clamp(Number(app.save.options.sfx) || 0, 0, 1) * clamp(volume, 0, 1);
  voice.play().catch(() => {});
  return true;
}

const MUSIC_TRACKS = {
  bass: { wave: "triangle", gain: 0.046, attack: 0.006, release: 0.08, sustain: 0.55, gate: 0.88, filterFreq: 640, q: 0.7 },
  lead: { wave: "square", gain: 0.023, attack: 0.006, release: 0.1, sustain: 0.44, gate: 0.78, filterFreq: 2200, q: 1.1 },
  chord: { wave: "triangle", gain: 0.015, attack: 0.035, release: 0.28, sustain: 0.52, gate: 0.95, filterFreq: 1050, q: 0.8 },
  arp: { wave: "square", gain: 0.013, attack: 0.004, release: 0.05, sustain: 0.25, gate: 0.58, filterFreq: 3400, q: 0.65 },
};

// One idea: the lead gently rocks upward, answers downward, then comes home.
const MUSIC_SCORES = buildMusicScores();

function buildMusicScores() {
  return {
    menu: buildWorkshopScore("Tiny Workshop", 104, { drums: true, arp: true, lead: true, volume: 1 }),
    cutscene: buildWorkshopScore("Signal Thread", 92, { drums: false, arp: false, lead: "sparse", volume: 0.74 }),
    game: buildMusicScore(),
    victory: buildFinalScore("Loop Stabilized", 104, "victory"),
    collapse: buildFinalScore("System Drift", 84, "collapse"),
    credits: buildWorkshopScore("Workshop Lights", 100, { drums: true, arp: true, lead: "credits", volume: 0.86 }),
  };
}

function buildMusicScore() {
  return buildWorkshopScore("Loop Runner", 116, { drums: "game", arp: false, lead: "game", volume: 0.92 });
}

function buildEmptyScore(title, bpm) {
  return {
    title,
    bpm,
    totalSteps: MUSIC_TOTAL_STEPS,
    notesByStep: Array.from({ length: MUSIC_TOTAL_STEPS }, () => []),
    drumsByStep: Array.from({ length: MUSIC_TOTAL_STEPS }, () => []),
  };
}

function addScoreNote(score, track, bar, start, length, midi, volume = 1) {
  const step = (bar * MUSIC_STEPS_PER_BAR + start) % score.totalSteps;
  score.notesByStep[step].push({ track, midi, length, volume });
}

function addScoreChord(score, bar, start, length, pitches, volume = 1) {
  for (const midi of pitches) addScoreNote(score, "chord", bar, start, length, midi, volume / pitches.length ** 0.35);
}

function addScoreDrum(score, bar, start, kind, volume = 1) {
  const step = (bar * MUSIC_STEPS_PER_BAR + start) % score.totalSteps;
  score.drumsByStep[step].push({ kind, volume });
}

function buildWorkshopScore(title, bpm, options = {}) {
  const score = buildEmptyScore(title, bpm);
  const volume = options.volume ?? 1;
  const leadMode = options.lead ?? true;
  const progression = [
    { bass: [[50, 8], [45, 8]], chord: [62, 66, 69] },
    { bass: [[50, 8], [45, 8]], chord: [62, 66, 69] },
    { bass: [[43, 8], [50, 8]], chord: [55, 59, 62] },
    { bass: [[50, 8], [45, 8]], chord: [62, 66, 69] },
    { bass: [[43, 8], [50, 8]], chord: [55, 59, 62] },
    { bass: [[45, 8], [52, 8]], chord: [57, 61, 64] },
    { bass: [[47, 8], [54, 8]], chord: [59, 62, 66] },
    { bass: [[45, 8], [50, 8]], chord: [57, 61, 64] },
  ];
  const melody = [
    [[0, 4, 74, 0.92], [5, 2, 76, 0.7], [8, 2, 78, 0.76], [11, 4, 81, 0.86]],
    [[0, 4, 78, 0.82], [5, 2, 76, 0.7], [8, 4, 74, 0.86]],
    [[0, 4, 74, 0.88], [5, 2, 76, 0.7], [8, 2, 78, 0.76], [11, 4, 81, 0.88]],
    [[0, 4, 81, 0.82], [5, 4, 78, 0.76], [10, 2, 76, 0.68], [13, 3, 74, 0.88]],
    [[0, 4, 76, 0.82], [5, 2, 78, 0.72], [8, 2, 79, 0.74], [11, 4, 81, 0.86]],
    [[0, 4, 78, 0.78], [5, 2, 76, 0.68], [8, 4, 74, 0.84]],
    [[0, 4, 81, 0.84], [5, 2, 83, 0.68], [8, 4, 81, 0.76], [13, 2, 78, 0.72]],
    [[0, 6, 74, 0.9], [9, 2, 76, 0.62], [12, 3, 74, 0.86]],
  ];

  progression.forEach((barData, bar) => {
    let cursor = 0;
    for (const [midi, length] of barData.bass) {
      addScoreNote(score, "bass", bar, cursor, length, midi, 0.78 * volume);
      cursor += length;
    }
    addScoreChord(score, bar, 0, 14, barData.chord, 0.42 * volume);
  });

  if (leadMode) {
    melody.forEach((notes, bar) => {
      if (leadMode === "sparse" && bar % 2 === 1) return;
      if (leadMode === "game" && bar % 4 === 3) return;
      for (const [start, length, midi, noteVolume] of notes) {
        const octaveShift = leadMode === "credits" && bar >= 4 ? -12 : 0;
        addScoreNote(score, "lead", bar, start, length, midi + octaveShift, noteVolume * volume);
      }
    });
  }

  if (options.arp) {
    for (let bar = 0; bar < 8; bar += 1) {
      const chord = progression[bar].chord;
      for (let i = 0; i < 2; i += 1) {
        addScoreNote(score, "arp", bar, i * 8 + 6, 1, chord[i % chord.length] + 24, 0.22 * volume);
      }
    }
  }

  if (options.drums) {
    for (let bar = 0; bar < 8; bar += 1) {
      addScoreDrum(score, bar, 0, "ghost", 0.26 * volume);
      addScoreDrum(score, bar, 8, "hat", 0.3 * volume);
      if (options.drums === "game") addScoreDrum(score, bar, 12, "hat", 0.2 * volume);
    }
  }
  return score;
}

function buildFinalScore(title, bpm, mood) {
  const score = buildEmptyScore(title, bpm);
  const collapse = mood === "collapse";
  const roots = collapse ? [50, 45, 43, 45, 50, 45, 43, 50] : [50, 43, 45, 50, 43, 45, 47, 50];
  const chords = collapse
    ? [[62, 66, 69], [57, 61, 64], [55, 59, 62], [57, 61, 64]]
    : [[62, 66, 69], [55, 59, 62], [57, 61, 64], [62, 66, 69]];
  const leadLine = collapse
    ? [[0, 5, 74], [8, 4, 72]]
    : [[0, 4, 74], [5, 2, 76], [8, 2, 78], [11, 4, 81]];

  for (let bar = 0; bar < 8; bar += 1) {
    const root = roots[bar];
    addScoreNote(score, "bass", bar, 0, 8, root, collapse ? 0.42 : 0.62);
    addScoreNote(score, "bass", bar, 8, 8, bar === 7 ? 50 : root - 5, collapse ? 0.3 : 0.46);
    addScoreChord(score, bar, 0, 14, chords[bar % chords.length], collapse ? 0.3 : 0.46);
    if (!collapse || bar % 2 === 0) {
      for (const [start, length, midi] of leadLine) addScoreNote(score, "lead", bar, start, length, midi - (collapse ? 12 : 0), collapse ? 0.36 : 0.58);
    }
    if (!collapse && bar % 2 === 1) addScoreDrum(score, bar, 8, "hat", 0.24);
  }
  return score;
}

function ensureAudio() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return false;

  if (!audio.ctx) {
    audio.ctx = new AudioContext();
    audio.master = audio.ctx.createGain();
    audio.musicGain = audio.ctx.createGain();
    audio.sfxGain = audio.ctx.createGain();
    audio.master.gain.value = 0.92;
    audio.musicGain.connect(audio.master);
    audio.sfxGain.connect(audio.master);
    audio.master.connect(audio.ctx.destination);
  }

  if (audio.ctx.state === "suspended") {
    audio.ctx.resume();
  }

  applyAudioSettings();
  notifyMusicInteraction();
  return true;
}

function applyAudioSettings() {
  if (!audio.ctx) return;
  const now = audio.ctx.currentTime;
  const muted = Boolean(app.save.options.muted);
  const musicVolume = muted ? 0 : clamp(Number(app.save.options.music) || 0, 0, 1) * 0.62;
  const sfxVolume = muted ? 0 : clamp(Number(app.save.options.sfx) || 0, 0, 1) * 0.82;
  audio.musicGain.gain.setTargetAtTime(musicVolume, now, 0.035);
  audio.sfxGain.gain.setTargetAtTime(sfxVolume, now, 0.025);
}

function updateAudioState() {
  applyAudioSettings();

  setMusicSettings({
    volume: app.save.options.music,
    muted: app.save.options.muted,
  });

  if (state?.ended) {
    return;
  }

  if (app.screen === "pause") {
    pauseMusic();
    return;
  }

  if (
    app.previousScreen === "pause" &&
    app.screen === "playing"
  ) {
    resumeMusic();
    return;
  }

  if (app.screen === "playing") {
    playMusic(Music.GAMEPLAY);
    return;
  }

  if (app.screen === "credits") {
    playMusic(Music.ENDING);
    return;
  }

  if (
    app.screen === "menu" ||
    app.screen === "levels" ||
    app.screen === "options" ||
    app.screen === "how" ||
    app.screen === "editor" ||
    app.screen === "cutscene"
  ) {
    playMusic(Music.TITLE);
  }
}

function startMusicLoop() {
  if (!audio.ctx) return;
  updateMusicCue();
  if (audio.timer) return;
  audio.nextStepTime = audio.ctx.currentTime + 0.06;
  audio.timer = window.setInterval(scheduleMusic, 25);
}

function scheduleMusic() {
  if (!audio.ctx) return;
  const score = audio.score || MUSIC_SCORES.menu;
  const scheduleUntil = audio.ctx.currentTime + 0.14;
  while (audio.nextStepTime < scheduleUntil) {
    scheduleMusicStep(score, audio.step, audio.nextStepTime);
    audio.step = (audio.step + 1) % score.totalSteps;
    audio.nextStepTime += 60 / score.bpm / 4;
  }
}

function scheduleMusicStep(score, step, time) {
  for (const note of score.notesByStep[step] || []) playMusicNote(note, time, score);
  for (const drum of score.drumsByStep[step] || []) playMusicDrum(drum, time);
}

function updateMusicCue() {
  const cue = musicCueForApp();
  if (audio.cue === cue && audio.score) return;
  audio.cue = cue;
  audio.score = MUSIC_SCORES[cue] || MUSIC_SCORES.menu;
  audio.step = 0;
  audio.nextStepTime = audio.ctx.currentTime + 0.08;
  playMusicStinger(cue);
}

function musicCueForApp() {
  if (state?.ended) return state.won ? "victory" : "collapse";
  if (app.screen === "playing") return "game";
  if (app.screen === "cutscene") return "cutscene";
  if (app.screen === "credits") return "credits";
  return "menu";
}

function playMusicStinger(cue) {
  if (!audio.ctx || !audio.musicGain || app.save.options.muted || Number(app.save.options.music) <= 0) return;
  const now = audio.ctx.currentTime + 0.01;
  const volume = 0.036 * clamp(Number(app.save.options.music) || 0, 0, 1);
  if (cue === "game") {
    playTone(146.83, now, 0.08, "triangle", volume * 0.8, audio.musicGain, { attack: 0.002, release: 0.06, slideTo: 293.66, filterFreq: 1200 });
    playNoise(now + 0.04, 0.045, volume * 0.42, audio.musicGain, { filterType: "highpass", filterFreq: 5200, release: 0.04 });
  } else if (cue === "cutscene") {
    playTone(440, now, 0.12, "triangle", volume * 0.55, audio.musicGain, { attack: 0.01, release: 0.12, filterFreq: 1600 });
    playTone(587.33, now + 0.08, 0.16, "triangle", volume * 0.48, audio.musicGain, { attack: 0.01, release: 0.16, filterFreq: 1600 });
  } else if (cue === "victory") {
    [587.33, 739.99, 880].forEach((freq, index) => {
      playTone(freq, now + index * 0.075, 0.2, "square", volume * 0.58, audio.musicGain, { attack: 0.006, release: 0.16, filterFreq: 2600 });
    });
  } else if (cue === "collapse") {
    playTone(146.83, now, 0.26, "triangle", volume * 0.62, audio.musicGain, { attack: 0.012, release: 0.24, slideTo: 110, filterFreq: 760 });
  } else if (cue === "credits") {
    [587.33, 659.25, 739.99].forEach((freq, index) => {
      playTone(freq, now + index * 0.09, 0.18, "triangle", volume * 0.42, audio.musicGain, { attack: 0.008, release: 0.16, filterFreq: 2100 });
    });
  } else if (cue === "menu") {
    playTone(587.33, now, 0.1, "square", volume * 0.34, audio.musicGain, { attack: 0.006, release: 0.09, filterFreq: 2200 });
    playTone(880, now + 0.08, 0.12, "square", volume * 0.28, audio.musicGain, { attack: 0.006, release: 0.1, filterFreq: 2600 });
  }
}

function playMusicNote(note, time, score = audio.score || MUSIC_SCORES.menu) {
  const config = MUSIC_TRACKS[note.track];
  if (!config) return;
  const stepSeconds = 60 / score.bpm / 4;
  const duration = Math.max(0.035, note.length * stepSeconds * config.gate);
  playTone(midiToFrequency(note.midi), time, duration, config.wave, config.gain * note.volume, audio.musicGain, config);
}

function playMusicDrum(drum, time) {
  const volume = drum.volume || 1;
  if (drum.kind === "kick") {
    playTone(94, time, 0.14, "sine", 0.12 * volume, audio.musicGain, { attack: 0.001, release: 0.12, slideTo: 44, sustain: 0.2 });
  } else if (drum.kind === "snare") {
    playNoise(time, 0.09, 0.06 * volume, audio.musicGain, { filterType: "bandpass", filterFreq: 1350, q: 0.9, release: 0.07 });
    playTone(190, time, 0.045, "triangle", 0.018 * volume, audio.musicGain, { attack: 0.001, release: 0.05 });
  } else if (drum.kind === "open") {
    playNoise(time, 0.18, 0.035 * volume, audio.musicGain, { filterType: "highpass", filterFreq: 6200, release: 0.16, rate: 1.4 });
  } else if (drum.kind === "ghost") {
    playNoise(time, 0.045, 0.032 * volume, audio.musicGain, { filterType: "bandpass", filterFreq: 900, release: 0.04 });
  } else {
    playNoise(time, 0.035, 0.028 * volume, audio.musicGain, { filterType: "highpass", filterFreq: 7600, release: 0.03, rate: 1.6 });
  }
}

function playSfx(name, detail = null) {
  if (!audio.ctx || !audio.sfxGain || app.save.options.muted || Number(app.save.options.sfx) <= 0) return;
  const now = audio.ctx.currentTime;
  const limits = { hit: 0.045, enemyDown: 0.08, combo: 0.1, pickup: 0.08, damage: 0.16, guard: 0.12, mode: 0.045, pulse: 0.045, ability: 0.12, switchTick: 0.025, switchSnap: 0.04, switchCommit: 0.08, fli: 0.09, bossIntro: 0.3, bossDefeat: 0.3, terminalAccept: 0.2, nullPing: 0.3 };
  if (now - (audio.lastSfx[name] || -Infinity) < (limits[name] || 0)) return;
  audio.lastSfx[name] = now;

  // Prefer the OGG library for identity-critical actions. The procedural
  // synthesizer below remains as a fallback for generic impacts and pickups.
  if (playFileSfx(name, detail)) return;

  if (name === "mode") {
    const base = { pressure: 220, control: 330, chaos: 277 }[detail] || 260;
    playTone(base, now, 0.055, "square", 0.12, audio.sfxGain, { attack: 0.002, release: 0.05, filterFreq: 1800 });
    playTone(base * 1.5, now + 0.045, 0.08, "sawtooth", 0.06, audio.sfxGain, { attack: 0.003, release: 0.07, filterFreq: 2400 });
    playNoise(now + 0.01, 0.028, 0.018, audio.sfxGain, { filterType: "bandpass", filterFreq: 1150, release: 0.024 });
  } else if (name === "pulse") {
    const base = { pressure: 185, control: 520, chaos: 300 }[detail] || 280;
    playTone(base, now, 0.055, detail === "control" ? "triangle" : "square", 0.075, audio.sfxGain, { attack: 0.001, release: 0.045, slideTo: detail === "chaos" ? base * 1.22 : base * 0.88, filterFreq: 2600 });
  } else if (name === "ability") {
    const base = { pressure: 130, control: 392, chaos: 247 }[detail] || 220;
    playTone(base, now, 0.11, "sawtooth", 0.14, audio.sfxGain, { attack: 0.003, release: 0.08, slideTo: base * 1.7, filterFreq: 1700 });
    playNoise(now, 0.07, 0.045, audio.sfxGain, { filterType: "highpass", filterFreq: 1700, release: 0.05 });
  } else if (name === "hit") {
    const base = { pressure: 170, control: 410, chaos: 255 }[detail] || 230;
    playTone(base, now, 0.045, "triangle", 0.1, audio.sfxGain, { attack: 0.001, release: 0.04, slideTo: base * 0.74 });
    playNoise(now, 0.035, 0.025, audio.sfxGain, { filterType: "bandpass", filterFreq: 1800, release: 0.03 });
  } else if (name === "enemyDown") {
    playNoise(now, 0.11, 0.065, audio.sfxGain, { filterType: "bandpass", filterFreq: 720, release: 0.09 });
    playTone(96, now, 0.13, "sine", 0.085, audio.sfxGain, { attack: 0.002, release: 0.11, slideTo: 58 });
  } else if (name === "combo") {
    const streak = Math.max(1, Number(detail) || 1);
    const root = 440 * Math.pow(2, Math.min(10, streak) / 24);
    playTone(root, now, 0.07, "square", 0.08, audio.sfxGain, { attack: 0.002, release: 0.055, filterFreq: 3100 });
    playTone(root * 1.5, now + 0.06, 0.09, "square", 0.07, audio.sfxGain, { attack: 0.002, release: 0.07, filterFreq: 3600 });
  } else if (name === "pickup") {
    [523.25, 659.25, 880].forEach((freq, index) => {
      playTone(freq, now + index * 0.045, 0.075, "triangle", 0.07, audio.sfxGain, { attack: 0.002, release: 0.06, filterFreq: 4200 });
    });
  } else if (name === "damage") {
    playNoise(now, 0.13, 0.09, audio.sfxGain, { filterType: "lowpass", filterFreq: 900, release: 0.11 });
    playTone(110, now, 0.2, "sawtooth", 0.075, audio.sfxGain, { attack: 0.002, release: 0.14, slideTo: 67, filterFreq: 580 });
  } else if (name === "guard") {
    [392, 523.25, 783.99].forEach((freq, index) => {
      playTone(freq, now + index * 0.028, 0.12, "triangle", 0.055, audio.sfxGain, { attack: 0.002, release: 0.12, filterFreq: 5200 });
    });
  } else if (name === "fli") {
    const base = detail === "alert" ? 740 : detail === "celebrate" ? 880 : 660;
    playTone(base, now, 0.06, "triangle", 0.055, audio.sfxGain, { attack: 0.002, release: 0.05, filterFreq: 5200 });
    playTone(base * 1.25, now + 0.055, 0.08, "sine", 0.045, audio.sfxGain, { attack: 0.002, release: 0.07, filterFreq: 6000 });
    if (detail === "celebrate") playTone(base * 1.5, now + 0.12, 0.1, "triangle", 0.04, audio.sfxGain, { attack: 0.002, release: 0.08, filterFreq: 6500 });
  } else if (name === "levelClear") {
    [261.63, 329.63, 392, 523.25].forEach((freq, index) => {
      playTone(freq, now + index * 0.095, 0.26, "sawtooth", 0.075, audio.sfxGain, { attack: 0.01, release: 0.2, filterFreq: 2600 });
    });
  } else if (name === "collapse") {
    playNoise(now, 0.36, 0.13, audio.sfxGain, { filterType: "lowpass", filterFreq: 620, release: 0.3 });
    playTone(146.83, now, 0.42, "sawtooth", 0.1, audio.sfxGain, { attack: 0.004, release: 0.35, slideTo: 55, filterFreq: 500 });
  } else if (name === "switchTick") {
    playTone(980, now, 0.018, "square", 0.022, audio.sfxGain, { attack: 0.001, release: 0.018, filterFreq: 5200 });
    playNoise(now, 0.012, 0.008, audio.sfxGain, { filterType: "highpass", filterFreq: 4800, release: 0.012 });
  } else if (name === "switchSnap") {
    playTone(310, now, 0.035, "square", 0.055, audio.sfxGain, { attack: 0.001, release: 0.028, slideTo: 245, filterFreq: 2200 });
    playTone(760, now + 0.022, 0.026, "triangle", 0.028, audio.sfxGain, { attack: 0.001, release: 0.024, filterFreq: 4000 });
    playNoise(now + 0.008, 0.025, 0.018, audio.sfxGain, { filterType: "bandpass", filterFreq: 1500, release: 0.025 });
  } else if (name === "switchCommit") {
    playTone(155, now, 0.07, "square", 0.075, audio.sfxGain, { attack: 0.001, release: 0.055, slideTo: 112, filterFreq: 1250 });
    playNoise(now, 0.052, 0.04, audio.sfxGain, { filterType: "lowpass", filterFreq: 920, release: 0.045 });
    playTone(520, now + 0.045, 0.04, "triangle", 0.026, audio.sfxGain, { attack: 0.001, release: 0.035, filterFreq: 3200 });
  } else if (name === "ui") {
    playTone(660, now, 0.035, "triangle", 0.035, audio.sfxGain, { attack: 0.001, release: 0.035, filterFreq: 3000 });
  }
}

function playTone(frequency, time, duration, wave, peakGain, output, options = {}) {
  if (!audio.ctx || !output || peakGain <= 0) return;
  const oscillator = audio.ctx.createOscillator();
  const gainNode = audio.ctx.createGain();
  const attack = options.attack ?? 0.006;
  const release = options.release ?? 0.08;
  const sustain = options.sustain ?? 0.32;
  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(Math.max(20, frequency), time);
  if (options.slideTo) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, options.slideTo), time + Math.max(0.02, duration * 0.82));
  gainNode.gain.setValueAtTime(0.0001, time);
  gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0002, peakGain), time + attack);
  gainNode.gain.setTargetAtTime(Math.max(0.0001, peakGain * sustain), time + attack, Math.max(0.01, duration * 0.25));
  gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration + release);

  if (options.filterFreq) {
    const filter = audio.ctx.createBiquadFilter();
    filter.type = options.filterType || "lowpass";
    filter.frequency.setValueAtTime(options.filterFreq, time);
    filter.Q.value = options.q || 0.7;
    oscillator.connect(filter);
    filter.connect(gainNode);
  } else {
    oscillator.connect(gainNode);
  }

  gainNode.connect(output);
  oscillator.start(time);
  oscillator.stop(time + duration + release + 0.03);
}

function playNoise(time, duration, peakGain, output, options = {}) {
  if (!audio.ctx || !output || peakGain <= 0) return;
  const source = audio.ctx.createBufferSource();
  const filter = audio.ctx.createBiquadFilter();
  const gainNode = audio.ctx.createGain();
  source.buffer = getNoiseBuffer();
  source.loop = true;
  source.playbackRate.setValueAtTime(options.rate || 1, time);
  filter.type = options.filterType || "bandpass";
  filter.frequency.setValueAtTime(options.filterFreq || 1400, time);
  filter.Q.value = options.q || 0.8;
  gainNode.gain.setValueAtTime(0.0001, time);
  gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0002, peakGain), time + 0.003);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration + (options.release ?? 0.05));
  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(output);
  source.start(time);
  source.stop(time + duration + (options.release ?? 0.05) + 0.02);
}

function getNoiseBuffer() {
  if (audio.noiseBuffer) return audio.noiseBuffer;
  const sampleRate = audio.ctx.sampleRate;
  const buffer = audio.ctx.createBuffer(1, sampleRate, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  audio.noiseBuffer = buffer;
  return buffer;
}

function midiToFrequency(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function loadSave() {
  const defaults = {
    unlocked: 1,
    completed: {},
    bestScores: {},
    survivalBest: 0,
    customLevel: null,
    options: {
      music: 0.65,
      sfx: 0.75,
      muted: false,
      screenShake: 1,
    },
    controls: {
      pressure: "KeyQ",
      control: "KeyE",
      chaos: "KeyF",
    },
  };
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVE_KEY));
    return {
      ...defaults,
      ...parsed,
      options: { ...defaults.options, ...(parsed?.options || {}) },
      controls: { ...defaults.controls, ...(parsed?.controls || {}) },
    };
  } catch {
    return defaults;
  }
}

function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(app.save));
}

function controlKeyLabel(code) {
  if (!code) return "?";
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  return code.replace("Arrow", "").replace("Space", "SPACE").toUpperCase();
}

function modeForControlCode(code) {
  if (code === "Digit1") return "pressure";
  if (code === "Digit2") return "control";
  if (code === "Digit3") return "chaos";
  for (const mode of ["pressure", "control", "chaos"]) {
    if (app.save.controls?.[mode] === code) return mode;
  }
  return null;
}

function beginControlRebind(mode) {
  app.rebindingMode = mode;
  app.controlBindStatus = `Press a letter key for ${mode.toUpperCase()} (Esc to cancel).`;
  renderScreen();
}

function completeControlRebind(code) {
  const mode = app.rebindingMode;
  if (!mode) return false;
  if (code === "Escape") {
    app.rebindingMode = null;
    app.controlBindStatus = "Rebinding cancelled.";
    renderScreen();
    return true;
  }
  if (!/^Key[A-Z]$/.test(code)) {
    app.controlBindStatus = "Use a letter key (A-Z) for the alternate mode shortcut.";
    renderScreen();
    return true;
  }
  const reserved = new Set(["KeyZ", "KeyJ", "KeyX", "KeyK", "KeyP"]);
  if (reserved.has(code)) {
    app.controlBindStatus = `${controlKeyLabel(code)} is reserved for Pulse / Ability / Pause. Pick another letter.`;
    renderScreen();
    return true;
  }
  const conflict = ["pressure", "control", "chaos"].find((other) => other !== mode && app.save.controls?.[other] === code);
  if (conflict) {
    app.controlBindStatus = `${controlKeyLabel(code)} is already bound to ${conflict.toUpperCase()}. Pick another letter.`;
    renderScreen();
    return true;
  }
  app.save.controls[mode] = code;
  app.rebindingMode = null;
  app.controlBindStatus = `${mode.toUpperCase()} is now  ${controlKeyLabel(code)}  (number key stays ${mode === "pressure" ? "1" : mode === "control" ? "2" : "3"}).`;
  saveGame();
  renderScreen();
  return true;
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

const CURTAIN_CLOSE_MS = 440;
const CURTAIN_HOLD_MS = 95;
const CURTAIN_OPEN_MS = 470;
let curtainBusy = false;

function setCurtainClass(name) {
  if (!curtainTransition) return;
  curtainTransition.classList.remove("is-open", "is-opening", "is-closing", "is-closed");
  curtainTransition.classList.add(name);
}

function revealInitialScreen() {
  if (!curtainTransition) return;
  if (REDUCED_MOTION_QUERY.matches) {
    setCurtainClass("is-open");
    return;
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setCurtainClass("is-opening");
      window.setTimeout(() => setCurtainClass("is-open"), CURTAIN_OPEN_MS);
    });
  });
}

function withCurtainTransition(action, { hold = CURTAIN_HOLD_MS } = {}) {
  if (typeof action !== "function") return false;
  if (!curtainTransition || REDUCED_MOTION_QUERY.matches) {
    action();
    return true;
  }
  if (curtainBusy) return false;

  curtainBusy = true;
  curtainTransition.setAttribute("aria-hidden", "false");
  setCurtainClass("is-closing");

  window.setTimeout(() => {
    setCurtainClass("is-closed");
    action();

    window.setTimeout(() => {
      setCurtainClass("is-opening");
      window.setTimeout(() => {
        setCurtainClass("is-open");
        curtainTransition.setAttribute("aria-hidden", "true");
        curtainBusy = false;
      }, CURTAIN_OPEN_MS);
    }, hold);
  }, CURTAIN_CLOSE_MS);

  return true;
}

function setScreen(screen) {
  app.previousScreen = app.screen;
  app.screen = screen;
  const playing = screen === "playing";
  const overlay = screen !== "playing";
  hudTop.classList.toggle("hidden", !playing);
  modeDock.classList.toggle("hidden", !playing);
  pauseButton.classList.toggle("hidden", !playing);
  screenLayer.classList.toggle("hidden", !overlay);
  comboChip.classList.toggle("hidden", !playing || !state?.combo?.streak);
  if (state) state.paused = !playing && screen !== "result";
  if (overlay) {
    renderScreen();
    requestAnimationFrame(decorateSwitchInterface);
  }
  updateHud();
  updateAudioState();
}

function renderTitleLogo() {
  return `
    <h1 class="screen-title title-logo" data-title-logo aria-label="RoboSwitch">
      ${"RoboSwitch".split("").map((letter, index) => `<span data-title-letter style="--letter-index:${index}">${letter}</span>`).join("")}
    </h1>`;
}


const actorPerformanceState = { timers: [], transitionTimer: 0 };


function comicSceneKey(scene) {
  return String(scene?.title || "field-archive")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function renderComicBackdrop(scene) {
  const key = comicSceneKey(scene);
  const words = {
    "before-the-switch": "HMMMMM",
    "the-drift": "KRRRNNK",
    "pressure": "KRAK!",
    "control": "BEEP-BEEP",
    "chaos": "FWIP!",
    "the-pcc-loop": "WHIRRR",
    "why-roboswitch": "DING!",
    "the-first-chamber": "KLANG!",
  };
  const sceneSets = {
    "before-the-switch": `
      <div class="set-sign sign-tour">SCHOOL TOUR 14B</div><div class="set-banner">NORTH ARRAY: POWER FOR EVERY BLOCK!</div>
      <div class="set-window"><span class="city-tower t1"></span><span class="city-tower t2"></span><span class="city-tower t3"></span></div>
      <div class="set-reactor"><span></span><b></b></div><div class="set-rail"></div>
      <div class="set-exhibit exhibit-a">FIRST PCC COIL</div><div class="set-exhibit exhibit-b">DO NOT TAP GLASS</div>`,
    "the-drift": `
      <div class="set-sign sign-log">REACTOR LOG 01</div><div class="set-banner cracked">NORTH ARRAY OBSERVATION DECK</div>
      <div class="set-window drift"><span class="city-tower t1"></span><span class="city-tower t2"></span><span class="city-tower t3"></span></div>
      <div class="set-reactor drifting"><span></span><b></b></div><div class="set-rail"></div>
      <div class="set-gauge gauge-a"><i></i></div><div class="set-gauge gauge-b"><i></i></div><div class="set-clipboard">ALL GREEN?</div>`,
    "pressure": `
      <div class="set-sign sign-danger">IMPACT TRIAL 03</div><div class="set-press press-left"><i></i></div><div class="set-press press-right"><i></i></div>
      <div class="set-blocks"><i></i><i></i><i></i></div><div class="set-console"><b>FORCE</b><span></span></div><div class="set-coffee">HOT!</div>`,
    "control": `
      <div class="set-sign sign-model">PREDICTION THEATER</div><div class="set-gridwall"></div><div class="set-route"><i></i><i></i><i></i><i></i></div>
      <div class="set-stool"></div><div class="set-console control-console"><b>ROUTE: 99.8%</b><span></span></div><div class="set-camera"></div>`,
    "chaos": `
      <div class="set-sign sign-chaos">UNMAPPED SERVICE DISTRICT</div><div class="set-door door-a">EXIT?</div><div class="set-door door-b">BROOMS</div><div class="set-door door-c">???</div>
      <div class="set-pipe pipe-a"></div><div class="set-pipe pipe-b"></div><div class="set-crate">SALVAGE</div><div class="set-arrow">THIS WAY-ish</div>`,
    "the-pcc-loop": `
      <div class="set-sign sign-loop">LIVE COUNTER-CYCLE DEMO</div><div class="set-track track-red"></div><div class="set-track track-blue"></div><div class="set-track track-green"></div>
      <div class="set-switch switch-red">P</div><div class="set-switch switch-blue">C</div><div class="set-switch switch-green">χ</div><div class="set-scoreboard">READ → COUNTER → MOVE</div>`,
    "why-roboswitch": `
      <div class="set-sign sign-lift">DEPLOYMENT LIFT 6</div><div class="set-shaft"></div><div class="set-lift-door left"></div><div class="set-lift-door right"></div>
      <div class="set-floorlight f1"></div><div class="set-floorlight f2"></div><div class="set-floorlight f3"></div><div class="set-paperstack">FIELD NOTES</div>`,
    "the-first-chamber": `
      <div class="set-sign sign-breach">BREACH ALARM</div><div class="set-shutter"></div><div class="set-breach"><i></i></div><div class="set-alarm a1"></div><div class="set-alarm a2"></div>
      <div class="set-arena-line"></div><div class="set-warningtext">SAFETY SYSTEM: CONFUSED</div>`
  };
  return `<div class="comic-backdrop comic-${escapeHtml(key)}" aria-hidden="true">
    <div class="comic-sky"></div><div class="comic-far"></div><div class="comic-mid"></div><div class="comic-floor"></div>
    <div class="comic-prop prop-one"></div><div class="comic-prop prop-two"></div><div class="comic-prop prop-three"></div>
    <div class="comic-setpieces">${sceneSets[key] || ""}</div>
    <div class="comic-speed-lines"></div><div class="comic-sfx">${escapeHtml(words[key] || "BZZZT!")}</div>
    <div class="comic-caption">${escapeHtml(scene.location || "PCC FIELD ARCHIVE")}</div>
  </div>`;
}


function renderSceneTableau(scene) {
  const key = comicSceneKey(scene);
  const tableaux = {
    "before-the-switch": `
      <div class="world-npc tour-guide"><i></i><b></b></div>
      <div class="world-kid kid-point"><i></i></div><div class="world-kid kid-wave"><i></i></div><div class="world-kid kid-note"><i></i></div>
      <div class="world-prop bench"></div><div class="world-prop audio-post"></div><div class="world-prop museum-map">YOU ARE HERE</div>
      <div class="action-line action-point"></div>`,
    "the-drift": `
      <div class="world-npc technician"><i></i><b></b></div><div class="world-prop maintenance-cart"><i></i></div>
      <div class="world-prop clipboard-cover">ALL GREEN</div><div class="world-prop loose-cable"></div>
      <div class="action-line action-worry"></div>`,
    "pressure": `
      <div class="world-prop magnet-block block-one"></div><div class="world-prop magnet-block block-two"></div><div class="world-prop magnet-block block-three"></div>
      <div class="world-prop coffee-cup">!</div><div class="world-npc cleanup-drone"><i></i></div>
      <div class="action-line action-impact">K-TUNK!</div>`,
    "control": `
      <div class="world-prop route-arrow r1"></div><div class="world-prop route-arrow r2"></div><div class="world-prop route-arrow r3"></div>
      <div class="world-prop missing-stool"><i></i></div><div class="world-prop model-label">MODEL: PERFECT</div>
      <div class="action-line action-bonk">BONK</div>`,
    "chaos": `
      <div class="world-npc lost-bot"><i></i><b></b></div><div class="world-npc arguing-bot"><i></i><b></b></div>
      <div class="world-prop ladder"></div><div class="world-prop sideways-vender">SNAX</div><div class="world-prop warning-tape"></div>
      <div class="world-prop drone-flock"><i></i><i></i><i></i><i></i></div><div class="action-line action-confusion">?!?</div>`,
    "the-pcc-loop": `
      <div class="world-npc class-bot"><i></i><b></b></div><div class="world-prop switch-podium"><i>P</i><i>C</i><i>χ</i></div>
      <div class="world-prop loop-orbit orbit-a"></div><div class="world-prop loop-orbit orbit-b"></div><div class="world-prop loop-orbit orbit-c"></div>
      <div class="action-line action-choice">CLICK!</div>`,
    "why-roboswitch": `
      <div class="world-prop paper-stack"><i></i><i></i><i></i></div><div class="world-prop falling-page">R-SW-01</div>
      <div class="world-npc lift-attendant"><i></i><b></b></div><div class="world-prop floor-counter">LEVEL 03</div>
      <div class="action-line action-catch">SNAP!</div>`,
    "the-first-chamber": `
      <div class="world-prop sealing-door"><i></i></div><div class="world-prop alarm-beam"></div><div class="world-prop threat-reticle"></div>
      <div class="world-npc fleeing-drone"><i></i></div><div class="world-prop debris d1"></div><div class="world-prop debris d2"></div>
      <div class="action-line action-alarm">WEE-OO!</div>`
  };
  return `<div class="scene-tableau tableau-${escapeHtml(key)}">${tableaux[key] || ""}</div>`;
}

function renderPixelActor(actor) {
  if (!actor?.role || !actor?.position) return "";

  const role = escapeHtml(actor.role);
  const position = escapeHtml(actor.position);
  const pose = escapeHtml(actor.pose || "idle");

  return `
    <div
      class="pixel-actor actor-${position} actor-${role}"
      data-role="${role}"
      data-beat="${pose}"
    >
      <span class="actor-shadow"></span>
      <span class="actor-neck"></span>
      <span class="actor-antenna"></span>

      <span class="actor-head">
        <span class="actor-brow brow-left"></span>
        <span class="actor-brow brow-right"></span>

        <span class="actor-face">
          <i class="actor-eye eye-left"><em></em></i>
          <i class="actor-eye eye-right"><em></em></i>
          <b class="actor-mouth"></b>
        </span>
      </span>

      <span class="actor-body"></span>
      <span class="actor-arm arm-a"></span>
      <span class="actor-arm arm-b"></span>
      <span class="actor-feet"></span>
    </div>
  `;
}



function renderAmbientLife(scene) {
  const key = comicSceneKey(scene);
  const sceneExtras = {
    "before-the-switch": `
      <div class="ambient-door door-left"><i></i><b></b></div>
      <div class="ambient-bot walker walker-a carries-box"><span class="bot-head"></span><span class="bot-body"></span><em class="held-item">BOX</em></div>
      <div class="ambient-bot walker walker-b greeter"><span class="bot-head"></span><span class="bot-body"></span><i class="bot-arm"></i></div>
      <div class="ambient-vehicle city-car car-a"><i></i><b></b></div><div class="ambient-vehicle city-car car-b"><i></i><b></b></div>
      <div class="ambient-chat chat-a"><span>?</span><span>!</span></div>`,
    "the-drift": `
      <div class="ambient-door service-door"><i></i><b></b></div>
      <div class="ambient-bot walker mechanic-bot carries-tool"><span class="bot-head"></span><span class="bot-body"></span><em class="held-item">WRENCH</em></div>
      <div class="ambient-bot stationary checker-bot"><span class="bot-head"></span><span class="bot-body"></span><i class="bot-arm"></i></div>
`,
    pressure: `
      <div class="ambient-door lab-door"><i></i><b></b></div>
      <div class="ambient-bot runner runner-a carries-papers"><span class="bot-head"></span><span class="bot-body"></span><em class="held-item">NOTES</em></div>
      <div class="ambient-bot stationary cup-rescuer"><span class="bot-head"></span><span class="bot-body"></span><i class="bot-arm"></i></div>
      <div class="ambient-prop rolling-bolt"></div><div class="ambient-chat chat-b"><span>HEY!</span></div>`,
    control: `
      <div class="ambient-door model-door"><i></i><b></b></div>
      <div class="ambient-bot walker analyst-bot carries-tablet"><span class="bot-head"></span><span class="bot-body"></span><em class="held-item">MAP</em></div>
      <div class="ambient-bot stationary explainer-bot"><span class="bot-head"></span><span class="bot-body"></span><i class="bot-arm"></i></div>
      <div class="ambient-chat chat-c"><span>99.8%</span><span>…?</span></div><div class="ambient-prop paper-plane"></div>`,
    chaos: `
      <div class="ambient-door chaos-door"><i></i><b></b></div>
      <div class="ambient-bot runner runner-b carries-crate"><span class="bot-head"></span><span class="bot-body"></span><em class="held-item">?</em></div>
      <div class="ambient-bot walker lost-courier"><span class="bot-head"></span><span class="bot-body"></span><i class="bot-arm"></i></div>
      <div class="ambient-vehicle tiny-forklift"><i></i><b></b><em>LOAD</em></div><div class="ambient-chat chat-d"><span>THIS WAY</span><span>NO, THAT WAY</span></div>
`,
    "the-pcc-loop": `
      <div class="ambient-door classroom-door"><i></i><b></b></div>
      <div class="ambient-bot walker student-bot carries-book"><span class="bot-head"></span><span class="bot-body"></span><em class="held-item">P-C-χ</em></div>
      <div class="ambient-bot stationary applauding-bot"><span class="bot-head"></span><span class="bot-body"></span><i class="bot-arm"></i></div>
      <div class="ambient-chat chat-e"><span>OH!</span><span>AGAIN!</span></div><div class="ambient-prop bouncing-token">P</div>`,
    "why-roboswitch": `
      <div class="ambient-door lift-door-mini"><i></i><b></b></div>
      <div class="ambient-bot walker clerk-bot carries-folder"><span class="bot-head"></span><span class="bot-body"></span><em class="held-item">R-SW</em></div>
      <div class="ambient-bot runner runner-c"><span class="bot-head"></span><span class="bot-body"></span></div>
      <div class="ambient-chat chat-f"><span>GOOD LUCK</span></div><div class="ambient-prop rolling-case"></div>`,
    "the-first-chamber": `
      <div class="ambient-door emergency-door"><i></i><b></b></div>
      <div class="ambient-bot runner evacuation-a"><span class="bot-head"></span><span class="bot-body"></span></div>
      <div class="ambient-bot runner evacuation-b carries-kit"><span class="bot-head"></span><span class="bot-body"></span><em class="held-item">KIT</em></div>
      <div class="ambient-vehicle response-cart"><i></i><b></b><em>MED</em></div>`
  };
  return `<div class="ambient-life ambient-${escapeHtml(key)}" aria-hidden="true">
    ${sceneExtras[key] || ""}
  </div>`;
}

function renderSceneActors(scene) {
  const actors = Array.isArray(scene.actors) ? scene.actors : [];

  if (!actors.length) {
    return "";
  }

  return actors.map(renderPixelActor).join("");
}

function clearActorPerformance() {
  actorPerformanceState.timers.forEach((timer) => clearTimeout(timer));
  actorPerformanceState.timers = [];
  clearTimeout(actorPerformanceState.transitionTimer);
}

function queueActorBeat(delay, callback) {
  const timer = window.setTimeout(callback, delay);
  actorPerformanceState.timers.push(timer);
}

function startActorPerformance(scene) {
  clearActorPerformance();

  const media = screenLayer.querySelector(".cutscene-media");
  const stage = screenLayer.querySelector(".pixel-stage");
  const tableau = screenLayer.querySelector(".scene-tableau");
  if (!stage || REDUCED_MOTION_QUERY.matches) return;

  const actors = [...stage.querySelectorAll(".pixel-actor")];
  const key = comicSceneKey(scene);
  const direction = {
    "before-the-switch": [
      { at: 650, target: ".actor-center", pose: "curious" },
      { at: 1450, target: ".actor-left", pose: "talk" },
      { at: 2600, target: ".actor-center", pose: "notice" },
    ],
    "the-drift": [
      { at: 600, target: ".actor-right", pose: "concerned" },
      { at: 1800, target: ".actor-left", pose: "notice" },
      { at: 3000, target: ".actor-right", pose: "double-blink" },
    ],
    pressure: [
      { at: 450, target: ".actor-left", pose: "talk" },
      { at: 1550, target: ".actor-right", pose: "surprise" },
      { at: 2350, target: ".actor-left", pose: "notice" },
      { at: 3300, target: ".actor-right", pose: "smirk" },
    ],
    control: [
      { at: 700, target: ".actor-right", pose: "talk" },
      { at: 1750, target: ".actor-left", pose: "notice" },
      { at: 2450, target: ".actor-left", pose: "surprise" },
      { at: 3200, target: ".actor-right", pose: "double-blink" },
    ],
    chaos: [
      { at: 450, target: ".actor-left", pose: "smirk" },
      { at: 1350, target: ".actor-right", pose: "curious" },
      { at: 2200, target: ".actor-right", pose: "surprise" },
      { at: 3100, target: ".actor-left", pose: "surprise" },
    ],
    "the-pcc-loop": [
      { at: 500, target: ".actor-left", pose: "talk" },
      { at: 1300, target: ".actor-center", pose: "think" },
      { at: 2450, target: ".actor-center", pose: "notice" },
      { at: 3400, target: ".actor-right", pose: "smirk" },
    ],
    "why-roboswitch": [
      { at: 650, target: ".actor-left", pose: "talk" },
      { at: 1850, target: ".actor-center", pose: "notice" },
      { at: 2700, target: ".actor-center", pose: "curious" },
      { at: 3550, target: ".actor-left", pose: "smirk" },
    ],
    "the-first-chamber": [
      { at: 450, target: ".actor-right", pose: "talk" },
      { at: 1250, target: ".actor-left", pose: "concerned" },
      { at: 2050, target: ".actor-center", pose: "notice" },
      { at: 2850, target: ".actor-center", pose: "brace" },
      { at: 3300, target: ".actor-left", pose: "brace" },
    ],
  };

  media?.classList.add("scene-is-live");
  queueActorBeat(120, () => media?.classList.add("scene-beat-one"));
  queueActorBeat(1150, () => media?.classList.add("scene-beat-two"));
  queueActorBeat(2250, () => media?.classList.add("scene-beat-three"));
  queueActorBeat(3350, () => media?.classList.add("scene-beat-four"));

  actors.forEach((actor, index) => {
    queueActorBeat(160 + index * 170, () => actor.isConnected && actor.classList.add("is-performing"));
    queueActorBeat(620 + index * 170, () => actor.isConnected && actor.classList.remove("is-performing"));
  });

  (direction[key] || []).forEach((step) => {
    queueActorBeat(step.at, () => {
      const actor = stage.querySelector(step.target);
      if (!actor?.isConnected) return;
      actor.dataset.beat = step.pose;
      actor.classList.add("has-new-beat");
      queueActorBeat(360, () => actor.isConnected && actor.classList.remove("has-new-beat"));
    });
  });

  if (tableau) queueActorBeat(420, () => tableau.classList.add("tableau-awake"));

  const ambient = media?.querySelector(".ambient-life");
  if (ambient) {
    queueActorBeat(300, () => ambient.classList.add("ambient-awake"));
    const pulseAmbient = () => {
      if (!ambient.isConnected) return;
      ambient.classList.toggle("ambient-story-two");
      const next = 4200 + Math.floor(Math.random() * 2600);
      queueActorBeat(next, pulseAmbient);
    };
    queueActorBeat(3900, pulseAmbient);
  }

  if (scene?.centerSequence?.length) {
    const center = stage.querySelector(".actor-center");
    scene.centerSequence.forEach((step) => {
      queueActorBeat(step.at, () => {
        if (center?.isConnected) center.dataset.beat = step.pose;
      });
    });
  }
}
function performSceneTransition(next) {
  const card = screenLayer.querySelector(".cutscene-card");

  clearActorPerformance();

  if (!card || REDUCED_MOTION_QUERY.matches) {
    next();
    return;
  }

  card.classList.add("scene-performing-exit");

  actorPerformanceState.transitionTimer = window.setTimeout(() => {
    next();
  }, 260);
}

function renderScreen() {
  prepareScreenRender();
  if (app.screen === "menu") {
    screenLayer.innerHTML = `
      <section class="screen-card menu-card">
        <div class="title-art-wrap" data-title-monitor>
          <img class="title-art" src="${STORY_ART_DIR}title_screen.png?v=35" alt="RoboSwitch pixel art title screen">
          <div class="phase-signals" aria-hidden="true">
            <span class="phase-signal pressure-signal"></span>
            <span class="phase-signal control-signal"></span>
            <span class="phase-signal chaos-signal"></span>
          </div>
          <div class="menu-mascot" data-mascot aria-label="R-SW-01 watches the title display">
            <span class="mascot-antenna"></span>
            <span class="mascot-head">
              <span class="mascot-eye left"><i></i></span>
              <span class="mascot-eye right"><i></i></span>
              <span class="mascot-mouth"></span>
            </span>
            <span class="mascot-body"><i></i></span>
            <span class="mascot-arm mascot-arm-left"></span>
            <span class="mascot-arm mascot-arm-right"></span>
          </div>
          <div class="mascot-thought" aria-hidden="true">switch smart.</div>
          <div class="art-caption">FIELD UNIT R-SW-01 / loop carrier</div>
        </div>
        <div class="menu-grid">
          <div>
            <div class="screen-kicker">PCC arcade survival</div>
            ${renderTitleLogo()}
            <p class="screen-copy">
              A handmade arcade story about a small robot learning to cycle Pressure, Control, and Chaos inside an unstable lab.
            </p>
            <div class="menu-actions main-menu-actions">
              <button class="ui-button primary" data-action="play-menu">Play</button>
              <button class="ui-button control" data-action="extras-menu">Extras</button>
            </div>
          </div>
          <div class="menu-story">
            <div class="operator-note" data-operator-note>
              <div class="note-label">Operator margin note</div>
              <p class="operator-note-copy" data-note-copy>OPERATOR NOTE #031
Do not overpower the room.
Read the pressure, answer with the counter,
and move before the lab settles into one bad idea.</p>
              ${renderCounterRail()}
            </div>
            <div class="triad-panel" data-triad-panel>
              <div class="triad-tile" data-regime="pressure" style="border-color: rgba(255,77,69,.35)">
                <strong style="color: var(--pressure)">Pressure</strong>
                <p>Action without pause becomes impact.</p>
              </div>
              <div class="triad-tile" data-regime="control" style="border-color: rgba(67,184,255,.35)">
                <strong style="color: var(--control)">Control</strong>
                <p>Pattern without drift becomes brittle.</p>
              </div>
              <div class="triad-tile" data-regime="chaos" style="border-color: rgba(57,224,121,.35)">
                <strong style="color: var(--chaos)">Chaos</strong>
                <p>Escape without shape becomes scatter.</p>
              </div>
            </div>
          </div>
        </div>
      </section>`;
    titleAtmosphereController.init(screenLayer);
    return;
  }

  if (app.screen === "play-menu") {
    screenLayer.innerHTML = `
      <section class="screen-card compact submenu-card">
        <div class="screen-kicker">Choose a run</div>
        <h2 class="screen-title">Play</h2>
        <p class="screen-copy">Enter the archive story, chase an endless score, revisit a chamber, or build your own lab.</p>
        <div class="menu-actions submenu-actions">
          <button class="ui-button primary" data-action="start">Story</button>
          <button class="ui-button pressure" data-action="survival">Survival</button>
          <button class="ui-button control" data-action="levels">Level Select</button>
          <button class="ui-button chaos" data-action="editor">Lab Builder</button>
        </div>
        <div class="screen-actions row">
          <button class="ui-button" data-action="menu">Back</button>
        </div>
      </section>`;
    return;
  }

  if (app.screen === "extras-menu") {
    screenLayer.innerHTML = `
      <section class="screen-card compact submenu-card">
        <div class="screen-kicker">Field archive / optional material</div>
        <h2 class="screen-title">Extras</h2>
        <p class="screen-copy">Controls, development notes, credits, and local options. None of this is required to play.</p>
        <div class="menu-actions submenu-actions">
          <button class="ui-button primary" data-action="how">How To Play</button>
          <button class="ui-button chaos" data-action="author-notes">Author Notes</button>
          <button class="ui-button control" data-action="credits">Credits</button>
          <button class="ui-button" data-action="options">Options</button>
        </div>
        <div class="screen-actions row">
          <button class="ui-button" data-action="menu">Back</button>
        </div>
      </section>`;
    return;
  }

  if (app.screen === "cutscene") {
    const scene = app.cutsceneQueue[app.cutsceneIndex];
    const isLast = app.cutsceneIndex >= app.cutsceneQueue.length - 1;
    if (!scene) {
      finishCutscene();
      return;
    }
    screenLayer.innerHTML = `
      <section class="screen-card cutscene-card">
        <div class="cutscene-location">${escapeHtml(scene.location || "PCC FIELD ARCHIVE")}</div>
        <div class="cutscene-layout">
          <div
            class="cutscene-media"
            data-scene="${escapeHtml(comicSceneKey(scene))}"
            data-scene-cast="${escapeHtml((scene.cast || []).join(" "))}"
          >
            ${renderComicBackdrop(scene)}

            <div class="cutscene-camera">
              <img
                class="cutscene-art"
                src="${escapeHtml(scene.image)}"
                alt="${escapeHtml(scene.title)}"
              >

              <div class="cutscene-image-fallback">
                CUTSCENE IMAGE UNAVAILABLE
              </div>
            </div>

            ${renderSceneTableau(scene)}
            ${renderAmbientLife(scene)}
            ${renderBossCutscenePortrait(scene)}

            <div class="pixel-stage" aria-hidden="true">
              ${renderSceneActors(scene)}
            </div>

            <div class="cinematic-vignette" aria-hidden="true"></div>

            <div class="media-label">
              ${escapeHtml(scene.kicker)}
              //
              ${escapeHtml(scene.signal || "SIGNAL THREAD")}
            </div>
          </div>
          <div class="cutscene-side">
            <div class="screen-kicker">${escapeHtml(scene.kicker)}</div>
            <h2 class="screen-title">${escapeHtml(scene.title)}</h2>
            <div class="speaker-plate"><span></span>${escapeHtml(scene.speaker || "FIELD ARCHIVE")}</div>
            <p class="screen-copy terminal-copy" data-terminal-copy aria-live="polite"></p>
            ${scene.beat ? `<div class="scene-beat"><strong>ON SCREEN</strong>${escapeHtml(scene.beat)}</div>` : ""}
            ${renderSceneLedger(scene)}
            <div class="cutscene-footer">
              <div class="cutscene-count">${app.cutsceneIndex + 1} / ${app.cutsceneQueue.length}</div>
              <div class="screen-actions">
                <button class="ui-button primary" data-action="cutscene-next">${isLast ? "Enter chamber" : "Continue"}</button>
                <button class="ui-button" data-action="cutscene-skip">Skip archive</button>
              </div>
            </div>
          </div>
        </div>
      </section>`;

    const camera = screenLayer.querySelector(".cutscene-camera");
    const image = screenLayer.querySelector(".cutscene-art");

    if (camera && image) {
      const markReady = () => {
        camera.classList.add("is-ready");

        console.info("[RoboSwitch] Cutscene image loaded", {
          title: scene.title,
          src: image.currentSrc,
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      };

      const markError = () => {
        camera.classList.add("has-error");

        console.error("[RoboSwitch] Cutscene image failed", {
          title: scene.title,
          src: image.currentSrc || image.src,
        });
      };

      if (image.complete && image.naturalWidth > 0) {
        markReady();
      } else {
        image.addEventListener("load", markReady, { once: true });
        image.addEventListener("error", markError, { once: true });
      }
    }

    startCutsceneTerminal(scene);
    startActorPerformance(scene);
    return;
  }

  if (app.screen === "levels") {
    const cards = LEVELS.map((level, index) => {
      const unlocked = true;
      const best = app.save.bestScores[level.id] || 0;
      const brief = LEVEL_BRIEFS[index] || LEVEL_BRIEFS[0];
      return `
        <button class="level-card ${unlocked ? "" : "locked"}" style="--card-index:${index}" data-action="play-level" data-index="${index}" ${unlocked ? "" : "disabled"}>
          <div class="level-card-top">
            <span class="chamber-stamp">CH-${String(index + 1).padStart(2, "0")}</span>
            <span class="signal-stamp">${escapeHtml(brief.signal)}</span>
          </div>
          ${renderLevelMiniMap(level, index)}
          <h3>${index + 1}. ${escapeHtml(level.title)}</h3>
          <p>${escapeHtml(brief.callout)}</p>
          <div class="level-meta">
            <span class="tag">${escapeHtml(level.badge)}</span>
            <span class="tag">${level.waves.length} waves</span>
            <span class="tag">${best ? `best ${best}` : unlocked ? "ready" : "locked"}</span>
          </div>
          <div class="level-room-note">${escapeHtml(brief.chamber)}</div>
        </button>`;
    }).join("");
    screenLayer.innerHTML = `
      <section class="screen-card">
        <div class="screen-kicker">Campaign map</div>
        <h2 class="screen-title">Level Select</h2>
        <p class="screen-copy">All prototype arenas are selectable for playtesting. Best scores save locally in this browser.</p>
        <div class="level-grid">${cards}</div>
        <div class="screen-actions row">
          <button class="ui-button" data-action="play-menu">Back</button>
          <button class="ui-button pressure" data-action="survival">Survival</button>
        </div>
      </section>`;
    return;
  }

  if (app.screen === "author-notes") {
    screenLayer.innerHTML = `
      <section class="screen-card author-notes-card">
        <div class="screen-kicker">From the author / development archive</div>
        <h2 class="screen-title">Author Notes</h2>
        <p class="screen-copy author-notes-intro">These notes are optional. They explain some of the choices behind RoboSwitch without trying to prescribe a single interpretation of the game.</p>
        <div class="author-note-grid">
          <article class="author-note">
            <span>before the pitch doc</span>
            <h3>Why I Made RoboSwitch</h3>
            <p>I kept coming back to a simple problem: a strategy can be useful and still become destructive when you keep applying it after the situation changes. RoboSwitch grew out of wanting to turn that idea into something you could feel with your hands instead of only describing it.</p>
          </article>
          <article class="author-note">
            <span>the boring failure</span>
            <h3>The Drift</h3>
            <p>I did not want the lab to fail because of one giant obvious mistake. The more interesting failure was a system slowly learning to treat its own error as normal. That is why the instruments stay green while the room is already drifting.</p>
          </article>
          <article class="author-note pressure-note">
            <span>not the villain</span>
            <h3>Pressure</h3>
            <p>Pressure is not the villain. It is commitment, momentum, force, and the ability to break a deadlock. The problem begins when useful commitment turns into overcommitment and nobody notices the room has stopped yielding.</p>
          </article>
          <article class="author-note control-note">
            <span>the clean one</span>
            <h3>Control</h3>
            <p>Control is the part of a system that makes patterns legible and repeatable. I wanted its failure mode to feel deceptively reasonable: the model becomes cleaner and cleaner while reality becomes less and less welcome inside it.</p>
          </article>
          <article class="author-note chaos-note">
            <span>the one nobody trusts</span>
            <h3>Chaos</h3>
            <p>Chaos here means exploration, variance, escape, and novelty more than destruction. It can rescue a system that has become trapped. It can also keep a system from ever settling long enough to build anything.</p>
          </article>
          <article class="author-note">
            <span>argument I lost, then won</span>
            <h3>Why Three Modes?</h3>
            <p>I did not want the player to choose a personality class and then prove that choice correct forever. The point is the switch. Each mode solves a problem and creates another one if you cling to it.</p>
          </article>
          <article class="author-note">
            <span>the robot</span>
            <h3>R-SW-01 Has No Specialty</h3>
            <p>Inside the fiction, the robot's lack of a preferred regime is initially treated as a defect. That mattered to me. RoboSwitch is not Pressure, Control, or Chaos. The interesting ability is noticing when the current answer has stopped being the answer.</p>
          </article>
          <article class="author-note">
            <span>the day I almost cut the bird</span>
            <h3>Fli Was Almost a HUD Icon</h3>
            <p>Fli started as a floating arrow that pointed at objectives. I cut it in a build that's long gone, then missed having something on screen that reacted to the player instead of just directing them, and rebuilt it as a character instead of a UI element. The rarity gate on her voice lines exists because I did not want to have made that mistake twice in a row.</p>
          </article>
          <article class="author-note">
            <span>bosses</span>
            <h3>The Bosses</h3>
            <p>I wanted the bosses to feel like exaggerated system behaviors rather than ordinary monsters with more health. Their names and patterns turn abstract failure modes into characters you can recognize, anticipate, and eventually counter.</p>
          </article>
          <article class="author-note control-note">
            <span>the last one</span>
            <h3>Director Null</h3>
            <p>The final antagonist is not Chaos. Director Null wants one flawless signal, perfectly synchronized and perfectly lifeless. I liked ending on the danger of a system that has eliminated uncertainty by eliminating everything uncertainty was trying to tell it.</p>
          </article>
          <article class="author-note">
            <span>what I cut</span>
            <h3>Things That Did Not Work</h3>
            <p>A lot of RoboSwitch became better when I stopped trying to make every idea look polished or every mechanic look clever. Some of the best decisions came from deleting systems, simplifying explanations, and letting a joke or an imperfect drawing carry more of the load.</p>
          </article>
          <article class="author-note">
            <span>getting messier on purpose</span>
            <h3>Art Direction Pass</h3>
            <p>At one point the game was becoming too clean. I deliberately pushed the visual direction toward more texture and irregularity: uneven marks, sketch-like elements, odd spacing, little visual accidents, and details that keep the world from feeling overly polished or uniform.</p>
          </article>
          <article class="author-note">
            <span>last one, I promise</span>
            <h3>Afterword</h3>
            <p>I have my own reading of RoboSwitch, but I do not want these notes to close the game around it. If you came away with a different interpretation, that is not a misunderstanding I need to correct. The notes are here to show you some of the decisions behind the work, not to take the work away from you.</p>
          </article>
        </div>
        <div class="screen-actions row author-notes-actions">
          <button class="ui-button primary" data-action="extras-menu">Back to Extras</button>
        </div>
      </section>`;
    return;
  }

  if (app.screen === "how") {
    screenLayer.innerHTML = `
      <section class="screen-card compact">
        <div class="screen-kicker">Controls and system logic</div>
        <h2 class="screen-title">How To Play</h2>
        <div class="content-list">
          <div><strong>Move:</strong> WASD or arrow keys. Aim abilities with movement or pointer direction.</div>
          <div><strong>Switch:</strong> 1/Q Pressure, 2/F Control, 3/E Chaos.</div>
          <div><strong>Two-button combat:</strong> Z/J uses Signal Pulse (A). X/K/Space uses Signal Burst (B).</div>
          <div><strong>Pressure:</strong> short-range punch / overdrive slam. <strong>Control:</strong> precision shot / multi-target Signal Lock. <strong>Chaos:</strong> chaining arc / invulnerable warp.</div>
          <div><strong>Energy:</strong> Blue capsules restore energy and appear more often when you run low.</div>
          <div><strong>Guard:</strong> GD fills as your emergency block cools down. It auto-blocks a hit when ready.</div>
          <div><strong>PCC combo:</strong> Correct counter kills extend the chain. Wrong hits break it.</div>
          <div><strong>PCC triangle:</strong> Pressure defeats Chaos, Chaos defeats Control, Control defeats Pressure.</div>
          <div><strong>EBID:</strong> The bottom meter rises when you over-specialize. Cycling modes lowers collapse risk.</div>
          <div><strong>Goal:</strong> Clear campaign waves or survive as long as possible in arcade mode.</div>
        </div>
        <div class="screen-actions row">
          <button class="ui-button primary" data-action="start">Start Campaign</button>
          <button class="ui-button" data-action="extras-menu">Back</button>
        </div>
      </section>`;
    return;
  }

  if (app.screen === "options") {
    screenLayer.innerHTML = `
      <section class="screen-card compact">
        <div class="screen-kicker">Local settings</div>
        <h2 class="screen-title">Options</h2>
        <div class="option-row">
          <label for="musicRange">Music volume</label>
          <input id="musicRange" data-option="music" type="range" min="0" max="1" step="0.05" value="${app.save.options.music}">
        </div>
        <div class="option-row">
          <label for="sfxRange">SFX volume</label>
          <input id="sfxRange" data-option="sfx" type="range" min="0" max="1" step="0.05" value="${app.save.options.sfx}">
        </div>
        <div class="option-row">
          <label for="muteToggle">Mute all audio</label>
          <input id="muteToggle" data-option="muted" type="checkbox" ${app.save.options.muted ? "checked" : ""}>
        </div>
        <div class="option-row">
          <label for="shakeRange">Screen shake</label>
          <input id="shakeRange" data-option="screenShake" type="range" min="0" max="1" step="0.05" value="${app.save.options.screenShake}">
        </div>
        <div class="content-list control-bindings">
          <div><strong>Mode keys:</strong> 1 / ${controlKeyLabel(app.save.controls.pressure)} Pressure · 2 / ${controlKeyLabel(app.save.controls.control)} Control · 3 / ${controlKeyLabel(app.save.controls.chaos)} Chaos</div>
          <div class="screen-actions row compact-actions">
            <button class="ui-button pressure" data-bind-mode="pressure">Pressure: ${controlKeyLabel(app.save.controls.pressure)}</button>
            <button class="ui-button control" data-bind-mode="control">Control: ${controlKeyLabel(app.save.controls.control)}</button>
            <button class="ui-button chaos" data-bind-mode="chaos">Chaos: ${controlKeyLabel(app.save.controls.chaos)}</button>
          </div>
          <div class="option-note">Number keys 1 / 2 / 3 stay fixed. Click a mode above to customize its left-hand letter shortcut.</div>
          ${app.controlBindStatus ? `<div class="option-note"><strong>${escapeHtml(app.controlBindStatus)}</strong></div>` : ""}
        </div>
        <p class="option-note">Audio starts after your first click or key press so the browser can allow playback.</p>
        <div class="screen-actions row">
          <button class="ui-button" data-action="reset-save">Reset Progress</button>
          <button class="ui-button primary" data-action="extras-menu">Done</button>
        </div>
      </section>`;
    return;
  }

  if (app.screen === "credits") {
    screenLayer.innerHTML = `
      <section class="screen-card compact">
        <div class="screen-kicker">Credits</div>
        <h2 class="screen-title">RoboSwitch</h2>
        <div class="content-list">
          <div><strong>Created by:</strong> Syed Hussain Ather.</div>
          <div><strong>Game design and code direction:</strong> Syed Hussain Ather.</div>
          <div><strong>Research concept:</strong> Pressure-Control-Chaos, the Stability Triad, and EBID from Syed Hussain Ather's research work.</div>
          <div><strong>Pixel art and asset tooling:</strong> Syed Hussain Ather, using local Python pixel-art tools with manual art-direction and editing passes.</div>
          <div><strong>Music:</strong> Original procedural chiptune soundtrack for title, story, gameplay, results, and credits.</div>
          <div><strong>Prototype tech:</strong> HTML5 Canvas, Web Audio, local save data, and Newgrounds-ready medal/score hooks.</div>
        </div>
        <div class="screen-actions row">
          <button class="ui-button primary" data-action="extras-menu">Back</button>
        </div>
      </section>`;
    return;
  }

  if (app.screen === "pause") {
    screenLayer.innerHTML = `
      <section class="screen-card compact">
        <div class="screen-kicker">System suspended</div>
        <h2 class="screen-title">Paused</h2>
        <p class="screen-copy">${state?.level?.title || "RoboSwitch"} | Score ${state?.score || 0}</p>
        <div class="screen-actions">
          <button class="ui-button primary" data-action="resume">Resume</button>
          ${state?.level?.id === "tutorial-loop" && state?.playMode === "campaign"
            ? '<button class="ui-button control" data-action="skip-tutorial">Skip Tutorial</button>'
            : ""}
          <button class="ui-button" data-action="restart-run">Restart Run</button>
          <button class="ui-button" data-action="levels">Level Select</button>
          <button class="ui-button" data-action="menu">Main Menu</button>
        </div>
      </section>`;
    return;
  }

  if (app.screen === "editor") {
    renderEditorScreen();
  }
}

function renderEditorScreen() {
  const draft = app.editorDraft;
  const summary = `${draft.obstacles.length} obstacles | ${draft.spawns.length} placed enemies | ${draft.waves.length} waves`;
  screenLayer.innerHTML = `
    <section class="screen-card">
      <div class="screen-kicker">Lab Builder</div>
      <h2 class="screen-title">Make A Level</h2>
      <p class="screen-copy">Place obstacles, player start, and enemy markers. Export the code to share or save it locally for testing.</p>
      <div class="editor-layout">
        <div class="editor-tools">
          <button data-editor-tool="obstacle" class="${app.editorTool === "obstacle" ? "active" : ""}">Place Obstacle</button>
          <button data-editor-tool="player" class="${app.editorTool === "player" ? "active" : ""}">Set Player Start</button>
          <button data-editor-tool="wobbler" class="${app.editorTool === "wobbler" ? "active" : ""}">Add Wobbler</button>
          <button data-editor-tool="rusher" class="${app.editorTool === "rusher" ? "active" : ""}">Add Rusher</button>
          <button data-editor-tool="turret" class="${app.editorTool === "turret" ? "active" : ""}">Add Turret</button>
          <button data-editor-tool="erase" class="${app.editorTool === "erase" ? "active" : ""}">Erase Nearest</button>
          <div class="editor-summary">${summary}</div>
          <button class="ui-button primary" data-action="test-custom">Test Level</button>
          <button class="ui-button" data-action="save-custom">Save Local Level</button>
          <button class="ui-button chaos" data-action="export-custom">Export Code</button>
          <button class="ui-button control" data-action="import-custom">Import Code</button>
          <button class="ui-button" data-action="reset-editor">Reset Lab</button>
          <button class="ui-button" data-action="play-menu">Back</button>
        </div>
        <div>
          <div class="editor-stage"><canvas id="editorCanvas" aria-label="Level editor canvas"></canvas></div>
          <textarea class="editor-code" id="editorCode" placeholder="Exported level code appears here. Paste a code here, then press Import.">${escapeHtml(app.editorCode)}</textarea>
          <div class="editor-summary">${escapeHtml(app.editorStatus)}</div>
        </div>
      </div>
    </section>`;

  setupEditorCanvas();
}

function renderCounterRail() {
  const flow = [
    ["pressure", "chaos"],
    ["chaos", "control"],
    ["control", "pressure"],
  ];
  return `
    <div class="counter-rail" aria-label="PCC counter loop">
      ${flow.map(([winner, loser]) => `
        <div class="flow-chip ${winner}">
          <span>${escapeHtml(MODES[winner].label)}</span>
          <b>beats</b>
          <span>${escapeHtml(MODES[loser].label)}</span>
        </div>
      `).join("")}
    </div>`;
}

function renderSceneLedger(scene) {
  const ledger = scene.ledger || INTRO_LEDGER[scene.title] || {
    source: scene.signal || "Chamber record",
    clue: scene.body || "Read the room before the room reads you.",
    next: "Carry the loop into play.",
  };
  return `
    <div class="scene-ledger">
      <div><span>Source</span>${escapeHtml(ledger.source)}</div>
      <div><span>Clue</span>${escapeHtml(ledger.clue)}</div>
      <div><span>Next</span>${escapeHtml(ledger.next)}</div>
    </div>`;
}

function renderLevelMiniMap(level, index) {
  const brief = LEVEL_BRIEFS[index] || LEVEL_BRIEFS[0];
  const obstacleMarks = level.obstacles.map((item, itemIndex) => {
    const className = `map-${["pressure", "control", "chaos"][(index + itemIndex) % 3]}`;
    if (item.shape === "rect") {
      const w = clamp(item.w * 100, 7, 34);
      const h = clamp(item.h * 64, 4, 20);
      const x = clamp(item.x * 100 - w / 2, 5, 95 - w);
      const y = clamp(item.y * 64 - h / 2, 7, 57 - h);
      return `<rect class="map-obstacle ${className}" x="${roundAttr(x)}" y="${roundAttr(y)}" width="${roundAttr(w)}" height="${roundAttr(h)}" rx="1" />`;
    }
    const r = clamp(item.r * 64, 3, 8);
    const x = clamp(item.x * 100, 7 + r, 93 - r);
    const y = clamp(item.y * 64, 8 + r, 56 - r);
    return `<circle class="map-obstacle ${className}" cx="${roundAttr(x)}" cy="${roundAttr(y)}" r="${roundAttr(r)}" />`;
  }).join("");
  const startX = roundAttr(clamp(level.playerStart.x * 100, 8, 92));
  const startY = roundAttr(clamp(level.playerStart.y * 64, 8, 56));
  const enemyMarks = renderLevelThreatMarks(level);
  return `
    <svg class="level-map ${escapeHtml(brief.focus)}" viewBox="0 0 100 64" role="img" aria-label="${escapeHtml(level.title)} room preview">
      <rect class="map-shell" x="2" y="4" width="96" height="54" />
      <path class="map-flow" d="M10 51 C26 40, 38 45, 50 32 S76 20, 90 12" />
      ${obstacleMarks}
      <path class="map-player" d="M${startX} ${roundAttr(startY - 5)} L${roundAttr(Number(startX) + 5)} ${roundAttr(Number(startY) + 5)} L${roundAttr(Number(startX) - 5)} ${roundAttr(Number(startY) + 5)} Z" />
      ${enemyMarks}
    </svg>`;
}

function renderLevelThreatMarks(level) {
  const totals = { pressure: 0, control: 0, chaos: 0 };
  for (const wave of level.waves) {
    for (const [kind, count] of Object.entries(wave)) {
      const role = ENEMIES[kind]?.role;
      if (role) totals[role] += count;
    }
  }
  return Object.entries(totals).map(([role, count], roleIndex) => {
    const dots = Math.min(4, Math.max(1, Math.ceil(count / 6)));
    if (count <= 0) return "";
    return Array.from({ length: dots }, (_, dotIndex) => {
      const x = 12 + roleIndex * 14 + dotIndex * 3.6;
      const y = 9 + roleIndex * 2;
      return `<circle class="map-threat map-${role}" cx="${roundAttr(x)}" cy="${roundAttr(y)}" r="1.8" />`;
    }).join("");
  }).join("");
}

function roundAttr(value) {
  return Number(value).toFixed(1).replace(/\.0$/, "");
}

function prepareScreenRender() {
  titleAtmosphereController.destroy();
  clearCutsceneTerminal();
  screenLayer.dataset.screen = app.screen;
  screenLayer.classList.remove("screen-boot");
  void screenLayer.offsetWidth;
  screenLayer.classList.add("screen-boot");
  clearTimeout(screenBootTimer);
  screenBootTimer = window.setTimeout(() => screenLayer.classList.remove("screen-boot"), 620);
}

function triggerInterfaceGlitch() {
  screenLayer.classList.remove("interface-glitch");
  void screenLayer.offsetWidth;
  screenLayer.classList.add("interface-glitch");
  clearTimeout(interfaceGlitchTimer);
  interfaceGlitchTimer = window.setTimeout(() => screenLayer.classList.remove("interface-glitch"), 220);
}

function startCutsceneTerminal(scene) {
  const target = screenLayer.querySelector("[data-terminal-copy]");
  if (!target) return;
  clearCutsceneTerminal();
  terminalState.target = target;
  terminalState.text = "";
  terminalState.fullText = scene.body || "";
  terminalState.active = true;
  terminalState.done = false;
  renderTerminalText();
  runTerminalActions(cutsceneTerminalScript(scene), 0);
}

function cutsceneTerminalScript(scene) {
  const title = scene.title || "";
  const body = scene.body || "";
  if (title === "The Drift") {
    return [
      { type: "text", value: "The reactor failed" },
      { type: "pause", value: 260 },
      { type: "erase", value: 6 },
      { type: "text", value: "did not fail all at once. It drifted, one stable-looking loop at a time." },
    ];
  }
  if (title === "Pressure") {
    return [
      { type: "text", value: "Pressure made action possible, then made it dangerous when it had no off" },
      { type: "pause", value: 180 },
      { type: "erase", value: 3 },
      { type: "text", value: "counterweight." },
    ];
  }
  if (title === "Chaos") {
    return [
      { type: "text", value: "Chaos made escape possible, then scattered the map when it could not be held" },
      { type: "pause", value: 200 },
      { type: "erase", value: 4 },
      { type: "text", value: "shaped." },
    ];
  }
  if (title === "Collapse Run") {
    return [
      { type: "text", value: "A compact finale built to test your ability to cycle under stress" },
      { type: "pause", value: 160 },
      { type: "text", value: "." },
    ];
  }
  return [{ type: "text", value: body }];
}

function runTerminalActions(actions, index) {
  if (!terminalState.active || terminalState.done) return;
  if (index >= actions.length) {
    terminalState.done = true;
    terminalState.text = terminalState.fullText;
    renderTerminalText();
    return;
  }
  const action = actions[index];
  if (action.type === "pause") {
    queueTerminalTimer(action.value, () => runTerminalActions(actions, index + 1));
    return;
  }
  if (action.type === "erase") {
    eraseTerminalChars(action.value, () => runTerminalActions(actions, index + 1));
    return;
  }
  typeTerminalText(action.value, () => runTerminalActions(actions, index + 1));
}

function typeTerminalText(value, onComplete, offset = 0) {
  if (!terminalState.active || terminalState.done) return;
  if (offset >= value.length) {
    queueTerminalTimer(90, onComplete);
    return;
  }
  terminalState.text += value[offset];
  renderTerminalText();
  queueTerminalTimer(terminalCharDelay(value[offset], offset), () => typeTerminalText(value, onComplete, offset + 1));
}

function eraseTerminalChars(count, onComplete) {
  if (!terminalState.active || terminalState.done) return;
  if (count <= 0) {
    queueTerminalTimer(80, onComplete);
    return;
  }
  terminalState.text = terminalState.text.slice(0, -1);
  renderTerminalText(true);
  queueTerminalTimer(24, () => eraseTerminalChars(count - 1, onComplete));
}

function terminalCharDelay(char, offset) {
  if (char === " ") return 18;
  if (/[.,;]/.test(char)) return 115;
  return 22 + ((char.charCodeAt(0) + offset * 7) % 26);
}

function queueTerminalTimer(delay, callback) {
  const timer = window.setTimeout(callback, delay);
  terminalState.timers.push(timer);
}

function renderTerminalText(erasing = false) {
  if (!terminalState.target) return;
  terminalState.target.classList.toggle("is-erasing", erasing);
  terminalState.target.classList.toggle("is-complete", terminalState.done);
  terminalState.target.innerHTML = `${escapeHtml(terminalState.text)}<span class="terminal-cursor" aria-hidden="true">_</span>`;
}

function clearCutsceneTerminal() {
  for (const timer of terminalState.timers) clearTimeout(timer);
  terminalState.timers = [];
  terminalState.target = null;
  terminalState.active = false;
  terminalState.done = true;
}

function completeCutsceneTerminal() {
  if (!terminalState.active || terminalState.done) return false;
  for (const timer of terminalState.timers) clearTimeout(timer);
  terminalState.timers = [];
  terminalState.text = terminalState.fullText;
  terminalState.done = true;
  renderTerminalText();
  return true;
}

function startLevel(index, mode = "campaign") {
  app.levelIndex = clamp(index, 0, LEVELS.length - 1);
  app.playMode = mode;
  app.currentLevel = LEVELS[app.levelIndex];
  state = createGameState(app.currentLevel, mode);
  resultPanel.classList.add("hidden");
  setScreen("playing");
}

function startStoryLevel(index, includeIntro = false) {
  const levelIndex = clamp(index, 0, LEVELS.length - 1);
  const queue = [];
  if (includeIntro) queue.push(...INTRO_CUTSCENES);
  queue.push(levelCutsceneFor(levelIndex));
  beginCutscene(queue, () => startLevel(levelIndex, "campaign"));
}

function skipTutorial({ includeIntro = false } = {}) {
  const firstMissionIndex = Math.min(1, LEVELS.length - 1);
  resultPanel.classList.add("hidden");
  clearActorPerformance();
  clearCutsceneTerminal();
  app.cutsceneQueue = [];
  app.cutsceneIndex = 0;
  app.cutsceneComplete = null;
  state = null;
  startStoryLevel(firstMissionIndex, includeIntro);
}

function levelCutsceneFor(index) {
  const level = LEVELS[index];
  const brief = LEVEL_BRIEFS[index] || LEVEL_BRIEFS[0];
  return {
    image: `${STORY_ART_DIR}${LEVEL_CUTSCENE_IMAGES[index]}`,
    kicker: `Chamber ${String(index + 1).padStart(2, "0")}`,
    title: index === 0 ? "RoboSwitch Meets Fli" : level.title,
    body: index === 0 ? "RoboSwitch frees a tiny maintenance butterfly from the damaged training rail. Fli chooses to stay—not as a weapon, but as his eyes, signal link, and friend." : level.subtitle,
    signal: brief.signal,
    location: `${level.title} / access gantry`,
    speaker: index === 0 ? "FLI-01, maintenance signal drone" : "MARA-7, field archive",
    beat: index === 0
      ? "A damaged access panel opens and releases Fli, a tiny robot butterfly with flickering cyan wings. She shakes off one loose spark, circles RoboSwitch, projects FLI ONLINE, and lands on his shoulder."
      : "Fli enters first, reads the chamber's signal signature, then loops back to RoboSwitch with a small holographic arrow and an encouraging chirp.",
    cast: index % 2 ? ["mara", "rsw", "drone"] : ["iona", "rsw", "drone"],
    ledger: {
      source: brief.signal,
      clue: brief.chamber,
      next: brief.callout,
    },
  };
}

function beginCutscene(queue, onComplete) {
  app.cutsceneQueue = queue.filter(Boolean);
  app.cutsceneIndex = 0;
  app.cutsceneComplete = onComplete;
  resultPanel.classList.add("hidden");
  setScreen("cutscene");
}

function advanceCutscene() {
  if (app.screen !== "cutscene") return false;
  if (completeCutsceneTerminal()) return true;
  triggerInterfaceGlitch();
  performSceneTransition(() => {
    if (app.cutsceneIndex < app.cutsceneQueue.length - 1) {
      app.cutsceneIndex += 1;
      renderScreen();
    } else {
      finishCutscene();
    }
  });
  return true;
}

function skipCutscene() {
  if (app.screen !== "cutscene") return false;
  triggerInterfaceGlitch();
  finishCutscene();
  return true;
}

function finishCutscene() {
  clearActorPerformance();
  clearCutsceneTerminal();
  const onComplete = app.cutsceneComplete;
  app.cutsceneQueue = [];
  app.cutsceneIndex = 0;
  app.cutsceneComplete = null;
  if (onComplete) withCurtainTransition(onComplete);
  else withCurtainTransition(() => setScreen("menu"));
}

function startSurvival() {
  app.playMode = "survival";
  app.currentLevel = SURVIVAL_LEVEL;
  state = createGameState(SURVIVAL_LEVEL, "survival");
  resultPanel.classList.add("hidden");
  setScreen("playing");
}

function startCustom() {
  const level = draftToLevel(app.editorDraft);
  app.playMode = "custom";
  app.currentLevel = level;
  state = createGameState(level, "custom");
  resultPanel.classList.add("hidden");
  setScreen("playing");
}

function restartCurrentRun() {
  if (app.playMode === "survival") startSurvival();
  else if (app.playMode === "custom") startCustom();
  else startLevel(app.levelIndex, "campaign");
}

function createGameState(level, mode) {
  const start = level.playerStart || { x: 0.5, y: 0.58 };
  obstacles = absoluteObstacles(level);
  return {
    time: 0,
    paused: false,
    ended: false,
    won: false,
    playMode: mode,
    level,
    score: 0,
    wave: 0,
    nextWaveIn: LEVEL_START_DELAY,
    mode: "pressure",
    entropyDeficit: 0,
    regime: "Dynamic",
    usage: { pressure: 0.34, control: 0.33, chaos: 0.33 },
    heat: { pressure: 0, control: 0, chaos: 0 },
    shake: 0,
    flash: 0,
    controlPulse: 0,
    chaosNoise: 0,
    spawnGrace: 0,
    combo: {
      streak: 0,
      best: 0,
      timer: 0,
      lastBonus: 0,
      message: "",
      messageTimer: 0,
      pulse: 0,
    },
    player: {
      x: start.x * width,
      y: clamp(start.y * height, 92, height - 92),
      vx: 0,
      vy: 0,
      radius: 18,
      hp: 100,
      energy: 100,
      angle: -Math.PI / 2,
      invuln: PLAYER_START_INVULN,
      phase: 0,
      guard: 0,
      guardCooldown: 0,
      pulseCooldown: 0,
      abilityCooldown: 0,
      controlTick: 0,
      hurtCooldown: 0,
      lastMoveX: 1,
      lastMoveY: 0,
    },
    enemies: [],
    projectiles: [],
    pickups: [],
    pickupTimer: 4,
    lowEnergyTimer: 0,
    particles: [],
    shockwaves: [],
    beams: [],
    floaters: [],
    afterimages: [],
    objective: level.objective ? { ...level.objective, active: false, collected: false, x: width * 0.78, y: height * 0.5 } : null,
    puzzle: level.objective ? createPuzzleState(level.objective, level) : null,
    roomDoor: { locked: Boolean(level.objective), open: false },
    mechanic: createLevelMechanic(level),
    bossIntroPlayed: false,
    bossOutroPlayed: false,
    pendingBossWave: 0,
    signalDirector: { timer: 6.5, last: "", count: 0 },
    fli: { active: true, cue: "", mood: "curious", timer: 0, angle: 0, celebrate: 0 },
    humanTouch: { quiet: 7.5, eventTimer: 5.5, eventIndex: 0, event: "", eventLife: 0, idle: 0 },
  };
}


function createLevelMechanic(level) {
  const config = level?.mechanic || { type: "standard", label: "STANDARD ARENA" };
  return {
    ...config,
    time: 0,
    phase: 0,
    warning: 0,
    lastDangerPhase: -1,
    angle: 0,
  };
}

function refreshMechanicObstacles() {
  if (!state) return;
  const base = absoluteObstacles(state.level);
  const mechanic = state.mechanic;
  const dynamic = [];
  if (mechanic?.type === "revolver") {
    const cx = width * 0.5;
    const cy = height * 0.53;
    const armLength = Math.min(width, height) * 0.22;
    const segments = 7;
    for (let arm = 0; arm < 2; arm += 1) {
      const angle = mechanic.angle + arm * Math.PI / 2;
      for (let i = 1; i <= segments; i += 1) {
        const d = (armLength * i) / segments;
        dynamic.push({ shape: "circle", x: cx + Math.cos(angle) * d, y: cy + Math.sin(angle) * d, r: 15 });
        dynamic.push({ shape: "circle", x: cx - Math.cos(angle) * d, y: cy - Math.sin(angle) * d, r: 15 });
      }
    }
    dynamic.push({ shape: "circle", x: cx, y: cy, r: 34 });
  }
  if (mechanic?.type === "blastDoors") {
    const closed = mechanic.phase < 0.54;
    if (closed) {
      dynamic.push({ shape: "rect", x: width * 0.34, y: height * 0.53, w: 34, h: height * 0.42, hazard: true });
      dynamic.push({ shape: "rect", x: width * 0.66, y: height * 0.53, w: 34, h: height * 0.42, hazard: true });
    }
  }
  if (mechanic?.type === "platforms") {
    const firstClosed = mechanic.phase < 0.5;
    const rects = firstClosed
      ? [[0.28,0.40,0.28,0.045],[0.72,0.66,0.28,0.045]]
      : [[0.72,0.40,0.28,0.045],[0.28,0.66,0.28,0.045]];
    for (const [x,y,w,h] of rects) dynamic.push({ shape:"rect", x:x*width, y:y*height, w:w*width, h:Math.max(26,h*height), hazard:true });
  }
  obstacles = base.concat(dynamic);
}

function updateLevelMechanic(dt) {
  const mechanic = state.mechanic;
  if (!mechanic || mechanic.type === "standard" || mechanic.type === "maze") return;
  mechanic.time += dt;
  const period = mechanic.period || 5;
  mechanic.phase = (mechanic.time % period) / period;
  mechanic.warning = mechanic.phase > 0.43 && mechanic.phase < 0.54 ? 1 : 0;
  if (mechanic.type === "revolver") {
    mechanic.angle += dt * 0.42;
  }
  if (mechanic.type === "nexus") {
    mechanic.angle += dt * (0.22 + mechanic.phase * 0.35);
    state.controlPulse = Math.max(state.controlPulse, mechanic.warning ? 0.12 : 0);
  }
  refreshMechanicObstacles();

  const p = state.player;
  if (mechanic.type === "blastDoors" || mechanic.type === "platforms") {
    const danger = mechanic.phase < 0.08 || (mechanic.phase > 0.49 && mechanic.phase < 0.57);
    if (danger && mechanic.lastDangerPhase !== Math.floor(mechanic.time * 4)) {
      mechanic.lastDangerPhase = Math.floor(mechanic.time * 4);
      for (const obstacle of obstacles) {
        if (!obstacle.hazard || !circleHitsObstacle(p, obstacle)) continue;
        hurtPlayer(28, obstacle.x, obstacle.y);
        state.floaters.push({ text: "CRUSH ZONE", x: p.x, y: p.y - 30, vy: -16, life: 0.8, maxLife: 0.8, color: "#ff665f", size: 17 });
      }
    }
  }
  if (mechanic.type === "nexus") {
    const active = mechanic.phase < 0.24 || (mechanic.phase > 0.5 && mechanic.phase < 0.7);
    if (active && p.invuln <= 0 && p.hurtCooldown <= 0) {
      const dx = Math.abs(p.x - width * 0.5);
      const dy = Math.abs(p.y - height * 0.53);
      if (dx < 34 || dy < 34) hurtPlayer(14, width * 0.5, height * 0.53);
    }
  }
  if (mechanic.type === "fireWalls") {
    const active = mechanic.phase < 0.46;
    if (active && p.invuln <= 0 && p.hurtCooldown <= 0) {
      const wall = 76;
      if (p.x < wall || p.x > width - wall || p.y < 150 || p.y > height - 150) {
        hurtPlayer(18, width * 0.5, height * 0.5);
        state.floaters.push({ text: "FURNACE BURST", x: p.x, y: p.y - 28, vy: -18, life: 0.75, maxLife: 0.75, color: "#ff8b39", size: 17 });
      }
    }
  }
}

function drawLevelMechanic() {
  if (!state?.mechanic) return;
  const m = state.mechanic;
  ctx.save();
  ctx.font = "700 13px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(229,183,90,0.9)";
  ctx.fillText(m.label || "ARENA SYSTEM", width * 0.5, 102);

  if (m.type === "maze") {
    ctx.fillStyle = "rgba(229,183,90,0.12)";
    ctx.fillText("FIND THE ROUTE • DEAD ENDS MAY HOLD ENERGY", width * 0.5, 121);
  }
  if (m.type === "revolver") {
    const cx=width*0.5, cy=height*0.53, len=Math.min(width,height)*0.22;
    ctx.translate(cx,cy); ctx.rotate(m.angle);
    ctx.strokeStyle="rgba(67,184,255,0.78)"; ctx.lineWidth=11; ctx.lineCap="round";
    ctx.beginPath(); ctx.moveTo(-len,0); ctx.lineTo(len,0); ctx.moveTo(0,-len); ctx.lineTo(0,len); ctx.stroke();
    ctx.fillStyle="#071823"; ctx.strokeStyle="#9fe2ff"; ctx.lineWidth=4; ctx.beginPath();ctx.arc(0,0,34,0,TAU);ctx.fill();ctx.stroke();
  }
  if (m.type === "blastDoors" || m.type === "platforms") {
    const closing = m.phase < 0.54;
    ctx.fillStyle = closing ? "rgba(255,77,69,0.88)" : "rgba(57,224,121,0.78)";
    ctx.fillText(closing ? "WARNING: STRUCTURES CLOSING" : "PASSAGE OPEN", width*0.5, 122);
    if (m.warning) {
      ctx.globalAlpha=0.18+Math.sin(state.time*24)*0.08; ctx.fillStyle="#ff4d45"; ctx.fillRect(12,80,width-24,height-164);
    }
  }
  if (m.type === "nexus") {
    const cx = width * 0.5, cy = height * 0.53;
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(m.angle);
    ctx.strokeStyle = "rgba(220,236,255,0.72)"; ctx.lineWidth = 4;
    for (let i=0;i<3;i+=1){ctx.rotate(Math.PI/3);ctx.strokeRect(-Math.min(width,height)*0.24,-14,Math.min(width,height)*0.48,28);}
    ctx.restore();
    ctx.fillStyle = m.warning ? "#ffffff" : "rgba(220,236,255,0.78)";
    ctx.fillText(m.warning ? "NULL FIELD ALIGNING" : "READ THE RHYTHM • BREAK THE LOOP", width*0.5, 122);
  }
  if (m.type === "fireWalls") {
    const active=m.phase<0.46;
    ctx.fillStyle=active?"#ff8b39":"rgba(57,224,121,0.8)";
    ctx.fillText(active?"FIRE WALLS ACTIVE":"COOLING INTERVAL",width*0.5,122);
    if (active) {
      const flicker=10+Math.sin(state.time*22)*5;
      ctx.fillStyle="rgba(255,87,33,0.68)";
      for(let y=150;y<height-130;y+=32){ctx.beginPath();ctx.moveTo(12,y);ctx.lineTo(42+flicker,y-12);ctx.lineTo(70,y+8);ctx.lineTo(12,y+18);ctx.fill();ctx.beginPath();ctx.moveTo(width-12,y);ctx.lineTo(width-42-flicker,y-12);ctx.lineTo(width-70,y+8);ctx.lineTo(width-12,y+18);ctx.fill();}
      for(let x=70;x<width-50;x+=44){ctx.beginPath();ctx.moveTo(x,80);ctx.lineTo(x-12,125+flicker);ctx.lineTo(x+12,145);ctx.lineTo(x+20,80);ctx.fill();ctx.beginPath();ctx.moveTo(x,height-82);ctx.lineTo(x-12,height-125-flicker);ctx.lineTo(x+12,height-145);ctx.lineTo(x+20,height-82);ctx.fill();}
    }
  }
  ctx.restore();
}

function createPuzzleState(objective, level) {
  const sequence = Array.isArray(objective?.puzzle) && objective.puzzle.length
    ? objective.puzzle
    : ["pressure", "control", "chaos"];
  // Control Grid has a solid reactor housing in the upper center. The generic
  // three-node layout put its second (Control) pad inside that wall, making the
  // access circuit impossible. Use a level-specific layout that keeps every pad
  // in reachable floor space around the revolving gate.
  const positions = level?.id === "control-grid"
    ? [[0.24, 0.39], [0.78, 0.34], [0.72, 0.68]]
    : sequence.length === 4
      ? [[0.28, 0.38], [0.48, 0.33], [0.68, 0.42], [0.48, 0.66]]
      : [[0.28, 0.4], [0.5, 0.3], [0.7, 0.6]];
  return {
    active: false,
    solved: false,
    step: 0,
    feedback: 0,
    sequence: [...sequence],
    nodes: sequence.map((mode, index) => ({
      mode,
      nx: positions[index][0],
      ny: positions[index][1],
      active: false,
      solved: false,
    })),
  };
}

function syncPuzzleLayout() {
  if (!state?.puzzle) return;
  for (const node of state.puzzle.nodes) {
    node.x = node.nx * width;
    node.y = clamp(node.ny * height, 110, height - 110);
  }
  if (state.objective) {
    state.objective.x = width * 0.78;
    state.objective.y = height * 0.5;
  }
}

function absoluteObstacles(level) {
  return (level?.obstacles || []).map((item) => {
    if (item.shape === "rect") {
      const w = Math.max(34, item.w * width);
      const h = Math.max(24, item.h * height);
      return {
        shape: "rect",
        x: item.x * width,
        y: clamp(item.y * height, 96 + h / 2, height - 92 - h / 2),
        w,
        h,
      };
    }
    return {
      shape: "circle",
      x: item.x * width,
      y: clamp(item.y * height, 96, height - 92),
      r: Math.max(18, item.r * Math.min(width, height)),
    };
  });
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  const previousWidth = width;
  const previousHeight = height;
  dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX);

  // Newgrounds presentation tuning: use a near-full-size logical arena instead
  // of the old 68% compact arena. This makes characters/enemies ~26% smaller
  // on screen than the previous build without changing collision proportions.
  width = Math.max(1, rect.width * NEWGROUNDS_ARENA_SCALE);
  height = Math.max(1, rect.height * NEWGROUNDS_ARENA_SCALE);
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (state) {
    const scaleX = width / Math.max(1, previousWidth);
    const scaleY = height / Math.max(1, previousHeight);
    state.player.x *= scaleX;
    state.player.y *= scaleY;
    for (const collection of [state.enemies, state.projectiles, state.pickups, state.particles, state.shockwaves, state.floaters, state.afterimages]) {
      for (const item of collection || []) {
        if (Number.isFinite(item.x)) item.x *= scaleX;
        if (Number.isFinite(item.y)) item.y *= scaleY;
        if (Number.isFinite(item.x1)) item.x1 *= scaleX;
        if (Number.isFinite(item.y1)) item.y1 *= scaleY;
        if (Number.isFinite(item.x2)) item.x2 *= scaleX;
        if (Number.isFinite(item.y2)) item.y2 *= scaleY;
      }
    }
    refreshMechanicObstacles();
    state.player.x = clamp(state.player.x, 34, width - 34);
    state.player.y = clamp(state.player.y, 88, height - 92);
    syncPuzzleLayout();
  }
}

function loop(now) {
  const rawDt = (now - lastTime) / 1000 || 0;
  lastTime = now;
  const dt = Math.min(0.033, rawDt);
  ambientTime += dt;

  if (state && app.screen === "playing" && !state.paused) update(dt);
  else if (state) updateParticles(dt);

  draw();
  updateLockCursor();
  animationFrame = requestAnimationFrame(loop);
}

function update(dt) {
  state.time += dt;
  updateTimers(dt);

  if (!state.ended) {
    handleMovement(dt);
    updateLevelMechanic(dt);
    updateModeEconomy(dt);
    updateControlBeam(dt);
    updateChaosField(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updatePickups(dt);
    updatePuzzle(dt);
    updateObjective(dt);
    updateCollisions();
    updateSignalDirector(dt);
    updateHumanTouch(dt);
    updateWaves(dt);
  }

  updateParticles(dt);
  updateHud();
}

function updateTimers(dt) {
  const shakeScale = app.save.options.screenShake;
  state.shake = Math.max(0, state.shake - dt * 12 * (shakeScale > 0 ? 1 : 10));
  state.flash = Math.max(0, state.flash - dt * 3);
  state.controlPulse = Math.max(0, state.controlPulse - dt * 2);
  state.chaosNoise = Math.max(0, state.chaosNoise - dt * 2.8);

  const p = state.player;
  p.invuln = Math.max(0, p.invuln - dt);
  p.phase = Math.max(0, p.phase - dt);
  p.guard = Math.max(0, p.guard - dt);
  p.guardCooldown = Math.max(0, p.guardCooldown - dt);
  p.pulseCooldown = Math.max(0, p.pulseCooldown - dt);
  p.abilityCooldown = Math.max(0, p.abilityCooldown - dt);
  p.hurtCooldown = Math.max(0, p.hurtCooldown - dt);

  const combo = state.combo;
  combo.messageTimer = Math.max(0, combo.messageTimer - dt);
  combo.pulse = Math.max(0, combo.pulse - dt * 2.6);
  if (combo.streak > 0) {
    combo.timer -= dt;
    if (combo.timer <= 0) breakCombo("PCC LOST", "#a9a694", combo.streak > 1);
  }
}

function handleMovement(dt) {
  const p = state.player;
  let ix = 0;
  let iy = 0;

  if (keys.has("KeyA") || keys.has("ArrowLeft")) ix -= 1;
  if (keys.has("KeyD") || keys.has("ArrowRight")) ix += 1;
  if (keys.has("KeyW") || keys.has("ArrowUp")) iy -= 1;
  if (keys.has("KeyS") || keys.has("ArrowDown")) iy += 1;

  if (ix === 0 && iy === 0 && pointer.down) {
    const dx = pointer.x - p.x;
    const dy = pointer.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 30) {
      ix = dx / dist;
      iy = dy / dist;
    }
  }

  const mag = Math.hypot(ix, iy);
  if (state.humanTouch) {
    state.humanTouch.idle = mag > 0 ? 0 : state.humanTouch.idle + dt;
  }
  if (mag > 0) {
    ix /= mag;
    iy /= mag;
    p.lastMoveX = ix;
    p.lastMoveY = iy;
    p.angle = Math.atan2(iy, ix);
  }

  let speed = 214;
  if (state.mode === "pressure") speed = 248;
  if (state.mode === "control") speed = 148;
  if (state.mode === "chaos") speed = 214;
  speed *= PLAYER_SPEED_MULTIPLIER;
  speed *= 1 - state.entropyDeficit * 0.12;

  let driftX = 0;
  let driftY = 0;
  if (state.mode === "chaos") {
    const wobble = Math.sin(state.time * 9.7) * 0.65 + Math.cos(state.time * 5.3) * 0.35;
    driftX = Math.cos(state.time * 4.4) * wobble * 34;
    driftY = Math.sin(state.time * 5.8) * wobble * 34;
  }

  const accel = state.mode === "control" ? 9 : 13;
  p.vx = lerp(p.vx, ix * speed + driftX, 1 - Math.exp(-accel * dt));
  p.vy = lerp(p.vy, iy * speed + driftY, 1 - Math.exp(-accel * dt));
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.x = clamp(p.x, p.radius + 9, width - p.radius - 9);
  p.y = clamp(p.y, 82 + p.radius, height - p.radius - 82);
  collideCircleObstacles(p);
}

function updateModeEconomy(dt) {
  const p = state.player;
  const decay = Math.exp(-dt / 6.5);
  for (const key of Object.keys(state.usage)) {
    state.usage[key] *= decay;
    state.heat[key] = Math.max(0, state.heat[key] - dt * 0.08);
  }
  state.usage[state.mode] += dt;
  state.heat[state.mode] = clamp(state.heat[state.mode] + dt * 0.14, 0, 1.4);

  const total = state.usage.pressure + state.usage.control + state.usage.chaos;
  const probs = [state.usage.pressure / total, state.usage.control / total, state.usage.chaos / total];
  let entropy = 0;
  for (const value of probs) if (value > 0.0001) entropy -= value * Math.log(value);

  const targetDeficit = clamp(1 - entropy / Math.log(3), 0, 1);
  state.entropyDeficit = lerp(state.entropyDeficit, targetDeficit, 1 - Math.exp(-dt * 3.2));

  const regenPenalty = 1 - state.entropyDeficit * 0.34;
  if (state.mode === "control") p.energy -= 8 * dt;
  else p.energy += 8 * regenPenalty * dt;

  if (state.mode === "control" && p.energy > 0) p.energy += 1.2 * regenPenalty * dt;
  if (state.heat[state.mode] > 1) p.energy -= (state.heat[state.mode] - 1) * 5.5 * dt;
  p.energy = clamp(p.energy, 0, 100);

  state.pickupTimer -= dt;
  if (p.energy < 28) state.lowEnergyTimer += dt;
  else state.lowEnergyTimer = Math.max(0, state.lowEnergyTimer - dt * 2);

  if ((state.pickupTimer <= 0 && state.pickups.length < 2) || state.lowEnergyTimer > 4.5) {
    spawnEnergyPickup();
    state.pickupTimer = rand(8.5, 13.5);
    state.lowEnergyTimer = 0;
  }

  state.regime = regimeFromDeficit(state.entropyDeficit);
}

function updateControlBeam(dt) {
  const p = state.player;
  if (state.mode !== "control" || p.energy <= 0 || state.ended) return;
  p.controlTick -= dt;
  if (p.controlTick > 0) return;
  p.controlTick = 0.32 + state.entropyDeficit * 0.12;

  const target = nearestEnemy(p.x, p.y, 380);
  if (!target) return;

  state.beams.push({ x1: p.x, y1: p.y, x2: target.x, y2: target.y, life: 0.16, maxLife: 0.16, color: MODES.control.color });
  damageEnemy(target, 8.5, "control");
  target.slow = 0.34;
  state.controlPulse = Math.min(1, state.controlPulse + 0.14);
  spawnParticles(target.x, target.y, MODES.control.color, 4, 90);
}

function updateChaosField(dt) {
  if (state.mode !== "chaos") return;
  const p = state.player;
  for (const enemy of state.enemies) {
    if (ENEMIES[enemy.kind]?.family !== "control") continue;
    const dist = distance(p.x, p.y, enemy.x, enemy.y);
    if (dist < 116) {
      enemy.scrambled = Math.max(enemy.scrambled || 0, 0.32);
      damageEnemy(enemy, 5.5 * dt, "chaos");
      if (Math.random() < dt * 10) spawnParticles(enemy.x, enemy.y, MODES.chaos.color, 1, 70);
    }
  }
}

function updateEnemies(dt) {
  for (const enemy of state.enemies) {
    enemy.age += dt;
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt * 4);
    enemy.slow = Math.max(0, (enemy.slow || 0) - dt);
    enemy.scrambled = Math.max(0, (enemy.scrambled || 0) - dt);
    enemy.weak = Math.max(0, (enemy.weak || 0) - dt);
    enemy.spawnGrace = Math.max(0, (enemy.spawnGrace || 0) - dt);
    enemy.shielded = Math.max(0, (enemy.shielded || 0) - dt);
    const spec = ENEMIES[enemy.kind];
    if (spec?.boss) {
      const ratio = clamp(enemy.hp / enemy.maxHp, 0, 1);
      const nextPhase = ratio <= 0.34 ? 3 : ratio <= 0.67 ? 2 : 1;
      if (enemy.bossPhase && nextPhase > enemy.bossPhase) {
        state.floaters.push({ text: `${spec.label}: PHASE ${nextPhase}`, x: enemy.x, y: enemy.y - enemy.radius - 24, vy: -16, life: 1.25, maxLife: 1.25, color: spec.color, size: 18 });
        state.shake = Math.max(state.shake, 0.7);
        spawnParticles(enemy.x, enemy.y, spec.color, 24, 220);
        if (nextPhase === 2) playVoice("rhythm", { once: `rhythm:${state.level.id}`, volume: 0.82 });
      }
      enemy.bossPhase = nextPhase;
    }

    if (enemy.spawnGrace > 0) {
      enemy.vx = 0;
      enemy.vy = 0;
      continue;
    }

    const family = ENEMIES[enemy.kind]?.family || enemy.role;
    if (family === "pressure") updatePressureEnemy(enemy, dt);
    if (family === "control") updateControlEnemy(enemy, dt);
    if (family === "chaos") updateChaosEnemy(enemy, dt);

    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;
    enemy.x = clamp(enemy.x, enemy.radius + 8, width - enemy.radius - 8);
    enemy.y = clamp(enemy.y, 84 + enemy.radius, height - enemy.radius - 84);
    collideCircleObstacles(enemy);
  }
  separateEnemies();
}

function updatePressureEnemy(enemy, dt) {
  const spec = ENEMIES[enemy.kind];
  if (enemy.kind === "foreman" || enemy.kind === "colossus") {
    enemy.auraTimer -= dt;
    if (enemy.auraTimer <= 0) {
      enemy.auraTimer = (enemy.kind === "colossus" ? 2.4 : 3.2) / (1 + ((enemy.bossPhase || 1) - 1) * 0.25);
      for (const ally of state.enemies) if (ally !== enemy && ally.role === "pressure") ally.cooldown = Math.min(ally.cooldown || 1, 0.25);
      state.shockwaves.push({ x: enemy.x, y: enemy.y, radius: 12, speed: 180, life: 0.6, maxLife: 0.6, color: spec.color });
    }
  }
  updateRusher(enemy, dt);
}

function updateControlEnemy(enemy, dt) {
  if (enemy.kind === "medic") {
    enemy.healTimer -= dt;
    if (enemy.healTimer <= 0) {
      enemy.healTimer = 2.2;
      const target = state.enemies.filter(e => e !== enemy && e.role === "control" && e.hp < e.maxHp).sort((a,b)=>a.hp-b.hp)[0];
      if (target) { target.hp = Math.min(target.maxHp, target.hp + 16); state.beams.push({x1:enemy.x,y1:enemy.y,x2:target.x,y2:target.y,life:.3,maxLife:.3,color:ENEMIES.medic.color}); }
    }
  }
  if (enemy.kind === "shield") {
    for (const ally of state.enemies) if (ally !== enemy && ally.role === "control" && distance(enemy.x,enemy.y,ally.x,ally.y)<125) ally.shielded = 0.2;
  }
  if (enemy.kind === "administrator" || enemy.kind === "core") {
    enemy.summonTimer -= dt;
    if (enemy.summonTimer <= 0 && state.enemies.length < 10) { enemy.summonTimer = (enemy.kind === "core" ? 3.2 : 4.4) / (1 + ((enemy.bossPhase || 1) - 1) * 0.3); spawnEnemy(enemy.kind === "core" ? ((enemy.bossPhase || 1) >= 3 ? "shield" : "sniper") : "turret"); }
  }
  updateTurret(enemy, dt);
}

function updateChaosEnemy(enemy, dt) {
  if (enemy.kind === "teleporter" || enemy.kind === "prototype" || enemy.kind === "anomaly") {
    enemy.teleportTimer -= dt;
    if (enemy.teleportTimer <= 0) {
      enemy.teleportTimer = (enemy.kind === "anomaly" ? 1.15 : enemy.kind === "prototype" ? 1.65 : 2.25) / (1 + ((enemy.bossPhase || 1) - 1) * 0.24);
      spawnParticles(enemy.x, enemy.y, ENEMIES[enemy.kind].color, 9, 110);
      enemy.x = clamp(state.player.x + rand(-230,230), 42, width-42); enemy.y = clamp(state.player.y + rand(-180,180), 105, height-105);
    }
  }
  if (enemy.kind === "bomber") {
    enemy.bombTimer -= dt;
    if (enemy.bombTimer <= 0) { enemy.bombTimer = 1.8; fireChaosBomb(enemy); }
  }
  updateWobbler(enemy, dt);
  if (enemy.kind === "spinner") { enemy.vx *= 1.35; enemy.vy *= 1.35; }
}

function fireChaosBomb(enemy) {
  const dx=state.player.x-enemy.x, dy=state.player.y-enemy.y, d=Math.max(1,Math.hypot(dx,dy));
  state.projectiles.push({x:enemy.x,y:enemy.y,vx:dx/d*145,vy:dy/d*145,radius:8,life:4,color:ENEMIES.bomber.color,damage:12,chaosBomb:true});
}

function updateRusher(enemy, dt) {
  const p = state.player;
  const dx = p.x - enemy.x;
  const dy = p.y - enemy.y;
  const dist = Math.max(1, Math.hypot(dx, dy));
  const dirX = dx / dist;
  const dirY = dy / dist;
  const scale = 1 + state.wave * 0.08 + state.entropyDeficit * 0.28;
  const slowFactor = enemy.slow > 0 ? 0.48 : 1;
  const spec = ENEMIES[enemy.kind];
  const phaseBoost = spec.boss ? 1 + ((enemy.bossPhase || 1) - 1) * 0.18 : 1;
  const speedMod = (spec.speed || 1) * phaseBoost;
  const dashMod = (spec.dashScale || 1) * phaseBoost;

  enemy.cooldown -= dt;
  if (enemy.windup > 0) {
    enemy.windup -= dt;
    enemy.vx = lerp(enemy.vx, 0, 0.12);
    enemy.vy = lerp(enemy.vy, 0, 0.12);
    if (enemy.windup <= 0) {
      enemy.dash = 0.34;
      enemy.vx = dirX * 430 * scale * dashMod;
      enemy.vy = dirY * 430 * scale * dashMod;
    }
    return;
  }
  if (enemy.dash > 0) {
    enemy.dash -= dt;
    if (enemy.dash <= 0) {
      enemy.recover = 0.52;
      enemy.weak = 0.7;
      enemy.cooldown = 1.3 + Math.random() * 0.8;
    }
    return;
  }
  if (enemy.recover > 0) {
    enemy.recover -= dt;
    enemy.vx = lerp(enemy.vx, 0, 0.16);
    enemy.vy = lerp(enemy.vy, 0, 0.16);
    return;
  }
  if (enemy.cooldown <= 0 && dist < 360) {
    enemy.windup = 0.34;
    enemy.vx = 0;
    enemy.vy = 0;
    return;
  }

  enemy.vx = lerp(enemy.vx, dirX * 92 * scale * slowFactor * speedMod, 0.08);
  enemy.vy = lerp(enemy.vy, dirY * 92 * scale * slowFactor * speedMod, 0.08);
}

function updateTurret(enemy, dt) {
  enemy.vx = 0;
  enemy.vy = 0;
  enemy.fireTimer -= dt;

  if (!hasLineOfSight(enemy.x, enemy.y, state.player.x, state.player.y)) {
    enemy.charge = 0;
    enemy.fireTimer = Math.max(enemy.fireTimer, 0.22);
    return;
  }

  if (enemy.scrambled > 0 && Math.random() < dt * 4) {
    enemy.charge = 0;
    enemy.fireTimer = 0.4 + Math.random() * 0.6;
    spawnParticles(enemy.x, enemy.y, MODES.chaos.color, 2, 80);
    return;
  }

  if (enemy.charge > 0) {
    enemy.charge -= dt;
    if (enemy.charge <= 0) {
      fireTurret(enemy, state.player);
      enemy.fireTimer = Math.max(0.95, 2.45 - state.wave * 0.14 - state.entropyDeficit * 0.3);
    }
    return;
  }
  if (enemy.fireTimer <= 0) enemy.charge = 0.72;
}

function updateWobbler(enemy, dt) {
  const p = state.player;
  const dx = p.x - enemy.x;
  const dy = p.y - enemy.y;
  const dist = Math.max(1, Math.hypot(dx, dy));
  enemy.turnTimer -= dt;
  if (enemy.turnTimer <= 0) {
    const angle = Math.atan2(dy, dx) + rand(-1.4, 1.4);
    const speed = rand(80, 170) * (1 + state.wave * 0.045 + state.entropyDeficit * 0.25);
    enemy.targetVx = Math.cos(angle) * speed;
    enemy.targetVy = Math.sin(angle) * speed;
    enemy.turnTimer = rand(0.28, 0.72);
  }
  const pulse = 1 + Math.sin(enemy.age * 11 + enemy.seed) * 0.18;
  enemy.vx = lerp(enemy.vx, enemy.targetVx * pulse, 0.12);
  enemy.vy = lerp(enemy.vy, enemy.targetVy * pulse, 0.12);
}

function fireTurret(enemy, player) {
  const speed = 260 + state.wave * 12;
  let leadTime = distance(enemy.x, enemy.y, player.x, player.y) / speed;
  leadTime = clamp(leadTime, 0.16, 0.72);
  let tx = player.x + player.vx * leadTime;
  let ty = player.y + player.vy * leadTime;

  if (state.mode === "chaos" || player.phase > 0) {
    const angle = Math.atan2(ty - enemy.y, tx - enemy.x) + rand(-0.8, 0.8);
    tx = enemy.x + Math.cos(angle) * 360;
    ty = enemy.y + Math.sin(angle) * 360;
  }

  const dx = tx - enemy.x;
  const dy = ty - enemy.y;
  const mag = Math.max(1, Math.hypot(dx, dy));
  state.projectiles.push({
    x: enemy.x,
    y: enemy.y,
    vx: (dx / mag) * speed,
    vy: (dy / mag) * speed,
    radius: 5,
    life: 3.2,
    color: ENEMIES[enemy.kind].color,
    damage: 12,
  });
  state.shake = Math.max(state.shake, 0.08);
  spawnParticles(enemy.x, enemy.y, ENEMIES[enemy.kind].color, 4, 100);
}

function updateProjectiles(dt) {
  for (const projectile of state.projectiles) {
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.life -= dt;

    if (projectile.x < -40 || projectile.x > width + 40 || projectile.y < 42 || projectile.y > height + 40) projectile.life = 0;
    for (const obstacle of obstacles) {
      if (circleHitsObstacle(projectile, obstacle)) {
        projectile.life = 0;
        spawnParticles(projectile.x, projectile.y, projectile.color, 3, 70);
        break;
      }
    }
  }
  state.projectiles = state.projectiles.filter((projectile) => projectile.life > 0);
}

function updatePickups(dt) {
  const p = state.player;
  for (const pickup of state.pickups) {
    pickup.age += dt;
    pickup.life -= dt;
    if (distance(p.x, p.y, pickup.x, pickup.y) < p.radius + pickup.radius) {
      p.energy = clamp(p.energy + pickup.amount, 0, 100);
      p.guardCooldown = Math.max(0, p.guardCooldown - 2.2);
      pickup.life = 0;
      state.flash = Math.max(state.flash, 0.18);
      state.controlPulse = Math.max(state.controlPulse, 0.35);
      playSfx("pickup");
      spawnParticles(pickup.x, pickup.y, "#69f0ff", 14, 170);
      state.floaters.push({ text: "+EN", x: pickup.x, y: pickup.y - 14, vy: -22, life: 0.7, maxLife: 0.7, color: "#69f0ff", size: 15 });
    }
  }
  state.pickups = state.pickups.filter((pickup) => pickup.life > 0);
}

function updateCollisions() {
  const p = state.player;
  for (const projectile of state.projectiles) {
    if (distance(p.x, p.y, projectile.x, projectile.y) < p.radius + projectile.radius) {
      if (p.phase <= 0 && p.invuln <= 0 && !(state.mode === "chaos" && Math.random() < 0.55)) {
        hurtPlayer(projectile.damage, projectile.x, projectile.y);
      } else {
        spawnParticles(projectile.x, projectile.y, MODES.chaos.color, 5, 110);
      }
      projectile.life = 0;
    }
  }

  for (const enemy of state.enemies) {
    if (enemy.spawnGrace > 0) continue;
    const dist = distance(p.x, p.y, enemy.x, enemy.y);
    const minDist = p.radius + enemy.radius;
    if (dist < minDist) {
      const nx = (p.x - enemy.x) / Math.max(1, dist);
      const ny = (p.y - enemy.y) / Math.max(1, dist);
      p.x = enemy.x + nx * minDist;
      p.y = enemy.y + ny * minDist;
      p.vx += nx * 85;
      p.vy += ny * 85;

      if (p.phase <= 0 && p.invuln <= 0 && p.hurtCooldown <= 0) {
        let damage = ENEMIES[enemy.kind]?.damage || (enemy.role === "pressure" ? 13 : enemy.role === "control" ? 8 : 7);
        if (MODES[state.mode].counters === enemy.role) damage *= 0.48;
        hurtPlayer(damage, enemy.x, enemy.y);
      }
    }
  }
}

function updatePuzzle(dt) {
  const puzzle = state.puzzle;
  if (!puzzle || !puzzle.active || puzzle.solved) return;
  puzzle.feedback = Math.max(0, puzzle.feedback - dt);
  const node = puzzle.nodes[puzzle.step];
  if (!node) return;
  node.active = true;
  const p = state.player;
  if (distance(p.x, p.y, node.x, node.y) > p.radius + 30) return;

  if (state.mode === node.mode) {
    node.solved = true;
    node.active = false;
    puzzle.step += 1;
    state.score += 125;
    state.floaters.push({ text: `${MODES[node.mode].label.toUpperCase()} LINKED`, x: node.x, y: node.y - 30, vy: -18, life: 1.15, maxLife: 1.15, color: MODES[node.mode].color, size: 17 });
    spawnParticles(node.x, node.y, MODES[node.mode].color, 18, 150);
    playSfx("mode", node.mode);
    if (puzzle.step >= puzzle.nodes.length) {
      puzzle.solved = true;
      puzzle.active = false;
      state.objective.active = true;
      playSfx("terminalAccept");
      state.floaters.push({ text: "ACCESS CIRCUIT COMPLETE", x: width * 0.5, y: height * 0.3, vy: -14, life: 1.7, maxLife: 1.7, color: "#e5b75a", size: 22 });
      spawnParticles(state.objective.x, state.objective.y, "#e5b75a", 22, 180);
      triggerFliCue("CIRCUIT COMPLETE!", "celebrate", 2.4);
    }
  } else if (puzzle.feedback <= 0) {
    puzzle.feedback = 0.75;
    state.floaters.push({ text: `USE ${MODES[node.mode].label.toUpperCase()}`, x: node.x, y: node.y - 28, vy: -12, life: 0.8, maxLife: 0.8, color: MODES[node.mode].color, size: 14 });
  }
}

function updateObjective(dt) {
  const objective = state.objective;
  if (!objective || !objective.active || objective.collected) return;
  const p = state.player;
  const d = distance(p.x,p.y,objective.x,objective.y);
  if (d < p.radius + 24) {
    objective.collected = true; objective.active = false; state.roomDoor.locked = false; state.roomDoor.open = true;
    state.nextWaveIn = 1.25;
    state.floaters.push({text:`${objective.label} ACQUIRED`,x:p.x,y:p.y-34,vy:-18,life:1.8,maxLife:1.8,color:"#e5b75a",size:20});
    spawnParticles(p.x,p.y,"#e5b75a",20,170);
    playSfx("pickup");
    triggerFliCue("GATE SIGNAL OPEN", "happy", 2.2);
  }
}

function triggerFliCue(text, mood = "happy", duration = 2.2) {
  if (!state?.fli || !text) return;
  state.fli.cue = text;
  state.fli.mood = mood;
  state.fli.timer = duration;
  state.fli.celebrate = mood === "celebrate" ? duration : Math.min(duration, 0.8);
  playSfx("fli", mood);
}

function updateSignalDirector(dt) {
  if (!state?.signalDirector || state.ended) return;
  const director = state.signalDirector;
  director.timer -= dt;
  if (state.fli) {
    state.fli.timer = Math.max(0, state.fli.timer - dt);
    state.fli.celebrate = Math.max(0, state.fli.celebrate - dt);
    state.fli.angle += dt * (state.fli.celebrate > 0 ? 7.5 : 2.2);
  }
  if (director.timer > 0 || state.enemies.length === 0) return;
  const cues = [
    ["That one almost got you.", "alert"], ["Okay—THAT was smooth.", "happy"], ["I hear something ahead...", "curious"],
    ["They keep changing formation.", "thinking"], ["Did that door just move?", "curious"], ["Still with you, Switch.", "happy"],
  ];
  const pick = cues[(director.count + state.wave + Math.floor(state.time / 7)) % cues.length];
  director.count += 1;
  director.timer = 9 + ((director.count * 3) % 5);
  triggerFliCue(pick[0], pick[1]);
}

function updateHumanTouch(dt) {
  const h = state?.humanTouch;
  if (!h || state.ended) return;
  h.eventTimer -= dt;
  h.eventLife = Math.max(0, h.eventLife - dt);
  h.quiet += dt;
  // Deliberately sparse background beats. They do not alter combat.
  if (h.eventTimer <= 0) {
    const levelId = state.level?.id || "training";
    const beats = {
      training: ["maintenance", "wave", "cart"],
      "pressure-front": ["steam", "workers", "tool"],
      "control-grid": ["scanner", "straighten", "courier"],
      "chaos-field": ["glitch", "lost", "forklift"],
      "phase-boundary": ["doorcheck", "guard", "searchlight"],
      "collapse-boss": ["ash", "welder", "heat"],
      "signal-nexus": ["perfect", "desync", "silence"],
    };
    const list = beats[levelId] || beats.training;
    h.event = list[h.eventIndex % list.length];
    h.eventIndex += 1;
    h.eventLife = 2.4;
    h.eventTimer = 8.5 + (h.eventIndex % 4) * 1.35;
    if (h.event === "desync") triggerFliCue("...that light blinked twice.", "curious", 2.1);
    if (h.event === "doorcheck") playVoice("doorMoved", { once: `doorMoved:${state.level.id}`, volume: 0.82 });
    if (h.event === "workers" && state.enemies.length === 0) triggerFliCue("They're coming back out.", "happy", 1.8);
    if (h.event === "cart") triggerFliCue("Cart's still moving. Not us.", "curious", 1.6);
    if (h.event === "courier") triggerFliCue("Courier's early today.", "curious", 1.6);
    if (h.event === "lost") triggerFliCue("...wrong door again?", "curious", 1.6);
    // "maintenance", "wave", "tool", "straighten", "forklift", "guard", "welder", and
    // "silence" are intentionally silent beats: the timer still runs and the label still
    // cycles, but nothing fires. The room has more happening in it than the player sees.
  }
  // Long idle: Fli checks on Switch instead of issuing generic tutorial advice.
  if (h.idle > 8 && state.fli?.timer <= 0) {
    const idleLines = ["You okay, Switch?", "...thinking?", "I can wait."];
    const idleLine = idleLines[h.eventIndex % idleLines.length];
    triggerFliCue(idleLine, "curious", 1.7);
    if (idleLine === "You okay, Switch?") playVoice("youOkay", { once: `youOkay:${state.level.id}`, volume: 0.78 });
    h.idle = -7;
  }
}

function resumePlayingAfterCutscene(callback) {
  return () => {
    setScreen("playing");
    if (callback) callback();
  };
}

function updateWaves(dt) {
  if (state.enemies.length > 0) return;
  if (state.objective && state.wave === state.objective.afterWave && !state.objective.collected) {
    if (state.puzzle && !state.puzzle.solved) {
      state.puzzle.active = true;
      syncPuzzleLayout();
    } else {
      state.objective.active = true;
    }
    return;
  }
  state.nextWaveIn -= dt;
  if (state.nextWaveIn > 0) return;

  const nextWave = state.wave + 1;
  if (!state.level.endless && nextWave > state.level.waves.length) {
    endGame(true);
    return;
  }
  const isBossWave = !state.level.endless && nextWave === state.level.waves.length;
  if (isBossWave && !state.bossIntroPlayed && state.playMode === "campaign") {
    state.bossIntroPlayed = true;
    state.pendingBossWave = nextWave;
    const scene = bossCutscene(state.level, "intro");
    playSfx("bossIntro");
    if (state.level.id === "signal-nexus") window.setTimeout(() => playSfx("nullPing"), 420);
    beginCutscene([scene], resumePlayingAfterCutscene(() => {
      state.pendingBossWave = 0;
      startWave(nextWave);
      triggerFliCue("BOSS SIGNAL LOCKED", "alert", 2.4);
      playVoice("bossLocked", { once: `bossLocked:${state.level.id}`, volume: 0.92, force: true });
    }));
    return;
  }
  startWave(nextWave);
}

function startWave(number) {
  state.wave = number;
  state.nextWaveIn = 2.1;
  state.spawnGrace = WAVE_SPAWN_GRACE;
  state.player.invuln = Math.max(state.player.invuln, WAVE_SPAWN_GRACE + 0.45);
  const plan = wavePlanFor(number);
  for (const [kind, count] of Object.entries(plan)) {
    for (let i = 0; i < count; i += 1) spawnEnemy(kind, null, i / Math.max(1, count));
  }

  for (const spawn of state.level.spawns || []) {
    if ((spawn.wave || 1) === number) spawnEnemy(spawn.kind, spawn);
  }
  state.spawnGrace = 0;

  state.floaters.push({
    text: `Wave ${number}`,
    x: width * 0.5,
    y: height * 0.34,
    vy: -18,
    life: 1.25,
    maxLife: 1.25,
    color: "#f4f1e8",
    size: 28,
  });
  spawnEnergyPickup();
}

function wavePlanFor(number) {
  if (state.level.waves[number - 1]) return state.level.waves[number - 1];
  const tier = Math.max(0, number - state.level.waves.length);
  return {
    wobbler: 4 + tier * 2,
    rusher: 2 + Math.floor(tier * 1.4),
    turret: 1 + Math.floor(tier * 0.9),
  };
}

function spawnEnemy(kind, spawn = null, phase = Math.random()) {
  const spec = ENEMIES[kind] || ENEMIES.wobbler;
  let x;
  let y;
  if (spawn) {
    x = spawn.x * width;
    y = clamp(spawn.y * height, 96, height - 94);
  } else {
    const edge = Math.floor(rand(0, 4));
    const pad = 34;
    if (edge === 0) {
      x = rand(pad, width - pad);
      y = 92;
    } else if (edge === 1) {
      x = width - pad;
      y = rand(98, height - 100);
    } else if (edge === 2) {
      x = rand(pad, width - pad);
      y = height - 95;
    } else {
      x = pad;
      y = rand(98, height - 100);
    }
  }

  if (distance(x, y, state.player.x, state.player.y) < 130) {
    x = clamp(width - x, 42, width - 42);
    y = clamp(height - y, 100, height - 100);
  }

  const hp = spec.hp + Math.max(0, state.wave - 1) * 4;
  const enemy = {
    kind,
    role: spec.role,
    x,
    y,
    vx: 0,
    vy: 0,
    radius: spec.radius * 1.08,
    hp,
    maxHp: hp,
    age: phase * 3,
    seed: Math.random() * 1000,
    hitFlash: 0,
    weak: 0,
    slow: 0,
    scrambled: 0,
    spawnGrace: state.spawnGrace || 0,
    bossPhase: spec.boss ? 1 : 0,
  };
  const family = spec.family || spec.role;
  if (family === "pressure") Object.assign(enemy, { cooldown: rand(0.45, 1.6) + enemy.spawnGrace, windup: 0, dash: 0, recover: 0, auraTimer: rand(1.2,2.5) });
  if (family === "control") Object.assign(enemy, { fireTimer: rand(0.8, 1.8) + enemy.spawnGrace, charge: 0, healTimer: rand(1,2), summonTimer: rand(2,4) });
  if (family === "chaos") Object.assign(enemy, { turnTimer: rand(0.1, 0.4), targetVx: rand(-90, 90), targetVy: rand(-90, 90), teleportTimer: rand(1,2.6), bombTimer: rand(.8,1.8) });
  state.enemies.push(enemy);
}

function spawnEnergyPickup(originX = null, originY = null) {
  if (!state || state.pickups.length >= 3) return;
  let point = null;
  if (originX !== null && originY !== null && isSafePickupSpot(originX, originY)) {
    point = { x: originX, y: originY };
  }

  for (let i = 0; !point && i < 18; i += 1) {
    const angle = rand(0, TAU);
    const radius = rand(128, 232);
    const x = clamp(state.player.x + Math.cos(angle) * radius, 42, width - 42);
    const y = clamp(state.player.y + Math.sin(angle) * radius, 112, height - 112);
    if (isSafePickupSpot(x, y)) point = { x, y };
  }

  for (let i = 0; !point && i < 36; i += 1) {
    const x = rand(42, width - 42);
    const y = rand(112, height - 112);
    if (isSafePickupSpot(x, y)) point = { x, y };
  }

  if (!point) return;
  state.pickups.push({
    x: point.x,
    y: point.y,
    radius: 10,
    amount: 42,
    life: 28,
    age: 0,
  });
}

function isSafePickupSpot(x, y) {
  const test = { x, y, radius: 16 };
  if (distance(x, y, state.player.x, state.player.y) < 95) return false;
  for (const obstacle of obstacles) if (circleHitsObstacle(test, obstacle)) return false;
  for (const enemy of state.enemies) if (distance(x, y, enemy.x, enemy.y) < 70) return false;
  return true;
}

function usePulse() {
  if (!state || state.ended || app.screen !== "playing") return;
  const p = state.player;
  if (p.pulseCooldown > 0) return;

  const costs = { pressure: 4, control: 2, chaos: 5 };
  const cost = costs[state.mode];
  if (p.energy < cost) {
    tryTriggerGuard("LOW EN");
    return;
  }
  p.energy -= cost;
  playSfx("pulse", state.mode);

  if (state.mode === "pressure") pressurePulse();
  else if (state.mode === "control") controlPulseShot();
  else chaosPulseArc();
}

function pressurePulse() {
  const p = state.player;
  const dir = abilityDirection();
  p.pulseCooldown = 0.2;
  p.angle = Math.atan2(dir.y, dir.x);
  p.vx += dir.x * 34;
  p.vy += dir.y * 34;
  const hitX = p.x + dir.x * 54;
  const hitY = p.y + dir.y * 54;
  state.shockwaves.push({ x: hitX, y: hitY, radius: 5, maxRadius: 48, life: 0.18, maxLife: 0.18, color: MODES.pressure.color });
  spawnParticles(hitX, hitY, MODES.pressure.color, 8, 125);
  let hit = false;
  for (const enemy of state.enemies) {
    const dx = enemy.x - p.x;
    const dy = enemy.y - p.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const facing = (dx / dist) * dir.x + (dy / dist) * dir.y;
    if (dist > 92 + enemy.radius || facing < 0.1) continue;
    damageEnemy(enemy, 11, "pressure");
    enemy.vx += dir.x * 175;
    enemy.vy += dir.y * 175;
    hit = true;
  }
  if (hit) state.shake = Math.max(state.shake, 0.32);
}

function controlPulseShot() {
  const p = state.player;
  p.pulseCooldown = 0.24;
  const target = nearestEnemy(p.x, p.y, 500);
  if (!target) {
    const dir = abilityDirection();
    state.beams.push({ x1: p.x, y1: p.y, x2: p.x + dir.x * 120, y2: p.y + dir.y * 120, life: 0.12, maxLife: 0.12, color: "#b7e6ff" });
    return;
  }
  state.beams.push({ x1: p.x, y1: p.y, x2: target.x, y2: target.y, life: 0.16, maxLife: 0.16, color: "#b7e6ff" });
  damageEnemy(target, 7.5, "control");
  target.slow = Math.max(target.slow || 0, 0.24);
  state.controlPulse = Math.max(state.controlPulse, 0.55);
  spawnParticles(target.x, target.y, MODES.control.color, 6, 105);
}

function chaosPulseArc() {
  const p = state.player;
  p.pulseCooldown = 0.26;
  const targets = [...state.enemies]
    .filter((enemy) => enemy.spawnGrace <= 0 && distance(p.x, p.y, enemy.x, enemy.y) < 260)
    .sort((a, b) => distance(p.x, p.y, a.x, a.y) - distance(p.x, p.y, b.x, b.y))
    .slice(0, 2);
  if (!targets.length) {
    spawnParticles(p.x + rand(-18, 18), p.y + rand(-18, 18), MODES.chaos.color, 7, 110);
    state.chaosNoise = Math.max(state.chaosNoise, 0.32);
    return;
  }
  let fromX = p.x;
  let fromY = p.y;
  for (const target of targets) {
    const jitterX = target.x + rand(-7, 7);
    const jitterY = target.y + rand(-7, 7);
    state.beams.push({ x1: fromX, y1: fromY, x2: jitterX, y2: jitterY, life: 0.15, maxLife: 0.15, color: MODES.chaos.color });
    damageEnemy(target, 6.5, "chaos");
    target.scrambled = Math.max(target.scrambled || 0, 0.38);
    spawnParticles(target.x, target.y, MODES.chaos.color, 7, 120);
    fromX = target.x;
    fromY = target.y;
  }
  state.chaosNoise = Math.max(state.chaosNoise, 0.6);
}

function useAbility() {
  if (!state || state.ended || app.screen !== "playing") return;
  const p = state.player;
  if (p.abilityCooldown > 0) return;

  if (state.mode === "pressure") {
    if (p.energy < 30) {
      tryTriggerGuard("LOW EN");
      return;
    }
    p.energy -= 30;
    p.abilityCooldown = 0.72;
    p.invuln = Math.max(p.invuln, 0.12);
    playSfx("ability", state.mode);
    const dir = abilityDirection();
    p.vx += dir.x * 420;
    p.vy += dir.y * 420;
    p.x += dir.x * 18;
    p.y += dir.y * 18;
    p.angle = Math.atan2(dir.y, dir.x);
    pressureSlam(p.x, p.y);
    state.shake = Math.max(state.shake, 1);
    state.flash = Math.max(state.flash, 0.55);
  } else if (state.mode === "control") {
    if (p.energy < 28) {
      tryTriggerGuard("LOW EN");
      return;
    }
    p.energy -= 28;
    p.abilityCooldown = 1.05;
    playSfx("ability", state.mode);
    const targets = [...state.enemies]
      .filter((enemy) => enemy.spawnGrace <= 0 && distance(p.x, p.y, enemy.x, enemy.y) < 390)
      .sort((a, b) => distance(p.x, p.y, a.x, a.y) - distance(p.x, p.y, b.x, b.y))
      .slice(0, 4);
    state.shockwaves.push({ x: p.x, y: p.y, radius: 12, maxRadius: 205, life: 0.52, maxLife: 0.52, color: MODES.control.color });
    for (const target of targets) {
      state.beams.push({ x1: p.x, y1: p.y, x2: target.x, y2: target.y, life: 0.38, maxLife: 0.38, color: "#dff5ff" });
      damageEnemy(target, 9, "control");
      target.slow = Math.max(target.slow || 0, 1.65);
      target.weak = Math.max(target.weak || 0, 0.9);
      spawnParticles(target.x, target.y, MODES.control.color, 10, 125);
    }
    state.controlPulse = 1;
    state.floaters.push({ text: "SIGNAL LOCK", x: p.x, y: p.y - 34, vy: -17, life: 0.85, maxLife: 0.85, color: MODES.control.color, size: 15 });
  } else if (state.mode === "chaos") {
    if (p.energy < 25) {
      tryTriggerGuard("LOW EN");
      return;
    }
    p.energy -= 25;
    p.abilityCooldown = 0.72;
    playSfx("ability", state.mode);
    chaosBlink();
  }
}

function tryTriggerGuard(label = "GUARD") {
  const p = state.player;
  if (p.guardCooldown > 0 || p.guard > 0) return false;
  p.guard = GUARD_DURATION;
  p.guardCooldown = GUARD_COOLDOWN;
  p.invuln = Math.max(p.invuln, 0.5);
  p.energy = clamp(p.energy + 12, 0, 100);
  state.shake = Math.max(state.shake, 0.24);
  state.flash = Math.max(state.flash, 0.22);
  state.shockwaves.push({ x: p.x, y: p.y, radius: 18, maxRadius: 86, life: 0.38, maxLife: 0.38, color: "#f4f1e8" });
  for (const enemy of state.enemies) {
    const dist = distance(p.x, p.y, enemy.x, enemy.y);
    if (dist < 112) {
      const nx = (enemy.x - p.x) / Math.max(1, dist);
      const ny = (enemy.y - p.y) / Math.max(1, dist);
      enemy.vx += nx * 190;
      enemy.vy += ny * 190;
      enemy.slow = Math.max(enemy.slow || 0, 0.4);
    }
  }
  state.floaters.push({ text: label, x: p.x, y: p.y - 28, vy: -18, life: 0.72, maxLife: 0.72, color: "#f4f1e8", size: 14 });
  spawnParticles(p.x, p.y, "#f4f1e8", 16, 160);
  playSfx("guard");
  return true;
}

function pressureSlam(x, y) {
  state.shockwaves.push({ x, y, radius: 10, maxRadius: 122, life: 0.34, maxLife: 0.34, color: MODES.pressure.color });
  spawnParticles(x, y, MODES.pressure.color, 22, 220);

  for (const enemy of state.enemies) {
    const dist = distance(x, y, enemy.x, enemy.y);
    if (dist > 132) continue;
    const falloff = 1 - dist / 132;
    damageEnemy(enemy, 18 + falloff * 14, "pressure");
    const nx = (enemy.x - x) / Math.max(1, dist);
    const ny = (enemy.y - y) / Math.max(1, dist);
    enemy.vx += nx * (240 + falloff * 260);
    enemy.vy += ny * (240 + falloff * 260);
  }
}

function chaosBlink() {
  const p = state.player;
  const dir = abilityDirection();
  state.afterimages.push({ x: p.x, y: p.y, angle: p.angle, life: 0.5, maxLife: 0.5, color: MODES.chaos.color });

  const startX = p.x;
  const startY = p.y;
  p.x = clamp(p.x + dir.x * 142, p.radius + 10, width - p.radius - 10);
  p.y = clamp(p.y + dir.y * 142, 84 + p.radius, height - p.radius - 84);
  collideCircleObstacles(p);

  for (let i = 0; i < 8; i += 1) {
    const t = i / 7;
    spawnParticles(lerp(startX, p.x, t), lerp(startY, p.y, t), MODES.chaos.color, 2, 130);
  }

  p.phase = 0.62;
  p.invuln = Math.max(p.invuln, 0.3);
  state.chaosNoise = 1;
  state.shake = Math.max(state.shake, 0.35);
  state.shockwaves.push({ x: p.x, y: p.y, radius: 18, maxRadius: 98, life: 0.35, maxLife: 0.35, color: MODES.chaos.color });

  for (const enemy of state.enemies) {
    const dist = distance(p.x, p.y, enemy.x, enemy.y);
    if (dist < 150) {
      enemy.scrambled = Math.max(enemy.scrambled || 0, 0.95);
      damageEnemy(enemy, 12, "chaos");
    }
  }
}

function abilityDirection() {
  const p = state.player;
  let dx = p.lastMoveX;
  let dy = p.lastMoveY;
  if (pointer.movedAt > state.time - 1.4) {
    const pdx = pointer.x - p.x;
    const pdy = pointer.y - p.y;
    const mag = Math.hypot(pdx, pdy);
    if (mag > 24) {
      dx = pdx / mag;
      dy = pdy / mag;
    }
  }
  const mag = Math.max(0.001, Math.hypot(dx, dy));
  return { x: dx / mag, y: dy / mag };
}

function damageEnemy(enemy, amount, sourceMode) {
  if (enemy.spawnGrace > 0) return;
  const source = MODES[sourceMode];
  const correctCounter = source.counters === enemy.role;
  if (correctCounter && state.combo.streak > 0) state.combo.timer = COMBO_TIMEOUT;
  if (!correctCounter && amount > 0.2) breakCombo("PCC BREAK", "#ff8f87", true);
  let multiplier = 0.82;
  if (correctCounter) multiplier = 2.25;
  if (enemy.role === sourceMode) multiplier = 0.48;
  if (enemy.weak > 0 && sourceMode === "control") multiplier += 0.95;
  if (enemy.shielded > 0) multiplier *= 0.52;
  enemy.hp -= amount * multiplier;
  enemy.hitFlash = 1;
  playSfx("hit", sourceMode);
  if (enemy.hp <= 0) killEnemy(enemy, sourceMode, correctCounter);
}

function killEnemy(enemy, sourceMode, correctCounter) {
  if (enemy.dead) return;
  enemy.dead = true;
  const stabilityBonus = Math.round((1 - state.entropyDeficit) * 30);
  const comboBonus = correctCounter ? registerComboKill(enemy, sourceMode) : 0;
  const earned = ENEMIES[enemy.kind].score + stabilityBonus + comboBonus;
  state.score += earned;
  playSfx("enemyDown");
  spawnParticles(enemy.x, enemy.y, MODES[sourceMode].color, 18, 190);
  if (Math.random() < 0.22 || state.player.energy < 24) spawnEnergyPickup(enemy.x, enemy.y);
  state.floaters.push({ text: String(earned), x: enemy.x, y: enemy.y - 10, vy: -24, life: 0.65, maxLife: 0.65, color: MODES[sourceMode].color, size: 14 });
  state.enemies = state.enemies.filter((item) => item !== enemy);
  if (ENEMIES[enemy.kind]?.boss) {
    triggerFliCue("SIGNAL BROKEN — KEEP GOING!", "celebrate", 2.8);
    playVoice("signalBroken", { once: `signalBroken:${state.level.id}`, volume: 0.9, force: true });
  }
}

function registerComboKill(enemy, sourceMode) {
  const combo = state.combo;
  combo.streak += 1;
  combo.best = Math.max(combo.best, combo.streak);
  combo.timer = COMBO_TIMEOUT;
  combo.lastBonus = comboBonusFor(combo.streak);
  combo.message = `PCC x${combo.streak} +${combo.lastBonus}`;
  combo.messageTimer = 1.2;
  combo.pulse = 1;
  playSfx("combo", combo.streak);
  if (combo.streak === 3) {
    triggerFliCue("TRIAD CHAIN!", "happy", 1.8);
    if (state.level?.id === "tutorial-loop") playVoice("triad", { once: "triad:tutorial", volume: 0.86 });
  }
  if (combo.streak === 6) {
    triggerFliCue("PERFECT ADAPTATION!", "celebrate", 2.2);
    playVoice("smooth", { once: `smooth:${state.level.id}`, volume: 0.78 });
  }
  state.floaters.push({
    text: combo.message,
    x: enemy.x,
    y: enemy.y - 30,
    vy: -28,
    life: 0.85,
    maxLife: 0.85,
    color: MODES[sourceMode].color,
    size: 15,
  });
  return combo.lastBonus;
}

function comboBonusFor(streak) {
  return Math.min(300, 25 + (streak - 1) * 20 + Math.floor(streak / 5) * 25);
}

function breakCombo(message, color, showFloater) {
  const combo = state?.combo;
  if (!combo || combo.streak <= 0) return;
  combo.streak = 0;
  combo.timer = 0;
  combo.lastBonus = 0;
  combo.message = message;
  combo.messageTimer = 0.85;
  combo.pulse = 0;
  if (showFloater) {
    state.floaters.push({
      text: message,
      x: state.player.x,
      y: state.player.y - 34,
      vy: -18,
      life: 0.75,
      maxLife: 0.75,
      color,
      size: 13,
    });
  }
}

function hurtPlayer(amount, x, y) {
  const p = state.player;
  if (p.guard > 0) {
    spawnParticles(p.x, p.y, "#f4f1e8", 7, 130);
    playSfx("guard");
    return;
  }
  if (tryTriggerGuard("BLOCK")) return;

  let final = amount;
  if (state.mode === "control" && p.energy > 0) {
    final *= 0.58;
    p.energy = Math.max(0, p.energy - 3.5);
  }
  p.hp = clamp(p.hp - final, 0, 100);
  p.hurtCooldown = 0.45;
  p.invuln = 0.28;
  state.shake = Math.max(state.shake, 0.55);
  state.flash = Math.max(state.flash, 0.25);
  playSfx("damage");
  if (p.hp > 0 && p.hp <= 30) playVoice("almostGotYou", { once: `almost:${state.level.id}`, volume: 0.8 });
  spawnParticles(p.x, p.y, "#f4f1e8", 10, 140);

  const dx = p.x - x;
  const dy = p.y - y;
  const mag = Math.max(1, Math.hypot(dx, dy));
  p.vx += (dx / mag) * 230;
  p.vy += (dy / mag) * 230;
  if (p.hp <= 0) endGame(false);
}

function resultQuipFor(won) {
  const lines = won ? RESULT_QUIPS.win : RESULT_QUIPS.collapse;
  const levelKey = state.level?.id || state.level?.title || "roboswitch";
  let seed = state.score + state.wave * 17 + Math.round(state.entropyDeficit * 100);
  for (let i = 0; i < levelKey.length; i += 1) seed += levelKey.charCodeAt(i) * (i + 3);
  return lines[Math.abs(seed) % lines.length];
}

function endGame(won) {
  if (won && state?.playMode === "campaign" && !state.bossOutroPlayed) {
    state.bossOutroPlayed = true;
    const scene = bossCutscene(state.level, "outro");
    playSfx("bossDefeat");
    beginCutscene([scene], () => finalizeEndGame(true));
    return;
  }
  finalizeEndGame(won);
}

function finalizeEndGame(won) {
  state.ended = true;
  state.won = won;
  app.result = { won, score: state.score, wave: state.wave, mode: state.playMode };
  playSfx(won ? "levelClear" : "collapse");
  if (won) {
    const isFinal = state.playMode === "campaign" && app.levelIndex === LEVELS.length - 1;
    playVoice(isFinal ? "loopStabilized" : "signalRestored", { once: `result:${state.level?.id}:win`, volume: 0.94, force: true });
  } else {
    playVoice("systemCollapse", { once: `result:${state.level?.id}:loss`, volume: 0.9, force: true });
  }

  if (won) {
    playMusic(Music.LEVEL_CLEAR, {
      restart: true,
    });
  } else {
    playMusic(Music.ENDING, {
      restart: true,
    });
  }

  if (won && state.playMode === "campaign") {
    const level = LEVELS[app.levelIndex];
    app.save.completed[level.id] = true;
    app.save.unlocked = Math.max(app.save.unlocked, Math.min(LEVELS.length, app.levelIndex + 2));
    app.save.bestScores[level.id] = Math.max(app.save.bestScores[level.id] || 0, state.score);
    saveGame();
    if (app.levelIndex === 0) ngBridge.unlockMedal("First Loop");
    if (app.levelIndex === LEVELS.length - 1) ngBridge.unlockMedal("Loop Stabilized");
  }

  if (state.playMode === "survival") {
    app.save.survivalBest = Math.max(app.save.survivalBest || 0, state.score);
    saveGame();
    ngBridge.postScore("survival", state.score);
  }

  resultTitle.textContent = won ? "Loop Stabilized" : "System Collapse";
  resultPanel.dataset.outcome = won ? "win" : "loss";
  resultStats.textContent = `${state.level.title} | Score ${state.score} | Wave ${state.wave} | EBID ${Math.round(state.entropyDeficit * 100)}%`;
  if (resultQuip) resultQuip.textContent = resultQuipFor(won);
  nextButton.hidden = !(won && state.playMode === "campaign" && app.levelIndex < LEVELS.length - 1);
  resultPanel.classList.remove("hidden");
  hudTop.classList.add("hidden");
  modeDock.classList.add("hidden");
  pauseButton.classList.add("hidden");
  comboChip.classList.add("hidden");
  screenLayer.classList.add("hidden");
}

function updateParticles(dt) {
  if (!state) return;
  for (const wave of state.shockwaves) {
    wave.life -= dt;
    const t = 1 - wave.life / wave.maxLife;
    wave.radius = lerp(wave.radius, wave.maxRadius, t);
  }
  state.shockwaves = state.shockwaves.filter((wave) => wave.life > 0);

  for (const beam of state.beams) beam.life -= dt;
  state.beams = state.beams.filter((beam) => beam.life > 0);

  for (const particle of state.particles) {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= 1 - dt * 2.1;
    particle.vy *= 1 - dt * 2.1;
  }
  state.particles = state.particles.filter((particle) => particle.life > 0);

  for (const floater of state.floaters) {
    floater.life -= dt;
    floater.y += floater.vy * dt;
  }
  state.floaters = state.floaters.filter((floater) => floater.life > 0);

  for (const image of state.afterimages) image.life -= dt;
  state.afterimages = state.afterimages.filter((image) => image.life > 0);
}

function spawnParticles(x, y, color, count, speed) {
  if (!state) return;
  const quality = getVisualQuality();
  const budget = Math.max(0, Math.round(count * quality.particleScale));
  for (let i = 0; i < budget; i += 1) {
    const angle = rand(0, TAU);
    const power = rand(speed * 0.18, speed);
    state.particles.push({ x, y, vx: Math.cos(angle) * power, vy: Math.sin(angle) * power, life: rand(0.24, 0.7), maxLife: 0.7, radius: rand(1.2, 3.8), color });
  }
}

function updateHud() {
  if (!state) return;
  hpBar.style.transform = `scaleX(${clamp(state.player.hp / 100, 0, 1)})`;
  energyBar.style.transform = `scaleX(${clamp(state.player.energy / 100, 0, 1)})`;
  entropyBar.style.transform = `scaleX(${clamp(state.entropyDeficit, 0, 1)})`;
  guardBar.style.transform = `scaleX(${clamp(1 - state.player.guardCooldown / GUARD_COOLDOWN, 0, 1)})`;
  waveLabel.textContent = state.puzzle?.active && !state.puzzle.solved
    ? `Circuit ${state.puzzle.step + 1}/${state.puzzle.nodes.length}: ${MODES[state.puzzle.sequence[state.puzzle.step]].label}`
    : state.objective?.active && !state.objective.collected
      ? `Find ${state.objective.label}`
      : state.wave > 0 ? `Wave ${state.wave}` : state.level?.title || "Wave 1";
  scoreLabel.textContent = String(state.score);
  regimeLabel.textContent = state.regime;
  updateComboChip();
  updateModeButtons();
}

function updateComboChip() {
  const combo = state.combo;
  const visible = app.screen === "playing" && (combo.streak > 0 || combo.messageTimer > 0);
  comboChip.classList.toggle("hidden", !visible);
  comboChip.classList.toggle("hot", combo.pulse > 0);
  if (!visible) return;
  comboChip.textContent = combo.streak > 0 ? `PCC x${combo.streak} +${combo.lastBonus}` : combo.message;
}

function setMode(mode) {
  if (!state || !MODES[mode] || state.mode === mode || state.ended || app.screen !== "playing") return;
  state.mode = mode;
  state.player.controlTick = 0;
  state.flash = Math.max(state.flash, 0.18);
  if (mode === "chaos") state.chaosNoise = Math.max(state.chaosNoise, 0.5);
  if (mode === "control") state.controlPulse = Math.max(state.controlPulse, 0.55);
  if (mode === "pressure") state.shake = Math.max(state.shake, 0.2);
  playSfx("mode", mode);
  updateModeButtons();
}

function updateModeButtons() {
  if (!state) return;
  for (const [mode, button] of Object.entries(modeButtons)) button.classList.toggle("active", state.mode === mode);
}

function updateLockCursor() {
  if (!lockCursor) return;
  const visible = Boolean(state && app.screen === "playing" && pointer.seen && !state.ended);
  lockCursor.classList.toggle("hidden", !visible);
  canvas.classList.toggle("aiming", visible);
  if (!visible) return;

  const canvasRect = canvas.getBoundingClientRect();
  const stageRect = canvas.parentElement.getBoundingClientRect();
  const x = canvasRect.left - stageRect.left + (pointer.x / Math.max(1, width)) * canvasRect.width;
  const y = canvasRect.top - stageRect.top + (pointer.y / Math.max(1, height)) * canvasRect.height;
  const target = nearestEnemy(pointer.x, pointer.y, 92);
  const correctCounter = Boolean(target && MODES[state.mode].counters === target.role);
  const tooClose = Boolean(target && distance(state.player.x, state.player.y, target.x, target.y) < 180);

  lockCursor.style.setProperty("--lock-color", MODES[state.mode].color);
  lockCursor.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
  lockCursor.classList.toggle("locked", Boolean(target));
  lockCursor.classList.toggle("counter-lock", correctCounter);
  lockCursor.classList.toggle("danger-lock", tooClose && !correctCounter);
  lockCursor.dataset.label = target ? (correctCounter ? "COUNTER" : "LOCK") : "AIM";
}

function draw() {
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  if (state) {
    const shake = state.shake * state.shake * 6 * app.save.options.screenShake;
    if (shake > 0.01) ctx.translate(rand(-shake, shake), rand(-shake, shake));
  }

  drawArena();
  if (state) {
    drawModeOverlay();
    drawEbidCoherenceLayer();
    drawObstacles();
    drawLevelMechanic();
    drawArenaLife();
    drawPickups();
    drawPuzzle();
    drawRoomObjective();
    drawShockwaves();
    drawProjectiles();
    drawEnemies();
    drawAfterimages();
    drawPlayer();
    drawBeams();
    drawParticles();
    drawFloaters();
    drawFliCompanion();
    drawScreenWash();
  } else {
    drawAttract();
  }
  ctx.restore();
}

function drawFliCompanion() {
  if (!state?.fli?.active || app.screen !== "playing") return;
  const f = state.fli;
  const p = state.player;
  const celebrating = f.celebrate > 0;
  const orbit = celebrating ? 48 : 32;
  const x = celebrating ? p.x + Math.cos(f.angle) * orbit : clamp(p.x + 38, 46, width - 46);
  const y = celebrating ? p.y - 26 + Math.sin(f.angle * 1.7) * 22 : clamp(p.y - 34 + Math.sin(state.time * 4.2) * 5, 108, height - 100);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(state.time * 3.1) * 0.08);
  const wing = 8 + Math.abs(Math.sin(state.time * 14)) * 6;
  ctx.globalAlpha = 0.86;
  ctx.fillStyle = "rgba(111,225,255,0.34)";
  ctx.strokeStyle = "rgba(190,248,255,0.95)";
  ctx.lineWidth = 2;
  for (const side of [-1,1]) {
    ctx.beginPath(); ctx.ellipse(side * 10, -2, wing, 6, side * 0.28, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(side * 8, 7, wing * 0.72, 5, side * -0.22, 0, TAU); ctx.fill(); ctx.stroke();
  }
  ctx.fillStyle = "#11242b"; ctx.strokeStyle = "#d8fbff"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, 2, 7, 11, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = f.mood === "alert" ? "#ffdf66" : "#8ff7ff";
  ctx.beginPath(); ctx.arc(-2.4, -1, 1.5, 0, TAU); ctx.arc(2.4, -1, 1.5, 0, TAU); ctx.fill();
  ctx.strokeStyle = "#d8fbff"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-3,-8); ctx.quadraticCurveTo(-8,-14,-9,-17); ctx.moveTo(3,-8); ctx.quadraticCurveTo(8,-14,9,-17); ctx.stroke();
  ctx.restore();

  if (f.timer > 0 && f.cue) {
    const alpha = clamp(Math.min(f.timer, 0.35) / 0.35, 0, 1);
    const bx = clamp(x + 18, 92, width - 92), by = clamp(y - 38, 112, height - 120);
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.font = "800 12px system-ui, sans-serif"; ctx.textAlign = "center";
    const w = Math.min(220, Math.max(110, ctx.measureText(f.cue).width + 26));
    ctx.fillStyle = "rgba(8,18,23,0.94)"; ctx.strokeStyle = "#bff8ff"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(bx-w/2, by-17, w, 34, 9); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#effdff"; ctx.fillText(f.cue, bx, by+4);
    ctx.restore();
  }
}


function sketchNoise(seed) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function drawSketchColorSmudges(x, y, w, h, seed = 1, strength = 1) {
  const palette = [
    [255, 77, 69],
    [67, 184, 255],
    [57, 224, 121],
    [229, 183, 90],
  ];
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalCompositeOperation = "screen";

  const count = Math.max(5, Math.min(14, Math.round((w + h) / 145)));
  for (let i = 0; i < count; i += 1) {
    const n1 = sketchNoise(seed + i * 3.17);
    const n2 = sketchNoise(seed + i * 5.43 + 2);
    const n3 = sketchNoise(seed + i * 7.91 + 4);
    const [r, g, b] = palette[(i + Math.floor(seed)) % palette.length];
    const edge = i % 4;
    let sx = x + n1 * w;
    let sy = y + n2 * h;
    if (edge === 0) sy = y + 3 + n2 * 12;
    if (edge === 1) sx = x + w - 3 - n1 * 12;
    if (edge === 2) sy = y + h - 3 - n2 * 12;
    if (edge === 3) sx = x + 3 + n1 * 12;

    const len = 10 + n3 * Math.min(54, Math.max(18, (w + h) * 0.055));
    const angle = (n2 - 0.5) * 1.35 + edge * Math.PI * 0.5;
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.055 * strength + n1 * 0.055 * strength})`;
    ctx.lineWidth = 2 + n3 * 4;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(
      sx + Math.cos(angle + 0.35) * len * 0.48,
      sy + Math.sin(angle + 0.35) * len * 0.48,
      sx + Math.cos(angle) * len,
      sy + Math.sin(angle) * len
    );
    ctx.stroke();

    if (i % 3 === 0) {
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.035 * strength})`;
      ctx.beginPath();
      ctx.ellipse(sx + Math.cos(angle) * len * 0.42, sy + Math.sin(angle) * len * 0.42, 5 + n1 * 8, 2 + n2 * 4, angle, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawArena() {
  const grd = ctx.createLinearGradient(0, 0, width, height);
  grd.addColorStop(0, "#15130e");
  grd.addColorStop(0.5, "#090909");
  grd.addColorStop(1, "#15110d");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, width, height);

  // Bring the notebook artwork into the live arena as a subtle
  // paper/line texture without sacrificing the darker combat readability.
  if (artReady(artAssets.notebook)) {
    ctx.save();
    ctx.globalAlpha = 0.075;
    ctx.globalCompositeOperation = "screen";
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(artAssets.notebook, 0, 0, width, height);
    ctx.restore();
  }

  ctx.save();
  drawHalftone(0, 72, width, height - 144, 12, "rgba(244, 241, 232, 0.035)");
  ctx.strokeStyle = "rgba(244, 241, 232, 0.052)";
  ctx.lineWidth = 1;
  const grid = 42;
  const offsetX = (ambientTime * 10) % grid;
  const offsetY = (ambientTime * 6) % grid;
  for (let x = -grid + offsetX; x < width + grid; x += grid) {
    ctx.beginPath();
    ctx.moveTo(x, 72);
    ctx.lineTo(x, height - 72);
    ctx.stroke();
  }
  for (let y = 72 - grid + offsetY; y < height - 72 + grid; y += grid) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  const arenaX = 10;
  const arenaY = 78;
  const arenaW = width - 20;
  const arenaH = height - 160;
  drawArenaReactorMark(arenaX, arenaY, arenaW, arenaH);
  drawArenaConduits(arenaX, arenaY, arenaW, arenaH);
  drawArenaSignalSparkles(arenaX, arenaY, arenaW, arenaH);
  ctx.strokeStyle = COMIC_INK;
  ctx.lineWidth = 7;
  ctx.strokeRect(arenaX, arenaY, arenaW, arenaH);
  ctx.strokeStyle = "rgba(244, 241, 232, 0.46)";
  ctx.lineWidth = 2;
  ctx.strokeRect(arenaX + 3, arenaY + 3, arenaW - 6, arenaH - 6);
  ctx.strokeStyle = "rgba(229, 183, 90, 0.3)";
  ctx.strokeRect(18, 86, width - 36, height - 176);
  drawPanelCorners(arenaX, arenaY, arenaW, arenaH);
  drawArenaStoryLayer(arenaX, arenaY, arenaW, arenaH);
  const smudgeSeed = Math.max(1, LEVELS.findIndex((level) => level.id === state?.level?.id) + 11);
  drawSketchColorSmudges(arenaX + 4, arenaY + 4, arenaW - 8, arenaH - 8, smudgeSeed, 1);
  ctx.restore();
  drawTriadMark(width - 98, height - 146, 42);
}

function drawArenaLife() {
  const h = state?.humanTouch;
  if (!h) return;
  const t = state.time;
  const event = h.eventLife > 0 ? h.event : "";
  ctx.save();
  ctx.globalAlpha = 0.72;
  // A pair of tiny maintenance citizens: background life, never targets.
  const patrol = ((t * 18) % (width + 120)) - 60;
  const y = height - 102;
  const drawCitizen = (x, yy, accent, carry = false) => {
    ctx.save(); ctx.translate(x, yy);
    ctx.fillStyle = "#c8d0d2"; ctx.strokeStyle = "#111"; ctx.lineWidth = 2;
    ctx.fillRect(-8,-19,16,11); ctx.strokeRect(-8,-19,16,11);
    ctx.fillStyle = accent; ctx.fillRect(-7,-7,14,14); ctx.strokeRect(-7,-7,14,14);
    ctx.fillStyle="#111"; ctx.fillRect(-4,-15,2,2); ctx.fillRect(2,-15,2,2);
    const step=Math.sin(t*8+x*.03)*3; ctx.fillRect(-6,7,4,8+step); ctx.fillRect(2,7,4,8-step);
    if(carry){ctx.fillStyle="#d7b45a";ctx.fillRect(9,-6,12,8);ctx.strokeRect(9,-6,12,8)}
    ctx.restore();
  };
  if (state.level?.id !== "signal-nexus") {
    drawCitizen(patrol, y, "#66899a", true);
    drawCitizen(width - ((t * 13 + 170) % (width + 120)) + 60, 104, "#8b7699", false);
  }
  if (event === "steam" || event === "heat") {
    for(let i=0;i<5;i++){const a=(h.eventLife*1.8+i)*1.7;ctx.fillStyle=`rgba(220,230,225,${.08+i*.025})`;ctx.beginPath();ctx.arc(42+Math.sin(a)*12,height-110-i*13,8+i*3,0,TAU);ctx.fill();}
  } else if (event === "glitch") {
    ctx.fillStyle="rgba(110,235,255,.16)"; for(let i=0;i<5;i++)ctx.fillRect(rand(30,width-120),rand(105,height-150),rand(30,100),3);
  } else if (event === "searchlight" || event === "scanner") {
    ctx.fillStyle="rgba(110,210,255,.07)";ctx.beginPath();ctx.moveTo(width*.5,80);ctx.lineTo(width*.5+Math.sin(t*2)*170,height-90);ctx.lineTo(width*.5+Math.sin(t*2)*170+70,height-90);ctx.closePath();ctx.fill();
  } else if (event === "ash") {
    ctx.fillStyle="rgba(230,190,140,.5)";for(let i=0;i<12;i++)ctx.fillRect((i*83+t*12)%width,90+((i*47+t*18)%(height-190)),2,3);
  } else if (event === "perfect" || event === "desync") {
    const blink = event === "desync" && Math.sin(t*19)>0.7;
    for(let i=0;i<9;i++){ctx.fillStyle=(blink&&i===5)?"#ffd35b":"rgba(220,245,255,.42)";ctx.fillRect(35+i*(width-70)/9,94,4,4);}
  }
  ctx.restore();
}

function drawArenaReactorMark(arenaX, arenaY, arenaW, arenaH) {
  if (!arenaReactorMark.complete || !arenaReactorMark.naturalWidth) return;
  const scale = clamp(Math.floor(Math.min(arenaW, arenaH) / 120), 2, 4);
  const size = ARENA_REACTOR_MARK_SIZE * scale;
  const x = Math.round(arenaX + arenaW * 0.5 - size / 2);
  const y = Math.round(arenaY + arenaH * 0.53 - size / 2);
  const ebidFade = state ? clamp(1 - state.entropyDeficit * 0.45, 0.58, 1) : 1;
  ctx.save();
  ctx.globalAlpha = (state ? 0.24 : 0.3) * ebidFade;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(arenaReactorMark, x, y, size, size);
  ctx.restore();
}

function drawArenaConduits(arenaX, arenaY, arenaW, arenaH) {
  if (!state || !obstacles.length) return;
  const levelIndex = Math.max(0, LEVELS.findIndex((level) => level.id === state.level?.id));
  const cx = arenaX + arenaW * 0.5;
  const cy = arenaY + arenaH * 0.53;
  ctx.save();
  ctx.lineWidth = 1.5;
  ctx.setLineDash([9, 8]);
  for (let i = 0; i < obstacles.length; i += 1) {
    const obstacle = obstacles[i];
    const mode = ["pressure", "control", "chaos"][(levelIndex + i) % 3];
    const alpha = state.mode === mode ? 0.28 : 0.14;
    ctx.strokeStyle = `rgba(${MODE_RGB[mode]}, ${alpha})`;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const bendX = lerp(cx, obstacle.x, 0.48) + Math.sin((i + 1) * 1.7) * 18;
    const bendY = lerp(cy, obstacle.y, 0.52) + Math.cos((i + 1) * 1.3) * 14;
    ctx.quadraticCurveTo(bendX, bendY, obstacle.x, obstacle.y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  const pulseX = arenaX + 38 + ((state.time * 46 + levelIndex * 31) % Math.max(1, arenaW - 76));
  ctx.fillStyle = "rgba(229, 183, 90, 0.72)";
  ctx.fillRect(pulseX - 4, arenaY + arenaH - 22, 8, 3);
  ctx.restore();
}

function drawArenaSignalSparkles(arenaX, arenaY, arenaW, arenaH) {
  if (!state) return;
  const cx = arenaX + arenaW * 0.5;
  const cy = arenaY + arenaH * 0.53;
  const stable = clamp(1 - state.entropyDeficit, 0.18, 1);
  const comboLift = clamp((state.combo?.streak || 0) / 9, 0, 1);
  const energyLift = clamp(state.player.energy / 100, 0.2, 1);
  const count = 3 + Math.round(comboLift * 2) + (state.player.guard > 0 ? 1 : 0);
  const levelIndex = Math.max(0, LEVELS.findIndex((level) => level.id === state.level?.id));
  ctx.save();
  for (let i = 0; i < count; i += 1) {
    const mode = ["pressure", "control", "chaos"][(i + levelIndex) % 3];
    const isComboSpark = i >= 3 && comboLift > 0;
    const angle = i * 2.399 + state.time * (0.28 + (i % 3) * 0.06);
    const ring = 58 + (i % 5) * 24 + Math.sin(state.time * 1.7 + i) * 5;
    const x = cx + Math.cos(angle) * ring;
    const y = cy + Math.sin(angle) * ring * 0.64;
    if (x < arenaX + 24 || x > arenaX + arenaW - 24 || y < arenaY + 36 || y > arenaY + arenaH - 36) continue;
    const pulse = 0.5 + Math.sin(state.time * 5.2 + i * 1.3) * 0.5;
    const alpha = (0.16 + pulse * 0.28 + comboLift * 0.18) * stable * energyLift;
    const color = isComboSpark ? "#fff0a6" : MODES[mode].color;
    drawSparkGlyph(x, y, 3 + (i % 3) + comboLift * 2, color, alpha);
  }
  ctx.restore();
}

function drawSparkGlyph(x, y, size, color, alpha) {
  const quality = getVisualQuality();
  if (artReady(artAssets.spark1) && size >= 4) {
    const spriteSize = Math.max(16, size * 5);
    ctx.save();
    ctx.globalAlpha = alpha * 0.52;
    ctx.translate(x, y);
    ctx.rotate(state ? state.time * 0.35 : ambientTime * 0.35);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(artAssets.spark1, -spriteSize / 2, -spriteSize / 2, spriteSize, spriteSize);
    ctx.restore();
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y - size * 1.6);
  ctx.lineTo(x, y + size * 1.6);
  ctx.moveTo(x - size * 1.6, y);
  ctx.lineTo(x + size * 1.6, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * 0.62, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size * 0.62, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawArenaStoryLayer(arenaX, arenaY, arenaW, arenaH) {
  if (!state?.level) return;
  const levelIndex = Math.max(0, LEVELS.findIndex((level) => level.id === state.level.id));
  const brief = LEVEL_BRIEFS[levelIndex] || LEVEL_BRIEFS[0];
  const chamber = `CH-${String(levelIndex + 1).padStart(2, "0")}`;
  ctx.save();
  ctx.textBaseline = "middle";
  ctx.font = "900 10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  ctx.lineWidth = 3;

  const label = `${chamber} / ${state.level.title}`;
  const labelX = arenaX + 22;
  const labelY = arenaY + 24;
  const labelW = Math.min(arenaW - 44, Math.max(156, ctx.measureText(label).width + 28));
  ctx.fillStyle = "rgba(3, 3, 3, 0.52)";
  ctx.fillRect(labelX - 9, labelY - 11, labelW, 22);
  ctx.strokeStyle = `rgba(${MODE_RGB[brief.focus]}, 0.35)`;
  ctx.strokeRect(labelX - 9, labelY - 11, labelW, 22);
  ctx.strokeStyle = "#030303";
  ctx.strokeText(label, labelX, labelY);
  ctx.fillStyle = "rgba(244, 241, 232, 0.78)";
  ctx.fillText(label, labelX, labelY);

  if (arenaW > 620) {
    const signal = `${brief.signal} // ${brief.chamber}`;
    const signalX = arenaX + arenaW - 24;
    ctx.textAlign = "right";
    ctx.globalAlpha = 0.72;
    ctx.strokeText(signal, signalX, labelY);
    ctx.fillStyle = `rgba(${MODE_RGB[brief.focus]}, 0.82)`;
    ctx.fillText(signal, signalX, labelY);
    ctx.textAlign = "left";
  }

  drawFloorCounterRail(arenaX + 28, arenaY + arenaH - 23, arenaW - 56);
  ctx.restore();
}

function drawFloorCounterRail(x, y, maxW) {
  const entries = [
    ["pressure", "CHAOS", "P>CH"],
    ["chaos", "CONTROL", "CH>CT"],
    ["control", "PRESSURE", "CT>P"],
  ];
  const compact = maxW < 470;
  let cursor = x;
  ctx.save();
  ctx.font = "900 9px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  ctx.textBaseline = "middle";
  for (const [winner, loser, shortText] of entries) {
    const text = compact ? shortText : `${MODES[winner].label.toUpperCase()} > ${loser}`;
    const w = ctx.measureText(text).width + 16;
    if (cursor + w > x + maxW) break;
    ctx.fillStyle = "rgba(3, 3, 3, 0.48)";
    ctx.fillRect(cursor, y - 8, w, 16);
    ctx.strokeStyle = `rgba(${MODE_RGB[winner]}, ${state.mode === winner ? 0.72 : 0.38})`;
    ctx.strokeRect(cursor, y - 8, w, 16);
    ctx.fillStyle = `rgba(${MODE_RGB[winner]}, ${state.mode === winner ? 0.95 : 0.62})`;
    ctx.fillText(text, cursor + 8, y + 1);
    cursor += w + 7;
  }
  ctx.restore();
}

function drawHalftone(x, y, w, h, gap, fillStyle) {
  ctx.save();
  ctx.fillStyle = fillStyle;
  const drift = Math.floor((ambientTime * 12) % gap);
  for (let yy = y + drift; yy < y + h; yy += gap) {
    for (let xx = x + ((Math.floor(yy / gap) % 2) * gap) / 2; xx < x + w; xx += gap) {
      ctx.beginPath();
      ctx.arc(xx, yy, 1.1, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawPanelCorners(x, y, w, h) {
  ctx.save();
  ctx.strokeStyle = "rgba(244, 241, 232, 0.7)";
  ctx.lineWidth = 3;
  const s = 28;
  const corners = [
    [x + 10, y + 10, 1, 1],
    [x + w - 10, y + 10, -1, 1],
    [x + 10, y + h - 10, 1, -1],
    [x + w - 10, y + h - 10, -1, -1],
  ];
  for (const [cx, cy, sx, sy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + sy * s);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + sx * s, cy);
    ctx.stroke();
  }
  ctx.restore();
}

function drawAttract() {
  ctx.save();
  ctx.globalAlpha = 0.55;
  for (let i = 0; i < 16; i += 1) {
    const mode = i % 3 === 0 ? "pressure" : i % 3 === 1 ? "control" : "chaos";
    const x = width * (0.16 + ((i * 0.217 + ambientTime * 0.018) % 0.68));
    const y = height * (0.2 + ((i * 0.131 + Math.sin(ambientTime * 0.2 + i) * 0.04) % 0.58));
    ctx.strokeStyle = MODES[mode].color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 8 + Math.sin(ambientTime * 2 + i) * 3, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTriadMark(x, y, r) {
  const points = {
    pressure: { mode: "pressure", x, y: y - r },
    control: { mode: "control", x: x + Math.cos(Math.PI / 6) * r, y: y + Math.sin(Math.PI / 6) * r },
    chaos: { mode: "chaos", x: x - Math.cos(Math.PI / 6) * r, y: y + Math.sin(Math.PI / 6) * r },
  };
  const dominance = [
    ["pressure", "chaos"],
    ["chaos", "control"],
    ["control", "pressure"],
  ];

  function drawDominanceArrow(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.max(1, Math.hypot(dx, dy));
    const ux = dx / len;
    const uy = dy / len;
    const startX = from.x + ux * 9;
    const startY = from.y + uy * 9;
    const endX = to.x - ux * 11;
    const endY = to.y - uy * 11;
    const arrow = 8;
    const spread = 0.55;
    const angle = Math.atan2(uy, ux);

    ctx.strokeStyle = MODES[from.mode].color;
    ctx.fillStyle = MODES[from.mode].color;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - Math.cos(angle - spread) * arrow, endY - Math.sin(angle - spread) * arrow);
    ctx.lineTo(endX - Math.cos(angle + spread) * arrow, endY - Math.sin(angle + spread) * arrow);
    ctx.closePath();
    ctx.fill();
  }

  ctx.save();
  ctx.globalAlpha = 0.82;
  ctx.lineWidth = 2;
  for (const [winner, loser] of dominance) {
    drawDominanceArrow(points[winner], points[loser]);
  }
  for (const point of Object.values(points)) {
    ctx.fillStyle = MODES[point.mode].color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, state?.mode === point.mode ? 6 : 4, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawModeOverlay() {
  const quality = getVisualQuality();
  if (!quality.overlays) return;
  const detail = quality.detail;
  ctx.save();
  if (state.mode === "pressure") {
    ctx.fillStyle = `rgba(255, 77, 69, ${0.035 + state.heat.pressure * 0.025})`;
    ctx.fillRect(0, 0, width, height);
    drawSpeedLines(state.player.x, state.player.y, Math.round(8 + 6 * detail), MODES.pressure.color, 0.18 + state.heat.pressure * 0.05);
  }
  if (state.mode === "control") {
    ctx.strokeStyle = `rgba(67, 184, 255, ${0.1 + state.controlPulse * 0.12})`;
    ctx.lineWidth = 1;
    const gap = quality.reduced ? 72 : 54;
    const scan = (state.time * 70) % gap;
    for (let y = 82 + scan; y < height - 76; y += gap) {
      ctx.beginPath();
      ctx.moveTo(14, y);
      ctx.lineTo(width - 14, y);
      ctx.stroke();
    }
  }
  if (state.mode === "chaos") {
    ctx.fillStyle = `rgba(57, 224, 121, ${0.04 + state.chaosNoise * 0.08})`;
    const shardCount = Math.round(7 + 11 * detail);
    const tick = Math.floor(state.time * 12);
    for (let i = 0; i < shardCount; i += 1) {
      const seed = tick * 37 + i * 19;
      const x = deterministic01(seed + 1) * width;
      const y = 84 + deterministic01(seed + 2) * Math.max(1, height - 168);
      const w = 18 + deterministic01(seed + 3) * 72;
      const h = 2 + deterministic01(seed + 4) * 6;
      ctx.fillRect(x, y, w, h);
    }
    drawGlitchSlashes(MODES.chaos.color, 0.18 + state.chaosNoise * 0.1);
  }
  ctx.restore();
}

function drawSpeedLines(cx, cy, count, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * TAU + state.time * 0.28;
    const inner = 70 + (i % 3) * 18;
    const outer = Math.max(width, height) * 0.72;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGlitchSlashes(color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  for (let i = 0; i < 12; i += 1) {
    const y = 92 + ((state.time * 90 + i * 47) % Math.max(1, height - 190));
    const x = (i * 83 + Math.sin(state.time + i) * 40) % width;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 34 + (i % 3) * 22, y + (i % 2 ? -12 : 12));
    ctx.stroke();
  }
  ctx.restore();
}

function drawEbidCoherenceLayer() {
  const quality = getVisualQuality();
  if (!quality.overlays) return;
  const ebid = state.entropyDeficit;
  if (ebid < 0.16) return;

  const arenaX = 10;
  const arenaY = 78;
  const arenaW = width - 20;
  const arenaH = height - 160;
  const tension = clamp((ebid - 0.16) / 0.84, 0, 1);
  const detail = quality.detail;
  const count = Math.round(5 + tension * 12 * detail);
  const tick = Math.floor(state.time * (quality.reduced ? 4 : 8));

  ctx.save();
  ctx.lineCap = "butt";
  ctx.lineWidth = 1.5 + tension * 1.4;
  for (let i = 0; i < count; i += 1) {
    const seed = tick * 23 + i * 41;
    const side = i % 4;
    const mode = ["pressure", "control", "chaos"][(i + Math.floor(tension * 6)) % 3];
    const length = 30 + deterministic01(seed + 1) * (72 + tension * 34);
    const offset = (deterministic01(seed + 2) - 0.5) * tension * 12;
    ctx.globalAlpha = 0.12 + tension * 0.23;
    ctx.strokeStyle = `rgba(${MODE_RGB[mode]}, ${0.42 + tension * 0.32})`;
    ctx.setLineDash(mode === "control" ? [12, 7] : mode === "chaos" ? [5, 8, 2, 5] : [18, 4]);
    ctx.beginPath();
    if (side === 0) {
      const x = arenaX + 24 + deterministic01(seed + 3) * Math.max(1, arenaW - 48 - length);
      ctx.moveTo(x, arenaY + 14 + offset);
      ctx.lineTo(x + length, arenaY + 14 - offset);
    } else if (side === 1) {
      const y = arenaY + 24 + deterministic01(seed + 3) * Math.max(1, arenaH - 48 - length);
      ctx.moveTo(arenaX + arenaW - 14 + offset, y);
      ctx.lineTo(arenaX + arenaW - 14 - offset, y + length);
    } else if (side === 2) {
      const x = arenaX + 24 + deterministic01(seed + 3) * Math.max(1, arenaW - 48 - length);
      ctx.moveTo(x, arenaY + arenaH - 14 - offset);
      ctx.lineTo(x + length, arenaY + arenaH - 14 + offset);
    } else {
      const y = arenaY + 24 + deterministic01(seed + 3) * Math.max(1, arenaH - 48 - length);
      ctx.moveTo(arenaX + 14 - offset, y);
      ctx.lineTo(arenaX + 14 + offset, y + length);
    }
    ctx.stroke();
  }

  if (ebid > 0.42) {
    const cx = arenaX + arenaW * 0.5;
    const cy = arenaY + arenaH * 0.53;
    const seamCount = Math.round((ebid - 0.38) * 9 * detail);
    ctx.setLineDash([9, 8]);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < seamCount; i += 1) {
      const angle = i * 2.399 + state.time * 0.12;
      const inner = 42 + deterministic01(i + 9) * 38;
      const outer = inner + 64 + tension * 44;
      const mode = ["pressure", "control", "chaos"][i % 3];
      ctx.globalAlpha = 0.1 + tension * 0.12;
      ctx.strokeStyle = `rgba(${MODE_RGB[mode]}, 0.72)`;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner * 0.65);
      ctx.lineTo(cx + Math.cos(angle + tension * 0.16) * outer, cy + Math.sin(angle - tension * 0.12) * outer * 0.65);
      ctx.stroke();
    }
  }

  if (ebid > 0.72) {
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.1 + (ebid - 0.72) * 0.22;
    ctx.strokeStyle = "rgba(229, 183, 90, 0.9)";
    ctx.lineWidth = 3;
    ctx.strokeRect(arenaX + 8, arenaY + 8, arenaW - 16, arenaH - 16);
  }
  ctx.restore();
}

function drawObstacles() {
  for (let obstacleIndex = 0; obstacleIndex < obstacles.length; obstacleIndex += 1) {
    const obstacle = obstacles[obstacleIndex];
    ctx.save();
    if (obstacle.shape === "rect") {
      ctx.fillStyle = "rgba(238, 233, 220, 0.11)";
      ctx.shadowColor = "rgba(0,0,0,0.72)";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;
      ctx.strokeStyle = COMIC_INK;
      ctx.lineWidth = 5;
      ctx.fillRect(obstacle.x - obstacle.w / 2, obstacle.y - obstacle.h / 2, obstacle.w, obstacle.h);
      ctx.strokeRect(obstacle.x - obstacle.w / 2, obstacle.y - obstacle.h / 2, obstacle.w, obstacle.h);
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.strokeStyle = "rgba(244, 241, 232, 0.24)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(obstacle.x - obstacle.w / 2 + 4, obstacle.y - obstacle.h / 2 + 4, obstacle.w - 8, obstacle.h - 8);
      for (let x = obstacle.x - obstacle.w / 2 + 8; x < obstacle.x + obstacle.w / 2; x += 18) {
        ctx.strokeStyle = "rgba(244, 241, 232, 0.08)";
        ctx.beginPath();
        ctx.moveTo(x, obstacle.y - obstacle.h / 2 + 3);
        ctx.lineTo(x - 18, obstacle.y + obstacle.h / 2 - 3);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = "rgba(238, 233, 220, 0.11)";
      ctx.shadowColor = "rgba(0,0,0,0.72)";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;
      ctx.strokeStyle = COMIC_INK;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(obstacle.x, obstacle.y, obstacle.r, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.strokeStyle = "rgba(244, 241, 232, 0.24)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(obstacle.x - obstacle.r * 0.12, obstacle.y - obstacle.r * 0.12, obstacle.r * 0.72, 0.2, TAU * 0.82);
      ctx.stroke();
    }
    const smudgeW = obstacle.shape === "rect" ? obstacle.w : obstacle.r * 2;
    const smudgeH = obstacle.shape === "rect" ? obstacle.h : obstacle.r * 2;
    drawSketchColorSmudges(
      obstacle.x - smudgeW / 2,
      obstacle.y - smudgeH / 2,
      smudgeW,
      smudgeH,
      31 + obstacleIndex * 7.3,
      0.72
    );
    ctx.restore();
  }
}

function drawShockwaves() {
  for (const wave of state.shockwaves) {
    const alpha = clamp(wave.life / wave.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = wave.color;
    ctx.lineWidth = 4 * alpha + 1;
    ctx.beginPath();
    ctx.arc(wave.x, wave.y, wave.radius, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = alpha * 0.14;
    ctx.fillStyle = wave.color;
    ctx.beginPath();
    ctx.arc(wave.x, wave.y, wave.radius * 0.82, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

function drawProjectiles() {
  const quality = getVisualQuality();
  for (const projectile of state.projectiles) {
    ctx.save();
    ctx.fillStyle = projectile.color;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.radius, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

function drawPickups() {
  const quality = getVisualQuality();
  for (const pickup of state.pickups) {
    const pulse = 1 + Math.sin(pickup.age * 7) * 0.12;
    ctx.save();
    ctx.translate(pickup.x, pickup.y);
    ctx.rotate(Math.sin(pickup.age * 2.2) * 0.25);
    ctx.fillStyle = "rgba(105, 240, 255, 0.9)";
    ctx.strokeStyle = "rgba(244, 241, 232, 0.78)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6 * pulse, -7 * pulse);
    ctx.lineTo(6 * pulse, -7 * pulse);
    ctx.arc(6 * pulse, 0, 7 * pulse, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(-6 * pulse, 7 * pulse);
    ctx.arc(-6 * pulse, 0, 7 * pulse, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#091316";
    ctx.fillRect(-2, -5, 4, 10);
    ctx.fillRect(-6, -1, 12, 2);
    ctx.restore();
  }
}

function drawPuzzle() {
  const puzzle = state.puzzle;
  if (!puzzle || (!puzzle.active && !puzzle.solved)) return;
  ctx.save();
  for (let i = 0; i < puzzle.nodes.length; i += 1) {
    const node = puzzle.nodes[i];
    const isCurrent = puzzle.active && i === puzzle.step;
    const color = MODES[node.mode].color;
    const pulse = isCurrent ? 1 + Math.sin(state.time * 7) * 0.12 : 1;
    ctx.save();
    ctx.translate(node.x, node.y);
    ctx.globalAlpha = node.solved ? 0.9 : isCurrent ? 1 : 0.34;
    ctx.fillStyle = node.solved ? color : "rgba(8, 12, 14, 0.9)";
    ctx.strokeStyle = color;
    ctx.lineWidth = isCurrent ? 4 : 2;
    ctx.beginPath();
    ctx.arc(0, 0, 22 * pulse, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.rotate(state.time * (node.mode === "chaos" ? -0.8 : 0.45));
    ctx.setLineDash(node.mode === "control" ? [8, 4] : node.mode === "chaos" ? [3, 5] : []);
    ctx.beginPath();
    ctx.arc(0, 0, 29 * pulse, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.rotate(-state.time * (node.mode === "chaos" ? -0.8 : 0.45));
    ctx.fillStyle = node.solved ? "#071014" : color;
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.fillText(node.solved ? "OK" : MODES[node.mode].label[0], 0, 4);
    if (isCurrent) {
      ctx.fillStyle = "#f4f1e8";
      ctx.font = "bold 10px monospace";
      ctx.fillText(`ENTER AS ${MODES[node.mode].label.toUpperCase()}`, 0, -38);
    }
    ctx.restore();
  }
  ctx.restore();
}

function drawRoomObjective() {
  if (!state.objective) return;
  const o=state.objective;
  ctx.save();
  const doorX=width-38, doorY=height*.5;
  ctx.fillStyle=state.roomDoor.locked?"rgba(229,183,90,.18)":"rgba(57,224,121,.12)";
  ctx.strokeStyle=state.roomDoor.locked?"#e5b75a":"#39e079";ctx.lineWidth=4;
  ctx.fillRect(doorX-18,doorY-58,36,116);ctx.strokeRect(doorX-18,doorY-58,36,116);
  ctx.fillStyle="#f4f1e8";ctx.font="bold 11px monospace";ctx.textAlign="right";ctx.fillText(state.roomDoor.locked?"LOCKED":"OPEN",doorX-24,doorY-66);
  if (o.active&&!o.collected) {
    const pulse=1+Math.sin(state.time*6)*.12;ctx.translate(o.x,o.y);ctx.rotate(state.time*.8);
    ctx.fillStyle="#e5b75a";ctx.strokeStyle="#040404";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,-18*pulse);ctx.lineTo(15*pulse,0);ctx.lineTo(0,18*pulse);ctx.lineTo(-15*pulse,0);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.rotate(-state.time*.8);ctx.fillStyle="#040404";ctx.font="bold 10px monospace";ctx.textAlign="center";ctx.fillText("KEY",0,4);
  }
  ctx.restore();
}

function drawEnemies() {
  const sorted = [...state.enemies].sort((a, b) => a.y - b.y);
  for (const enemy of sorted) {
    ctx.save();
    if (enemy.spawnGrace > 0) ctx.globalAlpha = clamp(1 - enemy.spawnGrace / WAVE_SPAWN_GRACE, 0.25, 1);
    const spec = ENEMIES[enemy.kind];
    const family = spec?.family || enemy.role;
    if (spec?.boss) {
      drawBossSprite(enemy);
    } else {
      const usedGeneratedSprite = drawGeneratedEnemySprite(enemy, family);
      if (!usedGeneratedSprite) {
        if (family === "pressure") drawRusher(enemy);
        if (family === "control") drawTurret(enemy);
        if (family === "chaos") drawWobbler(enemy);
      }
      drawEnemyIdentity(enemy);
    }
    drawEnemyCounterState(enemy);
    if (enemy.spawnGrace > 0) drawSpawnRing(enemy);
    drawEnemyHp(enemy);
    ctx.restore();
  }
}

function drawGeneratedEnemySprite(enemy, family) {
  const image = family === "pressure" ? artAssets.pressureEnemy : family === "chaos" ? artAssets.chaosEnemy : null;
  if (!artReady(image)) return false;

  const speed = Math.hypot(enemy.vx || 0, enemy.vy || 0);
  let row = 0;
  let frames = family === "chaos" ? 4 : 3;
  let fps = family === "chaos" ? 10 : 7;

  if (enemy.hitFlash > 0) {
    row = 3; frames = 2; fps = 12;
  } else if ((enemy.windup || 0) > 0 || (enemy.charge || 0) > 0 || (enemy.attackCooldown || 0) > 0.65) {
    row = 2; frames = family === "chaos" ? 5 : 4; fps = 12;
  } else if (speed > 18) {
    row = 1; frames = 4; fps = family === "chaos" ? 11 : 8;
  }

  const column = Math.floor((enemy.age || state.time) * fps) % frames;
  const base = Math.max(48, enemy.radius * (family === "pressure" ? 3.0 : 3.15));
  const squash = family === "pressure" ? 0.88 : 1.0;
  const dw = base;
  const dh = base * squash;
  const flip = (enemy.vx || 0) < -4;

  ctx.save();
  if (enemy.hitFlash > 0) {
    ctx.shadowColor = "rgba(255,255,255,0.9)";
    ctx.shadowBlur = 10;
  } else {
    ctx.shadowColor = "rgba(0,0,0,0.68)";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 5;
  }
  const drawn = drawSheetFrame(
    image, 48, column, row,
    enemy.x - dw / 2, enemy.y - dh / 2 - 3, dw, dh, flip,
    enemy.hitFlash > 0 ? 0.94 : 1,
  );
  ctx.restore();
  return drawn;
}

function drawSpawnRing(enemy) {
  const t = clamp(enemy.spawnGrace / WAVE_SPAWN_GRACE, 0, 1);
  const quality = getVisualQuality();
  const roleColor = MODES[enemy.role]?.color || "#f4f1e8";
  ctx.save();
  ctx.strokeStyle = roleColor;
  ctx.globalAlpha = 0.34 + t * 0.32;
  ctx.lineWidth = 2;
  ctx.setLineDash(enemy.role === "control" ? [9, 5] : enemy.role === "chaos" ? [5, 7, 2, 5] : [13, 4]);
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, enemy.radius + 8 + t * 14, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);
  if (!quality.reduced) {
    ctx.translate(enemy.x, enemy.y);
    drawModeCounterGlyph(enemy.role, enemy.radius + 13 + t * 10, 0.28 + t * 0.18, false, enemy);
  }
  ctx.restore();
}

function drawEnemyCounterState(enemy) {
  const quality = getVisualQuality();
  const currentMode = state.mode;
  const counterMode = modeThatCountersRole(enemy.role);
  const correctCounter = MODES[currentMode].counters === enemy.role;
  const sameRegime = currentMode === enemy.role;
  const dist = distance(state.player.x, state.player.y, enemy.x, enemy.y);
  const near = clamp(1 - dist / 560, 0.28, 1);
  const r = enemy.radius + 11;

  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  if (correctCounter) {
    const pulse = 0.5 + Math.sin(state.time * 8.5 + enemy.seed) * 0.5;
    drawModeCounterGlyph(currentMode, r + pulse * 2, (0.54 + pulse * 0.18) * near, true, enemy);
  } else if (sameRegime) {
    drawResistanceGlyph(r, 0.36 * near);
  } else {
    drawWrongModeNotch(r, 0.48 * near, counterMode);
  }

  if (!quality.reduced && enemy.weak > 0) drawModeCounterGlyph("control", r + 5, 0.28 * clamp(enemy.weak / 0.7, 0, 1), false, enemy);
  if (!quality.reduced && enemy.scrambled > 0) drawModeCounterGlyph("chaos", r + 4, 0.32 * clamp(enemy.scrambled / 0.95, 0, 1), false, enemy);
  if (!quality.reduced && enemy.slow > 0) drawModeCounterGlyph("control", r + 3, 0.24 * clamp(enemy.slow / 0.68, 0, 1), false, enemy);
  ctx.restore();
}

function drawModeCounterGlyph(mode, r, alpha, active, enemy) {
  const color = MODES[mode]?.color || "#f4f1e8";
  ctx.save();
  ctx.globalAlpha = alpha;

  const markImage = mode === "pressure" ? artAssets.pressureMark : mode === "control" ? artAssets.controlMark : artAssets.chaosMark;
  if (active && artReady(markImage)) {
    const markSize = Math.max(28, r * 2.1);
    ctx.save();
    ctx.globalAlpha *= 0.28;
    ctx.rotate(mode === "chaos" ? state.time * 0.32 : mode === "pressure" ? -state.time * 0.1 : 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(markImage, -markSize / 2, -markSize / 2, markSize, markSize);
    ctx.restore();
  }
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = active ? 2.8 : 1.8;
  ctx.lineJoin = "miter";

  if (mode === "pressure") {
    const baseAngle = enemy ? Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x) : -Math.PI / 2;
    const count = active && !getVisualQuality().reduced ? 3 : 1;
    for (let i = 0; i < count; i += 1) {
      const angle = baseAngle + (i - (count - 1) / 2) * 0.72;
      const ca = Math.cos(angle);
      const sa = Math.sin(angle);
      const nx = -sa;
      const ny = ca;
      const tip = r - 4;
      const tail = r + 10;
      ctx.beginPath();
      ctx.moveTo(ca * tip, sa * tip);
      ctx.lineTo(ca * tail + nx * 5.5, sa * tail + ny * 5.5);
      ctx.lineTo(ca * tail - nx * 5.5, sa * tail - ny * 5.5);
      ctx.closePath();
      ctx.fill();
    }
  } else if (mode === "control") {
    const s = r + 4;
    const l = active ? 10 : 7;
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(sx * s, sy * (s - l));
        ctx.lineTo(sx * s, sy * s);
        ctx.lineTo(sx * (s - l), sy * s);
        ctx.stroke();
      }
    }
  } else if (mode === "chaos") {
    const shard = active ? 4 : 3;
    ctx.setLineDash([7, 5]);
    for (let i = 0; i < shard; i += 1) {
      const offset = i % 2 === 0 ? 2.5 : -2.5;
      const start = state.time * 0.8 + i * 1.72;
      ctx.beginPath();
      ctx.arc(offset, -offset, r + (i % 2) * 3, start, start + 0.86);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    for (let i = 0; i < shard; i += 1) {
      const angle = i * TAU / shard + state.time * 0.55;
      const x = Math.cos(angle) * (r + 5);
      const y = Math.sin(angle) * (r + 5);
      ctx.beginPath();
      ctx.moveTo(x - 5, y - 2);
      ctx.lineTo(x + 5, y + 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawResistanceGlyph(r, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "rgba(244, 241, 232, 0.82)";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 5]);
  ctx.beginPath();
  ctx.arc(0, 0, r + 2, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(0, 0, 0, 0.72)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-r * 0.45, -r * 0.28);
  ctx.lineTo(r * 0.42, r * 0.28);
  ctx.moveTo(r * 0.42, -r * 0.28);
  ctx.lineTo(-r * 0.45, r * 0.28);
  ctx.stroke();
  ctx.restore();
}

function drawWrongModeNotch(r, alpha, counterMode) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "rgba(229, 183, 90, 0.92)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-6, -r - 5);
  ctx.lineTo(0, -r - 12);
  ctx.lineTo(6, -r - 5);
  ctx.stroke();
  drawModeCounterGlyph(counterMode, r + 6, alpha * 0.55, false, null);
  ctx.restore();
}

function modeThatCountersRole(role) {
  for (const [mode, spec] of Object.entries(MODES)) {
    if (spec.counters === role) return mode;
  }
  return "pressure";
}

function drawRusher(enemy) {
  const angle = Math.atan2(enemy.vy, enemy.vx) || enemy.age;
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.rotate(angle);
  ctx.shadowColor = "rgba(0,0,0,0.75)";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;
  ctx.strokeStyle = COMIC_INK;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(enemy.radius + 8, 0);
  ctx.lineTo(-enemy.radius, -enemy.radius * 0.82);
  ctx.lineTo(-enemy.radius * 0.45, 0);
  ctx.lineTo(-enemy.radius, enemy.radius * 0.82);
  ctx.closePath();
  ctx.stroke();
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = enemy.hitFlash > 0 ? "#fff2e0" : ENEMIES[enemy.kind].color;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(enemy.radius + 8, 0);
  ctx.lineTo(-enemy.radius, -enemy.radius * 0.82);
  ctx.lineTo(-enemy.radius * 0.45, 0);
  ctx.lineTo(-enemy.radius, enemy.radius * 0.82);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.52)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(enemy.radius * 0.55, -3);
  ctx.lineTo(-enemy.radius * 0.62, -enemy.radius * 0.48);
  ctx.stroke();
  if (enemy.windup > 0) {
    ctx.strokeStyle = "rgba(229, 183, 90, 0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius + 6 + Math.sin(state.time * 20) * 2, 0, TAU);
    ctx.stroke();
  }
  if (enemy.weak > 0) {
    ctx.fillStyle = "#e5b75a";
    ctx.beginPath();
    ctx.arc(-enemy.radius * 0.15, 0, 4, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawTurret(enemy) {
  const p = state.player;
  const angle = Math.atan2(p.y - enemy.y, p.x - enemy.x);
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.rotate(angle);
  if (enemy.charge > 0) {
    const chargeAlpha = 1 - enemy.charge / 0.72;
    ctx.strokeStyle = `rgba(82, 189, 255, ${0.25 + chargeAlpha * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(520, 0);
    ctx.stroke();
  }
  ctx.shadowColor = "rgba(0,0,0,0.75)";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = COMIC_INK;
  ctx.fillRect(-enemy.radius - 3, -enemy.radius - 3, enemy.radius * 2 + 6, enemy.radius * 2 + 6);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = enemy.hitFlash > 0 ? "#eef9ff" : ENEMIES[enemy.kind].color;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth = 2;
  ctx.fillRect(-enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2);
  ctx.strokeRect(-enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillRect(-enemy.radius + 4, -enemy.radius + 4, enemy.radius * 0.7, 3);
  ctx.fillStyle = "#081017";
  ctx.fillRect(2, -4, enemy.radius + 11, 8);
  if (enemy.scrambled > 0) {
    ctx.strokeStyle = MODES.chaos.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius + 8 + Math.sin(state.time * 18) * 3, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

function drawWobbler(enemy) {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.shadowColor = "rgba(0,0,0,0.76)";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;
  ctx.strokeStyle = COMIC_INK;
  ctx.lineWidth = 6;
  ctx.beginPath();
  for (let i = 0; i <= 10; i += 1) {
    const angle = (i / 10) * TAU;
    const r = enemy.radius * (1 + Math.sin(enemy.age * 8 + enemy.seed + i * 1.7) * 0.18);
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = enemy.hitFlash > 0 ? "#efffed" : ENEMIES[enemy.kind].color;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.23)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i <= 10; i += 1) {
    const angle = (i / 10) * TAU;
    const r = enemy.radius * (1 + Math.sin(enemy.age * 8 + enemy.seed + i * 1.7) * 0.18);
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.52)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(-3, -4, enemy.radius * 0.38, 3.4, 5.5);
  ctx.stroke();
  ctx.fillStyle = "#08130c";
  ctx.beginPath();
  ctx.arc(-4, -2, 2.2, 0, TAU);
  ctx.arc(4, 1, 2.2, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawBossSprite(enemy) {
  const kind = enemy.kind;
  const spec = ENEMIES[kind];
  const r = enemy.radius;
  const t = state.time;
  const flash = enemy.hitFlash > 0;
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.shadowColor = "rgba(0,0,0,.72)";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 6;
  ctx.strokeStyle = COMIC_INK;
  ctx.lineWidth = Math.max(4, r * .13);

  const fill = flash ? "#fff7e8" : spec.color;
  const eye = kind === "null" ? "#ffffff" : "#ffe96b";
  const pulse = Math.sin(t * 4 + enemy.seed) * 2;

  if (kind === "prototype") {
    ctx.save();
    ctx.rotate(Math.sin(t * 8) * .045);
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(-r*.7,-r*.72); ctx.lineTo(r*.45,-r*.9); ctx.lineTo(r*.82,-r*.08);
    ctx.lineTo(r*.38,r*.82); ctx.lineTo(-r*.75,r*.52); ctx.lineTo(-r*.95,-r*.1); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle="#14121b"; ctx.fillRect(-r*.38,-r*.18,r*.76,r*.34);
    ctx.fillStyle=eye; ctx.fillRect(-r*.28,-r*.1,r*.16,r*.1); ctx.fillRect(r*.08,-r*.07,r*.24,r*.08);
    ctx.strokeStyle="#ffef73"; ctx.lineWidth=3;
    for (let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-r*.9+i*9,r*.15+i*5);ctx.lineTo(r*.75-i*5,-r*.5+i*11);ctx.stroke();}
    ctx.restore();
  } else if (kind === "surge" || kind === "foreman" || kind === "colossus") {
    const pump = Math.sin(t*7)*3;
    ctx.fillStyle="#4d5960";
    ctx.fillRect(-r-13,-r*.62,18,r*1.05); ctx.strokeRect(-r-13,-r*.62,18,r*1.05);
    ctx.fillRect(r-5,-r*.62,18,r*1.05); ctx.strokeRect(r-5,-r*.62,18,r*1.05);
    ctx.fillStyle=fill;
    ctx.beginPath();ctx.roundRect(-r*.82,-r*.7,r*1.64,r*1.45,8);ctx.fill();ctx.stroke();
    ctx.fillStyle="#20262a";ctx.beginPath();ctx.roundRect(-r*.42,-r*.43,r*.84,r*.32,5);ctx.fill();ctx.stroke();
    ctx.fillStyle=eye;ctx.fillRect(-r*.27,-r*.31,r*.54,5);
    ctx.fillStyle="#68747b";
    ctx.fillRect(-r-22,-r*.16-pump,16,r*.63);ctx.strokeRect(-r-22,-r*.16-pump,16,r*.63);
    ctx.fillRect(r+6,-r*.16+pump,16,r*.63);ctx.strokeRect(r+6,-r*.16+pump,16,r*.63);
    ctx.fillStyle="#ffb34f";ctx.fillRect(-r*.7,r*.62,r*.42,r*.28);ctx.fillRect(r*.28,r*.62,r*.42,r*.28);
  } else if (kind === "core" || kind === "administrator") {
    ctx.shadowOffsetX=3;ctx.shadowOffsetY=4;
    ctx.strokeStyle="#d8f4ff";ctx.lineWidth=2;
    for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(0,0,r+10+i*7,r*.38+i*4,t*.24+i*.9,0,TAU);ctx.stroke();}
    ctx.strokeStyle=COMIC_INK;ctx.lineWidth=5;ctx.fillStyle=fill;
    ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r*.55,-r*.4);ctx.lineTo(r*.34,r*.85);ctx.lineTo(-r*.34,r*.85);ctx.lineTo(-r*.55,-r*.4);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle="#06121a";ctx.fillRect(-r*.28,-r*.52,r*.56,r*.22);ctx.fillStyle=eye;ctx.fillRect(-r*.2,-r*.45,r*.4,3);
    ctx.strokeStyle="#8bdcff";ctx.beginPath();ctx.moveTo(0,r*.82);ctx.lineTo(0,r+16+pulse);ctx.stroke();
  } else if (kind === "anomaly") {
    const j = Math.sin(t*11)*4;
    ctx.fillStyle=fill;
    ctx.beginPath();ctx.moveTo(-r*.9,-r*.25);ctx.lineTo(-r*.22,-r*.95);ctx.lineTo(r*.55,-r*.62);ctx.lineTo(r*.88,r*.18);ctx.lineTo(r*.2,r*.86);ctx.lineTo(-r*.72,r*.57);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle="#101416";ctx.beginPath();ctx.arc(-r*.15,-r*.2,r*.3,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle=eye;ctx.beginPath();ctx.arc(-r*.15,-r*.2,4,0,TAU);ctx.fill();
    ctx.strokeStyle="#ffef73";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-r-15+j,-r*.55);ctx.lineTo(r+9-j,r*.35);ctx.moveTo(-r*.3,r+14);ctx.lineTo(r*.75,-r-12);ctx.stroke();
    ctx.fillStyle="#7ee8e8";ctx.beginPath();ctx.arc(r+12,-r*.38,7,0,TAU);ctx.fill();ctx.stroke();
  } else if (kind === "lattice") {
    ctx.fillStyle=fill;ctx.fillRect(-r*.78,-r*.86,r*1.56,r*1.72);ctx.strokeRect(-r*.78,-r*.86,r*1.56,r*1.72);
    ctx.strokeStyle="#bfe9ff";ctx.lineWidth=4;
    for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(i*r*.36,-r*.82);ctx.lineTo(i*r*.36,r*.82);ctx.stroke();ctx.beginPath();ctx.moveTo(-r*.75,i*r*.38);ctx.lineTo(r*.75,i*r*.38);ctx.stroke();}
    ctx.fillStyle="#07131b";ctx.fillRect(-r*.38,-r*.22,r*.76,r*.33);ctx.fillStyle=eye;ctx.fillRect(-r*.24,-r*.12,r*.48,4);
    ctx.strokeStyle="#8bdcff";ctx.setLineDash([8,5]);ctx.strokeRect(-r-14-pulse,-r-14-pulse,(r+14+pulse)*2,(r+14+pulse)*2);ctx.setLineDash([]);
  } else if (kind === "crown") {
    ctx.fillStyle="#3a2d27";ctx.beginPath();ctx.roundRect(-r*.78,-r*.68,r*1.56,r*1.5,9);ctx.fill();ctx.stroke();
    ctx.strokeStyle="#ff7b32";ctx.lineWidth=4;
    ctx.beginPath();ctx.moveTo(-r*.45,-r*.35);ctx.lineTo(-r*.1,r*.18);ctx.lineTo(r*.18,-r*.04);ctx.lineTo(r*.48,r*.42);ctx.stroke();
    ctx.fillStyle=eye;ctx.fillRect(-r*.28,-r*.42,r*.56,5);
    ctx.fillStyle="#ff8b32";
    for(let i=-2;i<=2;i++){const h=16+Math.sin(t*6+i)*6;ctx.beginPath();ctx.moveTo(i*11-7,-r*.62);ctx.lineTo(i*11,-r*.62-h);ctx.lineTo(i*11+7,-r*.62);ctx.fill();ctx.stroke();}
    ctx.fillStyle="#596066";ctx.fillRect(r*.68,-r*.1,r*.86,r*.22);ctx.strokeRect(r*.68,-r*.1,r*.86,r*.22);ctx.fillRect(r*1.35,-r*.48,r*.4,r*.92);ctx.strokeRect(r*1.35,-r*.48,r*.4,r*.92);
  } else if (kind === "null") {
    ctx.shadowColor="transparent";ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
    ctx.strokeStyle="rgba(255,255,255,.65)";ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(0,-r*.78,r*.28,0,TAU);ctx.stroke();
    ctx.beginPath();ctx.ellipse(0,0,r+17+pulse,r*.5,t*.08,0,TAU);ctx.stroke();
    ctx.fillStyle=flash?"#fff":"#e8f2f7";ctx.strokeStyle="#26343d";ctx.lineWidth=4;
    ctx.beginPath();ctx.moveTo(0,-r*.58);ctx.lineTo(r*.48,-r*.12);ctx.lineTo(r*.28,r*.72);ctx.lineTo(0,r*.92);ctx.lineTo(-r*.28,r*.72);ctx.lineTo(-r*.48,-r*.12);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle="#172129";ctx.fillRect(-r*.2,-r*.3,r*.4,r*.12);ctx.fillStyle="#fff";ctx.fillRect(-r*.14,-r*.27,r*.28,2);
  } else {
    ctx.restore();
    if (spec.family === "pressure") drawRusher(enemy);
    if (spec.family === "control") drawTurret(enemy);
    if (spec.family === "chaos") drawWobbler(enemy);
    return;
  }

  ctx.shadowColor="transparent";ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
  ctx.strokeStyle=spec.color;ctx.globalAlpha=.7;ctx.lineWidth=3;ctx.setLineDash([10,6]);
  ctx.beginPath();ctx.arc(0,0,r+12+pulse,0,TAU);ctx.stroke();ctx.setLineDash([]);
  ctx.restore();
}

function drawEnemyIdentity(enemy) {
  const spec=ENEMIES[enemy.kind];
  if (!spec) return;
  ctx.save();
  ctx.translate(enemy.x,enemy.y);
  if (spec.boss) {
    ctx.strokeStyle=spec.color; ctx.lineWidth=3; ctx.setLineDash([10,6]);
    ctx.beginPath(); ctx.arc(0,0,enemy.radius+10+Math.sin(state.time*4)*2,0,TAU); ctx.stroke(); ctx.setLineDash([]);
  }
  if (enemy.kind==="shield") { ctx.strokeStyle="#d8f3ff"; ctx.lineWidth=3; ctx.beginPath();ctx.arc(0,0,enemy.radius+7,-2.4,2.4);ctx.stroke(); }
  if (enemy.kind==="medic") { ctx.fillStyle="#f4f1e8";ctx.fillRect(-2,-9,4,18);ctx.fillRect(-9,-2,18,4); }
  if (enemy.kind==="bomber") { ctx.strokeStyle="#e5b75a";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,enemy.radius+5,0,TAU);ctx.stroke(); }
  if (enemy.kind==="foreman" || enemy.kind==="surge") { ctx.fillStyle="#ffb34f";ctx.fillRect(-enemy.radius-10,-8,8,16);ctx.fillRect(enemy.radius+2,-8,8,16); }
  if (enemy.kind==="core") { ctx.strokeStyle="#d8f4ff";ctx.lineWidth=2;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(0,0,enemy.radius+8+i*6,enemy.radius*0.42+i*2,state.time*0.18+i,0,TAU);ctx.stroke();} }
  if (enemy.kind==="anomaly") { ctx.strokeStyle="#ffef73";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-enemy.radius-14,-10);ctx.lineTo(enemy.radius+7,13);ctx.moveTo(-enemy.radius+4,enemy.radius+10);ctx.lineTo(enemy.radius+14,-enemy.radius-7);ctx.stroke(); }
  if (enemy.kind==="lattice") { ctx.strokeStyle="#a9dcff";ctx.lineWidth=5;ctx.strokeRect(-enemy.radius-11,-enemy.radius-11,(enemy.radius+11)*2,(enemy.radius+11)*2); }
  if (enemy.kind==="crown") { ctx.fillStyle="#ff9b3d";for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*10-6,-enemy.radius-4);ctx.lineTo(i*10,-enemy.radius-22-Math.sin(state.time*7+i)*5);ctx.lineTo(i*10+6,-enemy.radius-4);ctx.fill();} }
  if (enemy.kind==="null") { ctx.strokeStyle="#ffffff";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-enemy.radius-16,11,0,TAU);ctx.stroke();ctx.globalAlpha=.35;ctx.beginPath();ctx.arc(0,0,enemy.radius+18+Math.sin(state.time*2)*3,0,TAU);ctx.stroke(); }
  ctx.restore();
}

function drawEnemyHp(enemy) {
  if (enemy.hp >= enemy.maxHp || enemy.hitFlash <= 0) return;
  const w = enemy.radius * 2.2;
  const pct = clamp(enemy.hp / enemy.maxHp, 0, 1);
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.52)";
  ctx.fillRect(enemy.x - w / 2, enemy.y - enemy.radius - 12, w, 4);
  ctx.fillStyle = ENEMIES[enemy.kind].color;
  ctx.fillRect(enemy.x - w / 2, enemy.y - enemy.radius - 12, w * pct, 4);
  ctx.restore();
}

function drawAfterimages() {
  for (const image of state.afterimages) {
    const alpha = clamp(image.life / image.maxLife, 0, 1);
    drawPlayerShape(image.x, image.y, image.angle, image.color, alpha * 0.42, true);
  }
}

function drawPlayer() {
  const p = state.player;
  drawPlayerShape(p.x, p.y, p.angle, MODES[state.mode].color, p.invuln > 0 ? 0.72 : 1, false);
  if (p.invuln > 0 && p.guard <= 0) drawInvulnShield(p);
  if (p.guard > 0) {
    drawGuardShield(p);
  }
}

function drawInvulnShield(player) {
  const quality = getVisualQuality();
  const t = clamp(player.invuln / PLAYER_START_INVULN, 0, 1);
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.globalAlpha = 0.16 + t * 0.2;
  ctx.strokeStyle = "rgba(105, 240, 255, 0.9)";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 7]);
  ctx.beginPath();
  ctx.arc(0, 0, player.radius + 16, state.time * 0.7, state.time * 0.7 + TAU * 0.84);
  ctx.stroke();
  ctx.setLineDash([]);
  if (!quality.reduced) drawModeCounterGlyph("control", player.radius + 19, 0.18 + t * 0.1, false, null);
  ctx.restore();
}

function drawGuardShield(player) {
  const quality = getVisualQuality();
  const pulse = 0.5 + Math.sin(state.time * 12) * 0.5;
  const r = player.radius + 18 + pulse * 2;
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.globalAlpha = 0.42 + pulse * 0.08;
  ctx.strokeStyle = "#f4f1e8";
  ctx.lineWidth = 3;
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(sx * r, sy * (r - 10));
      ctx.lineTo(sx * r, sy * r);
      ctx.lineTo(sx * (r - 10), sy * r);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 0.24 + pulse * 0.12;
  ctx.strokeStyle = "rgba(105, 240, 255, 0.95)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r - 4, -Math.PI * 0.15, Math.PI * 1.15);
  ctx.stroke();
  if (!quality.reduced) {
    const modes = ["pressure", "control", "chaos"];
    for (let i = 0; i < modes.length; i += 1) {
      const angle = -Math.PI / 2 + i * TAU / 3 + state.time * 0.16;
      ctx.fillStyle = MODES[modes[i]].color;
      ctx.globalAlpha = 0.42;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * (r + 4), Math.sin(angle) * (r + 4), 2.5, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

function getPlayerArtFrame(ghost = false) {
  const p = state?.player;
  if (!p) return { row: 0, column: 0, frames: 3, fps: 6 };

  const speed = Math.hypot(p.vx || 0, p.vy || 0);
  let row = 0;
  let frames = 3;
  let fps = 6;

  if (!ghost && p.hurtCooldown > 0) {
    row = 5; frames = 2; fps = 12;
  } else if (!ghost && p.hp <= 25) {
    row = 6; frames = 3; fps = 5;
  } else if (!ghost && (p.abilityCooldown > 0.45 || p.pulseCooldown > 0.12)) {
    row = state.mode === "pressure" ? 2 : state.mode === "control" ? 3 : 4;
    frames = 3;
    fps = state.mode === "chaos" ? 14 : 11;
  } else if (speed > 32) {
    row = 1; frames = 4; fps = 10;
  }

  return {
    row,
    frames,
    fps,
    column: Math.floor(state.time * fps) % frames,
  };
}

function drawGeneratedPlayerSprite(x, y, color, alpha, ghost) {
  if (!artReady(artAssets.player)) return false;
  const frame = getPlayerArtFrame(ghost);
  const p = state?.player;
  const movingLeft = (p?.lastMoveX || 0) < -0.08;
  const speed = Math.hypot(p?.vx || 0, p?.vy || 0);
  const motionStretch = ghost ? 1.03 : 1 + clamp(speed / 900, 0, 0.05);
  const size = (ghost ? 58 : 64) * motionStretch;

  ctx.save();
  ctx.globalAlpha *= alpha;

  // Mode halo keeps the triad readable even though the sprite itself
  // stays mostly neutral metal.
  ctx.globalAlpha *= ghost ? 0.4 : 0.22;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y + 14, size * 0.34, size * 0.15, 0, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.save();
  if (!ghost) {
    ctx.shadowColor = "rgba(0,0,0,0.78)";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 6;
  }
  drawSheetFrame(
    artAssets.player,
    48,
    frame.column,
    frame.row,
    x - size / 2,
    y - size / 2 - 8,
    size,
    size,
    movingLeft,
    alpha,
  );
  ctx.restore();

  if (!ghost) {
    // Tiny mode indicator beneath the character ties gameplay state to the
    // Pressure / Control / Chaos device visible on the sprite.
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.72;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y + 15, 19 + Math.sin(state.time * 6) * 1.5, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
  return true;
}

function drawPlayerShape(x, y, angle, color, alpha, ghost) {
  if (drawGeneratedPlayerSprite(x, y, color, alpha, ghost)) return;

  // Original vector fallback: retained so the game still runs if the new art
  // is unavailable or still loading.
  const quality = getVisualQuality();
  const radius = state?.player?.radius || 16;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha;
  ctx.shadowColor = ghost ? color : "rgba(0,0,0,0.82)";
  ctx.shadowBlur = ghost && quality.shadows ? 5 : 0;
  ctx.shadowOffsetX = ghost ? 0 : 5;
  ctx.shadowOffsetY = ghost ? 0 : 5;
  ctx.fillStyle = ghost ? "transparent" : "#171713";
  ctx.strokeStyle = ghost ? color : COMIC_INK;
  ctx.lineWidth = ghost ? 2 : 8;
  ctx.beginPath();
  ctx.moveTo(radius + 8, 0);
  ctx.lineTo(-radius, -radius * 0.78);
  ctx.lineTo(-radius * 0.52, 0);
  ctx.lineTo(-radius, radius * 0.78);
  ctx.closePath();
  if (!ghost) ctx.fill();
  ctx.stroke();
  if (!ghost) {
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(radius + 8, 0);
    ctx.lineTo(-radius, -radius * 0.78);
    ctx.lineTo(-radius * 0.52, 0);
    ctx.lineTo(-radius, radius * 0.78);
    ctx.closePath();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(-2, 0, 5, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawBeams() {
  const quality = getVisualQuality();
  for (const beam of state.beams) {
    const alpha = clamp(beam.life / beam.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = beam.color;
    ctx.lineWidth = 2 + alpha * 3;
    ctx.shadowColor = beam.color;
    ctx.shadowBlur = quality.shadows ? 12 : 0;
    ctx.beginPath();
    ctx.moveTo(beam.x1, beam.y1);
    ctx.lineTo(beam.x2, beam.y2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawParticles() {
  for (const particle of state.particles) {
    const alpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius * alpha, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

function drawFloaters() {
  for (const floater of state.floaters) {
    const alpha = clamp(floater.life / floater.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 4;
    ctx.font = `800 ${floater.size}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = "#040404";
    ctx.strokeText(floater.text, floater.x, floater.y);
    ctx.fillStyle = floater.color;
    ctx.fillText(floater.text, floater.x, floater.y);
    ctx.restore();
  }
}

function drawScreenWash() {
  if (state.flash <= 0) return;
  ctx.save();
  ctx.globalAlpha = state.flash * 0.12;
  ctx.fillStyle = MODES[state.mode].color;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function nearestEnemy(x, y, maxDistance) {
  let best = null;
  let bestDist = maxDistance;
  for (const enemy of state.enemies) {
    const dist = distance(x, y, enemy.x, enemy.y);
    if (dist < bestDist) {
      best = enemy;
      bestDist = dist;
    }
  }
  return best;
}

function separateEnemies() {
  for (let i = 0; i < state.enemies.length; i += 1) {
    const a = state.enemies[i];
    for (let j = i + 1; j < state.enemies.length; j += 1) {
      const b = state.enemies[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.max(0.001, Math.hypot(dx, dy));
      const minDist = a.radius + b.radius + 4;
      if (dist < minDist) {
        const push = (minDist - dist) * 0.5;
        const nx = dx / dist;
        const ny = dy / dist;
        a.x -= nx * push;
        a.y -= ny * push;
        b.x += nx * push;
        b.y += ny * push;
      }
    }
  }
}

function collideCircleObstacles(body) {
  for (const obstacle of obstacles) {
    if (obstacle.shape === "rect") {
      collideCircleRect(body, obstacle);
      continue;
    }
    const dx = body.x - obstacle.x;
    const dy = body.y - obstacle.y;
    const dist = Math.max(0.001, Math.hypot(dx, dy));
    const minDist = obstacle.r + body.radius;
    if (dist < minDist) {
      const nx = dx / dist;
      const ny = dy / dist;
      const push = minDist - dist;
      body.x += nx * push;
      body.y += ny * push;
      body.vx = (body.vx || 0) * 0.62 + nx * 34;
      body.vy = (body.vy || 0) * 0.62 + ny * 34;
    }
  }
}

function circleHitsObstacle(circle, obstacle) {
  if (obstacle.shape === "rect") {
    const closestX = clamp(circle.x, obstacle.x - obstacle.w / 2, obstacle.x + obstacle.w / 2);
    const closestY = clamp(circle.y, obstacle.y - obstacle.h / 2, obstacle.y + obstacle.h / 2);
    return distance(circle.x, circle.y, closestX, closestY) < circle.radius;
  }
  return distance(circle.x, circle.y, obstacle.x, obstacle.y) < obstacle.r + circle.radius;
}

function collideCircleRect(body, rect) {
  const closestX = clamp(body.x, rect.x - rect.w / 2, rect.x + rect.w / 2);
  const closestY = clamp(body.y, rect.y - rect.h / 2, rect.y + rect.h / 2);
  let dx = body.x - closestX;
  let dy = body.y - closestY;
  let dist = Math.hypot(dx, dy);

  if (dist === 0) {
    const left = Math.abs(body.x - (rect.x - rect.w / 2));
    const right = Math.abs(rect.x + rect.w / 2 - body.x);
    const top = Math.abs(body.y - (rect.y - rect.h / 2));
    const bottom = Math.abs(rect.y + rect.h / 2 - body.y);
    const min = Math.min(left, right, top, bottom);
    if (min === left) dx = -1;
    else if (min === right) dx = 1;
    else if (min === top) dy = -1;
    else dy = 1;
    dist = 1;
  }

  if (dist < body.radius) {
    const nx = dx / dist;
    const ny = dy / dist;
    const push = body.radius - dist;
    body.x += nx * push;
    body.y += ny * push;
    body.vx = (body.vx || 0) * 0.52 + nx * 42;
    body.vy = (body.vy || 0) * 0.52 + ny * 42;
  }
}

function hasLineOfSight(x1, y1, x2, y2) {
  for (const obstacle of obstacles) {
    if (lineIntersectsObstacle(x1, y1, x2, y2, obstacle)) return false;
  }
  return true;
}

function lineIntersectsObstacle(x1, y1, x2, y2, obstacle) {
  if (obstacle.shape === "rect") {
    const left = obstacle.x - obstacle.w / 2;
    const right = obstacle.x + obstacle.w / 2;
    const top = obstacle.y - obstacle.h / 2;
    const bottom = obstacle.y + obstacle.h / 2;
    if (pointInRect(x1, y1, left, top, right, bottom) || pointInRect(x2, y2, left, top, right, bottom)) return true;
    return (
      segmentsIntersect(x1, y1, x2, y2, left, top, right, top) ||
      segmentsIntersect(x1, y1, x2, y2, right, top, right, bottom) ||
      segmentsIntersect(x1, y1, x2, y2, right, bottom, left, bottom) ||
      segmentsIntersect(x1, y1, x2, y2, left, bottom, left, top)
    );
  }

  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return false;
  const t = clamp(((obstacle.x - x1) * dx + (obstacle.y - y1) * dy) / lenSq, 0, 1);
  const px = x1 + dx * t;
  const py = y1 + dy * t;
  return distance(px, py, obstacle.x, obstacle.y) < obstacle.r + 6;
}

function pointInRect(x, y, left, top, right, bottom) {
  return x >= left && x <= right && y >= top && y <= bottom;
}

function segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = direction(cx, cy, dx, dy, ax, ay);
  const d2 = direction(cx, cy, dx, dy, bx, by);
  const d3 = direction(ax, ay, bx, by, cx, cy);
  const d4 = direction(ax, ay, bx, by, dx, dy);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function direction(ax, ay, bx, by, cx, cy) {
  return (cx - ax) * (by - ay) - (cy - ay) * (bx - ax);
}

function setupEditorCanvas() {
  const editorCanvas = document.querySelector("#editorCanvas");
  if (!editorCanvas) return;
  const ectx = editorCanvas.getContext("2d");
  const rect = editorCanvas.getBoundingClientRect();
  const pixelRatio = Math.min(window.devicePixelRatio || 1, DPR_MAX);
  editorCanvas.width = Math.floor(rect.width * pixelRatio);
  editorCanvas.height = Math.floor(rect.height * pixelRatio);
  ectx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  drawEditor(ectx, rect.width, rect.height);

  editorCanvas.addEventListener("pointerdown", (event) => {
    const box = editorCanvas.getBoundingClientRect();
    const x = clamp((event.clientX - box.left) / box.width, 0.04, 0.96);
    const y = clamp((event.clientY - box.top) / box.height, 0.12, 0.86);
    editDraftAt(x, y);
    renderEditorScreen();
  });
}

function drawEditor(ectx, w, h) {
  ectx.clearRect(0, 0, w, h);
  ectx.fillStyle = "#0c0c0a";
  ectx.fillRect(0, 0, w, h);
  ectx.strokeStyle = "rgba(244,241,232,.08)";
  for (let x = 0; x < w; x += 32) {
    ectx.beginPath();
    ectx.moveTo(x, 0);
    ectx.lineTo(x, h);
    ectx.stroke();
  }
  for (let y = 0; y < h; y += 32) {
    ectx.beginPath();
    ectx.moveTo(0, y);
    ectx.lineTo(w, y);
    ectx.stroke();
  }
  ectx.strokeStyle = "rgba(229,183,90,.28)";
  ectx.lineWidth = 2;
  ectx.strokeRect(8, 8, w - 16, h - 16);

  const draft = app.editorDraft;
  for (const obstacle of draft.obstacles) {
    ectx.fillStyle = "rgba(244,241,232,.13)";
    ectx.strokeStyle = "rgba(244,241,232,.28)";
    ectx.beginPath();
    ectx.arc(obstacle.x * w, obstacle.y * h, Math.max(14, obstacle.r * Math.min(w, h)), 0, TAU);
    ectx.fill();
    ectx.stroke();
  }

  const p = draft.playerStart;
  drawEditorMarker(ectx, p.x * w, p.y * h, "#f4f1e8", "P");
  for (const spawn of draft.spawns) {
    drawEditorMarker(ectx, spawn.x * w, spawn.y * h, ENEMIES[spawn.kind].color, spawn.kind[0].toUpperCase());
  }
}

function drawEditorMarker(ectx, x, y, color, label) {
  ectx.save();
  ectx.fillStyle = color;
  ectx.strokeStyle = "rgba(0,0,0,.5)";
  ectx.lineWidth = 2;
  ectx.beginPath();
  ectx.arc(x, y, 13, 0, TAU);
  ectx.fill();
  ectx.stroke();
  ectx.fillStyle = "#090908";
  ectx.font = "900 11px system-ui, sans-serif";
  ectx.textAlign = "center";
  ectx.textBaseline = "middle";
  ectx.fillText(label, x, y);
  ectx.restore();
}

function editDraftAt(x, y) {
  const draft = app.editorDraft;
  if (app.editorTool === "obstacle") {
    draft.obstacles.push({ x, y, r: 0.052 });
  } else if (app.editorTool === "player") {
    draft.playerStart = { x, y };
  } else if (ENEMIES[app.editorTool]) {
    const wave = clamp(1 + Math.floor(draft.spawns.length / 3), 1, 4);
    draft.spawns.push({ kind: app.editorTool, x, y, wave });
    ensureWaveHas(draft, app.editorTool, wave);
  } else if (app.editorTool === "erase") {
    eraseNearestDraftItem(x, y);
  }
}

function ensureWaveHas(draft, kind, wave) {
  while (draft.waves.length < wave) draft.waves.push({});
  draft.waves[wave - 1][kind] = Math.max(draft.waves[wave - 1][kind] || 0, 1);
}

function eraseNearestDraftItem(x, y) {
  const draft = app.editorDraft;
  let best = { type: null, index: -1, dist: 0.08 };
  draft.obstacles.forEach((item, index) => {
    const dist = distance(x, y, item.x, item.y);
    if (dist < best.dist) best = { type: "obstacles", index, dist };
  });
  draft.spawns.forEach((item, index) => {
    const dist = distance(x, y, item.x, item.y);
    if (dist < best.dist) best = { type: "spawns", index, dist };
  });
  if (best.type) draft[best.type].splice(best.index, 1);
}

function draftToLevel(draft) {
  return {
    id: "custom-lab",
    title: draft.name || "Lab Arena",
    subtitle: "Custom Lab Builder level.",
    badge: "Custom",
    playerStart: draft.playerStart || { x: 0.5, y: 0.58 },
    obstacles: draft.obstacles || [],
    spawns: draft.spawns || [],
    waves: draft.waves?.length ? draft.waves : [{ wobbler: 4 }, { rusher: 3 }, { turret: 2 }],
  };
}

function encodeDraft(draft) {
  const json = JSON.stringify(draft);
  return btoa(json).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function decodeDraft(code) {
  let normalized = code.trim().replaceAll("-", "+").replaceAll("_", "/");
  while (normalized.length % 4) normalized += "=";
  const parsed = JSON.parse(atob(normalized));
  validateDraft(parsed);
  return parsed;
}

function validateDraft(draft) {
  if (!draft || !Array.isArray(draft.obstacles) || !Array.isArray(draft.spawns) || !Array.isArray(draft.waves)) {
    throw new Error("Level code is missing required arrays.");
  }
  draft.name = String(draft.name || "Lab Arena").slice(0, 32);
  draft.playerStart = draft.playerStart || { x: 0.5, y: 0.58 };
  draft.obstacles = draft.obstacles.slice(0, 16).map((item) => ({ x: clamp(Number(item.x), 0.05, 0.95), y: clamp(Number(item.y), 0.12, 0.86), r: clamp(Number(item.r) || 0.052, 0.025, 0.09) }));
  draft.spawns = draft.spawns.slice(0, 28).filter((item) => ENEMIES[item.kind]).map((item) => ({ kind: item.kind, x: clamp(Number(item.x), 0.05, 0.95), y: clamp(Number(item.y), 0.12, 0.86), wave: clamp(Number(item.wave) || 1, 1, 6) }));
  draft.waves = draft.waves.slice(0, 6).map((wave) => ({
    wobbler: clamp(Number(wave.wobbler) || 0, 0, 18),
    rusher: clamp(Number(wave.rusher) || 0, 0, 12),
    turret: clamp(Number(wave.turret) || 0, 0, 10),
  }));
}


let lastSwitchHover = null;

function switchCandidates() {
  return [...screenLayer.querySelectorAll(
    '.ui-button:not(:disabled), .level-card:not(:disabled), .editor-tools button:not(:disabled), [data-action]:not(:disabled)'
  )].filter((node, index, list) => list.indexOf(node) === index && node.offsetParent !== null);
}

function decorateSwitchInterface() {
  const card = screenLayer.querySelector('.screen-card');
  if (!card || app.screen === 'cutscene') return;
  card.classList.add('switchboard-screen');
  const groups = card.querySelectorAll('.menu-actions, .screen-actions, .editor-tools');
  groups.forEach((group) => group.classList.add('switch-bank'));
  const candidates = switchCandidates();
  candidates.forEach((button, index) => {
    button.classList.add('switch-choice');
    button.dataset.switchIndex = String(index + 1);
    if (!button.querySelector('.switch-hardware')) {
      button.insertAdjacentHTML('afterbegin', '<span class="switch-hardware" aria-hidden="true"><i></i><b></b></span>');
    }
  });
  const active = document.activeElement && candidates.includes(document.activeElement)
    ? document.activeElement
    : candidates[0];
  if (active) setSwitchSelection(active, false);
}

function setSwitchSelection(button, sound = true) {
  if (!button || !button.classList.contains('switch-choice')) return;
  screenLayer.querySelectorAll('.switch-choice.switch-selected').forEach((node) => node.classList.remove('switch-selected'));
  button.classList.add('switch-selected');
  const card = button.closest('.screen-card');
  if (card) card.style.setProperty('--active-switch', button.dataset.switchIndex || '1');
  if (sound && lastSwitchHover !== button) {
    ensureAudio();
    playSfx('switchSnap');
  }
  lastSwitchHover = button;
}

function navigateSwitchMenu(direction) {
  const candidates = switchCandidates();
  if (!candidates.length) return false;
  const active = document.activeElement;
  let index = candidates.indexOf(active);
  if (index < 0) index = candidates.findIndex((node) => node.classList.contains('switch-selected'));
  if (index < 0) index = 0;
  index = (index + direction + candidates.length) % candidates.length;
  const target = candidates[index];
  target.focus({ preventScroll: false });
  setSwitchSelection(target, true);
  return true;
}

function activateFocusedSwitch() {
  const candidates = switchCandidates();
  const active = document.activeElement;
  if (!candidates.includes(active)) return false;
  active.click();
  return true;
}

function handleScreenAction(action, target) {
  ensureAudio();
  playSfx("switchCommit");
  target?.classList.add("switch-committing");

  // Major room/screen changes use the theatrical RoboSwitch curtains.
  // Cutscene page turns keep their quicker archive transition.
  if (action === "play-menu") return withCurtainTransition(() => setScreen("play-menu"));
  if (action === "extras-menu") return withCurtainTransition(() => setScreen("extras-menu"));
  if (action === "author-notes") return withCurtainTransition(() => setScreen("author-notes"));
  if (action === "start") return withCurtainTransition(() => startStoryLevel(0, true));
  if (action === "start-skip-tutorial") return withCurtainTransition(() => skipTutorial({ includeIntro: true }));
  if (action === "survival") return withCurtainTransition(startSurvival);
  if (action === "levels") return withCurtainTransition(() => setScreen("levels"));
  if (action === "how") return withCurtainTransition(() => setScreen("how"));
  if (action === "options") return withCurtainTransition(() => setScreen("options"));
  if (action === "credits") return withCurtainTransition(() => setScreen("credits"));
  if (action === "editor") return withCurtainTransition(() => setScreen("editor"));
  if (action === "menu") {
    return withCurtainTransition(() => {
      resultPanel.classList.add("hidden");
      state = null;
      app.cutsceneQueue = [];
      app.cutsceneComplete = null;
      setScreen("menu");
    });
  }
  if (action === "play-level") return withCurtainTransition(() => startStoryLevel(Number(target.dataset.index), false));
  if (action === "cutscene-next") advanceCutscene();
  if (action === "cutscene-skip") skipCutscene();
  if (action === "resume") return withCurtainTransition(() => setScreen("playing"), { hold: 40 });
  if (action === "skip-tutorial") skipTutorial();
  if (action === "restart-run") restartCurrentRun();
  if (action === "test-custom") return withCurtainTransition(startCustom);
  if (action === "save-custom") {
    app.save.customLevel = structuredCloneSafe(app.editorDraft);
    saveGame();
    app.editorStatus = "Saved locally. Test Level will use this draft.";
    renderEditorScreen();
  }
  if (action === "export-custom") {
    app.editorCode = encodeDraft(app.editorDraft);
    app.editorStatus = "Exported. Share this code with another player.";
    renderEditorScreen();
  }
  if (action === "import-custom") {
    const text = document.querySelector("#editorCode")?.value || "";
    try {
      app.editorDraft = decodeDraft(text);
      app.editorCode = text.trim();
      app.editorStatus = "Imported level code.";
    } catch (error) {
      app.editorStatus = error.message || "Could not import that level code.";
    }
    renderEditorScreen();
  }
  if (action === "reset-editor") {
    app.editorDraft = structuredCloneSafe(DEFAULT_DRAFT);
    app.editorCode = "";
    app.editorStatus = "Lab reset.";
    renderEditorScreen();
  }
  if (action === "reset-save") {
    if (confirm("Reset RoboSwitch progress on this browser?")) {
      localStorage.removeItem(SAVE_KEY);
      app.save = loadSave();
      app.editorDraft = structuredCloneSafe(DEFAULT_DRAFT);
      setScreen("options");
    }
  }
}

function togglePause() {
  if (!state || state.ended) return;
  if (app.screen === "playing") setScreen("pause");
  else if (app.screen === "pause") setScreen("playing");
}

function regimeFromDeficit(value) {
  if (value < 0.18) return "Dynamic";
  if (value < 0.36) return "Productive";
  if (value < 0.58) return "Volatile";
  if (value < 0.78) return "Constrained";
  return "Collapse Risk";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function deterministic01(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function getVisualQuality() {
  const forcedReduced = FX_PARAM === "reduced";
  const forcedOff = FX_PARAM === "off";
  const autoReduced = REDUCED_MOTION_QUERY.matches || width < VISUAL_QUALITY.reducedWidth || height < VISUAL_QUALITY.reducedHeight;
  const reduced = forcedOff || forcedReduced || (FX_PARAM === "auto" && autoReduced);
  return {
    reduced,
    detail: reduced ? 0.55 : 1,
    overlays: !forcedOff,
    shadows: !forcedOff && !reduced,
    particleScale: forcedOff ? 0.22 : reduced ? VISUAL_QUALITY.reducedParticleScale : VISUAL_QUALITY.fullParticleScale,
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function distance(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * width,
    y: ((event.clientY - rect.top) / rect.height) * height,
  };
}

window.addEventListener("resize", () => {
  resize();
  if (app.screen === "editor") renderEditorScreen();
});

const GAMEPLAY_SCROLL_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Space",
]);

// Newgrounds embeds live inside a scrolling page. Cancel browser navigation
// defaults at capture time while gameplay is active so arrow keys stay in-game
// and never scroll the NG page/iframe.
window.addEventListener("keydown", (event) => {
  if (app.screen === "playing" && GAMEPLAY_SCROLL_KEYS.has(event.code)) {
    event.preventDefault();
  }
  if (!event.repeat) ensureAudio();
  if (app.screen === "options" && app.rebindingMode) {
    event.preventDefault();
    if (!event.repeat) completeControlRebind(event.code);
    return;
  }
  if (app.screen === "cutscene") {
    if (event.code === "Space" || event.code === "Enter") {
      event.preventDefault();
      advanceCutscene();
      return;
    }
    if (event.code === "Escape") {
      skipCutscene();
      return;
    }
  }
  if (app.screen !== "playing" && app.screen !== "cutscene" && !state?.ended) {
    const tag = document.activeElement?.tagName;
    const type = document.activeElement?.getAttribute?.('type');
    const editingControl = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    if (!editingControl && (event.code === 'ArrowDown' || event.code === 'ArrowRight')) {
      event.preventDefault();
      navigateSwitchMenu(1);
      return;
    }
    if (!editingControl && (event.code === 'ArrowUp' || event.code === 'ArrowLeft')) {
      event.preventDefault();
      navigateSwitchMenu(-1);
      return;
    }
    if (!editingControl && (event.code === 'Enter' || event.code === 'Space')) {
      event.preventDefault();
      if (activateFocusedSwitch()) return;
    }
  }
  if (event.code === "KeyZ" || event.code === "KeyJ") {
    event.preventDefault();
    usePulse();
    return;
  }
  if (event.code === "KeyX" || event.code === "KeyK" || event.code === "Space") {
    event.preventDefault();
    useAbility();
    return;
  }
  if (event.code === "Enter" && state?.ended) {
    restartCurrentRun();
    return;
  }
  if (event.code === "Escape" || event.code === "KeyP") {
    togglePause();
    return;
  }
  const requestedMode = modeForControlCode(event.code);
  if (requestedMode) setMode(requestedMode);
  keys.add(event.code);
});

window.addEventListener("keyup", (event) => keys.delete(event.code));

canvas.addEventListener("pointerdown", (event) => {
  ensureAudio();
  canvas.focus({ preventScroll: true });
  const point = canvasPoint(event);
  pointer.down = true;
  pointer.seen = true;
  pointer.x = point.x;
  pointer.y = point.y;
  pointer.movedAt = state?.time || ambientTime;
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  const point = canvasPoint(event);
  pointer.seen = true;
  pointer.x = point.x;
  pointer.y = point.y;
  pointer.movedAt = state?.time || ambientTime;
});

canvas.addEventListener("pointerup", (event) => {
  pointer.down = false;
  const point = canvasPoint(event);
  pointer.seen = true;
  pointer.x = point.x;
  pointer.y = point.y;
  pointer.movedAt = state?.time || ambientTime;
  try {
    canvas.releasePointerCapture(event.pointerId);
  } catch {
    // Pointer capture can already be released by the browser.
  }
});

canvas.addEventListener("pointerleave", () => {
  if (!pointer.down) pointer.seen = false;
});

canvas.addEventListener("pointercancel", (event) => {
  pointer.down = false;
  pointer.seen = false;
  try {
    canvas.releasePointerCapture(event.pointerId);
  } catch {
    // Pointer capture can already be released by the browser.
  }
});

canvas.addEventListener("contextmenu", (event) => event.preventDefault());

for (const [mode, button] of Object.entries(modeButtons)) button.addEventListener("click", () => {
  ensureAudio();
  setMode(mode);
});
pulseButton.addEventListener("click", () => {
  ensureAudio();
  usePulse();
});
burstButton.addEventListener("click", () => {
  ensureAudio();
  useAbility();
});
pauseButton.addEventListener("click", () => {
  ensureAudio();
  playSfx("ui");
  togglePause();
});
restartButton.addEventListener("click", () => {
  ensureAudio();
  playSfx("ui");
  restartCurrentRun();
});
nextButton.addEventListener("click", () => {
  ensureAudio();
  playSfx("ui");
  startStoryLevel(app.levelIndex + 1, false);
});
resultSelectButton.addEventListener("click", () => {
  ensureAudio();
  playSfx("ui");
  withCurtainTransition(() => {
    resultPanel.classList.add("hidden");
    state = null;
    setScreen("levels");
  });
});
resultMenuButton.addEventListener("click", () => {
  ensureAudio();
  playSfx("ui");
  withCurtainTransition(() => {
    resultPanel.classList.add("hidden");
    state = null;
    setScreen("menu");
  });
});

screenLayer.addEventListener("pointerover", (event) => {
  const choice = event.target.closest('.switch-choice');
  if (!choice || choice === lastSwitchHover) return;
  setSwitchSelection(choice, true);
});

screenLayer.addEventListener("focusin", (event) => {
  const choice = event.target.closest('.switch-choice');
  if (!choice) return;
  setSwitchSelection(choice, true);
});

const switchObserver = new MutationObserver(() => requestAnimationFrame(decorateSwitchInterface));
switchObserver.observe(screenLayer, { childList: true, subtree: false });

screenLayer.addEventListener("click", (event) => {
  const bindButton = event.target.closest("[data-bind-mode]");
  if (bindButton) {
    ensureAudio();
    playSfx("ui");
    beginControlRebind(bindButton.dataset.bindMode);
    return;
  }
  const toolButton = event.target.closest("[data-editor-tool]");
  if (toolButton) {
    ensureAudio();
    playSfx("ui");
    app.editorTool = toolButton.dataset.editorTool;
    renderEditorScreen();
    return;
  }
  const actionButton = event.target.closest("[data-action]");
  if (actionButton) handleScreenAction(actionButton.dataset.action, actionButton);
});

screenLayer.addEventListener("input", (event) => {
  if (event.target.matches("[data-option]")) {
    ensureAudio();
    const option = event.target.dataset.option;
    app.save.options[option] = event.target.type === "checkbox" ? event.target.checked : Number(event.target.value);
    saveGame();
    applyAudioSettings();
  }
  if (event.target.id === "editorCode") app.editorCode = event.target.value;
});

resize();
setScreen("menu");
revealInitialScreen();
lastTime = performance.now();
cancelAnimationFrame(animationFrame);
animationFrame = requestAnimationFrame(loop);
