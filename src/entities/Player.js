// ============================================================
// Player.js — Mutable player state (singleton object)
// troops use {id, count} where id maps to TROOP_BY_ID
// ============================================================
const player = {
  gold:      1000000,
  troops:    [{id:0, count:10}, {id:1, count:20}],  // 10 Villagers + 3 Militia
  inventory: { grain:0, iron:0, cloth:0, fish:0 },
  skills:    { tactics:1, trading:1, leadership:1, pathfinding:1 },
  xp:        0,
  level:     1,
  renown:    0,
};