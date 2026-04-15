// ============================================================
// WorldScene.js — Main Phaser scene
// Depends on: config.js, Noise.js, MinHeap.js, helpers.js,
//             AStar.js, Roads.js, Player.js, Panel.js
// ============================================================

// ---- Troop composition helpers ----

/** Make a troop entry */
function tr(id, count) { return { id, count }; }

/**
 * Build a Lord's party: mixed infantry/cavalry/archer, upper tiers.
 * faction param reserved for per-faction flavour later.
 */
function lordTroops() {
  return [
    tr(1, randInt(8,14)),   // Militia
    tr(2, randInt(4,8)),    // Footman
    tr(3, randInt(1,4)),    // Man-at-Arms
    tr(4, randInt(3,7)),    // Scout Cavalry
    tr(5, randInt(1,4)),    // Light Cavalry
    tr(6, randInt(0,2)),    // Knight
    tr(7, randInt(3,7)),    // Archer
    tr(8, randInt(1,3)),    // Trained Archer
  ].filter(t => t.count > 0);
}

/** Bandits: infantry only (militia + footman) */
function banditTroops() {
  return [
    tr(1, randInt(5,16)),   // Militia
    tr(2, randInt(0,5)),    // Footman
  ].filter(t => t.count > 0);
}

/** Villager party (wandering villagers from a village) */
function villagerTroops() {
  return [ tr(0, randInt(4,10)) ];
}

/** Caravan: mixed low-tier escort */
function caravanTroops() {
  return [
    tr(0, randInt(2,5)),    // Villagers (labourers)
    tr(1, randInt(2,6)),    // Militia guards
    tr(7, randInt(1,3)),    // Archer guards
  ].filter(t => t.count > 0);
}

// ---- Tooltip helpers ----

/**
 * Build the display name shown under a party sprite.
 * - lord   → "[FactionBanner] Lord <name>'s Military"
 * - villager → "Village <name>'s Villagers"
 * - bandit   → "Bandits"
 * - caravan  → "[FactionBanner] <faction> Caravan"
 */
function npcLabel(npc) {
  const total = npc.troops.reduce((s,t) => s+t.count, 0);
  switch (npc.type) {
    case 'lord':     return [`${npc.faction} Lord ${npc.originName}'s Military`, total];
    case 'villager': return [`Village ${npc.originName}'s Villagers`,            total];
    case 'bandit':   return ['Bandits',                                           total];
    case 'caravan':  return [`${npc.faction} Caravan`,                           total];
    default:         return [npc.name,                                            total];
  }
}

/**
 * Build tooltip lines shown on hover.
 * Shows faction, unit kinds (Infantry/Cavalry/Archer/Villager), speed, power.
 * Does NOT expose individual tier names.
 */
function npcTooltipLines(npc) {
  const inf  = countKind(npc.troops, 'infantry');
  const cav  = countKind(npc.troops, 'cavalry');
  const arc  = countKind(npc.troops, 'archer');
  const vil  = countKind(npc.troops, 'villager');
  const spd  = calcSpeed(npc.troops, npc.baseSpeed);
  const pow  = calcPower(npc);
  const lines = [];
  lines.push(`Faction: ${npc.faction}`);
  if (inf)  lines.push(`Infantry:  ${inf}`);
  if (cav)  lines.push(`Cavalry:   ${cav}`);
  if (arc)  lines.push(`Archers:   ${arc}`);
  if (vil)  lines.push(`Villagers: ${vil}`);
  lines.push(`Power: ${pow}   Speed: ${spd}`);
  return lines;
}

// ============================================================
class WorldScene extends Phaser.Scene {
  constructor() { super('WorldScene'); }

  create() {
    this.paused       = true;
    this.dayTimer     = 0;
    this.day          = 1;
    this.battleLog    = '';
    this.logTimer     = 0;
    this.activePanel  = null;
    this.gameSpeed    = 1;

    // Settlement safe zone state
    this.playerInside     = false;
    this.playerInsideSett = null;
    this.stayMode         = false;

    // Terrain + settlements
    this.terrainGrid = new Uint8Array(GRID_W * GRID_H);
    this.costGrid    = new Float32Array(GRID_W * GRID_H);
    this.generateTerrain();
    this.loadSettlements();
    this.ensureSettlementsPassable();
    this.renderTerrain();
    this.renderTerrainOverlays();
    this.drawSettlements();
    this.drawFactionTerritories();

    // Pathfinder
    this.pathfinder = new AStar(this.costGrid, GRID_W, GRID_H);

    // Player sprite — start at Highcourt (Varric League capital)
    this.playerAuraGfx = this.add.graphics().setDepth(48);
    this.playerGfx     = this.add.graphics().setDepth(50);
    this._animT        = 0;
    const st = this.towns.find(t => t.id === 'highcourt') || this.towns[0];
    this.playerPos  = { x: st.x*TILE+TILE/2, y: st.y*TILE+TILE/2 };
    this.playerPath = [];
    this.playerPathIdx = 0;
    this.drawPlayer();

    // Camera
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.camTarget = { x: this.playerPos.x, y: this.playerPos.y };
    this.cameras.main.startFollow(this.camTarget, false, 0.08, 0.08);
    this.cameras.main.setZoom(0.7);

    // Path preview
    this.pathGfx = this.add.graphics().setDepth(40);

    // Hover tooltip (world-space, depth 60)
    this._tooltipObjs = [];
    this._hoveredNpc  = null;

    // Click to move
    this.input.on('pointerdown', (ptr) => {
      if (this.activePanel) return;
      if (this.playerInside) return;
      if (ptr.y < THEME.hud.height + 4) return;
      const wx = ptr.worldX, wy = ptr.worldY;
      const gx = clamp(Math.floor(wx/TILE), 0, GRID_W-1);
      const gy = clamp(Math.floor(wy/TILE), 0, GRID_H-1);
      if (this.costGrid[gy*GRID_W+gx] >= 999) return;
      const px = clamp(Math.floor(this.playerPos.x/TILE), 0, GRID_W-1);
      const py = clamp(Math.floor(this.playerPos.y/TILE), 0, GRID_H-1);
      const path = this.pathfinder.findPath(px, py, gx, gy);
      if (path && path.length > 1) {
        this.playerPath = path; this.playerPathIdx = 1;
        this.drawPathPreview(path);
      }
    });

    // NPCs
    this.npcs = [];

    // Spawn static Lords — distribute across towns/castles (tier≥1) by faction
    const factionTowns = {};
    this.towns.filter(t => t.tier >= 1).forEach(t => { (factionTowns[t.faction] = factionTowns[t.faction]||[]).push(t); });

    LORD_DEFS.forEach(lordDef => {
      const pool     = factionTowns[lordDef.faction] || this.towns.filter(t=>t.tier>=1);
      const homeTown = randPick(pool.length ? pool : this.towns);
      const npc      = this.spawnNPC(lordDef.name, lordDef.faction, homeTown.x, homeTown.y, 'lord',
                                     lordDef.troops.map(tr => ({...tr})), lordDef.name);
      npc.lordDef    = lordDef;
      npc.homeTown   = homeTown;       // preferred base
      npc.lordState  = 'patrol';       // 'patrol'|'recruit'|'defend'|'attack'
      npc.lordTarget = null;           // NPC or town object when defending/attacking
    });

    for (let i=0; i<8; i++) {
      let gx, gy;
      do { gx=randInt(5,GRID_W-5); gy=randInt(5,GRID_H-5); }
      while (this.costGrid[gy*GRID_W+gx] >= 999);
      this.spawnNPC('Bandits', 'Bandit', gx, gy, 'bandit', banditTroops(), 'Bandits');
    }

    // Caravans — one per type='town' settlement (not castles, not villages)
    this.towns.filter(t => t.type === 'town').forEach(homeTown => {
      const npc = this.spawnNPC(`${homeTown.faction} Caravan`, homeTown.faction,
                                homeTown.x, homeTown.y, 'caravan', caravanTroops(), homeTown.name);
      npc.homeTown = homeTown;
      npc.destTown = randPick(this.towns.filter(t => t !== homeTown && t.type === 'town'));
      npc.cargo    = this._caravanLoadCargo(homeTown);
    });

    // Villager parties — one per village, bound to their town
    this.towns.filter(t => t.type === 'village').forEach(village => {
      const npc = this.spawnNPC(`${village.name} Villagers`, village.faction,
                                village.x, village.y, 'villager', villagerTroops(), village.name);
      npc.homeTown   = village;
      npc.destTown   = village.boundTown;
      npc.delivering = true;           // true = heading to boundTown; false = returning home
      npc.cargo      = this._villagerLoadCargo(village);
    });

    // HUD
    this.createHUD();

    // Keyboard shortcuts
    this.input.keyboard.addKey('SPACE').on('down', ()=>this.togglePause());
    this.input.keyboard.addKey('P').on('down',     ()=>this.showPartyPanel());
    this.input.keyboard.addKey('I').on('down',     ()=>this.showInventoryPanel());
    this.input.keyboard.addKey('ESC').on('down',   ()=>this.onEscKey());
    this.input.keyboard.addKey('ONE').on('down',   ()=>this.gameSpeed=1);
    this.input.keyboard.addKey('TWO').on('down',   ()=>this.gameSpeed=2);
    this.input.keyboard.addKey('THREE').on('down', ()=>this.gameSpeed=4);

    this.input.on('wheel', (p,go,dx,dy) => {
      this.cameras.main.setZoom(clamp(this.cameras.main.zoom - dy*0.0003, 0.15, 2.5));
    });
  }

  // ---- Terrain generation ----
  generateTerrain() {
    const scale=0.018, forestScale=0.04;
    const moistScale=0.010, highlandScale=0.009;
    for (let y=0; y<GRID_H; y++) { for (let x=0; x<GRID_W; x++) {
      const idx = y*GRID_W+x;
      let elev = Noise.fbm(x*scale, y*scale, 5);
      elev = (elev+1)*0.5;
      const cx=x/GRID_W-0.5, cy=y/GRID_H-0.5;
      elev = elev*0.7 + (1-Math.sqrt(cx*cx+cy*cy)*2.2)*0.3;
      const highland = Noise.fbm(x*highlandScale+200, y*highlandScale+200, 2);
      elev = clamp(elev + highland*0.06, 0, 1);
      let terrain;
      if      (elev < 0.25) terrain = TERRAIN.DEEP_WATER;
      else if (elev < 0.32) terrain = TERRAIN.WATER;
      else if (elev < 0.36) terrain = TERRAIN.SAND;
      else if (elev < 0.65) {
        const f     = Noise.fbm(x*forestScale+100, y*forestScale+100, 3);
        const moist = Noise.fbm(x*moistScale+50,   y*moistScale+50,   2);
        const bias  = moist * 0.28;
        terrain = f>(0.25-bias) ? TERRAIN.DENSE_FOREST : f>(0.0-bias) ? TERRAIN.FOREST : TERRAIN.GRASS;
      }
      else if (elev < 0.75) terrain = TERRAIN.HILLS;
      else if (elev < 0.85) terrain = TERRAIN.MOUNTAIN;
      else                  terrain = TERRAIN.SNOW;
      this.terrainGrid[idx] = terrain.id;
      this.costGrid[idx]    = terrain.cost;
    }}

    // ── Biome overrides ──────────────────────────────────────
    // Grayspine Mountain ridge: x=87..105
    // Passes: Crown Pass y=72–88, Southgate Pass y=129–145
    for (let y=0; y<GRID_H; y++) {
      for (let x=87; x<=105; x++) {
        const idx = y*GRID_W+x;
        const inCrownPass     = y>=72  && y<=88;
        const inSouthgatePass = y>=129 && y<=145;
        if (inCrownPass || inSouthgatePass) {
          if (this.terrainGrid[idx]===TERRAIN.MOUNTAIN.id || this.terrainGrid[idx]===TERRAIN.SNOW.id ||
              this.terrainGrid[idx]<=TERRAIN.WATER.id) {
            this.terrainGrid[idx] = TERRAIN.HILLS.id;
            this.costGrid[idx]    = TERRAIN.HILLS.cost;
          }
        } else {
          this.terrainGrid[idx] = TERRAIN.MOUNTAIN.id;
          this.costGrid[idx]    = TERRAIN.MOUNTAIN.cost;
        }
      }
    }

    // SE desert zone: x>135, y>126 — replace water/mountains/forest with sand/grass
    for (let y=127; y<GRID_H; y++) {
      for (let x=135; x<GRID_W; x++) {
        const idx = y*GRID_W+x;
        const t = this.terrainGrid[idx];
        if (this.costGrid[idx]>=999 || t===TERRAIN.FOREST.id || t===TERRAIN.DENSE_FOREST.id || t===TERRAIN.SNOW.id) {
          this.terrainGrid[idx] = TERRAIN.SAND.id;
          this.costGrid[idx]    = TERRAIN.SAND.cost;
        } else if (t===TERRAIN.HILLS.id) {
          this.terrainGrid[idx] = TERRAIN.GRASS.id;
          this.costGrid[idx]    = TERRAIN.GRASS.cost;
        }
      }
    }

    // Northern cold highlands: y<30 — push snow thresholds lower
    for (let y=0; y<30; y++) {
      for (let x=0; x<GRID_W; x++) {
        const idx = y*GRID_W+x;
        const t = this.terrainGrid[idx];
        if (t===TERRAIN.HILLS.id || t===TERRAIN.GRASS.id) {
          const snowBias = (30-y)/30;
          if (Math.random() < snowBias*0.5) {
            this.terrainGrid[idx] = TERRAIN.SNOW.id;
            this.costGrid[idx]    = TERRAIN.SNOW.cost;
          }
        }
      }
    }
  }

  renderTerrain() {
    const rt = this.add.renderTexture(0, 0, MAP_W, MAP_H).setOrigin(0).setDepth(0);
    const g  = this.make.graphics({add:false});
    for (let y=0; y<GRID_H; y++) { for (let x=0; x<GRID_W; x++) {
      const t = TERRAIN_BY_ID[this.terrainGrid[y*GRID_W+x]];
      const v = Noise.noise2d(x*0.3, y*0.3)*0.05;
      let r  = ((t.color>>16)&0xff)/255+v;
      let gr = ((t.color>>8)&0xff)/255+v;
      let b  = (t.color&0xff)/255+v;
      r=clamp(r,0,1); gr=clamp(gr,0,1); b=clamp(b,0,1);
      g.fillStyle((Math.round(r*255)<<16)|(Math.round(gr*255)<<8)|Math.round(b*255));
      g.fillRect(x*TILE, y*TILE, TILE, TILE);
    }}
    rt.draw(g); g.destroy();
  }

  renderTerrainOverlays() {
    const rt = this.add.renderTexture(0, 0, MAP_W, MAP_H).setOrigin(0).setDepth(1);
    const g  = this.make.graphics({add:false});

    for (let y=1; y<GRID_H-1; y++) { for (let x=1; x<GRID_W-1; x++) {
      const tid = this.terrainGrid[y*GRID_W+x];
      if (tid <= TERRAIN.WATER.id) continue;
      let adj=0;
      if (this.terrainGrid[y*GRID_W+x-1]<=TERRAIN.WATER.id)   adj++;
      if (this.terrainGrid[y*GRID_W+x+1]<=TERRAIN.WATER.id)   adj++;
      if (this.terrainGrid[(y-1)*GRID_W+x]<=TERRAIN.WATER.id) adj++;
      if (this.terrainGrid[(y+1)*GRID_W+x]<=TERRAIN.WATER.id) adj++;
      if (adj>0) { g.fillStyle(0x000000,0.22+adj*0.05); g.fillRect(x*TILE,y*TILE,TILE,TILE); }
    }}
    for (let y=0; y<GRID_H; y+=2) { for (let x=0; x<GRID_W; x+=2) {
      const tid = this.terrainGrid[y*GRID_W+x];
      if (tid!==TERRAIN.FOREST.id && tid!==TERRAIN.DENSE_FOREST.id) continue;
      const alpha = tid===TERRAIN.DENSE_FOREST.id ? 0.32 : 0.20;
      g.fillStyle(0x002200, alpha);
      const ox=(x*7+y*3)%4, oy=(y*5+x*2)%4;
      g.fillCircle(x*TILE+ox+2, y*TILE+oy+2, 2.2);
    }}
    for (let y=1; y<GRID_H; y++) { for (let x=0; x<GRID_W; x++) {
      const tid = this.terrainGrid[y*GRID_W+x];
      if (tid!==TERRAIN.MOUNTAIN.id && tid!==TERRAIN.SNOW.id) continue;
      const above = this.terrainGrid[(y-1)*GRID_W+x];
      if (above!==TERRAIN.MOUNTAIN.id && above!==TERRAIN.SNOW.id) {
        g.fillStyle(0xffffff,0.14); g.fillRect(x*TILE, y*TILE, TILE, 2);
      }
    }}
    // Roads — draw static ROAD_CONNECTIONS pairs
    ROAD_CONNECTIONS.forEach(([idA, idB]) => {
      const a = SETTLEMENTS_BY_ID[idA];
      const b = SETTLEMENTS_BY_ID[idB];
      if (!a || !b) return;
      const path = roadAStar(this.terrainGrid, a.x, a.y, b.x, b.y);
      if (!path || path.length<2) return;
      const sparse = path.filter((_,i) => i%3===0 || i===path.length-1);
      const smooth = chaikinSmooth(sparse, 2);
      g.lineStyle(1.5, 0xc8a050, 0.30);
      g.beginPath();
      smooth.forEach((p,i) => {
        const px=p.x*TILE+TILE/2, py=p.y*TILE+TILE/2;
        if (i===0) g.moveTo(px,py); else g.lineTo(px,py);
      });
      g.strokePath();
    });
    rt.draw(g); g.destroy();
  }

  loadSettlements() {
    // Deep-copy settlement data so we don't mutate the static arrays
    this.towns = SETTLEMENTS_DATA.map(s => ({ ...s, goods: { ...s.goods } }));
    // Resolve boundTownId string → live object reference
    this.towns.forEach(s => {
      s.boundTown = s.boundTownId ? (this.towns.find(t => t.id === s.boundTownId) || null) : null;
    });
  }

  ensureSettlementsPassable() {
    // Force a 3×3 passable patch around each settlement so they are never on water/mountain
    this.towns.forEach(s => {
      for (let dy=-1; dy<=1; dy++) {
        for (let dx=-1; dx<=1; dx++) {
          const nx = clamp(s.x+dx, 0, GRID_W-1);
          const ny = clamp(s.y+dy, 0, GRID_H-1);
          const idx = ny*GRID_W+nx;
          if (this.costGrid[idx] >= 999) {
            this.terrainGrid[idx] = TERRAIN.GRASS.id;
            this.costGrid[idx]    = TERRAIN.GRASS.cost;
          }
        }
      }
    });
  }

  drawSettlements() {
    this.towns.forEach(t => {
      const px=t.x*TILE+TILE/2, py=t.y*TILE+TILE/2;
      const fc   = THEME.faction[t.faction] || 0x888888;
      const tier = t.tier || 0;
      const hover = this.add.graphics().setDepth(29);
      const g     = this.add.graphics().setDepth(30);

      if (tier===0) {
        // Village — modest square
        g.fillStyle(fc,0.06); g.fillCircle(px,py,28);
        g.fillStyle(fc,0.13); g.fillCircle(px,py,18);
        g.fillStyle(0xb8a070); g.fillRect(px-9,py-9,18,18);
        g.lineStyle(2,fc,0.65); g.strokeRect(px-9,py-9,18,18);
        this.add.text(px,py+13,t.name,{fontSize:THEME.font.xs,fontFamily:THEME.font.ui,color:THEME.text.muted,stroke:'#000',strokeThickness:2}).setOrigin(0.5,0).setDepth(31);
        const zone = this.add.zone(px,py,44,44).setInteractive({useHandCursor:true}).setDepth(55);
        zone.on('pointerover',()=>{ hover.clear(); hover.fillStyle(0xffffff,0.08); hover.fillCircle(px,py,22); hover.lineStyle(1.5,fc,0.65); hover.strokeCircle(px,py,22); });
        zone.on('pointerout', ()=>hover.clear());
        zone.on('pointerdown',(ptr)=>{ptr.event.stopPropagation();this.enterSettlement(t);});

      } else if (t.type === 'castle') {
        // Castle — keep with 4 prominent corner towers
        g.fillStyle(fc,0.06); g.fillCircle(px,py,50);
        g.fillStyle(fc,0.14); g.fillCircle(px,py,34);
        g.fillStyle(0x9a8060); g.fillRect(px-15,py-15,30,30);       // main keep
        g.fillStyle(0x7a6040);                                         // corner towers
        g.fillRect(px-22,py-22,13,13); g.fillRect(px+9,py-22,13,13);
        g.fillRect(px-22,py+9, 13,13); g.fillRect(px+9,py+9, 13,13);
        g.lineStyle(2,fc,0.9); g.strokeRect(px-15,py-15,30,30);
        g.lineStyle(1.5,fc,0.7);
        g.strokeRect(px-22,py-22,13,13); g.strokeRect(px+9,py-22,13,13);
        g.strokeRect(px-22,py+9, 13,13); g.strokeRect(px+9,py+9, 13,13);
        g.fillStyle(0x1a1208); g.fillRect(px-4,py+4,8,11);          // gate arch
        this.add.text(px,py+26,t.name,{fontSize:THEME.font.xs,fontFamily:THEME.font.ui,color:THEME.text.muted,stroke:'#000',strokeThickness:2}).setOrigin(0.5,0).setDepth(31);
        const zone = this.add.zone(px,py,72,72).setInteractive({useHandCursor:true}).setDepth(55);
        zone.on('pointerover',()=>{ hover.clear(); hover.fillStyle(0xffffff,0.09); hover.fillCircle(px,py,38); hover.lineStyle(1.5,fc,0.7); hover.strokeCircle(px,py,38); });
        zone.on('pointerout', ()=>hover.clear());
        zone.on('pointerdown',(ptr)=>{ptr.event.stopPropagation();this.enterSettlement(t);});

      } else if (tier===1) {
        // Town — walled castle with 3 crenellated merlons
        g.fillStyle(fc,0.07); g.fillCircle(px,py,60);
        g.fillStyle(fc,0.17); g.fillCircle(px,py,42);
        g.fillStyle(0xd4c090); g.fillRect(px-16,py-14,32,28);
        g.fillStyle(0xb89a60);
        g.fillRect(px-16,py-22,9,8); g.fillRect(px-5, py-22,9,8); g.fillRect(px+7, py-22,9,8);
        g.lineStyle(2.5,fc,0.9); g.strokeRect(px-16,py-14,32,28);
        g.fillStyle(0x1a1208); g.fillRect(px-4,py+4,8,10);           // gate
        this.add.text(px,py+20,t.name,{fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:THEME.text.gold,stroke:'#000',strokeThickness:2}).setOrigin(0.5,0).setDepth(31);
        const zone = this.add.zone(px,py,88,88).setInteractive({useHandCursor:true}).setDepth(55);
        zone.on('pointerover',()=>{ hover.clear(); hover.fillStyle(0xffffff,0.10); hover.fillCircle(px,py,46); hover.lineStyle(2,fc,0.75); hover.strokeCircle(px,py,46); });
        zone.on('pointerout', ()=>hover.clear());
        zone.on('pointerdown',(ptr)=>{ptr.event.stopPropagation();this.enterSettlement(t);});

      } else {
        // City — grand walled keep with 5 merlons, triple glow ring, gold cap (largest)
        g.fillStyle(fc,0.04); g.fillCircle(px,py,80);
        g.fillStyle(fc,0.09); g.fillCircle(px,py,58);
        g.fillStyle(fc,0.22); g.fillCircle(px,py,40);
        g.fillStyle(0xe8d898); g.fillRect(px-21,py-18,42,36);
        g.fillStyle(0xf4e8a8,0.45); g.fillRect(px-18,py-18,36,6);
        g.fillStyle(0xc8a860);
        g.fillRect(px-21,py-28,6,9); g.fillRect(px-12,py-28,6,9); g.fillRect(px-3,py-28,6,9);
        g.fillRect(px+6, py-28,6,9); g.fillRect(px+15,py-28,6,9);
        g.lineStyle(3,fc,1.0); g.strokeRect(px-21,py-18,42,36);
        g.fillStyle(0xffd866,0.9); g.fillCircle(px,py-32,5);         // gold banner cap
        g.fillStyle(0x1a1208); g.fillRect(px-6,py+8,12,10);          // main gate
        this.add.text(px,py+26,t.name,{fontSize:THEME.font.md,fontFamily:THEME.font.ui,color:THEME.text.gold,stroke:'#000',strokeThickness:3,fontStyle:'bold'}).setOrigin(0.5,0).setDepth(31);
        const zone = this.add.zone(px,py,116,116).setInteractive({useHandCursor:true}).setDepth(55);
        zone.on('pointerover',()=>{ hover.clear(); hover.fillStyle(0xffffff,0.08); hover.fillCircle(px,py,56); hover.lineStyle(2,fc,0.8); hover.strokeCircle(px,py,56); });
        zone.on('pointerout', ()=>hover.clear());
        zone.on('pointerdown',(ptr)=>{ptr.event.stopPropagation();this.enterSettlement(t);});
      }
    });
  }

  // ---- NPCs ----
  /**
   * @param {string} name      — internal name
   * @param {string} faction   — faction key
   * @param {number} gx,gy    — grid coords
   * @param {string} type      — 'lord'|'bandit'|'caravan'|'villager'
   * @param {Array}  troops    — [{id,count}, ...]
   * @param {string} originName — town/bandit origin name for label
   */
  spawnNPC(name, faction, gx, gy, type, troops, originName='?') {
    const baseSpeed = type==='bandit' ? 45 : type==='caravan' ? 30 : type==='villager' ? 35 : 50;
    const g         = this.add.graphics().setDepth(45);
    const labelTxt  = this.add.text(0, 0, '', {
      fontSize: THEME.font.xs, fontFamily: THEME.font.ui,
      color: THEME.text.primary, stroke: '#000', strokeThickness: 2,
    }).setDepth(46).setOrigin(0.5, 0);

    const npc = {
      name, faction, type, troops, originName,
      x: gx*TILE+TILE/2, y: gy*TILE+TILE/2,
      graphics: g, labelTxt,
      path: [], pathIdx: 0,
      baseSpeed, speed: baseSpeed,
      alive: true, respawnTimer: 0, retargetTimer: 0,
    };
    // Hover zone (recreated in drawNPC)
    npc.hoverZone = null;
    this.drawNPC(npc);
    this.npcs.push(npc);
    return npc;
  }

  drawNPC(npc) {
    npc.graphics.clear();
    if (npc.labelTxt) npc.labelTxt.setText('');

    if (!npc.alive) return;

    const c     = THEME.faction[npc.faction] || 0x888888;
    const total = npc.troops.reduce((s,t) => s+t.count, 0);
    const [labelLine] = npcLabel(npc);

    // --- sprite (all sizes smaller than smallest settlement = village at 18px) ---
    const g = npc.graphics;
    if (npc.type==='lord') {
      // Military unit — coloured box with gold border + faction pennant
      g.fillStyle(0x000000,0.45); g.fillRect(-5,-5,15,15);
      g.fillStyle(c,0.92);        g.fillRect(-7,-7,14,14);
      g.lineStyle(2,0xffd866,0.95); g.strokeRect(-7,-7,14,14);
      // Flag pole
      g.lineStyle(1.5,0xd4b860,0.9); g.lineBetween(7,-7,7,-22);
      // Pennant
      g.fillStyle(c,0.95);        g.fillTriangle(7,-22,7,-14,16,-18);
      g.lineStyle(1,0xffd866,0.7); g.strokeTriangle(7,-22,7,-14,16,-18);
    } else if (npc.type==='bandit') {
      // Skull — dark red circle with hollow eye sockets
      g.fillStyle(0x000000,0.5);  g.fillCircle(2,2,10);
      g.fillStyle(0x991111,0.92); g.fillCircle(0,0,9);
      g.fillStyle(0x000000,0.75); g.fillCircle(-3,-2,3);   // left eye
      g.fillStyle(0x000000,0.75); g.fillCircle(3,-2,3);    // right eye
      g.fillStyle(0x440000,0.6);  g.fillRect(-3,3,7,3);    // jaw
    } else if (npc.type==='villager') {
      // Humble peasant — earthy circle
      g.fillStyle(0x000000,0.30); g.fillCircle(1,1,8);
      g.fillStyle(0x8b6040,0.92); g.fillCircle(0,0,7);
      g.lineStyle(1.5,c,0.55);    g.strokeCircle(0,0,7);
    } else {
      // Caravan — wagon body + wheels
      g.fillStyle(0x000000,0.35); g.fillRect(-9,-4,19,12);
      g.fillStyle(c,0.88);        g.fillRect(-10,-5,18,9);
      g.lineStyle(1.5,0xffd866,0.5); g.strokeRect(-10,-5,18,9);
      // Wheels
      g.fillStyle(0x553311,0.9);  g.fillCircle(-6,5,4); g.fillCircle(6,5,4);
      g.lineStyle(1,0x886644,0.8); g.strokeCircle(-6,5,4); g.strokeCircle(6,5,4);
    }
    g.setPosition(npc.x, npc.y);

    // --- label: name + count ---
    if (npc.labelTxt) {
      npc.labelTxt.setText(`${labelLine}\n×${total}`);
      npc.labelTxt.setPosition(npc.x, npc.y + 12);
    }

    // --- hover zone + tooltip ---
    if (npc.hoverZone) { npc.hoverZone.destroy(); npc.hoverZone = null; }
    const zone = this.add.zone(npc.x, npc.y, 32, 32).setInteractive({ useHandCursor: true }).setDepth(56);
    zone.on('pointerover', () => this.showNpcTooltip(npc));
    zone.on('pointerout',  () => this.hideNpcTooltip());
    zone.on('pointerdown', (ptr) => {
      ptr.event.stopPropagation();
      this.hideNpcTooltip();
      if (!npc.alive || this.activePanel) return;
      if (npc.type === 'villager') return;
      this.paused = true;
      this.showEncounterPanel(npc);
    });
    npc.hoverZone = zone;
  }

  // ---- Tooltip ----
  showNpcTooltip(npc) {
    this.hideNpcTooltip();
    const lines    = npcTooltipLines(npc);
    const [label]  = npcLabel(npc);
    const allLines = [label, ...lines];
    const cam      = this.cameras.main;

    // Convert world → screen coords
    const sx = (npc.x - cam.worldView.x) * cam.zoom;
    const sy = (npc.y - cam.worldView.y) * cam.zoom - 14;

    const txt = this.add.text(sx, sy, allLines.join('\n'), {
      fontSize:        THEME.font.xs,
      fontFamily:      THEME.font.ui,
      color:           THEME.text.primary,
      backgroundColor: '#' + THEME.panel.fill.toString(16).padStart(6,'0') + 'ee',
      padding:         { x: 8, y: 6 },
      stroke:          '#000',
      strokeThickness: 1,
      lineSpacing:     3,
    })
      .setScrollFactor(0)
      .setDepth(500)
      .setOrigin(0.5, 1);

    // Keep on screen
    const tw = txt.width, th = txt.height;
    const cw = cam.width,  ch = cam.height;
    txt.setX(clamp(txt.x, tw/2+4, cw-tw/2-4));
    txt.setY(clamp(txt.y, th+4, ch-4));

    this._tooltipObjs = [txt];
    this._hoveredNpc = npc;
  }

  hideNpcTooltip() {
    this._tooltipObjs.forEach(o => o.destroy());
    this._tooltipObjs = [];
    this._hoveredNpc  = null;
  }

  drawPlayer() {
    this.playerGfx.clear();
    this.playerGfx.fillStyle(0x000000,0.35); this.playerGfx.fillTriangle(1,-11,-8,10,10,10);
    this.playerGfx.fillStyle(0xffffff,0.95); this.playerGfx.fillTriangle(0,-12,-9,9,9,9);
    this.playerGfx.lineStyle(2,0xffdd44,1.0); this.playerGfx.strokeTriangle(0,-12,-9,9,9,9);
    this.playerGfx.setPosition(this.playerPos.x, this.playerPos.y);
  }

  _drawPlayerAura() {
    const t     = this._animT;
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.5);
    const g     = this.playerAuraGfx;
    g.clear();
    g.setPosition(this.playerPos.x, this.playerPos.y);
    // Outer soft glow
    g.fillStyle(0xffdd44, 0.04 + pulse * 0.04);
    g.fillCircle(0, 0, 28 + pulse * 5);
    // Inner warm halo
    g.fillStyle(0xffdd44, 0.10 + pulse * 0.08);
    g.fillCircle(0, 0, 16);
    // Moving: show a thin travel ring
    if (this.playerPath && this.playerPath.length > 0) {
      g.lineStyle(1.5, 0xffdd44, 0.18 + pulse * 0.18);
      g.strokeCircle(0, 0, 21 + pulse * 3);
    }
  }

  drawPathPreview(path) {
    this.pathGfx.clear();
    this.pathGfx.lineStyle(2, 0xffdd44, 0.3);
    this.pathGfx.beginPath();
    path.forEach((p,i) => {
      const px=p.x*TILE+TILE/2, py=p.y*TILE+TILE/2;
      if (i===0) this.pathGfx.moveTo(px,py); else this.pathGfx.lineTo(px,py);
    });
    this.pathGfx.strokePath();
  }

  // ---- Threat map ----
  buildThreatMap(npc) {
    const map = new Float32Array(GRID_W*GRID_H);
    const myPow = calcPower(npc);
    const pp = calcPower(player);
    if (pp > myPow*1.3)
      this.stampThreat(map, Math.floor(this.playerPos.x/TILE), Math.floor(this.playerPos.y/TILE), pp/myPow);
    this.npcs.forEach(o => {
      if (o===npc || !o.alive || o.faction===npc.faction) return;
      const op = calcPower(o);
      if (op > myPow*1.3)
        this.stampThreat(map, Math.floor(o.x/TILE), Math.floor(o.y/TILE), op/myPow);
    });
    return map;
  }

  stampThreat(map, cx, cy, ratio) {
    const radius = Math.min(18, Math.round(5+ratio*3));
    const cost   = ratio*8;
    for (let dy=-radius; dy<=radius; dy++) { for (let dx=-radius; dx<=radius; dx++) {
      const nx=cx+dx, ny=cy+dy;
      if (nx<0||nx>=GRID_W||ny<0||ny>=GRID_H) continue;
      const d = Math.sqrt(dx*dx+dy*dy);
      if (d<=radius) map[ny*GRID_W+nx] += cost*(1-d/radius);
    }}
  }

  // ---- Cargo helpers ----
  _villagerLoadCargo(village) {
    if (!village.production || !village.production.length) return {};
    const good = village.production[0];
    const amt  = Math.min(village.goods[good]||0, randInt(3,8));
    return amt > 0 ? { [good]: amt } : {};
  }

  _caravanLoadCargo(town) {
    // Pick the good with highest stock to export
    const good = GOODS.reduce((best, g) =>
      (town.goods[g]||0) > (town.goods[best]||0) ? g : best, GOODS[0]);
    const amt = Math.min(town.goods[good]||0, randInt(8,20));
    if (amt <= 0) return {};
    town.goods[good] = Math.max(0, town.goods[good] - amt);
    return { [good]: amt };
  }

  // ---- NPC target selection ----
  npcPickTarget(npc) {
    if (npc.type === 'bandit') {
      const myPow = calcPower(npc);
      // Hunt player if weak enough
      if (calcPower(player) < myPow*0.7 && dist(npc, this.playerPos) < 900)
        return { x:Math.floor(this.playerPos.x/TILE), y:Math.floor(this.playerPos.y/TILE) };
      // Hunt nearest weak caravan or villager
      let weak=null, wd=Infinity;
      this.npcs.forEach(o => {
        if (!o.alive || o===npc) return;
        if ((o.type==='caravan'||o.type==='villager') && calcPower(o)<myPow) {
          const d2=dist(npc,o); if(d2<wd){wd=d2;weak=o;}
        }
      });
      if (weak && wd<1500) return { x:Math.floor(weak.x/TILE), y:Math.floor(weak.y/TILE) };
      let gx,gy;
      do { gx=randInt(10,GRID_W-10); gy=randInt(10,GRID_H-10); } while(this.costGrid[gy*GRID_W+gx]>=999);
      return {x:gx,y:gy};
    }

    if (npc.type === 'villager') {
      // Oscillate: home ↔ boundTown
      const dest = npc.delivering ? npc.destTown : npc.homeTown;
      if (dest) return { x:dest.x, y:dest.y };
      const t=randPick(this.towns); return {x:t.x,y:t.y};
    }

    if (npc.type === 'caravan') {
      const dest = npc.destTown || randPick(this.towns);
      return { x:dest.x, y:dest.y };
    }

    // Lord — state-driven
    if (npc.type === 'lord') {
      if (npc.lordState === 'recruit') {
        const ft = this.towns.filter(t => t.faction===npc.faction && t.tier>=1);
        const t  = ft.length ? ft.reduce((b,c) =>
          Math.hypot(c.x-npc.x/TILE,c.y-npc.y/TILE) < Math.hypot(b.x-npc.x/TILE,b.y-npc.y/TILE) ? c : b)
          : (npc.homeTown || randPick(this.towns));
        return { x:t.x, y:t.y };
      }
      if (npc.lordState === 'defend' && npc.lordTarget) {
        const tgt = npc.lordTarget;
        return { x:Math.floor((tgt.x||tgt.x*TILE+TILE/2)/TILE), y:Math.floor((tgt.y||tgt.y*TILE+TILE/2)/TILE) };
      }
      if (npc.lordState === 'attack') {
        // Move toward nearest enemy town or lord
        let best=null, bd=Infinity;
        this.towns.forEach(t => {
          if (factionsAtWar(npc.faction, t.faction)) {
            const d=Math.hypot(t.x-npc.x/TILE,t.y-npc.y/TILE);
            if(d<bd){bd=d;best={x:t.x,y:t.y};}
          }
        });
        if (best) return best;
      }
      // Patrol: wander near home faction territory
      const ft = this.towns.filter(t => t.faction===npc.faction);
      const t  = randPick(ft.length ? ft : this.towns);
      return { x:clamp(t.x+randInt(-5,5),0,GRID_W-1), y:clamp(t.y+randInt(-5,5),0,GRID_H-1) };
    }

    const ft = this.towns.filter(t => t.faction===npc.faction);
    const t  = randPick(ft.length ? ft : this.towns);
    return { x:clamp(t.x+randInt(-3,3),0,GRID_W-1), y:clamp(t.y+randInt(-3,3),0,GRID_H-1) };
  }

  // ---- NPC arrival effects ----
  npcOnArrival(npc) {
    if (npc.type === 'villager') {
      if (npc.delivering && npc.destTown) {
        // Deliver cargo to bound town
        const town = npc.destTown;
        let delivered = '';
        Object.entries(npc.cargo||{}).forEach(([good, amt]) => {
          if (amt > 0) {
            town.goods[good] = (town.goods[good]||0) + amt;
            delivered += `${amt} ${good} `;
          }
        });
        // Boost recruit pool slightly
        town.recruitPool = Math.min(20, town.recruitPool + 1);
        town.prosperity  = Math.min(100, town.prosperity + 1);
        npc.cargo        = {};
        npc.delivering   = false;
        if (delivered) this._worldLog(`Villagers from ${npc.homeTown.name} delivered ${delivered.trim()} to ${town.name}.`);
      } else {
        // Arrived back home — reload cargo
        npc.cargo      = this._villagerLoadCargo(npc.homeTown);
        npc.delivering = true;
      }
      return;
    }

    if (npc.type === 'caravan') {
      const dest = npc.destTown;
      if (!dest) return;
      // Sell cargo at destination
      let soldLog = '';
      Object.entries(npc.cargo||{}).forEach(([good, amt]) => {
        if (amt > 0) {
          dest.goods[good] = (dest.goods[good]||0) + amt;
          dest.prosperity  = Math.min(100, dest.prosperity + 1);
          soldLog += `${amt} ${good} `;
        }
      });
      if (soldLog) this._worldLog(`Caravan arrived at ${dest.name} with ${soldLog.trim()}.`);
      // Pick new destination, reload from current town
      const prev = dest;
      const candidates = this.towns.filter(t => t !== prev && t.type === 'town');
      npc.homeTown = prev;
      npc.destTown = candidates.length ? randPick(candidates) : randPick(this.towns.filter(t=>t.type==='town'));
      npc.cargo    = this._caravanLoadCargo(prev);
      return;
    }

    if (npc.type === 'lord' && npc.lordState === 'recruit') {
      const total = npc.troops.reduce((s,t)=>s+t.count,0);
      if (total < 30) {
        const town = this.towns.filter(t=>t.faction===npc.faction && t.recruitPool>0)
          .sort((a,b)=>Math.hypot(a.x-npc.x/TILE,a.y-npc.y/TILE)-Math.hypot(b.x-npc.x/TILE,b.y-npc.y/TILE))[0];
        if (town && town.recruitPool >= 3) {
          const recruited = Math.min(town.recruitPool, randInt(3,8));
          town.recruitPool -= recruited;
          const m = npc.troops.find(t=>t.id===1);
          if (m) m.count += recruited; else npc.troops.push({id:1, count:recruited});
          this._worldLog(`${npc.name} recruited ${recruited} from ${town.name}.`);
          npc.lordState = 'patrol';
        }
      }
    }
  }

  // ---- Lord daily AI decision ----
  lordDecideState(lord) {
    const total = lord.troops.reduce((s,t)=>s+t.count,0);
    // Weak → go recruit
    if (total < 15) { lord.lordState='recruit'; lord.lordTarget=null; return; }

    // Check if any bandit or enemy lord is threatening a friendly settlement
    let threat=null, threatDist=Infinity;
    this.npcs.forEach(o => {
      if (!o.alive || o===lord) return;
      if (!factionsAtWar(lord.faction, o.faction)) return;
      this.towns.forEach(t => {
        if (t.faction !== lord.faction) return;
        const d = dist(o, {x:t.x*TILE,y:t.y*TILE});
        if (d < 540 && d < threatDist) { threatDist=d; threat=o; }
      });
    });
    if (threat) {
      lord.lordState  = 'defend';
      lord.lordTarget = threat;
      return;
    }

    // At war → sometimes attack
    const atWarWith = Object.keys(FACTION_RELATIONS[lord.faction]||{})
      .filter(f => factionsAtWar(lord.faction, f));
    if (atWarWith.length && Math.random() < 0.25) {
      lord.lordState  = 'attack';
      lord.lordTarget = null;
      return;
    }

    // Default: patrol
    lord.lordState  = 'patrol';
    lord.lordTarget = null;
  }

  // ---- Safety decay from nearby threats ----
  _updateSettlementSafety() {
    // Reset toward 100
    this.towns.forEach(t => { t.safety = Math.min(100, t.safety + 2); });
    // Decay near hostile NPCs
    this.npcs.forEach(o => {
      if (!o.alive) return;
      this.towns.forEach(t => {
        if (!factionsAtWar(o.faction, t.faction)) return;
        const d = dist(o, {x:t.x*TILE, y:t.y*TILE});
        if (d < 600) t.safety = Math.max(0, t.safety - 3);
      });
    });
  }

  // ---- World event log (not player-facing notification) ----
  _worldLog(msg) {
    if (!this._logHistory) this._logHistory = [];
    this._logHistory.push(msg);
    if (this._logHistory.length > 8) this._logHistory.shift();
  }

  npcRepath(npc) {
    const tgt = this.npcPickTarget(npc);
    const gx  = clamp(Math.floor(npc.x/TILE), 0, GRID_W-1);
    const gy  = clamp(Math.floor(npc.y/TILE), 0, GRID_H-1);
    const threatMap = this.buildThreatMap(npc);
    const path = this.pathfinder.findPath(gx, gy, clamp(tgt.x,0,GRID_W-1), clamp(tgt.y,0,GRID_H-1), threatMap);
    if (path && path.length>1) { npc.path=path; npc.pathIdx=1; }
    // Recalculate speed based on current troops
    npc.speed = calcSpeed(npc.troops, npc.baseSpeed);
    npc.retargetTimer = randInt(4,10);
  }

  // ---- HUD ----
  createHUD() {
    const cam=this.cameras.main, w=cam.width, h=cam.height;
    this._notifications = [];
    this._logHistory    = [];
    this._lastNotifLog  = '';

    this.hudBg   = this.add.rectangle(w/2,0,w,THEME.hud.height,THEME.hud.fill,THEME.hud.fillAlpha).setOrigin(0.5,0).setScrollFactor(0).setDepth(200);
    this.hudLine = this.add.graphics().setScrollFactor(0).setDepth(201);
    this.hudLine.lineStyle(1,THEME.panel.border,0.75);
    this.hudLine.lineBetween(0,THEME.hud.height,w,THEME.hud.height);
    this.hudText     = this.add.text(10,7,'',{fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:THEME.text.primary}).setScrollFactor(0).setDepth(201);
    this.pauseLabel  = this.add.text(w/2,5,'⏸ PAUSED [SPACE]',{fontSize:THEME.font.md,fontFamily:THEME.font.ui,color:THEME.text.gold,fontStyle:'bold'}).setOrigin(0.5,0).setScrollFactor(0).setDepth(201);
    this.speedLabel  = this.add.text(w/2,26,'Speed: 1x [1/2/3]',{fontSize:THEME.font.xs,fontFamily:THEME.font.ui,color:THEME.text.muted}).setOrigin(0.5,0).setScrollFactor(0).setDepth(201);

    const bx = w-10;
    this.partyBtn = createStyledButton(this, bx-130, 8, 'Party',     ()=>this.showPartyPanel(),     {depth:201,padX:8,padY:3});
    this.invBtn   = createStyledButton(this, bx-62,  8, 'Inventory', ()=>this.showInventoryPanel(), {depth:201,padX:8,padY:3});

    const lw=THEME.log.w, lh=THEME.log.h;
    this.logPanel = this.add.rectangle(0,h-lh,lw,lh,THEME.panel.fill,0.82).setOrigin(0,0).setScrollFactor(0).setDepth(198);
    this.logPanelBorder = this.add.graphics().setScrollFactor(0).setDepth(199);
    this.logPanelBorder.lineStyle(1,THEME.panel.border,0.6);
    this.logPanelBorder.strokeRect(0,h-lh,lw,lh);
    this.logText    = this.add.text(10,h-lh+8,'',{fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:THEME.text.gold,wordWrap:{width:lw-20},lineSpacing:4,stroke:'#000',strokeThickness:1}).setScrollFactor(0).setDepth(201);
    this.terrainTip = this.add.text(10,h-14,'',{fontSize:THEME.font.xs,fontFamily:THEME.font.mono,color:THEME.text.muted}).setScrollFactor(0).setDepth(201);

    const mw=THEME.minimap.w, mh=THEME.minimap.h;
    const mx=w-mw-THEME.spacing.pad, my=h-mh-THEME.spacing.pad;
    this.minimapFrameGfx  = drawMinimapFrame(this,mx,my,mw,mh);
    this.minimapTex       = this.add.renderTexture(mx,my,mw,mh).setScrollFactor(0).setDepth(200);
    this.minimapBorderGfx = drawMinimapBorder(this,mx,my,mw,mh);
    this.minimapGfx       = this.make.graphics({add:false});
    this._mmW=mw; this._mmH=mh;
    this.drawMinimap();

    // Screen vignette (dark edges) — depth below HUD, above terrain
    this._vignette = this.add.graphics().setScrollFactor(0).setDepth(195);
    this._drawVignette(w, h);

    // Faction colour strip along the bottom of the HUD bar
    this.hudFactionStrip = this.add.graphics().setScrollFactor(0).setDepth(202);
    this._drawFactionStrip(w);

    this.scale.on('resize', (gameSize)=>this.onResize(gameSize.width,gameSize.height), this);
  }

  onResize(w,h) {
    this.hudBg.setPosition(w/2,0).setSize(w,THEME.hud.height);
    this.hudLine.clear();
    this.hudLine.lineStyle(1,THEME.panel.border,0.75);
    this.hudLine.lineBetween(0,THEME.hud.height,w,THEME.hud.height);
    this.pauseLabel.setPosition(w/2,5);
    this.speedLabel.setPosition(w/2,26);
    const bx=w-10;
    this.partyBtn.setPosition(bx-130,8);
    this.invBtn.setPosition(bx-62,8);
    const lw=THEME.log.w, lh=THEME.log.h;
    this.logPanel.setPosition(0,h-lh);
    this.logPanelBorder.clear();
    this.logPanelBorder.lineStyle(1,THEME.panel.border,0.6);
    this.logPanelBorder.strokeRect(0,h-lh,lw,lh);
    this.logText.setPosition(10,h-lh+8);
    this.terrainTip.setPosition(10,h-14);
    const mw=THEME.minimap.w, mh=THEME.minimap.h;
    const mx=w-mw-THEME.spacing.pad, my=h-mh-THEME.spacing.pad;
    this.minimapFrameGfx.clear();
    this.minimapFrameGfx.fillStyle(0x000000,0.55); this.minimapFrameGfx.fillRect(mx-3,my-3,mw+6,mh+6);
    this.minimapFrameGfx.fillStyle(THEME.minimap.bg,1.0); this.minimapFrameGfx.fillRect(mx,my,mw,mh);
    this.minimapTex.setPosition(mx,my);
    this.minimapBorderGfx.clear();
    this.minimapBorderGfx.lineStyle(2,THEME.minimap.frame,1.0); this.minimapBorderGfx.strokeRect(mx-1,my-1,mw+2,mh+2);
    this.minimapBorderGfx.lineStyle(1,THEME.minimap.frameInner,0.85); this.minimapBorderGfx.strokeRect(mx+1,my+1,mw-2,mh-2);
    this.drawMinimap();
    this._drawVignette(w, h);
    this._drawFactionStrip(w);
    this._notifications.forEach((n,i)=>{ n.obj.setPosition(w/2, THEME.hud.height+20+i*32); });
  }

  showNotification(msg) {
    const w = this.cameras.main.width;
    if (this._notifications.length >= 4) { const old=this._notifications.shift(); old.obj.destroy(); }
    const y = THEME.hud.height+20+this._notifications.length*32;
    const fillHex = '#'+THEME.panel.fill.toString(16).padStart(6,'0');
    const obj = this.add.text(w/2,y,msg,{
      fontSize:THEME.font.md, fontFamily:THEME.font.ui,
      color:THEME.text.gold, backgroundColor:fillHex,
      padding:{x:14,y:6}, stroke:'#000000', strokeThickness:2,
    }).setOrigin(0.5,0).setScrollFactor(0).setDepth(210).setAlpha(1);
    this._notifications.push({obj, timer:0, life:4.5});
  }

  _tickNotifications(dt) {
    if (!this._notifications.length) return;
    const w = this.cameras.main.width;
    for (let i=this._notifications.length-1; i>=0; i--) {
      const n = this._notifications[i];
      n.timer += dt;
      if      (n.timer >= n.life)        { n.obj.destroy(); this._notifications.splice(i,1); }
      else if (n.timer >= n.life-1.0)    { n.obj.setAlpha(Math.max(0, 1-(n.timer-(n.life-1.0)))); }
    }
    this._notifications.forEach((n,i)=>{ n.obj.setPosition(w/2, THEME.hud.height+20+i*32); });
  }

  drawMinimap() {
    const mw=this._mmW||THEME.minimap.w, mh=this._mmH||THEME.minimap.h;
    const g = this.minimapGfx; g.clear();
    for (let y=0; y<GRID_H; y+=3) { for (let x=0; x<GRID_W; x+=3) {
      g.fillStyle(TERRAIN_BY_ID[this.terrainGrid[y*GRID_W+x]].color, 0.85);
      g.fillRect(x/GRID_W*mw, y/GRID_H*mh, 2, 2);
    }}
    this.towns.forEach(t => {
      const tx=t.x/GRID_W*mw, ty=t.y/GRID_H*mh;
      const fc=THEME.faction[t.faction]||0xffffff;
      if (t.tier===2) {
        // City — large square with gold centre
        g.fillStyle(fc,0.9);     g.fillRect(tx-4,ty-4,9,9);
        g.fillStyle(0xffd866,1); g.fillRect(tx-1,ty-1,3,3);
      } else if (t.type==='town') {
        // Town — medium square with white centre
        g.fillStyle(fc,0.85);    g.fillRect(tx-3,ty-3,7,7);
        g.fillStyle(0xffffff,0.9);g.fillRect(tx-1,ty-1,3,3);
      } else if (t.type==='castle') {
        // Castle — small cross/diamond to distinguish from town
        g.fillStyle(fc,0.75);    g.fillRect(tx-2,ty-4,5,9);
        g.fillStyle(fc,0.75);    g.fillRect(tx-4,ty-2,9,5);
      } else {
        // Village — tiny dot
        g.fillStyle(fc,0.55);    g.fillRect(tx-1,ty-1,3,3);
      }
    });
    this.npcs.forEach(n => {
      if (!n.alive) return;
      g.fillStyle(THEME.faction[n.faction]||0x888888,0.7);
      g.fillCircle(n.x/MAP_W*mw, n.y/MAP_H*mh, 1.5);
    });
    const cam=this.cameras.main, zoom=cam.zoom;
    const vw=cam.width/zoom, vh=cam.height/zoom;
    const vx=(this.playerPos.x-vw/2)/MAP_W*mw, vy=(this.playerPos.y-vh/2)/MAP_H*mh;
    g.lineStyle(1,0xffffff,0.3);
    g.strokeRect(clamp(vx,0,mw-2),clamp(vy,0,mh-2),clamp(vw/MAP_W*mw,4,mw),clamp(vh/MAP_H*mh,4,mh));
    const ppx=this.playerPos.x/MAP_W*mw, ppy=this.playerPos.y/MAP_H*mh;
    g.fillStyle(0xffffff,1.0); g.fillCircle(ppx,ppy,2.5);
    g.fillStyle(0xffdd44,0.9); g.fillCircle(ppx,ppy,1.5);
    this.minimapTex.clear(); this.minimapTex.draw(g);
  }

  updateHUD() {
    const tot = player.troops.reduce((s,t)=>s+t.count,0);
    this.hudText.setText(`Gold: ${player.gold} · Troops: ${tot} · Power: ${calcPower(player)} · Day ${this.day} · Renown: ${player.renown} · Lv ${player.level}`);
    this.pauseLabel.setVisible(this.paused);
    this.speedLabel.setText(`Speed: ${this.gameSpeed}x [1/2/3]`);
    if (this.battleLog && this.battleLog !== this._lastNotifLog) {
      this._lastNotifLog = this.battleLog;
      this._logHistory.push(this.battleLog);
      if (this._logHistory.length>8) this._logHistory.shift();
      this.showNotification(this.battleLog);
    }
    this.logText.setText(this._logHistory.slice(-4).join('\n'));
    const ptr=this.input.activePointer;
    const gx=clamp(Math.floor(ptr.worldX/TILE),0,GRID_W-1);
    const gy=clamp(Math.floor(ptr.worldY/TILE),0,GRID_H-1);
    const terr = TERRAIN_BY_ID[this.terrainGrid[gy*GRID_W+gx]];
    this.terrainTip.setText(`${terr.name} (${gx},${gy}) ${terr.cost>=999?'Impassable':'Cost:'+terr.cost.toFixed(1)}`);
  }

  togglePause() { this.paused = !this.paused; }

  // ---- Main loop ----
  update(time, delta) {
    this.updateHUD();
    this._tickNotifications(delta/1000);

    // Animate player aura every frame regardless of pause state
    this._animT += delta / 1000;
    this._drawPlayerAura();

    // Keep tooltip position synced to moving NPC
    if (this._hoveredNpc && this._tooltipObjs.length) {
      const npc = this._hoveredNpc;
      const cam = this.cameras.main;
      const sx  = (npc.x - cam.worldView.x) * cam.zoom;
      const sy  = (npc.y - cam.worldView.y) * cam.zoom - 14;
      this._tooltipObjs[0].setPosition(
        clamp(sx, this._tooltipObjs[0].width/2+4, cam.width-this._tooltipObjs[0].width/2-4),
        clamp(sy, this._tooltipObjs[0].height+4, cam.height-4)
      );
    }

    // Stay mode — advance time while resting inside a settlement (panel active, world paused)
    if (this.stayMode) {
      const stayDt = (delta/1000) * this.gameSpeed;
      this.dayTimer += stayDt;
      if (this.dayTimer >= 6) { this.dayTimer=0; this.day++; this.dailyTick(); }
    }

    if (this.activePanel || this.paused) return;

    const dt = (delta/1000) * this.gameSpeed;
    this.dayTimer += dt;
    if (this.dayTimer >= 6) { this.dayTimer=0; this.day++; this.dailyTick(); }
    if (this.battleLog) { this.logTimer+=dt; if(this.logTimer>8){this.battleLog='';this._lastNotifLog='';this.logTimer=0;} }

    // Player movement
    if (this.playerPath.length>0 && this.playerPathIdx<this.playerPath.length) {
      const tgt = this.playerPath[this.playerPathIdx];
      const tx=tgt.x*TILE+TILE/2, ty=tgt.y*TILE+TILE/2;
      const speed = 80*(1+player.skills.pathfinding*0.06);
      const gx=clamp(Math.floor(this.playerPos.x/TILE),0,GRID_W-1);
      const gy=clamp(Math.floor(this.playerPos.y/TILE),0,GRID_H-1);
      const tc=this.costGrid[gy*GRID_W+gx];
      const sp=speed/Math.max(1,tc);
      const d=dist(this.playerPos,{x:tx,y:ty});
      if (d>2) {
        this.playerPos.x += (tx-this.playerPos.x)/d*sp*dt;
        this.playerPos.y += (ty-this.playerPos.y)/d*sp*dt;
      } else {
        this.playerPathIdx++;
        if (this.playerPathIdx >= this.playerPath.length) { this.playerPath=[]; this.pathGfx.clear(); }
      }
      this.drawPlayer();
      this.camTarget.x=this.playerPos.x; this.camTarget.y=this.playerPos.y;
    }

    // NPC movement + label update
    this.npcs.forEach(npc => {
      if (!npc.alive) {
        npc.respawnTimer-=dt;
        if (npc.respawnTimer<=0) this.respawnNPC(npc);
        return;
      }
      npc.retargetTimer-=dt;
      const pathDone = npc.path.length>0 && npc.pathIdx>=npc.path.length;
      if (npc.retargetTimer<=0 || npc.path.length===0 || pathDone) {
        if (pathDone) this.npcOnArrival(npc);
        this.npcRepath(npc);
      }
      if (npc.path.length>0 && npc.pathIdx<npc.path.length) {
        const t=npc.path[npc.pathIdx];
        const tx=t.x*TILE+TILE/2, ty=t.y*TILE+TILE/2;
        const d=dist(npc,{x:tx,y:ty});
        const gx=clamp(Math.floor(npc.x/TILE),0,GRID_W-1);
        const gy=clamp(Math.floor(npc.y/TILE),0,GRID_H-1);
        const sp=npc.speed/Math.max(1,this.costGrid[gy*GRID_W+gx]);
        if (d>2) { npc.x+=(tx-npc.x)/d*sp*dt; npc.y+=(ty-npc.y)/d*sp*dt; }
        else npc.pathIdx++;
      }

      // Move graphics + label each frame (cheap)
      npc.graphics.setPosition(npc.x, npc.y);
      if (npc.labelTxt) npc.labelTxt.setPosition(npc.x, npc.y+8);
      if (npc.hoverZone) npc.hoverZone.setPosition(npc.x, npc.y);

      // Tick encounter cooldown
      if (npc._encounterCooldown && npc._encounterCooldown > 0) npc._encounterCooldown -= dt;
      if (!this.playerInside && dist(npc,this.playerPos)<36) this.handleEncounter(npc);
    });

    // NPC vs NPC — use faction war/peace relations
    for (let i=0; i<this.npcs.length; i++) { for (let j=i+1; j<this.npcs.length; j++) {
      const a=this.npcs[i], b=this.npcs[j];
      if (!a.alive||!b.alive) continue;
      if (!factionsAtWar(a.faction, b.faction)) continue;
      if (a.type==='caravan'&&b.type==='caravan') continue;
      // Villagers can be raided by bandits; otherwise villagers don't fight
      if (a.type==='villager' && b.type!=='bandit') continue;
      if (b.type==='villager' && a.type!=='bandit') continue;
      if (dist(a,b)<36) this.npcBattle(a,b);
    }}

    if (time%500 < 20) this.drawMinimap();
  }

  isHostile(npc) {
    return factionsAtWar(player.faction || 'Varric League', npc.faction);
  }

  handleEncounter(npc) {
    if (this.activePanel) return;
    if (this.playerInside) return;
    // Villagers: always silent, no interaction
    if (npc.type === 'villager') return;
    // Friendly/neutral: NEVER force a panel — player must click the sprite
    if (!this.isHostile(npc)) return;
    // Hostile: check cooldown so we don't re-fire while still overlapping
    if (npc._encounterCooldown && npc._encounterCooldown > 0) return;
    this.paused = true;
    this.showEncounterPanel(npc);
  }

  // ---- ENCOUNTER PANEL ----
  showEncounterPanel(npc) {
    const hostile  = this.isHostile(npc);
    const pw = 520, ph = 420;
    const {objs, cx, cy} = this.panelBg(pw, ph);
    const d   = this.add.container(0,0).setScrollFactor(0).setDepth(301);
    const tl  = cx - pw/2 + 24;
    const top = cy - ph/2;

    // ── Banner strip (faction colour) ──
    const fc = THEME.faction[npc.faction] || 0x888888;
    const banner = this.add.graphics().setScrollFactor(0).setDepth(301);
    banner.fillStyle(fc, 0.18);
    banner.fillRect(cx-pw/2+2, top+2, pw-4, 52);
    objs.push(banner);

    // ── Party portrait area (left) ──
    const portG = this.add.graphics().setScrollFactor(0).setDepth(302);
    portG.lineStyle(2, fc, 0.8);
    portG.strokeRect(tl, top+14, 54, 54);
    portG.fillStyle(fc, 0.22); portG.fillRect(tl+1, top+15, 53, 53);
    // Draw party icon inside portrait
    portG.fillStyle(fc, 0.9);
    if (npc.type === 'lord')     { portG.fillRect(tl+16, top+26, 22, 22); portG.lineStyle(1.5,0xffd866,1); portG.strokeRect(tl+16, top+26, 22, 22); }
    else if (npc.type === 'bandit') portG.fillCircle(tl+27, top+42, 11);
    else { portG.fillTriangle(tl+27, top+26, tl+16, top+58, tl+38, top+58); }
    objs.push(portG);

    // ── Name & title ──
    const nameStr = npc.lordDef ? npc.lordDef.name : npc.name;
    const titleStr = npc.lordDef
      ? `${npc.lordDef.title}  [${npc.faction}]`
      : `${npc.type.charAt(0).toUpperCase()+npc.type.slice(1)}  [${npc.faction}]`;
    d.add(this.add.text(tl+62, top+14, nameStr,  {fontSize:THEME.font.lg,  fontFamily:THEME.font.ui, color:THEME.text.gold, fontStyle:'bold'}));
    d.add(this.add.text(tl+62, top+36, titleStr, {fontSize:THEME.font.xs,  fontFamily:THEME.font.ui, color:THEME.text.muted}));

    // ── Enemy troop summary ──
    let ey = top + 74;
    d.add(this.add.text(tl, ey, 'Enemy Forces:', {fontSize:THEME.font.sm, fontFamily:THEME.font.ui, color:THEME.text.muted})); ey += 18;
    const inf = countKind(npc.troops,'infantry');
    const cav = countKind(npc.troops,'cavalry');
    const arc = countKind(npc.troops,'archer');
    const vil = countKind(npc.troops,'villager');
    const total = npc.troops.reduce((s,t)=>s+t.count,0);
    const parts = [];
    if (inf) parts.push(`Infantry ×${inf}`);
    if (cav) parts.push(`Cavalry ×${cav}`);
    if (arc) parts.push(`Archers ×${arc}`);
    if (vil) parts.push(`Villagers ×${vil}`);
    d.add(this.add.text(tl, ey, parts.join('   ') || 'Unknown', {fontSize:THEME.font.sm, fontFamily:THEME.font.ui, color:THEME.text.primary})); ey += 18;

    // Leader skills if lord
    if (npc.lordDef) {
      const ls = npc.lordDef.skills;
      d.add(this.add.text(tl, ey,
        `Tactics: ${ls.tactics}  Leadership: ${ls.leadership}  Speed: ${calcSpeed(npc.troops, npc.baseSpeed)}`,
        {fontSize:THEME.font.xs, fontFamily:THEME.font.ui, color:THEME.text.muted}));
      ey += 18;
    }

    // ── Divider ──
    ey += 4;
    const div = this.add.graphics().setScrollFactor(0).setDepth(302);
    div.lineStyle(1, THEME.panel.border, 0.5);
    div.lineBetween(tl, ey, cx+pw/2-24, ey);
    objs.push(div); ey += 10;

    // ── Win rate bar ──
    const atkParty = { troops: player.troops, skills: player.skills };
    const defParty = { troops: npc.troops, lordDef: npc.lordDef };
    const winPct   = estimateWinRate(atkParty, defParty);
    const winColor = winPct >= 65 ? THEME.text.green : winPct >= 40 ? THEME.text.gold : THEME.text.red;
    const winLabel = winPct >= 70 ? 'Favourable' : winPct >= 50 ? 'Even' : winPct >= 30 ? 'Risky' : 'Desperate';

    d.add(this.add.text(tl, ey, 'Estimated Win Chance:', {fontSize:THEME.font.sm, fontFamily:THEME.font.ui, color:THEME.text.muted}));
    d.add(this.add.text(tl+160, ey, `${winPct}%  (${winLabel})`, {fontSize:THEME.font.sm, fontFamily:THEME.font.ui, color:winColor, fontStyle:'bold'}));
    ey += 18;

    // Win bar background
    const barW = pw - 48, barH = 10;
    const barBg = this.add.graphics().setScrollFactor(0).setDepth(302);
    barBg.fillStyle(0x1a2030, 1); barBg.fillRect(tl, ey, barW, barH);
    barBg.fillStyle(Phaser.Display.Color.HexStringToColor(winColor.replace('#','')).color, 0.85);
    barBg.fillRect(tl, ey, Math.round(barW * winPct/100), barH);
    barBg.lineStyle(1, THEME.panel.border, 0.5); barBg.strokeRect(tl, ey, barW, barH);
    objs.push(barBg); ey += 22;

    // Player force summary
    const pInf = countKind(player.troops,'infantry');
    const pCav = countKind(player.troops,'cavalry');
    const pArc = countKind(player.troops,'archer');
    const pVil = countKind(player.troops,'villager');
    const pTotal = player.troops.reduce((s,t)=>s+t.count,0);
    const pParts = [];
    if (pInf) pParts.push(`Infantry ×${pInf}`);
    if (pCav) pParts.push(`Cavalry ×${pCav}`);
    if (pArc) pParts.push(`Archers ×${pArc}`);
    if (pVil) pParts.push(`Villagers ×${pVil}`);
    d.add(this.add.text(tl, ey, `Your Forces: ${pParts.join('  ')}  (Power: ${calcPower({troops:player.troops})})`,
      {fontSize:THEME.font.xs, fontFamily:THEME.font.ui, color:THEME.text.muted}));
    ey += 22;

    // ── Action buttons ──
    const btnY  = top + ph - 68;
    const btnW  = 100;
    const gap   = 12;
    let   btnX  = cx - pw/2 + 24;

    if (!hostile) {
      // Friendly/neutral: Trade | Rob | Social | Leave
      d.add(createStyledButton(this, btnX, btnY, '📦  Trade',  ()=>{ this.closePanel(); this.showNotification('Trade — coming soon!'); this.paused=false; }, {depth:302,padX:12,padY:8})); btnX += btnW+gap;
      d.add(createStyledButton(this, btnX, btnY, '⚔  Rob',    ()=>{ this.closePanel(); this.executeFight(npc); }, {depth:302,padX:12,padY:8})); btnX += btnW+gap;
      d.add(createStyledButton(this, btnX, btnY, '💬  Social', ()=>{ this.closePanel(); this.showNotification('Social — coming soon!'); this.paused=false; }, {depth:302,padX:12,padY:8})); btnX += btnW+gap;
      d.add(createStyledButton(this, btnX, btnY, '🚶  Leave',  ()=>{
        this.closePanel();
        npc._encounterCooldown = 8; // 8 sim-seconds grace period
        this.paused = false;
      }, {depth:302,padX:12,padY:8}));
    } else {
      // Hostile: Fight | Talk | Run
      d.add(createStyledButton(this, btnX, btnY, '⚔  Fight',  ()=>{ this.closePanel(); this.executeFight(npc); }, {depth:302,padX:12,padY:8})); btnX += btnW+gap;
      d.add(createStyledButton(this, btnX, btnY, '💬  Talk',   ()=>{ this.closePanel(); this.showNotification('Talk — coming soon!'); this.paused=false; }, {depth:302,padX:12,padY:8})); btnX += btnW+gap;
      d.add(createStyledButton(this, btnX, btnY, '💨  Run',    ()=>{ this.closePanel(); this.executeRun(npc); }, {depth:302,padX:12,padY:8}));
    }

    objs.push(d);
    this.activePanel = objs;
  }

  // ---- Execute Fight ----
  executeFight(npc) {
    const playerBefore = player.troops.map(t=>({...t}));
    const atkParty = { troops: player.troops.map(t=>({...t})), skills: player.skills };
    const defParty = { troops: npc.troops.map(t=>({...t})), lordDef: npc.lordDef };
    const r = autoResolveWithLeader(atkParty, defParty);
    if (!r) { this.paused = false; return; }
    player.troops = atkParty.troops;
    npc.troops    = defParty.troops;

    if (r.win) {
      player.gold   += r.loot;
      player.xp     += r.dLoss * 2;
      player.renown += Math.max(1, Math.round(r.dLoss/2));
      player.troops.forEach(t => {
        if (TROOP_UPGRADES[t.id]) {
          player.troopXP[t.id] = (player.troopXP[t.id]||0) + Math.max(1, Math.round(r.dLoss/Math.max(1,t.count)));
        }
      });
      npc.alive       = false;
      npc.respawnTimer= 25;
      this.drawNPC(npc);
      this.showBattleResultPanel(true, r, npc, playerBefore);
    } else {
      player.gold = Math.max(0, player.gold - 50);
      const near = this.towns.reduce((b,t) =>
        dist({x:t.x*TILE,y:t.y*TILE},this.playerPos) < dist({x:b.x*TILE,y:b.y*TILE},this.playerPos) ? t : b,
        this.towns[0]);
      this.playerPos.x = near.x*TILE+TILE/2;
      this.playerPos.y = near.y*TILE+TILE/2;
      this.playerPath = []; this.pathGfx.clear(); this.drawPlayer();
      this.camTarget.x = this.playerPos.x; this.camTarget.y = this.playerPos.y;
      this.showBattleResultPanel(false, r, npc, playerBefore);
    }
    this.checkLevelUp();
  }

  // ---- Execute Run ----
  executeRun(npc) {
    const playerSpd = calcSpeed(player.troops, 80);
    const npcSpd    = calcSpeed(npc.troops, npc.baseSpeed);
    const escaped   = playerSpd >= npcSpd || Math.random() < 0.55;

    // Rear-guard losses — weakest troops sacrificed
    const rearLossRatio = escaped ? 0.06 : 0.18;
    const total = player.troops.reduce((s,t)=>s+t.count,0);
    let rem = Math.max(1, Math.round(total * rearLossRatio));
    const sorted = [...player.troops].sort((a,b)=>(TROOP_BY_ID[a.id]?.power??1)-(TROOP_BY_ID[b.id]?.power??1));
    for (let i=0; i<sorted.length && rem>0; i++) {
      const k = Math.min(sorted[i].count, rem); sorted[i].count -= k; rem -= k;
    }
    player.troops = player.troops.filter(t=>t.count>0);

    const rearLoss = Math.max(1, Math.round(total * rearLossRatio));
    this.showRunResultPanel(escaped, rearLoss, npc);

    if (escaped) {
      // Move player away from npc
      const dx = this.playerPos.x - npc.x, dy = this.playerPos.y - npc.y;
      const d  = Math.sqrt(dx*dx+dy*dy) || 1;
      const nx = clamp(Math.floor((this.playerPos.x + dx/d*180)/TILE), 0, GRID_W-1);
      const ny = clamp(Math.floor((this.playerPos.y + dy/d*180)/TILE), 0, GRID_H-1);
      if (this.costGrid[ny*GRID_W+nx] < 999) {
        this.playerPos.x = nx*TILE+TILE/2;
        this.playerPos.y = ny*TILE+TILE/2;
        this.drawPlayer();
        this.camTarget.x = this.playerPos.x;
        this.camTarget.y = this.playerPos.y;
      }
    }
  }

  // ---- Battle Result Panel ----
  showBattleResultPanel(win, r, npc, playerBefore) {
    // Camera effects — fire immediately before showing the panel
    if (win) {
      this.cameras.main.flash(500, 60, 180, 60, true);
    } else {
      this.cameras.main.shake(600, 0.018);
      this.cameras.main.flash(400, 160, 20, 20, true);
    }

    const enemy = npc.lordDef ? npc.lordDef.name : (npc.name || 'Enemy');

    // Build per-troop breakdown: compare playerBefore vs current player.troops
    const troopRows = [];
    (playerBefore || []).forEach(before => {
      const def   = TROOP_BY_ID[before.id];
      if (!def) return;
      const after = player.troops.find(t => t.id === before.id);
      const lost  = before.count - (after ? after.count : 0);
      troopRows.push({ name: def.name, before: before.count, after: after ? after.count : 0, lost });
    });

    const rowH   = 22;
    const extraH = Math.max(0, troopRows.length - 2) * rowH;
    const pw = 460, ph = 360 + extraH;
    const {objs, cx, cy} = this.panelBg(pw, ph);
    const d  = this.add.container(0,0).setScrollFactor(0).setDepth(301);
    const tl = cx - pw/2 + 28, top = cy - ph/2;

    // Title
    const titleStr = win ? '⚔  VICTORY!' : '💀  DEFEATED';
    const titleCol = win ? THEME.text.green : THEME.text.red;
    d.add(this.add.text(cx, top+16, titleStr,
      {fontSize:THEME.font.xl, fontFamily:THEME.font.ui, color:titleCol, fontStyle:'bold', stroke:'#000000', strokeThickness:4}
    ).setOrigin(0.5, 0));

    // Sub-header
    const subStr = win ? `You defeated ${enemy}'s forces.` : `${enemy}'s forces crushed you.`;
    d.add(this.add.text(cx, top+50, subStr,
      {fontSize:THEME.font.sm, fontFamily:THEME.font.ui, color:THEME.text.muted}
    ).setOrigin(0.5, 0));

    // Divider
    const divG = this.add.graphics().setScrollFactor(0).setDepth(302);
    divG.lineStyle(1, THEME.panel.border, 0.5);
    divG.lineBetween(tl, top+74, cx+pw/2-28, top+74);
    objs.push(divG);

    // Stats block
    let gy = top + 84;
    const col2 = tl + 200;

    d.add(this.add.text(tl,   gy, 'Enemy slain:',  {fontSize:THEME.font.sm, fontFamily:THEME.font.ui, color:THEME.text.muted}));
    d.add(this.add.text(col2, gy, `${r.dLoss}`,    {fontSize:THEME.font.sm, fontFamily:THEME.font.ui, color:win ? THEME.text.green : THEME.text.primary}));
    gy += 20;

    d.add(this.add.text(tl,   gy, 'Your losses:',  {fontSize:THEME.font.sm, fontFamily:THEME.font.ui, color:THEME.text.muted}));
    d.add(this.add.text(col2, gy, `${r.aLoss}`,    {fontSize:THEME.font.sm, fontFamily:THEME.font.ui, color: r.aLoss > 0 ? THEME.text.red : THEME.text.green}));
    gy += 20;

    if (win && r.loot > 0) {
      d.add(this.add.text(tl,   gy, 'Gold looted:', {fontSize:THEME.font.sm, fontFamily:THEME.font.ui, color:THEME.text.muted}));
      d.add(this.add.text(col2, gy, `+${r.loot}g`, {fontSize:THEME.font.sm, fontFamily:THEME.font.ui, color:THEME.text.gold}));
      gy += 20;
    }
    if (!win) {
      d.add(this.add.text(tl,   gy, 'Gold lost:',   {fontSize:THEME.font.sm, fontFamily:THEME.font.ui, color:THEME.text.muted}));
      d.add(this.add.text(col2, gy, '-50g',         {fontSize:THEME.font.sm, fontFamily:THEME.font.ui, color:THEME.text.red}));
      gy += 20;
    }
    if (win) {
      const xp = r.dLoss * 2;
      const ren = Math.max(1, Math.round(r.dLoss/2));
      d.add(this.add.text(tl,   gy, 'XP / Renown:', {fontSize:THEME.font.sm, fontFamily:THEME.font.ui, color:THEME.text.muted}));
      d.add(this.add.text(col2, gy, `+${xp} XP   +${ren} Renown`, {fontSize:THEME.font.sm, fontFamily:THEME.font.ui, color:THEME.text.gold}));
      gy += 20;
    }

    // Per-troop breakdown with mini bars
    if (troopRows.length > 0) {
      gy += 6;
      const divG2 = this.add.graphics().setScrollFactor(0).setDepth(302);
      divG2.lineStyle(1, THEME.panel.border, 0.4);
      divG2.lineBetween(tl, gy, cx+pw/2-28, gy);
      objs.push(divG2);
      gy += 8;

      d.add(this.add.text(tl, gy, 'Your troops:', {fontSize:THEME.font.xs, fontFamily:THEME.font.ui, color:THEME.text.muted}));
      gy += 16;

      const barW = 80, barH = 7;
      troopRows.forEach(row => {
        d.add(this.add.text(tl, gy, row.name, {fontSize:THEME.font.xs, fontFamily:THEME.font.ui, color:THEME.text.primary}));

        // Bar background
        const bg = this.add.graphics().setScrollFactor(0).setDepth(302);
        bg.fillStyle(0x1a2a3a, 1);
        bg.fillRect(tl+120, gy+1, barW, barH);
        // Before bar (grey)
        bg.fillStyle(0x445566, 1);
        bg.fillRect(tl+120, gy+1, barW, barH);
        // After bar (green or red)
        const frac = row.before > 0 ? row.after / row.before : 0;
        const col  = frac > 0.6 ? 0x44aa44 : frac > 0.3 ? 0xddaa22 : 0xcc3333;
        bg.fillStyle(col, 1);
        bg.fillRect(tl+120, gy+1, Math.round(barW * frac), barH);
        objs.push(bg);

        const lostStr = row.lost > 0 ? ` -${row.lost}` : '';
        d.add(this.add.text(tl+210, gy, `${row.after}/${row.before}${lostStr}`,
          {fontSize:THEME.font.xs, fontFamily:THEME.font.ui, color: row.lost > 0 ? THEME.text.red : THEME.text.green}));
        gy += rowH;
      });
    }

    // Continue button
    gy = top + ph - 44;
    const contBtn = createStyledButton(this, cx, gy, 'Continue →', ()=>{
      this.closePanel();
      this.paused = false;
      this.logTimer = 0;
      this.battleLog = win
        ? `⚔ VICTORY vs ${enemy}! Slain:${r.dLoss} Lost:${r.aLoss} Loot:${r.loot}g`
        : `💀 DEFEAT by ${enemy}! Lost:${r.aLoss}`;
    }, {depth:302, padX:20, padY:8});
    d.add(contBtn);

    objs.push(d);
    this.activePanel = objs;
  }

  // ---- Run Result Panel ----
  showRunResultPanel(escaped, rearLoss, npc) {
    const pw = 380, ph = 240;
    const {objs, cx, cy} = this.panelBg(pw, ph);
    const d  = this.add.container(0,0).setScrollFactor(0).setDepth(301);
    const tl = cx - pw/2 + 28, top = cy - ph/2;

    const titleStr = escaped ? '💨  Escaped!' : '💨  Failed to Flee!';
    const titleCol = escaped ? THEME.text.gold : THEME.text.red;
    d.add(this.add.text(cx, top+18, titleStr, {fontSize:THEME.font.xl, fontFamily:THEME.font.ui, color:titleCol, fontStyle:'bold', stroke:'#000', strokeThickness:3}).setOrigin(0.5,0));

    let gy = top + 58;
    const enemy = npc.lordDef ? npc.lordDef.name : npc.name;
    if (escaped) {
      d.add(this.add.text(tl, gy, `You broke away from ${enemy}.`, {fontSize:THEME.font.sm, fontFamily:THEME.font.ui, color:THEME.text.primary})); gy+=20;
    } else {
      d.add(this.add.text(tl, gy, `${enemy} was too fast — you couldn't escape.`, {fontSize:THEME.font.sm, fontFamily:THEME.font.ui, color:THEME.text.primary})); gy+=20;
    }
    d.add(this.add.text(tl, gy, `Rearguard lost: ${rearLoss} troops`, {fontSize:THEME.font.sm, fontFamily:THEME.font.ui, color:THEME.text.red})); gy+=22;
    if (!escaped) {
      d.add(this.add.text(tl, gy, `You were forced to fight!`, {fontSize:THEME.font.xs, fontFamily:THEME.font.ui, color:THEME.text.muted})); gy+=18;
    }

    const contBtn = createStyledButton(this, cx, top+ph-52, escaped ? 'Continue →' : 'Fight →', ()=>{
      this.closePanel();
      if (!escaped) {
        this.executeFight(npc);
      } else {
        this.paused = false;
        this.battleLog = `💨 Fled from ${enemy}, lost ${rearLoss} rearguard.`;
        this.logTimer = 0;
      }
    }, {depth:302, padX:20, padY:8});
    contBtn.setOrigin(0.5, 0);
    d.add(contBtn);

    objs.push(d);
    this.activePanel = objs;
  }

  npcBattle(a, b) {
    const aC={troops:a.troops.map(t=>({...t}))}; const bC={troops:b.troops.map(t=>({...t}))};
    const r=autoResolve(aC,bC); if(!r) return;
    a.troops=aC.troops; b.troops=bC.troops;
    const bDead = b.troops.reduce((s,t)=>s+t.count,0)<=0;
    const aDead = a.troops.reduce((s,t)=>s+t.count,0)<=0;
    if (r.win && bDead) {
      // If bandit won, loot cargo from caravan/villager
      if (a.type==='bandit' && b.cargo) {
        const loot = Object.entries(b.cargo).map(([g,n])=>`${n} ${g}`).join(', ');
        if (loot) this._worldLog(`Bandits raided ${b.name||'a party'} — looted ${loot}.`);
        b.cargo = {};
      }
      b.alive=false; b.respawnTimer=randInt(20,35); this.drawNPC(b);
    }
    if (!r.win && aDead) {
      // If caravan/villager won (rare), bandits retreat
      if (b.type==='bandit' && a.cargo) {
        const loot = Object.entries(a.cargo).map(([g,n])=>`${n} ${g}`).join(', ');
        if (loot) this._worldLog(`Bandits raided ${a.name||'a party'} — looted ${loot}.`);
        a.cargo = {};
      }
      a.alive=false; a.respawnTimer=randInt(20,35); this.drawNPC(a);
    }
  }

  respawnNPC(npc) {
    npc.alive=true; npc.path=[]; npc.pathIdx=0; npc.retargetTimer=0;
    switch (npc.type) {
      case 'bandit': {
        let gx,gy;
        do { gx=randInt(10,GRID_W-10); gy=randInt(10,GRID_H-10); } while(this.costGrid[gy*GRID_W+gx]>=999);
        npc.x=gx*TILE+TILE/2; npc.y=gy*TILE+TILE/2;
        npc.troops = banditTroops();
        break;
      }
      case 'lord': {
        // Respawn at home town
        const ht = npc.homeTown || randPick(this.towns.filter(t=>t.faction===npc.faction)||this.towns);
        npc.x=ht.x*TILE+TILE/2; npc.y=ht.y*TILE+TILE/2;
        npc.troops = npc.lordDef ? npc.lordDef.troops.map(t=>({...t})) : lordTroops();
        npc.lordState='patrol'; npc.lordTarget=null;
        break;
      }
      case 'villager': {
        // Respawn at home village
        const hv = npc.homeTown;
        if (hv) { npc.x=hv.x*TILE+TILE/2; npc.y=hv.y*TILE+TILE/2; }
        npc.troops     = villagerTroops();
        npc.delivering = true;
        npc.cargo      = hv ? this._villagerLoadCargo(hv) : {};
        break;
      }
      default: {
        // Caravan — respawn at home settlement (town or castle, not village)
        const hubs = this.towns.filter(t=>t.type!=='village');
        const ct = npc.homeTown || randPick(hubs.length ? hubs : this.towns);
        npc.x=ct.x*TILE+TILE/2; npc.y=ct.y*TILE+TILE/2;
        npc.troops   = caravanTroops();
        npc.destTown = randPick((hubs.filter(t=>t!==ct).length ? hubs.filter(t=>t!==ct) : hubs));
        npc.cargo    = this._caravanLoadCargo(ct);
        break;
      }
    }
    this.drawNPC(npc);
  }

  dailyTick() {
    // Snapshot goods for price-trend arrows before anything changes
    this.towns.forEach(t => { t._prevGoods = {...t.goods}; });

    // Refresh market noise ±12% per good per town each day
    this.towns.forEach(t => {
      if (!t._mNoise) t._mNoise = {};
      GOODS.forEach(g => { t._mNoise[g] = (Math.random() - 0.5) * 0.24; });
    });

    // Player wages
    let wages=0;
    player.troops.forEach(t => {
      const def = TROOP_BY_ID[t.id];
      if (def) wages += t.count * def.wage;
    });
    player.gold -= wages;
    if (player.gold < 0) {
      player.troops.forEach(t => { t.count = Math.max(0, t.count - Math.ceil(t.count*0.1)); });
      player.troops = player.troops.filter(t=>t.count>0);
      player.gold = 0;
      this.battleLog = `Day ${this.day}: Can't pay wages! Desertions.`; this.logTimer=0;
    }

    // Settlement recruit pool growth (proportional to prosperity)
    this.towns.forEach(t => {
      const growth = t.tier===0 ? randInt(0,1) : randInt(0,2);
      t.recruitPool = Math.min(20, t.recruitPool + growth);
    });

    // Village production — add goods to village stock each day
    this.towns.filter(t => t.type==='village' || t.tier===0).forEach(v => {
      (v.production||[]).forEach(good => {
        const rate = Math.max(1, Math.round((v.prosperity||50)/30));
        v.goods[good] = Math.min(60, (v.goods[good]||0) + randInt(1, rate));
      });
    });

    // All settlements: slow goods consumption (population uses goods daily)
    this.towns.forEach(t => {
      GOODS.forEach(g => {
        if ((t.goods[g]||0) > 0 && Math.random() < 0.3) {
          t.goods[g] = Math.max(0, t.goods[g] - 1);
        }
      });
    });

    // Lord AI daily decisions
    this.npcs.filter(n => n.alive && n.type==='lord').forEach(lord => {
      this.lordDecideState(lord);
    });

    // Settlement safety update
    this._updateSettlementSafety();
  }

  checkLevelUp() {
    const need = player.level*50;
    if (player.xp >= need) {
      player.xp -= need; player.level++;
      this.showNotification(`Level Up! Now level ${player.level}`);
      this.showLevelUpPanel();
    }
  }

  // ---- Panels ----
  closePanel() {
    if (this.activePanel) {
      this.activePanel.forEach(o => { try { o.destroy(); } catch(e){} });
      this.activePanel = null;
    }
  }

  // ESC key: close sub-panel → if inside settlement, return to its main menu
  onEscKey() {
    const wasInside = this.playerInside && this.playerInsideSett;
    const wasInStay = this.stayMode;
    if (wasInStay) {
      this.endStay(this.playerInsideSett);
      return;
    }
    this.closePanel();
    if (wasInside) {
      this.showSettlementMenu(this.playerInsideSett);
    }
  }

  panelBg(w,h) {
    const cam=this.cameras.main; const cx=cam.width/2, cy=cam.height/2; const objs=[];
    objs.push(this.add.rectangle(cx,cy,cam.width,cam.height,0x000000,THEME.panel.overlayAlpha).setScrollFactor(0).setDepth(300).setInteractive());
    objs.push(drawPanelBg(this,cx,cy,w,h));
    const cl = this.add.text(cx+w/2-18,cy-h/2+7,'✕',{fontSize:'14px',color:THEME.text.muted,fontFamily:THEME.font.ui}).setScrollFactor(0).setDepth(302).setInteractive({useHandCursor:true});
    cl.on('pointerover',()=>cl.setColor(THEME.text.red));
    cl.on('pointerout', ()=>cl.setColor(THEME.text.muted));
    cl.on('pointerdown',()=>this.closePanel());
    objs.push(cl);
    return {objs, cx, cy, w, h};
  }

  enterSettlement(sett) {
    if (this.activePanel) return;
    const pd = dist(this.playerPos, {x:sett.x*TILE+TILE/2, y:sett.y*TILE+TILE/2});
    if (pd > 180) { this.showNotification('Too far! Move closer.'); return; }
    this.playerInside     = true;
    this.playerInsideSett = sett;
    this.playerPath       = [];
    this.pathGfx.clear();
    this.showSettlementMenu(sett);
  }

  showSettlementMenu(sett) {
    this.closePanel();
    const pw=440, ph=320;
    const {objs,cx,cy} = this.panelBg(pw,ph);
    const d = this.add.container(0,0).setScrollFactor(0).setDepth(301);
    const tl=cx-pw/2+24, top=cy-ph/2;

    // Faction banner strip
    const fc = THEME.faction[sett.faction] || 0x888888;
    const banner = this.add.graphics().setScrollFactor(0).setDepth(301);
    banner.fillStyle(fc, 0.18); banner.fillRect(cx-pw/2+2, top+2, pw-4, 48);
    objs.push(banner);

    // Title
    const typeLabel = sett.type==='village' ? 'Village' : sett.type==='castle' ? 'Castle' : sett.tier===2 ? 'City' : 'Town';
    d.add(this.add.text(tl, top+10, sett.name, {fontSize:THEME.font.lg,fontFamily:THEME.font.ui,color:THEME.text.gold,fontStyle:'bold'}));
    d.add(this.add.text(tl, top+32, `${typeLabel}  ·  ${sett.faction}`, {fontSize:THEME.font.xs,fontFamily:THEME.font.ui,color:THEME.text.muted}));

    // Stats row
    let sy = top+60;
    d.add(this.add.text(tl, sy, `Prosperity: ${sett.prosperity}   Safety: ${Math.round(sett.safety||100)}   Recruit pool: ${sett.recruitPool}`, {fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:THEME.text.primary}));
    if (sett.type==='village' && sett.boundTown)
      d.add(this.add.text(tl, sy+18, `Produces: ${(sett.production||[]).join(', ')||'—'}   Supplies: ${sett.boundTown.name}`, {fontSize:THEME.font.xs,fontFamily:THEME.font.ui,color:THEME.text.muted}));

    // Action buttons
    const btnY = top+ph-68, gap=12;
    let bx=tl;
    d.add(createStyledButton(this,bx,btnY,'Trade',       ()=>this.showTradePanel(sett),   {depth:302,padX:14,padY:8})); bx+=90+gap;
    d.add(createStyledButton(this,bx,btnY,'Recruit',     ()=>this.showRecruitPanel(sett), {depth:302,padX:14,padY:8})); bx+=90+gap;
    d.add(createStyledButton(this,bx,btnY,'Stay',        ()=>this.beginStay(sett),        {depth:302,padX:14,padY:8})); bx+=90+gap;
    d.add(createStyledButton(this,bx,btnY,'Leave',       ()=>this.leaveSettlement(),      {depth:302,padX:14,padY:8}));

    objs.push(d);
    this.activePanel = objs;
  }

  // ---- Market price calculation ----
  // Prices are dynamic: low supply → high price, high supply → low price.
  // Safety and prosperity modulate demand. Villages have surplus of their
  // production goods (cheap there), deficit of others (expensive).
  _marketPrice(sett, good) {
    const BASE = { grain:8, iron:15, cloth:12, fish:10 };
    const base = BASE[good] || 10;
    const stock = sett.goods[good] || 0;
    const maxStock = 60;
    // Supply factor: 0 stock → +80% price; maxStock stock → −40%
    const supplyMod = 1.0 + ((maxStock - stock) / maxStock) * 1.2 - 0.4;
    // Demand factor: low safety/prosperity → people need goods more
    const demandMod = 1.0 + (1 - (sett.safety||100)/100) * 0.3
                          + (1 - (sett.prosperity||50)/100) * 0.2;
    // Village surplus: if this is a production good here, it's cheap
    const isProdHere = (sett.production||[]).includes(good);
    const prodMod = isProdHere ? 0.6 : 1.0;
    const raw = Math.round(base * supplyMod * demandMod * prodMod);
    return Math.max(2, raw);
  }

  showTradePanel(sett) {
    this.closePanel();
    const pw=520, ph=420;
    const {objs,cx,cy} = this.panelBg(pw,ph);
    const d = this.add.container(0,0).setScrollFactor(0).setDepth(301);
    const tl=cx-pw/2+20, top=cy-ph/2;

    d.add(this.add.text(tl, top+12, `Market — ${sett.name}`, {fontSize:THEME.font.lg,fontFamily:THEME.font.ui,color:THEME.text.gold,fontStyle:'bold'}));
    d.add(this.add.text(tl, top+36, `Prosperity: ${sett.prosperity}   Safety: ${Math.round(sett.safety||100)}`,
      {fontSize:THEME.font.xs,fontFamily:THEME.font.ui,color:THEME.text.muted}));

    // Column headers
    let gy=top+58;
    const colGood=tl, colStock=tl+120, colBuy=tl+185, colSell=tl+265, colInv=tl+360;
    d.add(this.add.text(colGood,  gy, 'Good',       {fontSize:THEME.font.xs,fontFamily:THEME.font.ui,color:THEME.text.muted}));
    d.add(this.add.text(colStock, gy, 'Stock',      {fontSize:THEME.font.xs,fontFamily:THEME.font.ui,color:THEME.text.muted}));
    d.add(this.add.text(colBuy,   gy, 'Buy',        {fontSize:THEME.font.xs,fontFamily:THEME.font.ui,color:THEME.text.muted}));
    d.add(this.add.text(colSell,  gy, 'Sell',       {fontSize:THEME.font.xs,fontFamily:THEME.font.ui,color:THEME.text.muted}));
    d.add(this.add.text(colInv,   gy, 'You have',   {fontSize:THEME.font.xs,fontFamily:THEME.font.ui,color:THEME.text.muted}));
    gy+=18;

    // Divider
    const divG = this.add.graphics().setScrollFactor(0).setDepth(302);
    divG.lineStyle(1,THEME.panel.border,0.4); divG.lineBetween(tl,gy,cx+pw/2-20,gy);
    objs.push(divG); gy+=8;

    GOODS.forEach(good => {
      const stock    = sett.goods[good] || 0;
      const buyPrice = calcBuyPrice(sett, good);
      const sellPrice= calcSellPrice(sett, good);
      const trend    = pricetrend(sett, good);
      const invQty   = player.inventory[good] || 0;
      const isProd   = (sett.production||[]).includes(good);
      const stockColor = stock < 5 ? THEME.text.red : stock > 30 ? THEME.text.green : THEME.text.primary;
      const trendColor = trend === '↑' ? THEME.text.red : trend === '↓' ? THEME.text.green : THEME.text.muted;
      const goodLabel  = isProd ? `★ ${good}` : good;

      d.add(this.add.text(colGood,  gy, goodLabel,                 {fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:isProd?THEME.text.gold:THEME.text.primary}));
      d.add(this.add.text(colStock, gy, `${stock}`,                {fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:stockColor}));
      d.add(this.add.text(colBuy,   gy, `${buyPrice}g`,            {fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:THEME.text.primary}));
      d.add(this.add.text(colBuy+38,gy, trend,                     {fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:trendColor}));
      d.add(this.add.text(colSell,  gy, `${sellPrice}g`,           {fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:THEME.text.muted}));
      d.add(this.add.text(colInv,   gy, `${invQty}`,               {fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:invQty>0?THEME.text.gold:THEME.text.muted}));

      // Buy button
      d.add(createStyledButton(this, colBuy+36, gy-2, '+1', ()=>{
        if(player.gold < buyPrice){ this.showNotification('Not enough gold!'); return; }
        player.gold -= buyPrice;
        player.inventory[good] = (player.inventory[good]||0) + 1;
        sett.goods[good] = Math.max(0, (sett.goods[good]||0) - 1);
        this.showNotification(`Bought ${good} for ${buyPrice}g`);
        this.showTradePanel(sett);
      }, {depth:302,padX:5,padY:2}));

      // Sell button (only if player has inventory)
      if (invQty > 0) {
        d.add(createStyledButton(this, colSell+36, gy-2, '-1', ()=>{
          player.inventory[good]--;
          player.gold += sellPrice;
          sett.goods[good] = (sett.goods[good]||0) + 1;
          sett.prosperity = Math.min(100, (sett.prosperity||50) + 1);
          this.showNotification(`Sold ${good} for ${sellPrice}g`);
          this.showTradePanel(sett);
        }, {depth:302,padX:5,padY:2}));
      }
      gy+=24;
    });

    // Profit tip
    gy += 4;
    d.add(this.add.text(tl, gy, '★ = produced here (surplus, cheaper)   Low stock → higher price',
      {fontSize:THEME.font.xs,fontFamily:THEME.font.ui,color:THEME.text.muted}));

    d.add(createStyledButton(this,cx,top+ph-44,'← Back',()=>this.showSettlementMenu(sett),{depth:302,padX:16,padY:8}));
    objs.push(d);
    this.activePanel = objs;
  }

  showRecruitPanel(sett) {
    this.closePanel();
    const pw=460, ph=380;
    const {objs,cx,cy} = this.panelBg(pw,ph);
    const d = this.add.container(0,0).setScrollFactor(0).setDepth(301);
    const tl=cx-pw/2+20, top=cy-ph/2;

    d.add(this.add.text(tl,top+12,`Recruit — ${sett.name}`,{fontSize:THEME.font.lg,fontFamily:THEME.font.ui,color:THEME.text.gold,fontStyle:'bold'}));
    d.add(this.add.text(tl,top+34,`Pool: ${sett.recruitPool}   Faction: ${sett.faction}`,{fontSize:THEME.font.xs,fontFamily:THEME.font.ui,color:THEME.text.muted}));
    let gy=top+62;

    // Recruit villager
    const vDef=TROOP_BY_ID[0];
    d.add(createStyledButton(this,tl,gy,`Recruit Villager  (${vDef.cost}g)`,()=>{
      if(sett.recruitPool<=0){this.showNotification('No recruits available!');return;}
      if(player.gold<vDef.cost){this.showNotification('Not enough gold!');return;}
      player.gold-=vDef.cost; sett.recruitPool--;
      const ex=player.troops.find(t=>t.id===0);
      if(ex) ex.count++; else player.troops.push({id:0,count:1});
      this.showNotification('Recruited a Villager');
      this.showRecruitPanel(sett);
    },{depth:302,padX:8,padY:4}));
    gy+=32;

    // Troop upgrades
    const upgradeable=player.troops.filter(t=>TROOP_UPGRADES[t.id]);
    if(upgradeable.length){
      d.add(this.add.text(tl,gy,'— Upgrade Troops —',{fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:THEME.text.muted})); gy+=18;
      upgradeable.forEach(t=>{
        const upg=TROOP_UPGRADES[t.id], def=TROOP_BY_ID[t.id], next=TROOP_BY_ID[upg.to];
        const xp=player.troopXP[t.id]||0, ready=xp>=upg.xp;
        d.add(this.add.text(tl,gy,`${def.name} ×${t.count}  →  ${next.name}   XP:${xp}/${upg.xp}   Cost:${upg.cost}g`,
          {fontSize:THEME.font.xs,fontFamily:THEME.font.ui,color:ready?THEME.text.green:THEME.text.muted}));
        if(ready){
          const fromId=t.id;
          d.add(createStyledButton(this,tl+310,gy,'Upgrade',()=>{
            if(player.gold<upg.cost){this.showNotification('Not enough gold!');return;}
            player.gold-=upg.cost; player.troopXP[fromId]=0;
            const ex=player.troops.find(s=>s.id===upg.to&&s!==t);
            if(ex){ex.count+=t.count;player.troops=player.troops.filter(s=>s!==t);}
            else  {t.id=upg.to;}
            this.showNotification(`Upgraded to ${next.name}!`);
            this.showRecruitPanel(sett);
          },{depth:302,padX:6,padY:2}));
        }
        gy+=18;
      });
    }

    d.add(createStyledButton(this,cx,top+ph-44,'← Back',()=>this.showSettlementMenu(sett),{depth:302,padX:16,padY:8}));
    objs.push(d);
    this.activePanel = objs;
  }

  beginStay(sett) {
    this.closePanel();
    this.stayMode = true;
    const pw=320, ph=160;
    const {objs,cx,cy} = this.panelBg(pw,ph);
    const d = this.add.container(0,0).setScrollFactor(0).setDepth(301);
    const top=cy-ph/2;
    d.add(this.add.text(cx,top+20,`Resting at ${sett.name}`,{fontSize:THEME.font.md,fontFamily:THEME.font.ui,color:THEME.text.gold,fontStyle:'bold'}).setOrigin(0.5,0));
    d.add(this.add.text(cx,top+46,'Time passes safely...',{fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:THEME.text.muted}).setOrigin(0.5,0));
    d.add(createStyledButton(this,cx,top+90,'Stop Waiting',()=>this.endStay(sett),{depth:302,padX:16,padY:8}));
    objs.push(d);
    this.activePanel = objs;
  }

  endStay(sett) {
    this.stayMode = false;
    this.closePanel();
    this.showSettlementMenu(sett);
  }

  leaveSettlement() {
    const sett = this.playerInsideSett;
    this.playerInside     = false;
    this.playerInsideSett = null;
    this.stayMode         = false;
    this.closePanel();
    if (sett) {
      const ep = this._findExitPoint(sett);
      this.playerPos.x = ep.x*TILE+TILE/2;
      this.playerPos.y = ep.y*TILE+TILE/2;
      this.drawPlayer();
      this.camTarget.x = this.playerPos.x;
      this.camTarget.y = this.playerPos.y;
    }
    this.paused = false;
  }

  _findExitPoint(sett) {
    // Search outward from settlement for the nearest passable tile
    for (let r=2; r<=8; r++) {
      for (let dy=-r; dy<=r; dy++) {
        for (let dx=-r; dx<=r; dx++) {
          if (Math.abs(dx)!==r && Math.abs(dy)!==r) continue; // ring edge only
          const nx=clamp(sett.x+dx,0,GRID_W-1), ny=clamp(sett.y+dy,0,GRID_H-1);
          if (this.costGrid[ny*GRID_W+nx] < 999) return {x:nx,y:ny};
        }
      }
    }
    return {x:sett.x,y:sett.y};
  }

  showPartyPanel() {
    if (this.activePanel) return;
    const pw=400, ph=320;
    const {objs,cx,cy} = this.panelBg(pw,ph);
    const d=this.add.container(0,0).setScrollFactor(0).setDepth(301);
    const tl=cx-pw/2+20, tr=cy-ph/2;
    d.add(this.add.text(tl,tr+12,'Your Party',{fontSize:THEME.font.lg,fontFamily:THEME.font.ui,color:THEME.text.gold,fontStyle:'bold'}));
    let gy2=tr+42;
    d.add(this.add.text(tl,gy2,`Gold: ${player.gold}   Power: ${calcPower(player)}   Renown: ${player.renown}   Lv${player.level}`,{fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:THEME.text.primary})); gy2+=22;

    // Summary by kind
    const inf = countKind(player.troops,'infantry');
    const cav = countKind(player.troops,'cavalry');
    const arc = countKind(player.troops,'archer');
    const vil = countKind(player.troops,'villager');
    d.add(this.add.text(tl,gy2,`Infantry: ${inf}   Cavalry: ${cav}   Archers: ${arc}   Villagers: ${vil}`,{fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:THEME.text.primary})); gy2+=20;

    // Wages
    let wages=0; player.troops.forEach(t=>{const def=TROOP_BY_ID[t.id];if(def)wages+=t.count*def.wage;});
    d.add(this.add.text(tl,gy2,`Daily wages: ${wages}g`,{fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:THEME.text.muted})); gy2+=20;

    d.add(this.add.text(tl,gy2,'Troops:',{fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:THEME.text.muted})); gy2+=16;
    player.troops.forEach(t => {
      const def = TROOP_BY_ID[t.id];
      if (!def) return;
      const kindLabel = def.kind.charAt(0).toUpperCase()+def.kind.slice(1);
      d.add(this.add.text(tl,gy2,`  [${kindLabel}] ${def.name} ×${t.count}   ${t.count*def.wage}g/day`,{fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:THEME.text.primary}));
      gy2+=16;
    });

    gy2+=4;
    d.add(this.add.text(tl,gy2,'Skills:',{fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:THEME.text.muted})); gy2+=16;
    Object.entries(player.skills).forEach(([k,v]) => {
      d.add(this.add.text(tl,gy2,`  ${k}: ${v}`,{fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:THEME.text.primary}));
      gy2+=14;
    });
    objs.push(d);
    this.activePanel=objs;
  }

  showInventoryPanel() {
    if (this.activePanel) return;
    const pw=320, ph=240;
    const {objs,cx,cy} = this.panelBg(pw,ph);
    const d=this.add.container(0,0).setScrollFactor(0).setDepth(301);
    const tl=cx-pw/2+20, tr=cy-ph/2;
    d.add(this.add.text(tl,tr+12,'Inventory',{fontSize:THEME.font.lg,fontFamily:THEME.font.ui,color:THEME.text.gold,fontStyle:'bold'}));
    let gy2=tr+42;
    GOODS.forEach(good => {
      const qty=player.inventory[good]||0;
      d.add(this.add.text(tl,gy2,`${good}: ${qty}`,{fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:THEME.text.primary}));
      if (qty>0) {
        const sell = createStyledButton(this, tl+180, gy2, 'Sell 1', ()=>{
          const price=Math.round(12+Math.random()*10);
          player.inventory[good]--; player.gold+=price;
          this.showNotification(`Sold ${good} for ${price}g`);
        }, {depth:302,padX:6,padY:2});
        d.add(sell);
      }
      gy2+=22;
    });
    objs.push(d);
    this.activePanel=objs;
  }

  // ---- Visual helpers ----

  /** Soft faction-coloured blobs showing political territory on the map */
  drawFactionTerritories() {
    const rt = this.add.renderTexture(0, 0, MAP_W, MAP_H).setOrigin(0).setDepth(2);
    const g  = this.make.graphics({add: false});
    // Draw smallest tier first so capitals paint on top
    const sorted = [...this.towns].sort((a,b) => a.tier - b.tier);
    sorted.forEach(t => {
      const fc = THEME.faction[t.faction] || 0x888888;
      const px = t.x * TILE + TILE/2, py = t.y * TILE + TILE/2;
      if (t.tier === 2) {
        g.fillStyle(fc, 0.07); g.fillCircle(px, py, 340);
        g.fillStyle(fc, 0.05); g.fillCircle(px, py, 200);
      } else if (t.type !== 'village') {
        g.fillStyle(fc, 0.06); g.fillCircle(px, py, 210);
        g.fillStyle(fc, 0.04); g.fillCircle(px, py, 120);
      } else {
        g.fillStyle(fc, 0.04); g.fillCircle(px, py, 100);
      }
    });
    rt.draw(g); g.destroy();
  }

  /** Screen-edge vignette — darkens corners for a cinematic look */
  _drawVignette(w, h) {
    const g = this._vignette; g.clear();
    const steps = 12;
    for (let i = 0; i < steps; i++) {
      const pad = (steps - i) * 24;
      const a   = Math.pow((steps - i) / steps, 2) * 0.30;
      g.fillStyle(0x000000, a);
      g.fillRect(0,     0,     w, pad);       // top
      g.fillRect(0,     h-pad, w, pad);       // bottom
      g.fillRect(0,     0,     pad, h);       // left
      g.fillRect(w-pad, 0,     pad, h);       // right
    }
  }

  /** Thin faction-coloured bar along the bottom edge of the HUD strip */
  _drawFactionStrip(w) {
    const g = this.hudFactionStrip; if (!g) return; g.clear();
    const fc = THEME.faction[player.faction] || 0x6688aa;
    g.fillStyle(fc, 0.55);
    g.fillRect(0, THEME.hud.height - 2, w, 2);
  }

  showLevelUpPanel() {
    if (this.activePanel) this.closePanel();
    const pw=340, ph=220;
    const {objs,cx,cy} = this.panelBg(pw,ph);
    const d=this.add.container(0,0).setScrollFactor(0).setDepth(301);
    const tl=cx-pw/2+20, tr=cy-ph/2;
    d.add(this.add.text(cx,tr+18,'⭐ Level Up!',{fontSize:THEME.font.xl,fontFamily:THEME.font.ui,color:THEME.text.gold,fontStyle:'bold'}).setOrigin(0.5,0));
    d.add(this.add.text(cx,tr+50,`Level ${player.level} — choose a skill:`,{fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:THEME.text.primary}).setOrigin(0.5,0));
    let bx2=cx-160;
    Object.keys(player.skills).forEach(skill => {
      const btn=createStyledButton(this,bx2,tr+90,`+${skill}`,()=>{
        player.skills[skill]++;
        this.showNotification(`${skill} → ${player.skills[skill]}`);
        this.closePanel();
      },{depth:302,padX:10,padY:5});
      d.add(btn); bx2+=85;
    });
    objs.push(d);
    this.activePanel=objs;
  }
}