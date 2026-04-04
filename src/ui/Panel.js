// ============================================================
// Panel.js — Reusable Phaser UI helper functions
// Used by WorldScene panels, HUD, and minimap.
// Depends on: config.js (THEME must be defined first)
// ============================================================

/**
 * Create a styled text button with hover/click effects.
 * Returns the Phaser Text object (so callers can setPosition on it).
 */
function createStyledButton(scene, x, y, label, onClick, opts = {}) {
  const depth  = opts.depth  ?? 301;
  const padX   = opts.padX   ?? 10;
  const padY   = opts.padY   ?? 5;
  const fillHex = '#' + THEME.panel.fill.toString(16).padStart(6, '0');

  const btn = scene.add.text(x, y, label, {
    fontSize:        THEME.font.sm,
    fontFamily:      THEME.font.ui,
    color:           THEME.text.gold,
    backgroundColor: fillHex,
    padding:         { x: padX, y: padY },
    stroke:          '#000000',
    strokeThickness: 1,
  })
    .setScrollFactor(0)
    .setDepth(depth)
    .setInteractive({ useHandCursor: true });

  btn.on('pointerover',  () => btn.setColor(THEME.text.primary));
  btn.on('pointerout',   () => btn.setColor(THEME.text.gold));
  btn.on('pointerdown',  () => { btn.setColor('#ffffff'); onClick(); });
  btn.on('pointerup',    () => btn.setColor(THEME.text.gold));

  return btn;
}

/**
 * Draw a styled panel background (dark fill + border + inner highlight).
 * Returns the Graphics object added to the scene.
 */
function drawPanelBg(scene, cx, cy, w, h) {
  const g = scene.add.graphics().setScrollFactor(0).setDepth(301);

  // Outer shadow
  g.fillStyle(0x000000, 0.6);
  g.fillRoundedRect(cx - w/2 + 4, cy - h/2 + 4, w, h, THEME.panel.radius);

  // Main fill
  g.fillStyle(THEME.panel.fill, THEME.panel.fillAlpha);
  g.fillRoundedRect(cx - w/2, cy - h/2, w, h, THEME.panel.radius);

  // Border
  g.lineStyle(1.5, THEME.panel.border, 0.9);
  g.strokeRoundedRect(cx - w/2, cy - h/2, w, h, THEME.panel.radius);

  // Inner highlight (top edge only)
  g.lineStyle(1, THEME.panel.borderBright, 0.25);
  g.strokeRoundedRect(cx - w/2 + 1, cy - h/2 + 1, w - 2, h - 2, THEME.panel.radius);

  // Title bar separator
  g.lineStyle(1, THEME.panel.border, 0.5);
  g.lineBetween(cx - w/2 + 10, cy - h/2 + 36, cx + w/2 - 10, cy - h/2 + 36);

  return g;
}

/**
 * Draw the dark background frame behind the minimap.
 */
function drawMinimapFrame(scene, mx, my, mw, mh) {
  const g = scene.add.graphics().setScrollFactor(0).setDepth(199);
  g.fillStyle(0x000000, 0.55);
  g.fillRect(mx - 3, my - 3, mw + 6, mh + 6);
  g.fillStyle(THEME.minimap.bg, 1.0);
  g.fillRect(mx, my, mw, mh);
  return g;
}

/**
 * Draw the two-tone border around the minimap.
 */
function drawMinimapBorder(scene, mx, my, mw, mh) {
  const g = scene.add.graphics().setScrollFactor(0).setDepth(201);
  g.lineStyle(2, THEME.minimap.frame, 1.0);
  g.strokeRect(mx - 1, my - 1, mw + 2, mh + 2);
  g.lineStyle(1, THEME.minimap.frameInner, 0.85);
  g.strokeRect(mx + 1, my + 1, mw - 2, mh - 2);
  return g;
}