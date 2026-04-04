// Global visual theme — Pass 1 visual polish
// Load this before src/ui/Panel.js and the main game script.
const THEME = {
  panel: {
    fill:         0x1c1810,   // dark parchment
    fillLight:    0x28221a,   // top-edge highlight
    border:       0x7a6035,   // bronze outer border
    borderInner:  0x38301c,   // inset shadow border
    accent:       0xaa7f28,   // gold divider line
    overlayAlpha: 0.65,       // dim-overlay alpha
  },
  text: {
    primary: '#e2cfa0',
    muted:   '#8a7a5a',
    gold:    '#ffd866',
    green:   '#7fc97a',
    red:     '#e07878',
    blue:    '#7ab3d4',
    orange:  '#e8a050',
  },
  btn: {
    fill:        0x2a2010,
    fillHover:   0x4a3820,
    fillPressed: 0x110d04,
    textNormal:  '#c8b07a',
    textHover:   '#ffd866',
  },
  hud: {
    fill:      0x0e0c07,
    fillAlpha: 0.90,
    height:    46,
  },
  minimap: {
    bg:         0x080706,
    frame:      0x7a6035,
    frameInner: 0x38301c,
    w: 126,
    h: 96,
  },
  faction: {
    Kingdom: 0x4488ff,
    Empire:  0xee4444,
    Rebels:  0x44cc44,
    Bandit:  0x998844,
  },
  font: {
    ui:  'Georgia, "Times New Roman", serif',
    mono: '"Courier New", Courier, monospace',
    xs:  '9px',
    sm:  '11px',
    md:  '13px',
    lg:  '16px',
    xl:  '20px',
  },
  spacing: {
    pad: 16,
    gap: 15,
  },
};
