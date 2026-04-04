// ============================================================
// Player.js — Mutable player state (singleton object)
// Import order: must come after config.js
// ============================================================
const player = {
  gold:      200,
  troops:    [{tier:0, count:10}, {tier:1, count:3}],
  inventory: { grain:0, iron:0, cloth:0, fish:0 },
  skills:    { tactics:1, trading:1, leadership:1, pathfinding:1 },
  xp:        0,
  level:     1,
  renown:    0,
};