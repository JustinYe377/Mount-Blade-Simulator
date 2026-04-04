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
  Kingdom: 0x4488ff,
  Empire:  0xee4444,
  Rebels:  0x44cc44,
  Bandit:  0x998844,
};

// --- Troop tiers ---
const TROOP_TIERS = [
  { name:'Militia',  power:1,  wage:1,  cost:10  },
  { name:'Footman',  power:3,  wage:3,  cost:30  },
  { name:'Veteran',  power:6,  wage:6,  cost:70  },
  { name:'Knight',   power:12, wage:12, cost:150 },
];

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