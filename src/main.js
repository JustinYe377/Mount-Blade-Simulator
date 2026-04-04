// ============================================================
// main.js — Phaser 3 game configuration and boot
// Loaded last; all scene classes must be defined before this runs.
// ============================================================

// Additional scenes can be registered here as the project grows:
//   import / add scene files above in index.html, then list them below.

const config = {
  type:   Phaser.AUTO,
  width:  window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#0a0a0f',
  parent: 'game-container',
  scale: {
    mode:          Phaser.Scale.RESIZE,
    autoCenter:    Phaser.Scale.CENTER_BOTH,
    width:         window.innerWidth,
    height:        window.innerHeight,
  },
  scene: [
    WorldScene,
    // Future scenes go here, e.g.:
    // BattleScene,
    // TownScene,
    // MenuScene,
  ],
};

const game = new Phaser.Game(config);