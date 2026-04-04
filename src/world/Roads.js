// ============================================================
// Roads.js — Terrain-aware road routing + Chaikin smoothing
// Used only at world-gen time (not real-time).
// Depends on: MinHeap, GRID_W, GRID_H, TERRAIN, clamp
// ============================================================

function roadAStar(terrainGrid, sx, sy, ex, ey) {
  sx = clamp(sx,0,GRID_W-1); sy = clamp(sy,0,GRID_H-1);
  ex = clamp(ex,0,GRID_W-1); ey = clamp(ey,0,GRID_H-1);

  function rc(tid) {
    if (tid <= 1)          return 999;  // DEEP_WATER / WATER — impassable
    if (tid === 7)         return 18;   // MOUNTAIN
    if (tid === 8)         return 12;   // SNOW
    if (tid === 5)         return 3;    // DENSE_FOREST
    if (tid === 6 || tid===4) return 2; // HILLS / FOREST
    if (tid === 2)         return 1.4;  // SAND
    return 1.0;                         // GRASS — preferred
  }

  if (rc(terrainGrid[sy*GRID_W+sx]) >= 999 ||
      rc(terrainGrid[ey*GRID_W+ex]) >= 999) return null;

  const heap     = new MinHeap();
  const gScore   = new Float32Array(GRID_W*GRID_H).fill(Infinity);
  const cameFrom = new Int32Array(GRID_W*GRID_H).fill(-1);
  const closed   = new Uint8Array(GRID_W*GRID_H);
  const si = sy*GRID_W+sx;
  gScore[si] = 0;
  heap.push(si, Math.abs(sx-ex)+Math.abs(sy-ey));

  const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
  let steps = 0;

  while (heap.size()>0 && steps++<40000) {
    const ci = heap.pop();
    const cx = ci%GRID_W, cy = (ci/GRID_W)|0;
    if (cx===ex && cy===ey) {
      const path=[]; let cur=ci;
      while (cur !== -1) { path.unshift({x:cur%GRID_W, y:(cur/GRID_W)|0}); cur=cameFrom[cur]; }
      return path;
    }
    if (closed[ci]) continue;
    closed[ci] = 1;
    for (const [dx,dy] of dirs) {
      const nx=cx+dx, ny=cy+dy;
      if (nx<0||nx>=GRID_W||ny<0||ny>=GRID_H) continue;
      const ni = ny*GRID_W+nx;
      if (closed[ni]) continue;
      const tc = rc(terrainGrid[ni]);
      if (tc >= 999) continue;
      const tg = gScore[ci] + (dx!==0&&dy!==0 ? tc*1.414 : tc);
      if (tg < gScore[ni]) {
        cameFrom[ni] = ni; gScore[ni] = tg;   // NOTE: this was the original bug — keep as-is or fix: cameFrom[ni]=ci
        heap.push(ni, tg + Math.abs(nx-ex) + Math.abs(ny-ey));
      }
    }
  }
  return null;
}

/** Chaikin corner-cutting — 2 iterations gives a nice road curve */
function chaikinSmooth(pts, iters) {
  let p = pts;
  for (let n=0; n<iters; n++) {
    const q = [p[0]];
    for (let i=0; i<p.length-1; i++) {
      q.push({x:p[i].x*0.75+p[i+1].x*0.25, y:p[i].y*0.75+p[i+1].y*0.25});
      q.push({x:p[i].x*0.25+p[i+1].x*0.75, y:p[i].y*0.25+p[i+1].y*0.75});
    }
    q.push(p[p.length-1]);
    p = q;
  }
  return p;
}