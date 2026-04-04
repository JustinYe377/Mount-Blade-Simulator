// ============================================================
// Lords.js — 12 named lords distributed across 6 factions
// All lords have skills: { tactics, leadership, trading, pathfinding }
// ============================================================

const LORD_DEFS = [

  // ── Varric League ────────────────────────────────────────
  {
    id: 'lord_aldric',
    name: 'Aldric the Bold',
    faction: 'Varric League',
    title: 'Marshal of the Northern March',
    skills: { tactics:5, leadership:4, trading:1, pathfinding:2 },
    troops: [
      {id:2,count:18}, // Footman
      {id:3,count:8},  // Man-at-Arms
      {id:5,count:6},  // Light Cavalry
      {id:8,count:8},  // Trained Archer
    ],
  },
  {
    id: 'lord_hazel',
    name: 'Lady Hazel',
    faction: 'Varric League',
    title: 'Warden of the Greenwood',
    skills: { tactics:3, leadership:2, trading:3, pathfinding:4 },
    troops: [
      {id:1,count:14}, // Militia
      {id:7,count:12}, // Archer
      {id:8,count:6},  // Trained Archer
      {id:4,count:4},  // Scout Cavalry
    ],
  },

  // ── Arden Clans ──────────────────────────────────────────
  {
    id: 'lord_brann',
    name: 'Brann Oakshield',
    faction: 'Arden Clans',
    title: 'Chieftain of the Deepwood',
    skills: { tactics:4, leadership:3, trading:1, pathfinding:5 },
    troops: [
      {id:1,count:24}, // Militia (large clan warband)
      {id:2,count:10}, // Footman
      {id:7,count:16}, // Archer
      {id:9,count:4},  // Longbowman
    ],
  },
  {
    id: 'lord_mira',
    name: 'Mira the Outlaw Queen',
    faction: 'Arden Clans',
    title: 'Shadow of Crestfall',
    skills: { tactics:5, leadership:4, trading:3, pathfinding:5 },
    troops: [
      {id:4,count:14}, // Scout Cavalry
      {id:5,count:8},  // Light Cavalry
      {id:8,count:10}, // Trained Archer
      {id:9,count:5},  // Longbowman
    ],
  },

  // ── Skeldir Holds ────────────────────────────────────────
  {
    id: 'lord_vorn',
    name: 'Vorn Ironsword',
    faction: 'Skeldir Holds',
    title: 'Jarl of the Frostpeak',
    skills: { tactics:4, leadership:5, trading:1, pathfinding:2 },
    troops: [
      {id:2,count:20}, // Footman
      {id:3,count:12}, // Man-at-Arms
      {id:6,count:4},  // Knight
      {id:8,count:8},  // Trained Archer
    ],
  },
  {
    id: 'lord_sigrid',
    name: 'Sigrid Frostborn',
    faction: 'Skeldir Holds',
    title: 'Shield-Maiden of Varngard',
    skills: { tactics:3, leadership:3, trading:2, pathfinding:4 },
    troops: [
      {id:1,count:18}, // Militia
      {id:2,count:10}, // Footman
      {id:3,count:6},  // Man-at-Arms
      {id:7,count:10}, // Archer
    ],
  },

  // ── Auric Empire ─────────────────────────────────────────
  {
    id: 'lord_magnus',
    name: 'Magnus Auric',
    faction: 'Auric Empire',
    title: 'Legate of the Southern Reach',
    skills: { tactics:5, leadership:5, trading:2, pathfinding:2 },
    troops: [
      {id:3,count:16}, // Man-at-Arms
      {id:6,count:8},  // Knight
      {id:9,count:6},  // Longbowman
      {id:5,count:6},  // Light Cavalry
    ],
  },
  {
    id: 'lord_sera',
    name: 'Sera Valdris',
    faction: 'Auric Empire',
    title: 'Prefect of Dustmere',
    skills: { tactics:2, leadership:3, trading:5, pathfinding:3 },
    troops: [
      {id:1,count:16}, // Militia
      {id:2,count:8},  // Footman
      {id:4,count:6},  // Scout Cavalry
      {id:7,count:6},  // Archer
    ],
  },

  // ── Qaratai Khanate ──────────────────────────────────────
  {
    id: 'lord_temur',
    name: 'Temur Khan',
    faction: 'Qaratai Khanate',
    title: 'Khan of the Eastern Steppe',
    skills: { tactics:5, leadership:5, trading:2, pathfinding:4 },
    troops: [
      {id:4,count:16}, // Scout Cavalry
      {id:5,count:12}, // Light Cavalry
      {id:6,count:6},  // Knight
      {id:8,count:8},  // Trained Archer
    ],
  },
  {
    id: 'lord_esen',
    name: 'Esen Swiftstride',
    faction: 'Qaratai Khanate',
    title: 'Noyan of the Windplains',
    skills: { tactics:3, leadership:3, trading:3, pathfinding:5 },
    troops: [
      {id:4,count:20}, // Scout Cavalry
      {id:5,count:8},  // Light Cavalry
      {id:7,count:10}, // Archer
    ],
  },

  // ── Zahir Sultanate ──────────────────────────────────────
  {
    id: 'lord_qahir',
    name: 'Qahir al-Zand',
    faction: 'Zahir Sultanate',
    title: 'Sultan of the Desert Reaches',
    skills: { tactics:4, leadership:5, trading:4, pathfinding:2 },
    troops: [
      {id:2,count:14}, // Footman
      {id:3,count:8},  // Man-at-Arms
      {id:5,count:10}, // Light Cavalry
      {id:9,count:6},  // Longbowman
    ],
  },
  {
    id: 'lord_saffar',
    name: 'Saffar the Gilded',
    faction: 'Zahir Sultanate',
    title: 'Vizier of Qahir',
    skills: { tactics:2, leadership:3, trading:5, pathfinding:3 },
    troops: [
      {id:1,count:18}, // Militia
      {id:4,count:12}, // Scout Cavalry
      {id:7,count:12}, // Archer
      {id:8,count:6},  // Trained Archer
    ],
  },
];

// Map by id for fast lookup
const LORDS_BY_ID = {};
LORD_DEFS.forEach(l => { LORDS_BY_ID[l.id] = l; });
