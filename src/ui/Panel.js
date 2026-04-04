// Reusable UI drawing helpers — Pass 1 visual polish
// Requires THEME (src/config.js) to be loaded before this file.

/** Draw a styled medieval panel background. Returns the graphics object. */
function drawPanelBg(scene, cx, cy, w, h) {
  const g = scene.add.graphics().setScrollFactor(0).setDepth(301);
  // Drop shadow
  g.fillStyle(0x000000, 0.4);
  g.fillRect(cx - w/2 + 5, cy - h/2 + 5, w, h);
  // Main panel fill
  g.fillStyle(THEME.panel.fill, 0.97);
  g.fillRect(cx - w/2, cy - h/2, w, h);
  // Subtle top-edge highlight strip
  g.fillStyle(THEME.panel.fillLight, 0.55);
  g.fillRect(cx - w/2 + 2, cy - h/2 + 2, w - 4, 5);
  // Outer bronze border
  g.lineStyle(2, THEME.panel.border, 1.0);
  g.strokeRect(cx - w/2, cy - h/2, w, h);
  // Inner inset border
  g.lineStyle(1, THEME.panel.borderInner, 0.85);
  g.strokeRect(cx - w/2 + 3, cy - h/2 + 3, w - 6, h - 6);
  // Gold divider line below title area
  g.fillStyle(THEME.panel.accent, 0.65);
  g.fillRect(cx - w/2 + 12, cy - h/2 + 36, w - 24, 1);
  return g;
}

/**
 * Create a styled button with hover and press states.
 * Returns the Phaser Text object — caller must push it to the panel's objs array.
 */
function createStyledButton(scene, x, y, label, onClick, opts) {
  opts = opts || {};
  const depth      = opts.depth      !== undefined ? opts.depth      : 302;
  const fontSize   = opts.fontSize   || THEME.font.sm;
  const fontFamily = opts.fontFamily || THEME.font.ui;
  const padX       = opts.padX       !== undefined ? opts.padX       : 10;
  const padY       = opts.padY       !== undefined ? opts.padY       : 4;

  const fillHex  = '#' + THEME.btn.fill.toString(16).padStart(6, '0');
  const hoverHex = '#' + THEME.btn.fillHover.toString(16).padStart(6, '0');
  const pressHex = '#' + THEME.btn.fillPressed.toString(16).padStart(6, '0');

  const btn = scene.add.text(x, y, label, {
    fontSize, fontFamily,
    color: THEME.btn.textNormal,
    backgroundColor: fillHex,
    padding: { x: padX, y: padY },
  }).setScrollFactor(0).setDepth(depth).setInteractive({ useHandCursor: true });

  btn.on('pointerover',  () => { btn.setColor(THEME.btn.textHover);  btn.setBackgroundColor(hoverHex); });
  btn.on('pointerout',   () => { btn.setColor(THEME.btn.textNormal); btn.setBackgroundColor(fillHex);  });
  btn.on('pointerdown',  () => { btn.setBackgroundColor(pressHex); if (onClick) onClick(); });
  btn.on('pointerup',    () => { btn.setBackgroundColor(hoverHex); });
  return btn;
}

/** Draw shadow + background behind the minimap render texture (depth 199). */
function drawMinimapFrame(scene, x, y, w, h) {
  const g = scene.add.graphics().setScrollFactor(0).setDepth(199);
  // Outer shadow
  g.fillStyle(0x000000, 0.55);
  g.fillRect(x - 3, y - 3, w + 6, h + 6);
  // Background fill (behind the RenderTexture)
  g.fillStyle(THEME.minimap.bg, 1.0);
  g.fillRect(x, y, w, h);
  return g;
}

/** Draw a border overlay on top of the minimap render texture (depth 202). */
function drawMinimapBorder(scene, x, y, w, h) {
  const g = scene.add.graphics().setScrollFactor(0).setDepth(202);
  // Outer bronze border
  g.lineStyle(2, THEME.minimap.frame, 1.0);
  g.strokeRect(x - 1, y - 1, w + 2, h + 2);
  // Inner inset line
  g.lineStyle(1, THEME.minimap.frameInner, 0.85);
  g.strokeRect(x + 1, y + 1, w - 2, h - 2);
  return g;
}
