// ============================================================
// config.js — Global constants, balance numbers, theme
// NOTE: Extend this file for new factions, troop tiers, goods, etc.
// ============================================================

// --- Grid & Map ---
const TILE   = 8;
const GRID_W = 240;
const GRID_H = 180;
const MAP_W  = GRID_W * TILE;
const MAP_H  = GRID_H * TILE;

// --- Terrain definitions ---
const TERRAIN = {
  DEEP_WATER:   { id:0, color:0x1a3a6a, cost:999, name:'Deep Water'   },
  WATER:        { id:1, color:0x2a5a9a, cost:999, name:'Water'        },
  SAND:         { id:2, color:0xd4c07a, cost:1.3, name:'Sand'         },
  GRASS:        { id:3, color:0x4a8a3a, cost:1.0, name:'Grassland'    },
  FOREST:       { id:4, color:0x2a6a2a, cost:1.8, name:'Forest'       },
  DENSE_FOREST: { id:5, color:0x1a4a1a, cost:2.5, name:'Dense Forest' },
  HILLS:        { id:6, color:0x8a7a4a, cost:2.0, name:'Hills'        },
  MOUNTAIN:     { id:7, color:0x6a6a6a, cost:999, name:'Mountain'     },
  SNOW:         { id:8, color:0xddeeff, cost:3.0, name:'Snow'         },
};
const TERRAIN_BY_ID = Object.values(TERRAIN);

// --- Faction colours (hex numbers for Phaser graphics) ---
const FACTION_COLORS = {
  'Varric League':    0x4488ff,   // blue
  'Arden Clans':      0x44cc44,   // green
  'Skeldir Holds':    0x88ccff,   // ice blue
  'Auric Empire':     0xcc3333,   // imperial red
  'Qaratai Khanate':  0xddaa22,   // steppe gold
  'Zahir Sultanate':  0xcc7722,   // desert amber
  'Bandit':           0x998844,   // dirty gold
};

// --- Troop definitions ---
// kind: 'villager' | 'infantry' | 'cavalry' | 'archer'
// Combat triangle: infantry beats cavalry, archer beats infantry, cavalry beats archer
// Villagers are neutral — no triangle interaction
const TROOP_TIERS = [
  // Villager — base recruit for all factions
  { id:0, kind:'villager', tier:0, name:'Villager',        power:1,  wage:1,  cost:10  },
  // Infantry line
  { id:1, kind:'infantry', tier:1, name:'Militia',         power:3,  wage:2,  cost:20  },
  { id:2, kind:'infantry', tier:2, name:'Footman',         power:7,  wage:5,  cost:50  },
  { id:3, kind:'infantry', tier:3, name:'Man-at-Arms',     power:15, wage:10, cost:110 },
  // Cavalry line
  { id:4, kind:'cavalry',  tier:1, name:'Scout Cavalry',   power:4,  wage:3,  cost:30  },
  { id:5, kind:'cavalry',  tier:2, name:'Light Cavalry',   power:9,  wage:7,  cost:70  },
  { id:6, kind:'cavalry',  tier:3, name:'Knight',          power:20, wage:14, cost:160 },
  // Archer line
  { id:7, kind:'archer',   tier:1, name:'Archer',          power:3,  wage:2,  cost:20  },
  { id:8, kind:'archer',   tier:2, name:'Trained Archer',  power:7,  wage:5,  cost:55  },
  { id:9, kind:'archer',   tier:3, name:'Longbowman',      power:14, wage:10, cost:120 },
];

// Fast O(1) lookup: TROOP_BY_ID[id] → troop def
const TROOP_BY_ID = {};
TROOP_TIERS.forEach(t => { TROOP_BY_ID[t.id] = t; });

// Combat triangle — attacker.kind vs defender.kind multiplier
const COMBAT_TRIANGLE = {
  infantry: { cavalry:1.35, infantry:1.0, archer:0.75,  villager:1.0 },
  cavalry:  { archer: 1.35, cavalry: 1.0, infantry:0.75, villager:1.0 },
  archer:   { infantry:1.35,archer:  1.0, cavalry: 0.75, villager:1.0 },
  villager: { infantry:1.0, cavalry: 1.0, archer:  1.0,  villager:1.0 },
};

// --- Economy ---
const GOODS = ['grain', 'iron', 'cloth', 'fish'];

// --- Visual theme (used by HUD, panels, minimap) ---
// Centralising these here lets you reskin the entire UI from one place.
const THEME = {
  hud: {
    height:    40,
    fill:      0x0d0d14,
    fillAlpha: 0.92,
  },
  panel: {
    fill:         0x0d0d18,
    fillAlpha:    0.96,
    border:       0x4a6a8a,
    borderBright: 0x6a9aaa,
    overlayAlpha: 0.55,
    titleColor:   '#c8d8e8',
    radius:       6,
  },
  minimap: {
    w:          160,
    h:          120,
    bg:         0x050a12,
    frame:      0x4a6a8a,
    frameInner: 0x2a3a4a,
  },
  log: {
    w: 340,
    h: 100,
  },
  font: {
    ui:   "'Segoe UI', sans-serif",
    mono: "monospace",
    xs:   '10px',
    sm:   '12px',
    md:   '14px',
    lg:   '18px',
    xl:   '22px',
  },
  text: {
    primary: '#c8d8e8',
    gold:    '#f0c860',
    muted:   '#7890a0',
    red:     '#e04040',
    green:   '#60c060',
  },
  faction: FACTION_COLORS,   // alias so THEME.faction.Kingdom works
  spacing: {
    pad: 8,
  },
};

// --- Faction relations ---
// 'war' → parties can fight; 'peace' → they do not engage each other
const FACTION_RELATIONS = {
  'Varric League':   { 'Varric League':'peace', 'Arden Clans':'war',   'Skeldir Holds':'peace', 'Auric Empire':'war',   'Qaratai Khanate':'peace', 'Zahir Sultanate':'peace', 'Bandit':'war'  },
  'Arden Clans':     { 'Varric League':'war',   'Arden Clans':'peace', 'Skeldir Holds':'war',   'Auric Empire':'peace', 'Qaratai Khanate':'war',   'Zahir Sultanate':'peace', 'Bandit':'peace'},
  'Skeldir Holds':   { 'Varric League':'peace', 'Arden Clans':'war',   'Skeldir Holds':'peace', 'Auric Empire':'war',   'Qaratai Khanate':'peace', 'Zahir Sultanate':'peace', 'Bandit':'war'  },
  'Auric Empire':    { 'Varric League':'war',   'Arden Clans':'peace', 'Skeldir Holds':'war',   'Auric Empire':'peace', 'Qaratai Khanate':'war',   'Zahir Sultanate':'war',   'Bandit':'war'  },
  'Qaratai Khanate': { 'Varric League':'peace', 'Arden Clans':'war',   'Skeldir Holds':'peace', 'Auric Empire':'war',   'Qaratai Khanate':'peace', 'Zahir Sultanate':'war',   'Bandit':'peace'},
  'Zahir Sultanate': { 'Varric League':'peace', 'Arden Clans':'peace', 'Skeldir Holds':'peace', 'Auric Empire':'war',   'Qaratai Khanate':'war',   'Zahir Sultanate':'peace', 'Bandit':'war'  },
  'Bandit':          { 'Varric League':'war',   'Arden Clans':'peace', 'Skeldir Holds':'war',   'Auric Empire':'war',   'Qaratai Khanate':'peace', 'Zahir Sultanate':'war',   'Bandit':'peace'},
};

function factionsAtWar(f1, f2) {
  return (FACTION_RELATIONS[f1]?.[f2] ?? 'war') === 'war';
}

// --- Troop upgrade paths ---
// Maps source troop id → { to: target id, xp: xp required, cost: gold cost }
const TROOP_UPGRADES = {
  0: { to: 1, xp: 10,  cost: 10  },   // Villager      → Militia
  1: { to: 2, xp: 30,  cost: 30  },   // Militia       → Footman
  4: { to: 5, xp: 30,  cost: 40  },   // Scout Cavalry → Light Cavalry
  7: { to: 8, xp: 30,  cost: 30  },   // Archer        → Trained Archer
  2: { to: 3, xp: 80,  cost: 100 },   // Footman       → Man-at-Arms
  5: { to: 6, xp: 80,  cost: 110 },   // Light Cavalry → Knight
  8: { to: 9, xp: 80,  cost: 100 },   // Trained Archer→ Longbowman
};