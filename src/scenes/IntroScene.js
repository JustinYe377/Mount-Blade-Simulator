// ============================================================
// IntroScene.js — New-player tutorial / intro screen
// Displayed before WorldScene on first launch.
// Depends on: config.js, Panel.js
// ============================================================

class IntroScene extends Phaser.Scene {
  constructor() { super('IntroScene'); }

  // ============================================================
  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ── Pages ────────────────────────────────────────────────
    this._pages = [
      {
        title: 'Welcome to Warbands',
        body: [
          'A 2D sandbox strategy game inspired by Mount & Blade.',
          '',
          'You are a wandering mercenary captain on a procedurally-',
          'generated medieval continent ruled by six rival factions,',
          'each at war with at least one of its neighbours.',
          '',
          'YOUR GOAL',
          '  Build a powerful warband, accumulate Renown through',
          '  battle, grow wealthy through trade, and carve your',
          '  legend into history.',
          '',
          'There is no fixed end — play as aggressively or as',
          'diplomatically as you like. The world keeps moving',
          'whether you do or not.',
        ],
      },
      {
        title: 'Moving Around the World',
        body: [
          'LEFT-CLICK anywhere on the map to set a destination.',
          'Your party pathfinds around impassable terrain.',
          '',
          'SCROLL WHEEL  zoom in / out',
          'SPACE         pause / unpause time',
          '1 / 2 / 3     game speed  ×1 / ×2 / ×4',
          '',
          'TERRAIN COSTS',
          '  Grassland          fastest',
          '  Sand / Hills       slower',
          '  Forest             slow',
          '  Dense Forest       very slow',
          '  Mountains / Water  impassable',
          '',
          'Entering a settlement\'s safe zone pauses enemy',
          'pursuit and gives access to town menus.',
        ],
      },
      {
        title: 'Factions & the World',
        body: [
          'Six major factions contest the map.',
          '',
          'Lords patrol, recruit, and attack enemies.',
          'Caravans ferry goods between towns.',
          'Villager parties supply nearby markets.',
          'Bandits prey on weaker parties.',
          '',
          'You start aligned with the Varric League but',
          'can fight anyone who declares war on you.',
          '',
          'Watch the faction relations — alliances shift',
          'and a war on one front can open another.',
        ],
      },
      {
        title: 'Building Your Warband',
        body: [
          'Your party starts with Villagers and Militia.',
          'Visit towns and villages to recruit more troops.',
          '',
          'Three troop branches, each with 4 tiers:',
          '  Infantry · Cavalry · Archers',
          '',
          'Troops earn XP in battle and can be upgraded',
          'for gold when they hit the XP threshold.',
          '',
          'Higher-tier troops cost more in daily wages.',
          'Keep an eye on income or your party shrinks.',
          '',
          'Press  P  to open the Party panel.',
        ],
      },
      {
        title: 'Combat',
        body: [
          'Click on an enemy party to engage them.',
          'Battles auto-resolve using unit power plus a',
          'rock-paper-scissors combat triangle:',
          '',
          '  Infantry  beats  Cavalry',
          '  Cavalry   beats  Archers',
          '  Archers   beat   Infantry',
          '',
          'A balanced force adapts to any enemy.',
          '',
          'SKILLS',
          '  Tactics     — reduces your casualties',
          '  Leadership  — raises party size cap',
          '  Trading     — better buy/sell prices',
          '',
          'After battle: Renown, XP, and troop upgrades.',
        ],
      },
      {
        title: 'Trade & Economy',
        body: [
          'Towns trade four goods:',
          '  Grain · Iron · Cloth · Fish',
          '',
          'Buy low where surplus is high; sell high',
          'where demand is strong. Prices shift with time.',
          '',
          'Press  I  to open the Inventory panel.',
          '',
          'SETTLEMENTS',
          '  Villages — produce raw goods',
          '  Towns    — markets, recruitment hubs',
          '  Castles  — military strongholds',
          '',
          'Staying in a settlement recovers wounded',
          'troops (wages keep ticking though).',
          '',
          'Keep ~500–1000 gold reserve for payday.',
        ],
      },
      {
        title: 'HUD & Keyboard Shortcuts',
        body: [
          'TOP BAR',
          '  Day counter · Gold · Troops · Renown',
          '  Party / Inventory buttons',
          '',
          'KEYBOARD',
          '  SPACE   pause / resume',
          '  P       Party panel',
          '  I       Inventory panel',
          '  ESC     close open panel',
          '  1       normal speed (×1)',
          '  2       fast (×2)',
          '  3       very fast (×4)',
          '',
          'MINIMAP (top-right corner)',
          '  Coloured dots = NPC parties by faction',
          '  White dot = you',
          '',
          'Good luck, captain.  The world is waiting.',
        ],
      },
    ];

    this._page = 0;

    // ── Background ───────────────────────────────────────────
    const bg = this.add.graphics().setScrollFactor(0).setDepth(300);
    bg.fillStyle(0x0a0a0f, 1);
    bg.fillRect(0, 0, W, H);

    // ── Panel ────────────────────────────────────────────────
    const PW = Math.min(780, W - 40);
    const PH = Math.min(510, H - 80);
    const cx = W / 2;
    const cy = H / 2;
    this._cx = cx; this._cy = cy;
    this._PW = PW; this._PH = PH;

    drawPanelBg(this, cx, cy, PW, PH);

    // Vertical divider between text and illustration
    const divG = this.add.graphics().setScrollFactor(0).setDepth(302);
    divG.lineStyle(1, THEME.panel.border, 0.35);
    divG.lineBetween(cx + 2, cy - PH/2 + 42, cx + 2, cy + PH/2 - 52);

    // ── Title (full width) ───────────────────────────────────
    this._titleText = this.add.text(cx - PW/2 + 18, cy - PH/2 + 10, '', {
      fontSize:        '18px',
      fontFamily:      THEME.font.ui,
      color:           THEME.text.gold,
      fontStyle:       'bold',
      stroke:          '#000000',
      strokeThickness: 2,
    }).setScrollFactor(0).setDepth(302);

    // ── Body text — left column ──────────────────────────────
    const textColW = PW / 2 - 26;
    this._bodyText = this.add.text(cx - PW/2 + 18, cy - PH/2 + 46, '', {
      fontSize:   '12px',
      fontFamily: THEME.font.ui,
      color:      THEME.text.primary,
      lineSpacing: 5,
      wordWrap:   { width: textColW },
    }).setScrollFactor(0).setDepth(302);

    // ── Illustration layer — right column ────────────────────
    this._illGfx   = this.add.graphics().setScrollFactor(0).setDepth(302);
    this._illTexts = [];

    // ── Page indicator ───────────────────────────────────────
    this._pageLabel = this.add.text(cx, cy + PH/2 - 42, '', {
      fontSize:   THEME.font.sm,
      fontFamily: THEME.font.ui,
      color:      THEME.text.muted,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(302);

    // ── Navigation buttons ───────────────────────────────────
    const btnY = cy + PH/2 - 20;

    this._backBtn = createStyledButton(this, cx - PW/2 + 18, btnY, '< Back', () => {
      if (this._page > 0) { this._page--; this._render(); }
    }, { depth: 302, padX: 14, padY: 6 });
    this._backBtn.setOrigin(0, 0.5);

    this._nextBtn = createStyledButton(this, cx + PW/2 - 18, btnY, 'Next >', () => {
      if (this._page < this._pages.length - 1) { this._page++; this._render(); }
    }, { depth: 302, padX: 14, padY: 6 });
    this._nextBtn.setOrigin(1, 0.5);

    this._startBtn = createStyledButton(this, cx, btnY, 'Begin Your Adventure', () => {
      this.scene.start('WorldScene');
    }, { depth: 302, padX: 20, padY: 6 });
    this._startBtn.setOrigin(0.5, 0.5);

    // ── Keyboard navigation ──────────────────────────────────
    this.input.keyboard.addKey('RIGHT').on('down', () => {
      if (this._page < this._pages.length - 1) { this._page++; this._render(); }
    });
    this.input.keyboard.addKey('LEFT').on('down', () => {
      if (this._page > 0) { this._page--; this._render(); }
    });
    this.input.keyboard.addKey('ENTER').on('down', () => {
      if (this._page < this._pages.length - 1) { this._page++; this._render(); }
      else { this.scene.start('WorldScene'); }
    });

    this._render();
  }

  // ── Helpers ──────────────────────────────────────────────

  _clearIllTexts() {
    this._illTexts.forEach(t => t.destroy());
    this._illTexts = [];
  }

  /** Add a text label to the illustration area (auto-tracked for cleanup). */
  _label(x, y, txt, opts = {}) {
    const t = this.add.text(x, y, txt, {
      fontSize:        opts.size  || '10px',
      fontFamily:      THEME.font.ui,
      color:           opts.color || THEME.text.muted,
      fontStyle:       opts.bold  ? 'bold' : 'normal',
      stroke:          '#000000',
      strokeThickness: 1,
    }).setScrollFactor(0).setDepth(303)
      .setOrigin(opts.ox ?? 0.5, opts.oy ?? 0.5);
    this._illTexts.push(t);
    return t;
  }

  _render() {
    const page = this._pages[this._page];
    const last  = this._page === this._pages.length - 1;
    const cx = this._cx, cy = this._cy, PW = this._PW, PH = this._PH;

    this._titleText.setText(page.title);
    this._bodyText.setText(page.body.join('\n'));
    this._pageLabel.setText(`${this._page + 1} / ${this._pages.length}  ·  arrow keys or buttons to navigate`);

    this._backBtn.setVisible(this._page > 0);
    this._nextBtn.setVisible(!last);
    this._startBtn.setVisible(last);

    // Clear and redraw illustration
    this._illGfx.clear();
    this._clearIllTexts();

    // Illustration area bounds (right column, below title separator)
    const ix  = cx + 10;
    const iy  = cy - PH/2 + 46;
    const iw  = PW/2 - 28;
    const ih  = PH - 104;
    const icx = ix + iw / 2;
    const icy = iy + ih / 2;

    const drawFns = [
      '_illWelcome', '_illMovement', '_illFactions',
      '_illWarband', '_illCombat',   '_illTrade', '_illHUD',
    ];
    const fn = drawFns[this._page];
    if (fn && this[fn]) this[fn](ix, iy, iw, ih, icx, icy);
  }

  // ============================================================
  // Illustration: Page 0 — Welcome (shield + crossed swords)
  // ============================================================
  _illWelcome(ix, iy, iw, ih, icx, icy) {
    const g  = this._illGfx;
    const sx = icx;
    const sy = icy - 10;
    const sw = 78, sh = 96;

    // Glow
    g.fillStyle(0x4488ff, 0.07);
    g.fillCircle(sx, sy, 70);

    // Shield body (top rect + bottom triangle)
    g.fillStyle(0x1a2a40, 1);
    g.fillRect(sx - sw/2, sy - sh/2, sw, sh * 0.6);
    g.fillTriangle(
      sx - sw/2, sy - sh/2 + sh * 0.6,
      sx + sw/2, sy - sh/2 + sh * 0.6,
      sx,        sy + sh/2
    );

    // Shield colour band (diagonal — Varric League blue)
    g.fillStyle(0x4488ff, 0.28);
    g.fillTriangle(
      sx - sw/2, sy - sh/2,
      sx + sw/2, sy - sh/2,
      sx - sw/2, sy - sh/2 + sh * 0.45
    );

    // Shield border — outline each piece
    g.lineStyle(2.5, 0x4a6a8a, 0.9);
    g.strokeRect(sx - sw/2, sy - sh/2, sw, sh * 0.6);

    // Bright top edge
    g.lineStyle(1.5, 0x6a9aaa, 0.4);
    g.lineBetween(sx - sw/2 + 1, sy - sh/2 + 1, sx + sw/2 - 1, sy - sh/2 + 1);

    // Crossed swords (two diagonal lines)
    const sl = 52;
    g.lineStyle(3, 0xd4c090, 0.9);
    g.lineBetween(sx - sl*0.38, sy - sl*0.32, sx + sl*0.38, sy + sl*0.32);
    g.lineBetween(sx + sl*0.38, sy - sl*0.32, sx - sl*0.38, sy + sl*0.32);

    // Cross-guards
    g.lineStyle(3.5, 0xc08030, 0.9);
    g.lineBetween(sx - sl*0.14, sy - sl*0.06, sx + sl*0.14, sy - sl*0.06);
    g.lineBetween(sx - sl*0.14, sy + sl*0.06, sx + sl*0.14, sy + sl*0.06);

    // Pommel dots
    g.fillStyle(0xffd866, 0.9);
    g.fillCircle(sx - sl*0.38 - 4, sy - sl*0.32 - 4, 3.5);
    g.fillCircle(sx + sl*0.38 + 4, sy - sl*0.32 - 4, 3.5);

    // Tagline
    this._label(icx, iy + ih - 6, 'Build your legend', {
      size: '13px', color: THEME.text.gold, oy: 1,
    });
  }

  // ============================================================
  // Illustration: Page 1 — Movement (mini terrain map)
  // ============================================================
  _illMovement(ix, iy, iw, ih, icx, icy) {
    const g  = this._illGfx;
    const ts = 20;   // tile size in pixels
    const cols = 8, rows = 6;
    const gw  = cols * ts, gh = rows * ts;
    const gx  = icx - gw / 2;
    const gy  = iy + 8;

    // Terrain color grid
    const T = [
      [0x2a5a9a, 0x2a5a9a, 0x4a8a3a, 0x4a8a3a, 0x4a8a3a, 0x2a6a2a, 0x2a6a2a, 0x6a6a6a],
      [0x2a5a9a, 0xd4c07a, 0xd4c07a, 0x4a8a3a, 0x2a6a2a, 0x2a6a2a, 0x6a6a6a, 0x6a6a6a],
      [0xd4c07a, 0xd4c07a, 0x4a8a3a, 0x8a7a4a, 0x8a7a4a, 0x2a6a2a, 0x6a6a6a, 0x6a6a6a],
      [0xd4c07a, 0x4a8a3a, 0x4a8a3a, 0x8a7a4a, 0x4a8a3a, 0x4a8a3a, 0x2a6a2a, 0x6a6a6a],
      [0x4a8a3a, 0x4a8a3a, 0x4a8a3a, 0x4a8a3a, 0x4a8a3a, 0x4a8a3a, 0x2a6a2a, 0x2a6a2a],
      [0x4a8a3a, 0x4a8a3a, 0xd4c07a, 0xd4c07a, 0x4a8a3a, 0x4a8a3a, 0x4a8a3a, 0x4a8a3a],
    ];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        g.fillStyle(T[r][c], 1);
        g.fillRect(gx + c*ts, gy + r*ts, ts, ts);
      }
    }

    // Light grid lines
    g.lineStyle(0.5, 0x000000, 0.25);
    for (let r = 0; r <= rows; r++) g.lineBetween(gx, gy+r*ts, gx+gw, gy+r*ts);
    for (let c = 0; c <= cols; c++) g.lineBetween(gx+c*ts, gy, gx+c*ts, gy+gh);

    // Map border
    g.lineStyle(1.5, THEME.panel.border, 0.8);
    g.strokeRect(gx, gy, gw, gh);

    // Player dot (white circle) at col 1.5, row 4.5
    const px = gx + 1.5 * ts;
    const py = gy + 4.5 * ts;
    g.fillStyle(0xffffff, 1);
    g.fillCircle(px, py, 5);
    g.lineStyle(1.5, 0x000000, 0.7);
    g.strokeCircle(px, py, 5);

    // Destination (gold X) at col 6.5, row 1
    const dx = gx + 6.5 * ts;
    const dy = gy + 1.0 * ts;
    g.lineStyle(2.5, 0xf0c860, 0.9);
    g.lineBetween(dx-5, dy-5, dx+5, dy+5);
    g.lineBetween(dx+5, dy-5, dx-5, dy+5);

    // Dotted path segments
    g.lineStyle(1.5, 0xf0c860, 0.55);
    const pathPts = [
      [px, py],
      [gx+2.5*ts, gy+3.5*ts],
      [gx+3.5*ts, gy+2.5*ts],
      [gx+4.5*ts, gy+1.5*ts],
      [dx, dy],
    ];
    for (let i = 1; i < pathPts.length; i++) {
      g.lineBetween(pathPts[i-1][0], pathPts[i-1][1], pathPts[i][0], pathPts[i][1]);
    }

    // Mini labels
    this._label(px - 12, py, 'you', { size: '9px', color: '#ffffff', ox: 1 });
    this._label(dx + 12, dy, 'click', { size: '9px', color: THEME.text.gold, ox: 0 });

    // Terrain legend
    const legendData = [
      { color: 0x2a5a9a, name: 'Water' },
      { color: 0xd4c07a, name: 'Sand'  },
      { color: 0x4a8a3a, name: 'Grass' },
      { color: 0x2a6a2a, name: 'Forest'},
      { color: 0x8a7a4a, name: 'Hills' },
      { color: 0x6a6a6a, name: 'Mtns'  },
    ];
    const ly    = gy + gh + 14;
    const step  = iw / legendData.length;
    legendData.forEach((item, i) => {
      const lx = ix + i * step + step/2 - 5;
      g.fillStyle(item.color, 1);
      g.fillRect(lx, ly, 10, 10);
      g.lineStyle(1, 0x000000, 0.4);
      g.strokeRect(lx, ly, 10, 10);
      this._label(lx + 5, ly + 16, item.name, { size: '9px', oy: 0 });
    });
  }

  // ============================================================
  // Illustration: Page 2 — Factions (coloured badges)
  // ============================================================
  _illFactions(ix, iy, iw, ih, icx, icy) {
    const g = this._illGfx;

    const factions = [
      { name: 'Varric League',    color: 0x4488ff, sym: 'V', tag: '(you)' },
      { name: 'Arden Clans',     color: 0x44cc44, sym: 'A', tag: '' },
      { name: 'Skeldir Holds',   color: 0x88ccff, sym: 'S', tag: '' },
      { name: 'Auric Empire',    color: 0xcc3333, sym: 'E', tag: 'aggressive' },
      { name: 'Qaratai Khanate', color: 0xddaa22, sym: 'Q', tag: '' },
      { name: 'Zahir Sultanate', color: 0xcc7722, sym: 'Z', tag: '' },
    ];

    const cols = 2, bw = 142, bh = 46;
    const gapX = (iw - cols * bw) / (cols + 1);
    const gapY = (ih - 3 * bh)   / 4;

    factions.forEach((f, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const bx  = ix + gapX + col * (bw + gapX);
      const by  = iy + gapY + row * (bh + gapY);

      // Shadow
      g.fillStyle(0x000000, 0.3);
      g.fillRoundedRect(bx+2, by+2, bw, bh, 5);

      // Badge fill
      g.fillStyle(f.color, 0.15);
      g.fillRoundedRect(bx, by, bw, bh, 5);
      g.lineStyle(1.5, f.color, 0.7);
      g.strokeRoundedRect(bx, by, bw, bh, 5);

      // Colour circle
      g.fillStyle(f.color, 0.9);
      g.fillCircle(bx + 20, by + bh/2, 11);
      g.lineStyle(1, 0x000000, 0.4);
      g.strokeCircle(bx + 20, by + bh/2, 11);

      // Symbol letter
      this._label(bx + 20, by + bh/2, f.sym, {
        size: '11px', color: '#000000', bold: true,
      });

      // Faction name
      this._label(bx + 38, by + bh/2 - (f.tag ? 7 : 0), f.name, {
        size: '10px', color: THEME.text.primary, ox: 0,
      });

      // Sub-tag
      if (f.tag) {
        const tagColor = f.sym === 'V' ? THEME.text.gold : THEME.text.muted;
        this._label(bx + 38, by + bh/2 + 7, f.tag, {
          size: '9px', color: tagColor, ox: 0,
        });
      }
    });
  }

  // ============================================================
  // Illustration: Page 3 — Warband (3-column tier ladders)
  // ============================================================
  _illWarband(ix, iy, iw, ih, icx, icy) {
    const g = this._illGfx;

    const branches = [
      {
        label: 'INFANTRY', color: 0x6688cc,
        tiers: ['Villager', 'Militia', 'Footman', 'Man-at-Arms'],
      },
      {
        label: 'CAVALRY',  color: 0xcc8833,
        tiers: ['Villager', 'Scout Cav.', 'Lt. Cavalry', 'Knight'],
      },
      {
        label: 'ARCHERS',  color: 0x44aa66,
        tiers: ['Villager', 'Archer', 'Trained', 'Longbowman'],
      },
    ];

    const colW   = iw / 3;
    const boxW   = colW - 16;
    const boxH   = 24;
    const arrowH = 14;
    const totalH = 4 * boxH + 3 * arrowH + 20; // tiers + arrows + header
    const startY = icy - totalH / 2 + 14;

    branches.forEach((br, bi) => {
      const cx2  = ix + bi * colW + colW / 2;
      const hexC = '#' + br.color.toString(16).padStart(6, '0');

      // Column header
      this._label(cx2, startY - 2, br.label, {
        size: '10px', color: hexC, bold: true, oy: 1,
      });

      br.tiers.forEach((tier, ti) => {
        const ty    = startY + ti * (boxH + arrowH);
        const alpha = 0.15 + ti * 0.2;

        // Box
        g.fillStyle(br.color, alpha);
        g.fillRoundedRect(cx2 - boxW/2, ty, boxW, boxH, 3);
        g.lineStyle(1.2, br.color, 0.45 + ti * 0.18);
        g.strokeRoundedRect(cx2 - boxW/2, ty, boxW, boxH, 3);

        this._label(cx2, ty + boxH/2, tier, {
          size: '10px', color: THEME.text.primary,
        });

        // Downward arrow to next tier
        if (ti < br.tiers.length - 1) {
          const ay = ty + boxH + 2;
          g.fillStyle(br.color, 0.6);
          g.fillTriangle(cx2 - 4, ay, cx2 + 4, ay, cx2, ay + arrowH - 2);
        }
      });
    });

    this._label(icx, iy + ih - 4, 'Upgrade with XP + gold  ·  Press P', {
      size: '9px', color: THEME.text.muted, oy: 1,
    });
  }

  // ============================================================
  // Illustration: Page 4 — Combat (triangle diagram)
  // ============================================================
  _illCombat(ix, iy, iw, ih, icx, icy) {
    const g = this._illGfx;

    const r     = Math.min(iw, ih) * 0.30;
    const angle = -Math.PI / 2; // top = Infantry

    const nodes = [
      { label: 'INFANTRY', color: 0x6688cc, icon: ['|', '/\\'] },
      { label: 'CAVALRY',  color: 0xcc8833, icon: ['^^']       },
      { label: 'ARCHERS',  color: 0x44aa66, icon: ['>--']      },
    ].map((n, i) => ({
      ...n,
      x: icx + r * Math.cos(angle + i * (2*Math.PI/3)),
      y: icy + r * Math.sin(angle + i * (2*Math.PI/3)),
    }));

    // "beats" edges (from → to, offset to one side)
    const edges = [[0,1], [1,2], [2,0]];
    edges.forEach(([fi, ti]) => {
      const a   = nodes[fi];
      const b   = nodes[ti];
      const dx  = b.x - a.x, dy  = b.y - a.y;
      const len = Math.hypot(dx, dy);
      const nx  = -dy/len, ny = dx/len;
      const off = 10;
      const nodeR = 28;
      // Start/end pulled to circle edge
      const ax  = a.x + dx/len * nodeR + nx*off;
      const ay  = a.y + dy/len * nodeR + ny*off;
      const bx2 = b.x - dx/len * nodeR + nx*off;
      const by2 = b.y - dy/len * nodeR + ny*off;

      g.lineStyle(2, a.color, 0.8);
      g.lineBetween(ax, ay, bx2, by2);

      // Arrow head at destination
      const adx = bx2 - ax, ady = by2 - ay;
      const al  = Math.hypot(adx, ady);
      const hx  = bx2 - (adx/al)*10, hy = by2 - (ady/al)*10;
      const hnx = -ady/al, hny = adx/al;
      g.fillStyle(a.color, 0.8);
      g.fillTriangle(bx2, by2, hx+hnx*5, hy+hny*5, hx-hnx*5, hy-hny*5);

      // "beats" label
      const mx = (ax+bx2)/2 + nx*10;
      const my = (ay+by2)/2 + ny*10;
      this._label(mx, my, 'beats', { size: '9px', color: '#a0a0a0' });
    });

    // Node circles
    nodes.forEach(n => {
      // Glow
      g.fillStyle(n.color, 0.1);
      g.fillCircle(n.x, n.y, 34);

      // Shadow + fill
      g.fillStyle(0x000000, 0.35);
      g.fillCircle(n.x+2, n.y+2, 28);
      g.fillStyle(n.color, 0.22);
      g.fillCircle(n.x, n.y, 28);
      g.lineStyle(2, n.color, 0.9);
      g.strokeCircle(n.x, n.y, 28);

      const hexC = '#' + n.color.toString(16).padStart(6, '0');
      this._label(n.x, n.y, n.label, { size: '9px', color: hexC, bold: true });
    });

    this._label(icx, iy + ih - 4, 'Villagers are neutral — no bonus/penalty', {
      size: '9px', color: THEME.text.muted, oy: 1,
    });
  }

  // ============================================================
  // Illustration: Page 5 — Trade (settlements + goods icons)
  // ============================================================
  _illTrade(ix, iy, iw, ih, icx, icy) {
    const g = this._illGfx;

    // ── Settlement icons (top row) ────────────────────────────
    const settTop  = iy + 20;
    const settGap  = iw / 3;
    const setts = [
      { label: 'Village', draw: (x,y) => this._iconVillage(g,x,y,0x4488ff) },
      { label: 'Town',    draw: (x,y) => this._iconTown(g,x,y,0x4488ff)    },
      { label: 'Castle',  draw: (x,y) => this._iconCastle(g,x,y,0x4488ff)  },
    ];
    setts.forEach((s, i) => {
      const sx = ix + settGap * i + settGap/2;
      s.draw(sx, settTop + 22);
      this._label(sx, settTop + 46, s.label, { size: '10px', color: THEME.text.muted });
    });

    // Divider
    const divY = settTop + 60;
    g.lineStyle(1, THEME.panel.border, 0.3);
    g.lineBetween(ix, divY, ix+iw, divY);

    // ── Goods icons (bottom area) ─────────────────────────────
    this._label(icx, divY + 10, 'Tradeable Goods', {
      size: '10px', color: THEME.text.gold, oy: 0,
    });

    const goods = [
      { name: 'Grain', color: 0xe8d060, fn: '_iconGrain' },
      { name: 'Iron',  color: 0x9090a0, fn: '_iconIron'  },
      { name: 'Cloth', color: 0xcc6688, fn: '_iconCloth' },
      { name: 'Fish',  color: 0x4488cc, fn: '_iconFish'  },
    ];
    const gTop = divY + 28;
    const gGap = iw / goods.length;

    goods.forEach((good, i) => {
      const gx = ix + gGap * i + gGap/2;
      const gy = gTop + 20;

      // Backing disc
      g.fillStyle(good.color, 0.13);
      g.fillCircle(gx, gy, 22);
      g.lineStyle(1.5, good.color, 0.45);
      g.strokeCircle(gx, gy, 22);

      this[good.fn](g, gx, gy);
      this._label(gx, gy + 28, good.name, { size: '10px', color: THEME.text.muted });
    });
  }

  // ── Settlement mini-icons ─────────────────────────────────

  _iconVillage(g, x, y, fc) {
    g.fillStyle(0xb8a070, 0.9);
    g.fillRect(x-9, y-9, 18, 18);
    g.lineStyle(1.5, fc, 0.65);
    g.strokeRect(x-9, y-9, 18, 18);
  }

  _iconTown(g, x, y, fc) {
    g.fillStyle(0xd4c090, 0.9);
    g.fillRect(x-13, y-8, 26, 20);
    g.fillStyle(0xb89a60, 0.9);
    g.fillRect(x-13, y-15, 7, 7);
    g.fillRect(x-4,  y-15, 7, 7);
    g.fillRect(x+6,  y-15, 7, 7);
    g.lineStyle(2, fc, 0.9);
    g.strokeRect(x-13, y-8, 26, 20);
    g.fillStyle(0x1a1208, 1);
    g.fillRect(x-3, y+3, 6, 9);
  }

  _iconCastle(g, x, y, fc) {
    g.fillStyle(0x9a8060, 0.9);
    g.fillRect(x-11, y-11, 22, 22);
    g.fillStyle(0x7a6040, 0.9);
    g.fillRect(x-18, y-18, 11, 11);
    g.fillRect(x+7,  y-18, 11, 11);
    g.fillRect(x-18, y+7,  11, 11);
    g.fillRect(x+7,  y+7,  11, 11);
    g.lineStyle(1.5, fc, 0.8);
    g.strokeRect(x-11, y-11, 22, 22);
    g.fillStyle(0x1a1208, 1);
    g.fillRect(x-3, y+4, 6, 7);
  }

  // ── Goods mini-icons ─────────────────────────────────────

  _iconGrain(g, x, y) {
    // Wheat stalk + grain heads
    g.lineStyle(2, 0xe8d060, 0.9);
    g.lineBetween(x, y+13, x, y-6);
    g.fillStyle(0xe8d060, 0.9);
    [[-5,0],[0,-3],[5,0],[0,3]].forEach(([dx,dy]) => {
      g.fillEllipse(x+dx, y+dy-4, 6, 11);
    });
  }

  _iconIron(g, x, y) {
    // Iron ingot (rect with shine)
    g.fillStyle(0x9090a0, 0.9);
    g.fillRect(x-12, y-6, 24, 12);
    g.lineStyle(1.5, 0xb0b0c0, 0.7);
    g.strokeRect(x-12, y-6, 24, 12);
    g.lineStyle(1.5, 0xd8d8e8, 0.5);
    g.lineBetween(x-10, y-3, x+4, y-3);
  }

  _iconCloth(g, x, y) {
    // Rolled bolt of cloth (ellipse + folds)
    g.fillStyle(0xcc6688, 0.9);
    g.fillEllipse(x, y, 26, 16);
    g.lineStyle(1.5, 0xff88aa, 0.65);
    g.strokeEllipse(x, y, 26, 16);
    g.lineStyle(1, 0xff88aa, 0.3);
    [-5, 0, 5].forEach(dy => g.lineBetween(x-11, y+dy, x+11, y+dy));
  }

  _iconFish(g, x, y) {
    // Simple fish silhouette
    g.fillStyle(0x4488cc, 0.9);
    g.fillEllipse(x-2, y, 20, 12);
    g.fillTriangle(x+8, y, x+17, y-7, x+17, y+7);
    g.fillStyle(0x000000, 0.7);
    g.fillCircle(x-7, y-2, 2);   // eye
  }

  // ============================================================
  // Illustration: Page 6 — HUD mockup + keyboard keys
  // ============================================================
  _illHUD(ix, iy, iw, ih, icx, icy) {
    const g = this._illGfx;

    // ── Mini HUD bar ─────────────────────────────────────────
    const bw = iw - 8, bh = 28;
    const bx = ix + 4, by = iy + 8;

    g.fillStyle(THEME.hud.fill, THEME.hud.fillAlpha);
    g.fillRect(bx, by, bw, bh);
    g.lineStyle(1, THEME.panel.border, 0.55);
    g.strokeRect(bx, by, bw, bh);
    g.lineStyle(1, THEME.panel.border, 0.4);
    g.lineBetween(bx, by + bh, bx + bw, by + bh);

    const hudSegs = [
      { txt: 'Day 1',     color: THEME.text.muted   },
      { txt: '2000 gold', color: THEME.text.gold     },
      { txt: '13 troops', color: THEME.text.primary  },
      { txt: 'Renown: 0', color: '#ffaa44'           },
    ];
    hudSegs.forEach((s, i) => {
      this._label(bx + 14 + i * (bw/4), by + bh/2, s.txt, {
        size: '10px', color: s.color, ox: 0,
      });
    });

    // Party / Inventory button mockups
    ['Party', 'Inventory'].forEach((lbl, i) => {
      const bxb = bx + bw - 56 - i * 60 - 8;
      const byb = by + 5;
      const btnW = 54, btnH = 18;
      g.fillStyle(THEME.panel.fill, 0.9);
      g.fillRoundedRect(bxb, byb, btnW, btnH, 3);
      g.lineStyle(1, THEME.panel.border, 0.65);
      g.strokeRoundedRect(bxb, byb, btnW, btnH, 3);
      this._label(bxb + btnW/2, byb + btnH/2, lbl, {
        size: '10px', color: THEME.text.gold,
      });
    });

    // ── Keyboard key grid ─────────────────────────────────────
    const keys = [
      { key: 'SPACE', desc: 'pause'   },
      { key: 'P',     desc: 'party'   },
      { key: 'I',     desc: 'inv.'    },
      { key: 'ESC',   desc: 'close'   },
      { key: '1/2/3', desc: 'speed'   },
      { key: 'Scroll',desc: 'zoom'    },
    ];

    const kTop  = by + bh + 18;
    const kCols = 3;
    const kw    = (iw - 8) / kCols;
    const kh    = 44;

    this._label(icx, kTop - 6, 'Keyboard Shortcuts', {
      size: '10px', color: THEME.text.gold, oy: 1,
    });

    keys.forEach(({ key, desc }, i) => {
      const col  = i % kCols;
      const row  = Math.floor(i / kCols);
      const kx   = ix + 4 + col * kw;
      const ky   = kTop + row * kh;
      const capW = kw - 10, capH = 22;

      // Key cap (3D look)
      g.fillStyle(0x1a2030, 0.9);
      g.fillRoundedRect(kx, ky, capW, capH, 3);
      g.lineStyle(1.5, 0x4a6a8a, 0.75);
      g.strokeRoundedRect(kx, ky, capW, capH, 3);
      // bottom shadow edge for depth
      g.lineStyle(2, 0x000000, 0.45);
      g.lineBetween(kx+2, ky+capH+1, kx+capW-2, ky+capH+1);
      // top shine
      g.lineStyle(1, 0x6a9aaa, 0.2);
      g.lineBetween(kx+3, ky+2, kx+capW-3, ky+2);

      this._label(kx + capW/2, ky + capH/2, key, {
        size: '10px', color: THEME.text.primary,
      });
      this._label(kx + capW/2, ky + capH + 10, desc, {
        size: '9px', color: THEME.text.muted,
      });
    });

    // Minimap note
    this._label(icx, iy + ih - 2, 'Minimap: coloured dots = factions  |  white = you', {
      size: '9px', color: THEME.text.muted, oy: 1,
    });
  }
}
