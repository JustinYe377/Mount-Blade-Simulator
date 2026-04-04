// ============================================================
// Lords.js — 10 static named Lords with fixed skills & troops
// All lords have skills: { tactics, leadership, trading, pathfinding }
// Their troops are deterministic (no randInt) so they stay consistent.
// ============================================================

const LORD_DEFS = [
  // ── Kingdom ──────────────────────────────────────────────
  {
    id: 'lord_aldric',
    name: 'Aldric the Bold',
    faction: 'Kingdom',
    title: 'Marshal of the Northern March',
    skills: { tactics:5, leadership:4, trading:1, pathfinding:2 },
    troops: [
      {id:2,count:18}, // Footman
      {id:3,count:8},  // Man-at-Arms
      {id:5,count:6},  // Light Cavalry
      {id:6,count:3},  // Knight
      {id:8,count:8},  // Trained Archer
    ],
  },
  {
    id: 'lord_hazel',
    name: 'Lady Hazel',
    faction: 'Kingdom',
    title: 'Warden of the Greenwood',
    skills: { tactics:3, leadership:2, trading:3, pathfinding:4 },
    troops: [
      {id:1,count:14}, // Militia
      {id:7,count:12}, // Archer
      {id:8,count:6},  // Trained Archer
      {id:4,count:4},  // Scout Cavalry
    ],
  },
  {
    id: 'lord_vorn',
    name: 'Vorn Ironsword',
    faction: 'Kingdom',
    title: 'Knight-Commander of Riverholt',
    skills: { tactics:4, leadership:5, trading:1, pathfinding:2 },
    troops: [
      {id:2,count:20}, // Footman
      {id:3,count:12}, // Man-at-Arms
      {id:6,count:6},  // Knight
      {id:5,count:8},  // Light Cavalry
    ],
  },

  // ── Empire ───────────────────────────────────────────────
  {
    id: 'lord_magnus',
    name: 'Magnus Auric',
    faction: 'Empire',
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
    faction: 'Empire',
    title: 'Prefect of Dustmere',
    skills: { tactics:2, leadership:3, trading:5, pathfinding:3 },
    troops: [
      {id:1,count:16}, // Militia
      {id:2,count:8},  // Footman
      {id:4,count:6},  // Scout Cavalry
      {id:7,count:6},  // Archer
    ],
  },
  {
    id: 'lord_crassus',
    name: 'Crassus the Mercenary',
    faction: 'Empire',
    title: 'Captain-General of Frostpeak',
    skills: { tactics:3, leadership:2, trading:4, pathfinding:1 },
    troops: [
      {id:2,count:14}, // Footman
      {id:3,count:6},  // Man-at-Arms
      {id:8,count:10}, // Trained Archer
      {id:4,count:8},  // Scout Cavalry
    ],
  },

  // ── Rebels ───────────────────────────────────────────────
  {
    id: 'lord_theron',
    name: 'Theron Ashveil',
    faction: 'Rebels',
    title: 'Champion of the Free People',
    skills: { tactics:4, leadership:3, trading:2, pathfinding:3 },
    troops: [
      {id:1,count:22}, // Militia (many recruits)
      {id:2,count:10}, // Footman
      {id:7,count:14}, // Archer
      {id:9,count:4},  // Longbowman
    ],
  },
  {
    id: 'lord_mira',
    name: 'Mira the Outlaw Queen',
    faction: 'Rebels',
    title: 'Shadow of Crestfall',
    skills: { tactics:5, leadership:4, trading:3, pathfinding:5 },
    troops: [
      {id:4,count:14}, // Scout Cavalry
      {id:5,count:8},  // Light Cavalry
      {id:8,count:10}, // Trained Archer
      {id:9,count:5},  // Longbowman
    ],
  },

  // ── Bandit Lords (named, dangerous) ──────────────────────
  {
    id: 'lord_grak',
    name: 'Grak Bonecrusher',
    faction: 'Bandit',
    title: 'King of the Wastes',
    skills: { tactics:3, leadership:4, trading:1, pathfinding:2 },
    troops: [
      {id:1,count:30}, // Militia (bandit horde)
      {id:2,count:15}, // Footman
      {id:3,count:6},  // Man-at-Arms
    ],
  },
  {
    id: 'lord_sable',
    name: 'Sable the Knife',
    faction: 'Bandit',
    title: 'Master of the Dark Road',
    skills: { tactics:4, leadership:2, trading:3, pathfinding:5 },
    troops: [
      {id:1,count:12}, // Militia
      {id:2,count:8},  // Footman
      {id:4,count:10}, // Scout Cavalry
      {id:5,count:4},  // Light Cavalry
    ],
  },
];

// Map by id for fast lookup
const LORDS_BY_ID = {};
LORD_DEFS.forEach(l => { LORDS_BY_ID[l.id] = l; });