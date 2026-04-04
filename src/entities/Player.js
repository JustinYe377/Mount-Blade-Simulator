// ============================================================
// Player.js — Mutable player state (singleton object)
// troops use {id, count} where id maps to TROOP_BY_ID
// ============================================================
const player = {
  gold:      800,
  faction:   'Varric League',
  troops:    [{id:0, count:8}, {id:1, count:5}],   // 8 Villagers + 5 Militia
  inventory: { grain:0, iron:0, cloth:0, fish:0 },
  skills:    { tactics:1, trading:1, leadership:1, pathfinding:1 },
  xp:        0,
  level:     1,
  renown:    0,
  troopXP:   {},   // troop id → accumulated XP toward next upgrade
};