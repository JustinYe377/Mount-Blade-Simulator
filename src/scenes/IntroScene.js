// ============================================================
// IntroScene.js — New-player tutorial / intro screen
// Displayed before WorldScene on first launch.
// Depends on: config.js, Panel.js
// ============================================================

class IntroScene extends Phaser.Scene {
  constructor() { super('IntroScene'); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ── Pages ────────────────────────────────────────────────
    this._pages = [
      {
        title: 'Welcome to Warbands',
        body: [
          'Warbands is a 2D sandbox strategy game inspired by Mount & Blade.',
          '',
          'You are a wandering mercenary captain on a procedurally-generated',
          'medieval continent ruled by six rival factions — each at war with',
          'at least one of its neighbours.',
          '',
          'YOUR GOAL',
          '  Build a powerful warband, accumulate Renown through battle,',
          '  grow wealthy through trade, and carve your legend into history.',
          '',
          'There is no fixed end — play as aggressively or as diplomatically',
          'as you like. The world keeps moving whether you do or not.',
        ],
      },
      {
        title: 'Moving Around the World',
        body: [
          'LEFT-CLICK anywhere on the map to set a destination.',
          'Your party automatically pathfinds around impassable terrain',
          '(deep water, mountains).',
          '',
          'SCROLL WHEEL — zoom in / out',
          'SPACE         — pause / unpause time',
          '1 / 2 / 3     — set game speed (×1 / ×2 / ×4)',
          '',
          'TERRAIN COSTS',
          '  Grassland  fastest',
          '  Sand / Hills    slower',
          '  Forest          slow',
          '  Dense Forest    very slow',
          '  Mountains / Water  impassable',
          '',
          'Entering a settlement\'s safe zone pauses enemy pursuit and',
          'gives access to town menus.',
        ],
      },
      {
        title: 'Factions & the World',
        body: [
          'Six major factions contest the map:',
          '',
          '  Varric League    (blue)   — your starting faction',
          '  Arden Clans      (green)',
          '  Skeldir Holds    (ice blue)',
          '  Auric Empire     (red)    — aggressive expansionist',
          '  Qaratai Khanate  (gold)',
          '  Zahir Sultanate  (amber)',
          '',
          'Each faction has Lords that patrol, recruit, and attack enemies.',
          'Caravans shuttle goods between towns; Villagers travel to markets.',
          'Bandits roam freely and prey on weaker parties.',
          '',
          'You start aligned with Varric League but can fight anyone who',
          'declares war on you.',
        ],
      },
      {
        title: 'Building Your Warband',
        body: [
          'Your party starts with Villagers and Militia.',
          'Visit towns and villages to recruit more troops.',
          '',
          'TROOP TIERS',
          '  Villager → Militia → Footman → Man-at-Arms    (Infantry)',
          '  Villager → Scout Cavalry → Light Cavalry → Knight  (Cavalry)',
          '  Villager → Archer → Trained Archer → Longbowman  (Archer)',
          '',
          'Troops gain XP in battle and can be upgraded for gold.',
          'Higher-tier troops cost more in daily wages — keep an eye',
          'on your gold income or your party will shrink.',
          '',
          'Press P to open the Party panel and manage your troops.',
        ],
      },
      {
        title: 'Combat',
        body: [
          'Click on an enemy party to initiate combat.',
          'Battles are resolved automatically using unit power + a',
          'rock-paper-scissors combat triangle:',
          '',
          '  Infantry  beats  Cavalry',
          '  Cavalry   beats  Archers',
          '  Archers   beat   Infantry',
          '',
          'A well-balanced force adapts to whatever the enemy brings.',
          'Your Tactics skill reduces casualties on your side.',
          'Your Leadership skill increases party size cap.',
          '',
          'After battle you gain Renown and XP. Your troops also gain XP',
          'and may be eligible for upgrade (check the Party panel).',
          '',
          'Avoid suicidal odds — retreat by moving away from the enemy.',
        ],
      },
      {
        title: 'Trade & Economy',
        body: [
          'Towns buy and sell four goods:  Grain · Iron · Cloth · Fish',
          '',
          'Buy low in towns that produce a surplus, sell high where',
          'demand is strong. Prices shift with supply and time.',
          '',
          'Press I to open the Inventory panel and view your cargo.',
          '',
          'SETTLEMENTS',
          '  Towns    — trading hubs, recruit troops, access market',
          '  Castles  — military strongholds, garrison lords',
          '  Villages — produce raw goods, supply nearby towns',
          '',
          'Staying in a settlement (click "Stay") passes time quickly',
          'and recovers wounded troops — but wages keep ticking.',
          '',
          'Keep 500–1000 gold in reserve to avoid running dry on payday.',
        ],
      },
      {
        title: 'HUD & Keyboard Shortcuts',
        body: [
          'TOP BAR',
          '  Day counter · Gold · Troops · Renown',
          '  Party / Inventory buttons',
          '  Pause indicator',
          '',
          'KEYBOARD',
          '  SPACE    pause / resume',
          '  P        Party panel',
          '  I        Inventory panel',
          '  ESC      close open panel',
          '  1        normal speed',
          '  2        ×2 speed',
          '  3        ×4 speed',
          '',
          'MINIMAP  (top-right corner)',
          '  Coloured dots = NPC parties by faction',
          '  White dot = you',
          '  Click minimap area to quickly pan the camera.',
          '',
          'Good luck, captain.  The world is waiting.',
        ],
      },
    ];

    this._page = 0;

    // ── Background ───────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a0f, 1);
    bg.fillRect(0, 0, W, H);

    // Subtle vignette
    const vig = this.add.graphics();
    vig.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.7, 0.7, 0, 0);
    vig.fillRect(0, 0, W, H);

    // ── Panel ────────────────────────────────────────────────
    const PW = Math.min(680, W - 40);
    const PH = Math.min(520, H - 80);
    const cx = W / 2;
    const cy = H / 2;

    this._panelGfx = drawPanelBg(this, cx, cy, PW, PH);

    // ── Title ────────────────────────────────────────────────
    this._titleText = this.add.text(cx, cy - PH/2 + 18, '', {
      fontSize:        '20px',
      fontFamily:      THEME.font.ui,
      color:           THEME.text.gold,
      fontStyle:       'bold',
      stroke:          '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(302);

    // ── Body ─────────────────────────────────────────────────
    this._bodyText = this.add.text(cx - PW/2 + 24, cy - PH/2 + 52, '', {
      fontSize:        '13px',
      fontFamily:      THEME.font.ui,
      color:           THEME.text.primary,
      lineSpacing:     6,
      wordWrap:        { width: PW - 48 },
    }).setScrollFactor(0).setDepth(302);

    // ── Page indicator ───────────────────────────────────────
    this._pageLabel = this.add.text(cx, cy + PH/2 - 44, '', {
      fontSize:  THEME.font.sm,
      fontFamily: THEME.font.ui,
      color:      THEME.text.muted,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(302);

    // ── Navigation buttons ───────────────────────────────────
    const btnY = cy + PH/2 - 20;

    this._backBtn = createStyledButton(this, cx - PW/2 + 14, btnY, '< Back', () => {
      if (this._page > 0) { this._page--; this._render(); }
    }, { depth: 302, padX: 14, padY: 6 });
    this._backBtn.setOrigin(0, 0.5);

    this._nextBtn = createStyledButton(this, cx + PW/2 - 14, btnY, 'Next >', () => {
      if (this._page < this._pages.length - 1) { this._page++; this._render(); }
    }, { depth: 302, padX: 14, padY: 6 });
    this._nextBtn.setOrigin(1, 0.5);

    this._startBtn = createStyledButton(this, cx, btnY, 'Begin Your Adventure', () => {
      this.scene.start('WorldScene');
    }, { depth: 302, padX: 20, padY: 6 });
    this._startBtn.setOrigin(0.5, 0.5);

    // Keyboard navigation
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

  _render() {
    const page = this._pages[this._page];
    const last = this._page === this._pages.length - 1;

    this._titleText.setText(page.title);
    this._bodyText.setText(page.body.join('\n'));
    this._pageLabel.setText(`${this._page + 1} / ${this._pages.length}  ·  ← → or buttons to navigate`);

    this._backBtn.setVisible(this._page > 0);
    this._nextBtn.setVisible(!last);
    this._startBtn.setVisible(last);
  }
}
