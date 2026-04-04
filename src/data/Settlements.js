// ============================================================
// Settlements.js — Static handcrafted campaign map data
//
// Coordinate system:
//   Logical reference space: 160 × 100
//   Grid space (game):       240 × 180  (GRID_W × GRID_H)
//   Scale: gx = Math.round(lx * 1.5),  gy = Math.round(ly * 1.8)
//
// Types: 'town' | 'castle' | 'village'
// Tier:  0=village, 1=town/castle, 2=capital city
// All settlements are safe zones (safeZone: true).
// ============================================================

const SETTLEMENTS_DATA = [

  // ══════════════════════════════════════════════════
  //  TOWNS
  // ══════════════════════════════════════════════════

  // ── Varric League ──────────────────────────────────
  {
    id:'highcourt', name:'Highcourt', type:'town', tier:2,
    faction:'Varric League', biome:'plains',
    x:33,  y:108,
    goods:{ grain:28, iron:16, cloth:22, fish:18 }, recruitPool:12,
    prosperity:72, safety:95, safeZone:true,
    production:[], protectedBy:['westhold_keep'],
  },
  {
    id:'stonebridge', name:'Stonebridge', type:'town', tier:1,
    faction:'Varric League', biome:'plains',
    x:57,  y:83,
    goods:{ grain:18, iron:20, cloth:14, fish:10 }, recruitPool:8,
    prosperity:62, safety:88, safeZone:true,
    production:[], protectedBy:['stonegate_castle'],
  },

  // ── Arden Clans ────────────────────────────────────
  {
    id:'thornwatch', name:'Thornwatch', type:'town', tier:2,
    faction:'Arden Clans', biome:'forest',
    x:42,  y:43,
    goods:{ grain:12, iron:24, cloth:26, fish:8 }, recruitPool:11,
    prosperity:66, safety:90, safeZone:true,
    production:[], protectedBy:['redthorn_castle'],
  },
  {
    id:'greenharrow', name:'Greenharrow', type:'town', tier:1,
    faction:'Arden Clans', biome:'forest',
    x:72,  y:32,
    goods:{ grain:10, iron:22, cloth:18, fish:6 }, recruitPool:8,
    prosperity:58, safety:85, safeZone:true,
    production:[], protectedBy:['greybark_fort'],
  },

  // ── Skeldir Holds ──────────────────────────────────
  {
    id:'frostholm', name:'Frostholm', type:'town', tier:2,
    faction:'Skeldir Holds', biome:'cold_highland',
    x:132, y:25,
    goods:{ grain:14, iron:30, cloth:10, fish:22 }, recruitPool:10,
    prosperity:60, safety:88, safeZone:true,
    production:[], protectedBy:['icewatch_keep'],
  },
  {
    id:'varngard', name:'Varngard', type:'town', tier:1,
    faction:'Skeldir Holds', biome:'cold_highland',
    x:168, y:36,
    goods:{ grain:12, iron:26, cloth:8, fish:18 }, recruitPool:7,
    prosperity:54, safety:82, safeZone:true,
    production:[], protectedBy:['northfang_castle'],
  },

  // ── Auric Empire ───────────────────────────────────
  {
    id:'aurelian', name:'Aurelian', type:'town', tier:2,
    faction:'Auric Empire', biome:'fertile_basin',
    x:114, y:83,
    goods:{ grain:30, iron:20, cloth:28, fish:14 }, recruitPool:15,
    prosperity:80, safety:92, safeZone:true,
    production:[], protectedBy:['crownguard_keep'],
  },
  {
    id:'cindercross', name:'Cindercross', type:'town', tier:1,
    faction:'Auric Empire', biome:'fertile_basin',
    x:137, y:104,
    goods:{ grain:22, iron:18, cloth:20, fish:12 }, recruitPool:9,
    prosperity:68, safety:84, safeZone:true,
    production:[], protectedBy:['ashenfort', 'sunwall_castle'],
  },
  {
    id:'southgate', name:'Southgate', type:'town', tier:1,
    faction:'Auric Empire', biome:'fertile_basin',
    x:111, y:137,
    goods:{ grain:18, iron:14, cloth:16, fish:10 }, recruitPool:8,
    prosperity:60, safety:78, safeZone:true,
    production:[], protectedBy:['sunwall_castle', 'dune_ward'],
  },

  // ── Qaratai Khanate ────────────────────────────────
  {
    id:'kharadun', name:'Kharadun', type:'town', tier:2,
    faction:'Qaratai Khanate', biome:'steppe',
    x:192, y:79,
    goods:{ grain:20, iron:12, cloth:24, fish:8 }, recruitPool:12,
    prosperity:64, safety:85, safeZone:true,
    production:[], protectedBy:['skyreign_fort'],
  },
  {
    id:'windscar', name:'Windscar', type:'town', tier:1,
    faction:'Qaratai Khanate', biome:'steppe',
    x:213, y:108,
    goods:{ grain:16, iron:10, cloth:20, fish:6 }, recruitPool:8,
    prosperity:56, safety:80, safeZone:true,
    production:[], protectedBy:['skyreign_fort'],
  },

  // ── Zahir Sultanate ────────────────────────────────
  {
    id:'saffar', name:'Saffar', type:'town', tier:2,
    faction:'Zahir Sultanate', biome:'desert',
    x:153, y:155,
    goods:{ grain:14, iron:10, cloth:30, fish:16 }, recruitPool:11,
    prosperity:66, safety:86, safeZone:true,
    production:[], protectedBy:['dune_ward'],
  },
  {
    id:'qahir', name:'Qahir', type:'town', tier:1,
    faction:'Zahir Sultanate', biome:'desert',
    x:192, y:151,
    goods:{ grain:12, iron:8,  cloth:24, fish:12 }, recruitPool:8,
    prosperity:58, safety:80, safeZone:true,
    production:[], protectedBy:['qasr_al_rimal'],
  },

  // ══════════════════════════════════════════════════
  //  CASTLES
  // ══════════════════════════════════════════════════

  {
    id:'westhold_keep', name:'Westhold Keep', type:'castle', tier:1,
    faction:'Varric League', biome:'plains',
    x:48,  y:101,
    goods:{ grain:10, iron:18, cloth:6, fish:6 }, recruitPool:6,
    prosperity:55, safety:95, safeZone:true,
    production:[], protectedBy:[],
  },
  {
    id:'stonegate_castle', name:'Stonegate Castle', type:'castle', tier:1,
    faction:'Varric League', biome:'plains',
    x:66,  y:79,
    goods:{ grain:8, iron:20, cloth:6, fish:4 }, recruitPool:6,
    prosperity:58, safety:92, safeZone:true,
    production:[], protectedBy:[],
  },
  {
    id:'redthorn_castle', name:'Redthorn Castle', type:'castle', tier:1,
    faction:'Arden Clans', biome:'forest',
    x:54,  y:50,
    goods:{ grain:6, iron:22, cloth:10, fish:4 }, recruitPool:5,
    prosperity:52, safety:90, safeZone:true,
    production:[], protectedBy:[],
  },
  {
    id:'greybark_fort', name:'Greybark Fort', type:'castle', tier:1,
    faction:'Arden Clans', biome:'forest',
    x:78,  y:43,
    goods:{ grain:6, iron:20, cloth:8, fish:4 }, recruitPool:5,
    prosperity:50, safety:88, safeZone:true,
    production:[], protectedBy:[],
  },
  {
    id:'icewatch_keep', name:'Icewatch Keep', type:'castle', tier:1,
    faction:'Skeldir Holds', biome:'cold_highland',
    x:144, y:32,
    goods:{ grain:6, iron:24, cloth:4, fish:10 }, recruitPool:5,
    prosperity:50, safety:90, safeZone:true,
    production:[], protectedBy:[],
  },
  {
    id:'northfang_castle', name:'Northfang Castle', type:'castle', tier:1,
    faction:'Skeldir Holds', biome:'cold_highland',
    x:177, y:47,
    goods:{ grain:6, iron:22, cloth:4, fish:8 }, recruitPool:5,
    prosperity:48, safety:88, safeZone:true,
    production:[], protectedBy:[],
  },
  {
    id:'crownguard_keep', name:'Crownguard Keep', type:'castle', tier:1,
    faction:'Auric Empire', biome:'fertile_basin',
    x:99,  y:76,
    goods:{ grain:10, iron:22, cloth:8, fish:6 }, recruitPool:7,
    prosperity:60, safety:94, safeZone:true,
    production:[], protectedBy:[],
  },
  {
    id:'sunwall_castle', name:'Sunwall Castle', type:'castle', tier:1,
    faction:'Auric Empire', biome:'fertile_basin',
    x:123, y:122,
    goods:{ grain:10, iron:18, cloth:8, fish:6 }, recruitPool:6,
    prosperity:56, safety:88, safeZone:true,
    production:[], protectedBy:[],
  },
  {
    id:'ashenfort', name:'Ashenfort', type:'castle', tier:1,
    faction:'Auric Empire', biome:'fertile_basin',
    x:144, y:94,
    goods:{ grain:8, iron:20, cloth:6, fish:6 }, recruitPool:6,
    prosperity:55, safety:88, safeZone:true,
    production:[], protectedBy:[],
  },
  {
    id:'skyreign_fort', name:'Skyreign Fort', type:'castle', tier:1,
    faction:'Qaratai Khanate', biome:'steppe',
    x:180, y:86,
    goods:{ grain:8, iron:14, cloth:12, fish:4 }, recruitPool:6,
    prosperity:52, safety:86, safeZone:true,
    production:[], protectedBy:[],
  },
  {
    id:'dune_ward', name:'Dune Ward', type:'castle', tier:1,
    faction:'Zahir Sultanate', biome:'desert',
    x:132, y:148,
    goods:{ grain:6, iron:10, cloth:16, fish:8 }, recruitPool:5,
    prosperity:50, safety:86, safeZone:true,
    production:[], protectedBy:[],
  },
  {
    id:'qasr_al_rimal', name:'Qasr al-Rimal', type:'castle', tier:1,
    faction:'Zahir Sultanate', biome:'desert',
    x:174, y:162,
    goods:{ grain:6, iron:8,  cloth:18, fish:10 }, recruitPool:5,
    prosperity:50, safety:84, safeZone:true,
    production:[], protectedBy:[],
  },

  // ══════════════════════════════════════════════════
  //  VILLAGES — Varric League  (plains / coastal)
  //  production: grain + fish
  // ══════════════════════════════════════════════════
  { id:'millford',   name:'Millford',   type:'village', tier:0, faction:'Varric League', biome:'plains',
    x:24, y:115, goods:{ grain:12, iron:2, cloth:4, fish:10 }, recruitPool:4,
    prosperity:52, safety:85, safeZone:true, production:['grain','fish'], boundTownId:'highcourt' },
  { id:'harrowby',   name:'Harrowby',   type:'village', tier:0, faction:'Varric League', biome:'plains',
    x:36, y:126, goods:{ grain:14, iron:2, cloth:4, fish:8  }, recruitPool:3,
    prosperity:50, safety:82, safeZone:true, production:['grain','fish'], boundTownId:'highcourt' },
  { id:'oak_hollow', name:'Oak Hollow', type:'village', tier:0, faction:'Varric League', biome:'plains',
    x:21, y:97,  goods:{ grain:10, iron:2, cloth:6, fish:6  }, recruitPool:3,
    prosperity:48, safety:80, safeZone:true, production:['grain','cloth'], boundTownId:'highcourt' },
  { id:'gatefield',  name:'Gatefield',  type:'village', tier:0, faction:'Varric League', biome:'plains',
    x:51, y:72,  goods:{ grain:12, iron:4, cloth:4, fish:6  }, recruitPool:4,
    prosperity:54, safety:84, safeZone:true, production:['grain','fish'], boundTownId:'stonebridge' },
  { id:'westrun',    name:'Westrun',    type:'village', tier:0, faction:'Varric League', biome:'plains',
    x:45, y:86,  goods:{ grain:10, iron:4, cloth:6, fish:6  }, recruitPool:3,
    prosperity:50, safety:82, safeZone:true, production:['grain','cloth'], boundTownId:'stonebridge' },

  // ══════════════════════════════════════════════════
  //  VILLAGES — Arden Clans  (forest)
  //  production: iron + cloth
  // ══════════════════════════════════════════════════
  { id:'pinerest',  name:'Pinerest',  type:'village', tier:0, faction:'Arden Clans', biome:'forest',
    x:33, y:32, goods:{ grain:6, iron:12, cloth:12, fish:2 }, recruitPool:3,
    prosperity:48, safety:80, safeZone:true, production:['iron','cloth'], boundTownId:'thornwatch' },
  { id:'mossden',   name:'Mossden',   type:'village', tier:0, faction:'Arden Clans', biome:'forest',
    x:51, y:32, goods:{ grain:6, iron:14, cloth:10, fish:2 }, recruitPool:3,
    prosperity:50, safety:82, safeZone:true, production:['iron','cloth'], boundTownId:'thornwatch' },
  { id:'briarglen', name:'Briarglen', type:'village', tier:0, faction:'Arden Clans', biome:'forest',
    x:30, y:54, goods:{ grain:8, iron:10, cloth:12, fish:2 }, recruitPool:3,
    prosperity:48, safety:78, safeZone:true, production:['cloth','iron'], boundTownId:'thornwatch' },
  { id:'elkshade',  name:'Elkshade',  type:'village', tier:0, faction:'Arden Clans', biome:'forest',
    x:66, y:22, goods:{ grain:6, iron:14, cloth:8, fish:2  }, recruitPool:3,
    prosperity:46, safety:78, safeZone:true, production:['iron','cloth'], boundTownId:'greenharrow' },
  { id:'rowan_vale', name:'Rowan Vale', type:'village', tier:0, faction:'Arden Clans', biome:'forest',
    x:81, y:22, goods:{ grain:6, iron:12, cloth:10, fish:2 }, recruitPool:3,
    prosperity:48, safety:80, safeZone:true, production:['iron','cloth'], boundTownId:'greenharrow' },

  // ══════════════════════════════════════════════════
  //  VILLAGES — Skeldir Holds  (cold highland)
  //  production: iron + grain
  // ══════════════════════════════════════════════════
  { id:'icefen',    name:'Icefen',    type:'village', tier:0, faction:'Skeldir Holds', biome:'cold_highland',
    x:123, y:18, goods:{ grain:8, iron:14, cloth:4, fish:8  }, recruitPool:3,
    prosperity:44, safety:78, safeZone:true, production:['iron','grain'], boundTownId:'frostholm' },
  { id:'wolfpine',  name:'Wolfpine',  type:'village', tier:0, faction:'Skeldir Holds', biome:'cold_highland',
    x:141, y:18, goods:{ grain:8, iron:12, cloth:4, fish:8  }, recruitPool:3,
    prosperity:44, safety:78, safeZone:true, production:['iron','grain'], boundTownId:'frostholm' },
  { id:'snowmere',  name:'Snowmere',  type:'village', tier:0, faction:'Skeldir Holds', biome:'cold_highland',
    x:159, y:29, goods:{ grain:8, iron:14, cloth:4, fish:6  }, recruitPool:3,
    prosperity:44, safety:76, safeZone:true, production:['grain','iron'], boundTownId:'varngard' },
  { id:'kald_tor',  name:'Kald Tor',  type:'village', tier:0, faction:'Skeldir Holds', biome:'cold_highland',
    x:177, y:29, goods:{ grain:8, iron:12, cloth:4, fish:6  }, recruitPool:3,
    prosperity:44, safety:76, safeZone:true, production:['iron','grain'], boundTownId:'varngard' },

  // ══════════════════════════════════════════════════
  //  VILLAGES — Auric Empire  (fertile basin)
  //  production: grain + cloth
  // ══════════════════════════════════════════════════
  { id:'goldenmead', name:'Goldenmead', type:'village', tier:0, faction:'Auric Empire', biome:'fertile_basin',
    x:105, y:72,  goods:{ grain:16, iron:6, cloth:12, fish:6 }, recruitPool:4,
    prosperity:58, safety:86, safeZone:true, production:['grain','cloth'], boundTownId:'aurelian' },
  { id:'ternfield',  name:'Ternfield',  type:'village', tier:0, faction:'Auric Empire', biome:'fertile_basin',
    x:126, y:72,  goods:{ grain:16, iron:6, cloth:10, fish:6 }, recruitPool:4,
    prosperity:58, safety:84, safeZone:true, production:['grain','cloth'], boundTownId:'aurelian' },
  { id:'eastmere',   name:'Eastmere',   type:'village', tier:0, faction:'Auric Empire', biome:'fertile_basin',
    x:123, y:90,  goods:{ grain:14, iron:8, cloth:10, fish:6 }, recruitPool:4,
    prosperity:56, safety:82, safeZone:true, production:['grain','cloth'], boundTownId:'cindercross' },
  { id:'ashwell',    name:'Ashwell',    type:'village', tier:0, faction:'Auric Empire', biome:'fertile_basin',
    x:129, y:112, goods:{ grain:14, iron:6, cloth:10, fish:6 }, recruitPool:4,
    prosperity:54, safety:80, safeZone:true, production:['grain','cloth'], boundTownId:'cindercross' },
  { id:'bronzeford', name:'Bronzeford', type:'village', tier:0, faction:'Auric Empire', biome:'fertile_basin',
    x:144, y:115, goods:{ grain:12, iron:8, cloth:8, fish:6 }, recruitPool:4,
    prosperity:54, safety:80, safeZone:true, production:['grain','iron'], boundTownId:'cindercross' },
  { id:'larkrise',   name:'Larkrise',   type:'village', tier:0, faction:'Auric Empire', biome:'fertile_basin',
    x:150, y:97,  goods:{ grain:14, iron:6, cloth:10, fish:6 }, recruitPool:4,
    prosperity:56, safety:82, safeZone:true, production:['grain','cloth'], boundTownId:'cindercross' },
  { id:'ryewatch',   name:'Ryewatch',   type:'village', tier:0, faction:'Auric Empire', biome:'fertile_basin',
    x:102, y:144, goods:{ grain:14, iron:4, cloth:8, fish:8 },  recruitPool:3,
    prosperity:50, safety:76, safeZone:true, production:['grain','cloth'], boundTownId:'southgate' },
  { id:'emberfield', name:'Emberfield', type:'village', tier:0, faction:'Auric Empire', biome:'fertile_basin',
    x:120, y:148, goods:{ grain:12, iron:4, cloth:8, fish:8 },  recruitPool:3,
    prosperity:48, safety:74, safeZone:true, production:['grain','cloth'], boundTownId:'southgate' },

  // ══════════════════════════════════════════════════
  //  VILLAGES — Qaratai Khanate  (open steppe)
  //  production: grain + cloth
  // ══════════════════════════════════════════════════
  { id:'horsewell',     name:'Horsewell',     type:'village', tier:0, faction:'Qaratai Khanate', biome:'steppe',
    x:183, y:68,  goods:{ grain:12, iron:6, cloth:14, fish:4 }, recruitPool:4,
    prosperity:50, safety:78, safeZone:true, production:['grain','cloth'], boundTownId:'kharadun' },
  { id:'sair_camp',     name:'Sair Camp',     type:'village', tier:0, faction:'Qaratai Khanate', biome:'steppe',
    x:201, y:68,  goods:{ grain:12, iron:6, cloth:12, fish:4 }, recruitPool:4,
    prosperity:50, safety:78, safeZone:true, production:['grain','cloth'], boundTownId:'kharadun' },
  { id:'tallgrass',     name:'Tallgrass',     type:'village', tier:0, faction:'Qaratai Khanate', biome:'steppe',
    x:204, y:115, goods:{ grain:12, iron:4, cloth:14, fish:4 }, recruitPool:3,
    prosperity:48, safety:76, safeZone:true, production:['cloth','grain'], boundTownId:'windscar' },
  { id:'red_mane_camp', name:'Red Mane Camp', type:'village', tier:0, faction:'Qaratai Khanate', biome:'steppe',
    x:222, y:119, goods:{ grain:10, iron:4, cloth:12, fish:4 }, recruitPool:3,
    prosperity:46, safety:74, safeZone:true, production:['cloth','grain'], boundTownId:'windscar' },

  // ══════════════════════════════════════════════════
  //  VILLAGES — Zahir Sultanate  (desert / oasis)
  //  production: cloth + grain
  // ══════════════════════════════════════════════════
  { id:'palmford',       name:'Palmford',       type:'village', tier:0, faction:'Zahir Sultanate', biome:'desert',
    x:144, y:162, goods:{ grain:10, iron:4, cloth:16, fish:8 }, recruitPool:3,
    prosperity:48, safety:78, safeZone:true, production:['cloth','grain'], boundTownId:'saffar' },
  { id:'salt_well',      name:'Salt Well',      type:'village', tier:0, faction:'Zahir Sultanate', biome:'desert',
    x:162, y:166, goods:{ grain:10, iron:4, cloth:14, fish:8 }, recruitPool:3,
    prosperity:46, safety:76, safeZone:true, production:['cloth','grain'], boundTownId:'saffar' },
  { id:'sunspire_oasis', name:'Sunspire Oasis', type:'village', tier:0, faction:'Zahir Sultanate', biome:'desert',
    x:183, y:158, goods:{ grain:10, iron:4, cloth:14, fish:6 }, recruitPool:3,
    prosperity:46, safety:76, safeZone:true, production:['cloth','grain'], boundTownId:'qahir' },
  { id:'dune_cross',     name:'Dune Cross',     type:'village', tier:0, faction:'Zahir Sultanate', biome:'desert',
    x:201, y:162, goods:{ grain:8, iron:4, cloth:12, fish:6 }, recruitPool:3,
    prosperity:44, safety:74, safeZone:true, production:['grain','cloth'], boundTownId:'qahir' },
];

// Priority road connections (pairs of settlement IDs)
const ROAD_CONNECTIONS = [
  // Main west-east trade route
  ['highcourt',      'stonebridge'],
  ['stonebridge',    'stonegate_castle'],
  ['stonegate_castle','crownguard_keep'],
  ['crownguard_keep','aurelian'],
  // Northern forest/highland route
  ['thornwatch',     'greenharrow'],
  ['greenharrow',    'frostholm'],
  ['frostholm',      'varngard'],
  // Imperial south route
  ['aurelian',       'cindercross'],
  ['cindercross',    'southgate'],
  ['southgate',      'saffar'],
  ['saffar',         'qahir'],
  // Imperial east route
  ['aurelian',       'kharadun'],
  ['kharadun',       'windscar'],
  // Desert cross-route
  ['cindercross',    'saffar'],
  // Internal connections
  ['highcourt',      'westhold_keep'],
  ['aurelian',       'ashenfort'],
  ['cindercross',    'ashenfort'],
  ['southgate',      'sunwall_castle'],
  ['kharadun',       'skyreign_fort'],
  ['saffar',         'dune_ward'],
];

// Build lookup map
const SETTLEMENTS_BY_ID = {};
SETTLEMENTS_DATA.forEach(s => { SETTLEMENTS_BY_ID[s.id] = s; });
