// ============================================================
// WorldScene.js — Main Phaser scene: world map, NPCs, HUD
// Depends on (must be loaded before this file):
//   config.js, utils/Noise.js, utils/MinHeap.js,
//   utils/helpers.js, systems/AStar.js, world/Roads.js,
//   entities/Player.js, ui/Panel.js
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

    // Terrain
    this.terrainGrid = new Uint8Array(GRID_W * GRID_H);
    this.costGrid    = new Float32Array(GRID_W * GRID_H);
    this.generateTerrain();
    this.renderTerrain();

    // Towns
    this.towns = this.placeTowns(8);
    this.renderTerrainOverlays();
    this.drawTowns();

    // Pathfinder
    this.pathfinder = new AStar(this.costGrid, GRID_W, GRID_H);

    // Player sprite
    this.playerGfx = this.add.graphics().setDepth(50);
    const st = this.towns[0];
    this.playerPos  = { x: st.x*TILE+TILE/2, y: st.y*TILE+TILE/2 };
    this.playerPath = [];
    this.playerPathIdx = 0;
    this.drawPlayer();

    // Camera
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.camTarget = { x: this.playerPos.x, y: this.playerPos.y };
    this.cameras.main.startFollow(this.camTarget, false, 0.08, 0.08);
    this.cameras.main.setZoom(2);

    // Path preview
    this.pathGfx = this.add.graphics().setDepth(40);

    // Click to move
    this.input.on('pointerdown', (ptr) => {
      if (this.activePanel) return;
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
    this.towns.forEach((t,i) => {
      if (i%2===0) this.spawnNPC(
        `Lord of ${t.name}`, t.faction, t.x, t.y, 'lord',
        [{tier:1,count:randInt(10,18)},{tier:2,count:randInt(4,9)},{tier:3,count:randInt(1,4)}]
      );
    });
    for (let i=0; i<8; i++) {
      let gx, gy;
      do { gx=randInt(5,GRID_W-5); gy=randInt(5,GRID_H-5); }
      while (this.costGrid[gy*GRID_W+gx] >= 999);
      this.spawnNPC('Bandit Gang','Bandit',gx,gy,'bandit',
        [{tier:0,count:randInt(5,18)},{tier:1,count:randInt(0,5)}]);
    }
    for (let i=0; i<4; i++) {
      const t = randPick(this.towns);
      this.spawnNPC('Caravan', t.faction, t.x, t.y, 'caravan',
        [{tier:0,count:randInt(3,7)},{tier:1,count:randInt(1,3)}]);
    }

    // HUD
    this.createHUD();

    // Keyboard shortcuts
    this.input.keyboard.addKey('SPACE').on('down', ()=>this.togglePause());
    this.input.keyboard.addKey('P').on('down',     ()=>this.showPartyPanel());
    this.input.keyboard.addKey('I').on('down',     ()=>this.showInventoryPanel());
    this.input.keyboard.addKey('ESC').on('down',   ()=>this.closePanel());
    this.input.keyboard.addKey('ONE').on('down',   ()=>this.gameSpeed=1);
    this.input.keyboard.addKey('TWO').on('down',   ()=>this.gameSpeed=2);
    this.input.keyboard.addKey('THREE').on('down', ()=>this.gameSpeed=4);

    // Scroll-wheel zoom
    this.input.on('wheel', (p,go,dx,dy) => {
      this.cameras.main.setZoom(clamp(this.cameras.main.zoom - dy*0.001, 0.8, 4));
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

    // Coastline shadow
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

    // Forest canopy dots
    for (let y=0; y<GRID_H; y+=2) { for (let x=0; x<GRID_W; x+=2) {
      const tid = this.terrainGrid[y*GRID_W+x];
      if (tid!==TERRAIN.FOREST.id && tid!==TERRAIN.DENSE_FOREST.id) continue;
      const alpha = tid===TERRAIN.DENSE_FOREST.id ? 0.32 : 0.20;
      g.fillStyle(0x002200, alpha);
      const ox=(x*7+y*3)%4, oy=(y*5+x*2)%4;
      g.fillCircle(x*TILE+ox+2, y*TILE+oy+2, 2.2);
    }}

    // Mountain ridge highlights
    for (let y=1; y<GRID_H; y++) { for (let x=0; x<GRID_W; x++) {
      const tid = this.terrainGrid[y*GRID_W+x];
      if (tid!==TERRAIN.MOUNTAIN.id && tid!==TERRAIN.SNOW.id) continue;
      const above = this.terrainGrid[(y-1)*GRID_W+x];
      if (above!==TERRAIN.MOUNTAIN.id && above!==TERRAIN.SNOW.id) {
        g.fillStyle(0xffffff,0.14); g.fillRect(x*TILE, y*TILE, TILE, 2);
      }
    }}

    // Roads
    const drawn = new Set();
    this.towns.forEach((a,ai) => {
      const conns = a.tier===2?3 : a.tier===1?2 : 1;
      const sorted = this.towns
        .map((b,bi) => ({b,bi,d:Math.hypot(b.x-a.x,b.y-a.y)}))
        .filter(({bi}) => bi!==ai)
        .sort((p,q) => p.d-q.d)
        .slice(0, conns);
      sorted.forEach(({b,bi}) => {
        const key = Math.min(ai,bi)+','+Math.max(ai,bi);
        if (drawn.has(key)) return; drawn.add(key);
        const path = roadAStar(this.terrainGrid, a.x,a.y,b.x,b.y);
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
    });

    rt.draw(g); g.destroy();
  }

  placeTowns(count) {
    const names    = ['Riverholt','Ashford','Thornwall','Dustmere','Frostpeak','Goldmere','Crestfall','Windhaven'];
    const factions = ['Kingdom','Kingdom','Kingdom','Empire','Empire','Empire','Rebels','Rebels'];
    const tiers    = [2,1,1,2,1,1,0,0];
    const towns=[]; const minD=35;
    for (let i=0; i<count; i++) {
      let att=0, gx, gy;
      do {
        gx=randInt(20,GRID_W-20); gy=randInt(20,GRID_H-20); att++;
      } while (att<500 && (
        this.costGrid[gy*GRID_W+gx]>=999 ||
        this.terrainGrid[gy*GRID_W+gx]===TERRAIN.SAND.id ||
        towns.some(t => Math.abs(t.x-gx)+Math.abs(t.y-gy)<minD)
      ));
      towns.push({
        name: names[i], x: gx, y: gy, faction: factions[i], tier: tiers[i] || 0,
        goods: { grain:randInt(8,30), iron:randInt(10,55), cloth:randInt(10,40), fish:randInt(5,35) },
        recruitPool: randInt(5,12),
      });
    }
    return towns;
  }

  drawTowns() {
    this.towns.forEach(t => {
      const px=t.x*TILE+TILE/2, py=t.y*TILE+TILE/2;
      const fc   = THEME.faction[t.faction] || 0x888888;
      const tier = t.tier || 0;
      const hover = this.add.graphics().setDepth(29);
      const g     = this.add.graphics().setDepth(30);

      if (tier===0) {
        g.fillStyle(fc,0.12); g.fillCircle(px,py,7);
        g.fillStyle(0xb8a070); g.fillRect(px-3,py-3,7,7);
        g.lineStyle(1,fc,0.65); g.strokeRect(px-3,py-3,7,7);
        this.add.text(px,py+6,t.name,{fontSize:THEME.font.xs,fontFamily:THEME.font.ui,color:THEME.text.muted,stroke:'#000',strokeThickness:1}).setOrigin(0.5,0).setDepth(31);
        const zone = this.add.zone(px,py,16,16).setInteractive({useHandCursor:true}).setDepth(55);
        zone.on('pointerover',()=>{hover.clear();hover.fillStyle(0xffffff,0.10);hover.fillCircle(px,py,9);});
        zone.on('pointerout', ()=>hover.clear());
        zone.on('pointerdown',(ptr)=>{ptr.event.stopPropagation();this.enterTown(t);});

      } else if (tier===1) {
        g.fillStyle(fc,0.18); g.fillCircle(px,py,11);
        g.fillStyle(0xd4c090); g.fillRect(px-5,py-5,10,10);
        g.fillStyle(0xb89a60);
        g.fillRect(px-5,py-8,3,3); g.fillRect(px-1,py-8,3,3); g.fillRect(px+3,py-8,3,3);
        g.lineStyle(1.5,fc,0.9); g.strokeRect(px-5,py-5,10,10);
        g.fillStyle(0x1a1208); g.fillRect(px-1,py+1,3,4);
        this.add.text(px,py+9,t.name,{fontSize:THEME.font.xs,fontFamily:THEME.font.ui,color:THEME.text.gold,stroke:'#000',strokeThickness:2}).setOrigin(0.5,0).setDepth(31);
        const zone = this.add.zone(px,py,24,24).setInteractive({useHandCursor:true}).setDepth(55);
        zone.on('pointerover',()=>{hover.clear();hover.fillStyle(0xffffff,0.14);hover.fillCircle(px,py,13);});
        zone.on('pointerout', ()=>hover.clear());
        zone.on('pointerdown',(ptr)=>{ptr.event.stopPropagation();this.enterTown(t);});

      } else {
        g.fillStyle(fc,0.08); g.fillCircle(px,py,20);
        g.fillStyle(fc,0.22); g.fillCircle(px,py,14);
        g.fillStyle(0xe8d898); g.fillRect(px-7,py-6,14,13);
        g.fillStyle(0xf4e8a8,0.45); g.fillRect(px-6,py-6,12,2);
        g.fillStyle(0xc8a860);
        g.fillRect(px-7,py-9,2,3); g.fillRect(px-4,py-9,2,3); g.fillRect(px-1,py-9,2,3);
        g.fillRect(px+2,py-9,2,3); g.fillRect(px+5,py-9,2,3);
        g.lineStyle(2,fc,1.0); g.strokeRect(px-7,py-6,14,13);
        g.fillStyle(0xffd866,0.9); g.fillCircle(px,py-11,2);
        g.fillStyle(0x1a1208); g.fillRect(px-2,py+2,4,5);
        this.add.text(px,py+10,t.name,{fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:THEME.text.gold,stroke:'#000',strokeThickness:2,fontStyle:'bold'}).setOrigin(0.5,0).setDepth(31);
        const zone = this.add.zone(px,py,36,36).setInteractive({useHandCursor:true}).setDepth(55);
        zone.on('pointerover',()=>{hover.clear();hover.fillStyle(0xffffff,0.12);hover.fillCircle(px,py,18);});
        zone.on('pointerout', ()=>hover.clear());
        zone.on('pointerdown',(ptr)=>{ptr.event.stopPropagation();this.enterTown(t);});
      }
    });
  }

  // ---- NPCs ----
  spawnNPC(name, faction, gx, gy, type, troops) {
    const g = this.add.graphics().setDepth(45);
    const npc = {
      name, faction, type, troops,
      x: gx*TILE+TILE/2, y: gy*TILE+TILE/2,
      graphics: g, path: [], pathIdx: 0,
      speed: type==='bandit'?45 : type==='caravan'?30 : 50,
      alive: true, respawnTimer: 0, retargetTimer: 0
    };
    this.drawNPC(npc); this.npcs.push(npc);
  }

  drawNPC(npc) {
    npc.graphics.clear(); if (!npc.alive) return;
    const c = THEME.faction[npc.faction] || 0x888888;
    if (npc.type==='lord') {
      npc.graphics.fillStyle(0x000000,0.4); npc.graphics.fillRect(-4,-4,10,10);
      npc.graphics.fillStyle(c,0.9);        npc.graphics.fillRect(-5,-5,10,10);
      npc.graphics.lineStyle(1.5,0xffd866,0.85); npc.graphics.strokeRect(-5,-5,10,10);
    } else if (npc.type==='bandit') {
      npc.graphics.fillStyle(0x000000,0.4); npc.graphics.fillCircle(1,1,5);
      npc.graphics.fillStyle(c,0.85);       npc.graphics.fillCircle(0,0,5);
      npc.graphics.fillStyle(0x000000,0.45);npc.graphics.fillCircle(0,0,2);
    } else {
      npc.graphics.fillStyle(0x000000,0.3); npc.graphics.fillTriangle(1,-4,-3,5,5,5);
      npc.graphics.fillStyle(c,0.85);       npc.graphics.fillTriangle(0,-5,-4,4,4,4);
    }
    npc.graphics.setPosition(npc.x, npc.y);
  }

  drawPlayer() {
    this.playerGfx.clear();
    this.playerGfx.fillStyle(0xffdd44,0.06); this.playerGfx.fillCircle(0,0,15);
    this.playerGfx.fillStyle(0xffdd44,0.12); this.playerGfx.fillCircle(0,0,10);
    this.playerGfx.fillStyle(0x000000,0.35); this.playerGfx.fillTriangle(1,-7,-5,7,7,7);
    this.playerGfx.fillStyle(0xffffff,0.95); this.playerGfx.fillTriangle(0,-8,-6,6,6,6);
    this.playerGfx.lineStyle(1.5,0xffdd44,1.0); this.playerGfx.strokeTriangle(0,-8,-6,6,6,6);
    this.playerGfx.setPosition(this.playerPos.x, this.playerPos.y);
  }

  drawPathPreview(path) {
    this.pathGfx.clear();
    this.pathGfx.lineStyle(1, 0xffdd44, 0.3);
    this.pathGfx.beginPath();
    path.forEach((p,i) => {
      const px=p.x*TILE+TILE/2, py=p.y*TILE+TILE/2;
      if (i===0) this.pathGfx.moveTo(px,py); else this.pathGfx.lineTo(px,py);
    });
    this.pathGfx.strokePath();
  }

  // ---- Threat map for NPC A* avoidance ----
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

  npcPickTarget(npc) {
    if (npc.type==='bandit') {
      const myPow = calcPower(npc);
      if (calcPower(player)<myPow*0.7 && dist(npc,this.playerPos)<300)
        return { x:Math.floor(this.playerPos.x/TILE), y:Math.floor(this.playerPos.y/TILE) };
      let weak=null, wd=Infinity;
      this.npcs.forEach(o => {
        if (!o.alive||o===npc||o.faction===npc.faction) return;
        if (o.type==='caravan' && calcPower(o)<myPow) { const d=dist(npc,o); if(d<wd){wd=d;weak=o;} }
      });
      if (weak && wd<400) return { x:Math.floor(weak.x/TILE), y:Math.floor(weak.y/TILE) };
      let gx,gy;
      do { gx=randInt(10,GRID_W-10); gy=randInt(10,GRID_H-10); } while(this.costGrid[gy*GRID_W+gx]>=999);
      return {x:gx,y:gy};
    }
    if (npc.type==='caravan') { const t=randPick(this.towns); return {x:t.x,y:t.y}; }
    const ft = this.towns.filter(t => t.faction===npc.faction);
    const t  = randPick(ft.length ? ft : this.towns);
    return { x:clamp(t.x+randInt(-3,3),0,GRID_W-1), y:clamp(t.y+randInt(-3,3),0,GRID_H-1) };
  }

  npcRepath(npc) {
    const tgt = this.npcPickTarget(npc);
    const gx  = clamp(Math.floor(npc.x/TILE), 0, GRID_W-1);
    const gy  = clamp(Math.floor(npc.y/TILE), 0, GRID_H-1);
    const threatMap = this.buildThreatMap(npc);
    const path = this.pathfinder.findPath(gx, gy, clamp(tgt.x,0,GRID_W-1), clamp(tgt.y,0,GRID_H-1), threatMap);
    if (path && path.length>1) { npc.path=path; npc.pathIdx=1; }
    npc.retargetTimer = randInt(4,10);
  }

  // ---- HUD ----
  createHUD() {
    const cam=this.cameras.main, w=cam.width, h=cam.height;
    this._notifications = [];
    this._logHistory    = [];
    this._lastNotifLog  = '';

    // Top bar
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

    // Event log (bottom-left)
    const lw=THEME.log.w, lh=THEME.log.h;
    this.logPanel = this.add.rectangle(0,h-lh,lw,lh,THEME.panel.fill,0.82).setOrigin(0,0).setScrollFactor(0).setDepth(198);
    this.logPanelBorder = this.add.graphics().setScrollFactor(0).setDepth(199);
    this.logPanelBorder.lineStyle(1,THEME.panel.border,0.6);
    this.logPanelBorder.strokeRect(0,h-lh,lw,lh);
    this.logText    = this.add.text(10,h-lh+8,'',{fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:THEME.text.gold,wordWrap:{width:lw-20},lineSpacing:4,stroke:'#000',strokeThickness:1}).setScrollFactor(0).setDepth(201);
    this.terrainTip = this.add.text(10,h-14,'',{fontSize:THEME.font.xs,fontFamily:THEME.font.mono,color:THEME.text.muted}).setScrollFactor(0).setDepth(201);

    // Minimap
    const mw=THEME.minimap.w, mh=THEME.minimap.h;
    const mx=w-mw-THEME.spacing.pad, my=h-mh-THEME.spacing.pad;
    this.minimapFrameGfx  = drawMinimapFrame(this,mx,my,mw,mh);
    this.minimapTex       = this.add.renderTexture(mx,my,mw,mh).setScrollFactor(0).setDepth(200);
    this.minimapBorderGfx = drawMinimapBorder(this,mx,my,mw,mh);
    this.minimapGfx       = this.make.graphics({add:false});
    this._mmW=mw; this._mmH=mh;
    this.drawMinimap();

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
      if      (n.timer >= n.life)         { n.obj.destroy(); this._notifications.splice(i,1); }
      else if (n.timer >= n.life-1.0)     { n.obj.setAlpha(Math.max(0, 1-(n.timer-(n.life-1.0)))); }
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
      const fc=THEME.faction[t.faction]||0xffffff, tier=t.tier||0;
      if      (tier===2) { g.fillStyle(fc,0.9);g.fillRect(tx-3,ty-3,7,7); g.fillStyle(0xffd866,1.0);g.fillRect(tx-1,ty-1,3,3); }
      else if (tier===1) { g.fillStyle(fc,0.8);g.fillRect(tx-2,ty-2,5,5); g.fillStyle(0xffffff,0.9);g.fillRect(tx-1,ty-1,3,3); }
      else               { g.fillStyle(fc,0.55);g.fillRect(tx-1,ty-1,3,3); }
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

  // ---- Main update loop ----
  update(time, delta) {
    this.updateHUD();
    this._tickNotifications(delta/1000);
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

    // NPC movement
    this.npcs.forEach(npc => {
      if (!npc.alive) { npc.respawnTimer-=dt; if(npc.respawnTimer<=0) this.respawnNPC(npc); return; }
      npc.retargetTimer-=dt;
      if (npc.retargetTimer<=0 || npc.path.length===0 || npc.pathIdx>=npc.path.length) this.npcRepath(npc);
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
      this.drawNPC(npc);
      if (dist(npc,this.playerPos)<12) this.handleEncounter(npc);
    });

    // NPC vs NPC battles
    for (let i=0; i<this.npcs.length; i++) { for (let j=i+1; j<this.npcs.length; j++) {
      const a=this.npcs[i], b=this.npcs[j];
      if (!a.alive||!b.alive||a.faction===b.faction) continue;
      if (a.type==='caravan'&&b.type==='caravan') continue;
      if (dist(a,b)<12) this.npcBattle(a,b);
    }}

    if (time%500 < 20) this.drawMinimap();
  }

  handleEncounter(npc) {
    if (npc.type==='bandit') {
      this.paused=true;
      const aC={troops:player.troops.map(t=>({...t})), skills:player.skills};
      const dC={troops:npc.troops.map(t=>({...t}))};
      const r=autoResolve(aC,dC); if(!r) return;
      player.troops=aC.troops; npc.troops=dC.troops;
      if (r.win) {
        player.gold+=r.loot; player.xp+=r.dLoss*2; player.renown+=Math.max(1,Math.round(r.dLoss/2));
        this.battleLog=`⚔ VICTORY vs ${npc.name}! Slain:${r.dLoss} Lost:${r.aLoss} Loot:${r.loot}g`;
        npc.alive=false; npc.respawnTimer=25; this.drawNPC(npc);
      } else {
        player.gold=Math.max(0,player.gold-50);
        this.battleLog=`💀 DEFEAT by ${npc.name}! Lost:${r.aLoss}`;
        const near=this.towns.reduce((b,t)=>dist({x:t.x*TILE,y:t.y*TILE},this.playerPos)<dist({x:b.x*TILE,y:b.y*TILE},this.playerPos)?t:b, this.towns[0]);
        this.playerPos.x=near.x*TILE+TILE/2; this.playerPos.y=near.y*TILE+TILE/2;
        this.playerPath=[]; this.pathGfx.clear(); this.drawPlayer();
        this.camTarget.x=this.playerPos.x; this.camTarget.y=this.playerPos.y;
      }
      this.logTimer=0; this.checkLevelUp();
    } else if (npc.type==='lord') {
      this.battleLog=`Met ${npc.name} (${npc.faction}).`; this.logTimer=0;
    } else {
      this.battleLog=`A ${npc.faction} caravan passes by.`; this.logTimer=0;
    }
  }

  npcBattle(a, b) {
    const aC={troops:a.troops.map(t=>({...t}))}; const bC={troops:b.troops.map(t=>({...t}))};
    const r=autoResolve(aC,bC); if(!r) return;
    a.troops=aC.troops; b.troops=bC.troops;
    if  (r.win  && b.troops.reduce((s,t)=>s+t.count,0)<=0) { b.alive=false; b.respawnTimer=30; this.drawNPC(b); }
    if (!r.win  && a.troops.reduce((s,t)=>s+t.count,0)<=0) { a.alive=false; a.respawnTimer=30; this.drawNPC(a); }
  }

  respawnNPC(npc) {
    let gx,gy;
    do { gx=randInt(10,GRID_W-10); gy=randInt(10,GRID_H-10); } while(this.costGrid[gy*GRID_W+gx]>=999);
    npc.x=gx*TILE+TILE/2; npc.y=gy*TILE+TILE/2; npc.alive=true; npc.path=[]; npc.pathIdx=0;
    if      (npc.type==='bandit')  npc.troops=[{tier:0,count:randInt(5,18)},{tier:1,count:randInt(0,6)}];
    else if (npc.type==='lord')    npc.troops=[{tier:1,count:randInt(10,18)},{tier:2,count:randInt(4,9)},{tier:3,count:randInt(1,4)}];
    else                           npc.troops=[{tier:0,count:randInt(3,7)},{tier:1,count:randInt(1,3)}];
    this.drawNPC(npc);
  }

  dailyTick() {
    let wages=0;
    player.troops.forEach(t => { wages += t.count * TROOP_TIERS[t.tier].wage; });
    player.gold -= wages;
    if (player.gold < 0) {
      player.troops.forEach(t => { t.count = Math.max(0, t.count - Math.ceil(t.count*0.1)); });
      player.troops = player.troops.filter(t=>t.count>0);
      player.gold = 0;
      this.battleLog = `Day ${this.day}: Can't pay wages! Desertions.`; this.logTimer=0;
    }
    this.towns.forEach(t => { t.recruitPool = Math.min(15, t.recruitPool+randInt(0,2)); });
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
  closePanel() { if (this.activePanel) { this.activePanel.forEach(o=>o.destroy()); this.activePanel=null; } }

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

  enterTown(town) {
    if (this.activePanel) return;
    const pd = dist(this.playerPos, {x:town.x*TILE+TILE/2, y:town.y*TILE+TILE/2});
    if (pd > 60) { this.showNotification('Too far! Move closer.'); return; }
    this.showTownPanel(town);
  }

  showTownPanel(town) {
    const pw=420, ph=320;
    const {objs,cx,cy} = this.panelBg(pw,ph);
    const d = this.add.container(0,0).setScrollFactor(0).setDepth(301);
    const tl = cx-pw/2+20, tr = cy-ph/2;
    d.add(this.add.text(tl,tr+12,`${town.name} [${town.faction}]`,{fontSize:THEME.font.lg,fontFamily:THEME.font.ui,color:THEME.text.gold,fontStyle:'bold'}));
    d.add(this.add.text(tl,tr+38,`Tier: ${['Village','Town','City'][town.tier||0]}  Recruit Pool: ${town.recruitPool}`,{fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:THEME.text.primary}));
    // Trade goods
    let gy2=tr+65;
    d.add(this.add.text(tl,gy2,'— Trade —',{fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:THEME.text.muted})); gy2+=20;
    GOODS.forEach(good => {
      const stock=town.goods[good]; const price=Math.round(10+50/Math.max(1,stock));
      const row=this.add.text(tl,gy2,`${good}: stock ${stock}  buy ${price}g`,{fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:THEME.text.primary});
      d.add(row); gy2+=18;
      const btn = createStyledButton(this, tl+220, gy2-18, 'Buy 1', ()=>{
        if (player.gold<price) { this.showNotification('Not enough gold!'); return; }
        player.gold-=price; player.inventory[good]=(player.inventory[good]||0)+1;
        town.goods[good]=Math.max(0,town.goods[good]-1);
        this.showNotification(`Bought ${good} for ${price}g`);
      }, {depth:302,padX:6,padY:2});
      d.add(btn);
    });
    // Recruit
    gy2+=10;
    d.add(this.add.text(tl,gy2,'— Recruit —',{fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:THEME.text.muted})); gy2+=20;
    TROOP_TIERS.forEach((tier,ti) => {
      const btn = createStyledButton(this, tl+(ti*96), gy2, `${tier.name} ${tier.cost}g`, ()=>{
        if (town.recruitPool<=0) { this.showNotification('No recruits available!'); return; }
        if (player.gold<tier.cost) { this.showNotification('Not enough gold!'); return; }
        player.gold-=tier.cost; town.recruitPool--;
        const existing=player.troops.find(t=>t.tier===ti);
        if (existing) existing.count++; else player.troops.push({tier:ti,count:1});
        this.showNotification(`Recruited ${tier.name}`);
      }, {depth:302,padX:4,padY:2});
      d.add(btn);
    });
    objs.push(d);
    this.activePanel = objs;
  }

  showPartyPanel() {
    if (this.activePanel) return;
    const pw=360, ph=280;
    const {objs,cx,cy} = this.panelBg(pw,ph);
    const d=this.add.container(0,0).setScrollFactor(0).setDepth(301);
    const tl=cx-pw/2+20, tr=cy-ph/2;
    d.add(this.add.text(tl,tr+12,'Party',{fontSize:THEME.font.lg,fontFamily:THEME.font.ui,color:THEME.text.gold,fontStyle:'bold'}));
    let gy2=tr+42;
    d.add(this.add.text(tl,gy2,`Gold: ${player.gold}   Power: ${calcPower(player)}   Renown: ${player.renown}   Lv${player.level}`,{fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:THEME.text.primary})); gy2+=22;
    d.add(this.add.text(tl,gy2,'Troops:',{fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:THEME.text.muted})); gy2+=18;
    player.troops.forEach(t => {
      const tier=TROOP_TIERS[t.tier];
      d.add(this.add.text(tl,gy2,`  ${tier.name} ×${t.count}   wage/day: ${t.count*tier.wage}g`,{fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:THEME.text.primary}));
      gy2+=18;
    });
    d.add(this.add.text(tl,gy2,'Skills:',{fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:THEME.text.muted})); gy2+=18;
    Object.entries(player.skills).forEach(([k,v]) => {
      d.add(this.add.text(tl,gy2,`  ${k}: ${v}`,{fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:THEME.text.primary}));
      gy2+=16;
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
      const row=this.add.text(tl,gy2,`${good}: ${qty}`,{fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:THEME.text.primary});
      d.add(row);
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

  showLevelUpPanel() {
    if (this.activePanel) this.closePanel();
    const pw=340, ph=220;
    const {objs,cx,cy} = this.panelBg(pw,ph);
    const d=this.add.container(0,0).setScrollFactor(0).setDepth(301);
    const tl=cx-pw/2+20, tr=cy-ph/2;
    d.add(this.add.text(cx,tr+18,'⭐ Level Up!',{fontSize:THEME.font.xl,fontFamily:THEME.font.ui,color:THEME.text.gold,fontStyle:'bold'}).setOrigin(0.5,0));
    d.add(this.add.text(cx,tr+50,`You are now Level ${player.level}. Choose a skill to improve:`,{fontSize:THEME.font.sm,fontFamily:THEME.font.ui,color:THEME.text.primary}).setOrigin(0.5,0));
    let bx2=cx-160;
    Object.keys(player.skills).forEach(skill => {
      const btn=createStyledButton(this,bx2,tr+90,`+${skill}`,()=>{
        player.skills[skill]++;
        this.showNotification(`${skill} increased to ${player.skills[skill]}!`);
        this.closePanel();
      },{depth:302,padX:10,padY:5});
      d.add(btn); bx2+=85;
    });
    objs.push(d);
    this.activePanel=objs;
  }
}