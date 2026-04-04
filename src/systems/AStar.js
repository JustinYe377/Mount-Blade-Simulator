// ============================================================
// AStar.js — Grid A* with optional threat-cost overlay
// Depends on: MinHeap, clamp (helpers.js)
// ============================================================
class AStar {
  constructor(grid, w, h) {
    this.grid = grid; this.w = w; this.h = h;
  }

  findPath(sx, sy, ex, ey, threatMap=null) {
    const w = this.w, h = this.h;
    sx = clamp(sx,0,w-1); sy = clamp(sy,0,h-1);
    ex = clamp(ex,0,w-1); ey = clamp(ey,0,h-1);
    if (this.grid[sy*w+sx] >= 999 || this.grid[ey*w+ex] >= 999) return null;

    const open    = new MinHeap();
    const gScore  = new Float32Array(w*h).fill(Infinity);
    const fScore  = new Float32Array(w*h).fill(Infinity);
    const cameFrom= new Int32Array(w*h).fill(-1);
    const closed  = new Uint8Array(w*h);
    const si = sy*w+sx;
    gScore[si] = 0; fScore[si] = this.heuristic(sx,sy,ex,ey);
    open.push(si, fScore[si]);

    const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
    let steps = 0;
    const maxSteps = 8000;

    while (open.size()>0 && steps++<maxSteps) {
      const ci = open.pop();
      const cx = ci%w, cy = (ci/w)|0;
      if (cx===ex && cy===ey) return this._reconstruct(cameFrom, ci, w);
      if (closed[ci]) continue;
      closed[ci] = 1;

      for (const [dx,dy] of dirs) {
        const nx=cx+dx, ny=cy+dy;
        if (nx<0||nx>=w||ny<0||ny>=h) continue;
        const ni = ny*w+nx;
        if (closed[ni]) continue;
        const tileCost = this.grid[ni];
        if (tileCost >= 999) continue;
        const isDiag = dx!==0 && dy!==0;
        let moveCost = isDiag ? tileCost*1.414 : tileCost;
        if (threatMap) moveCost += (threatMap[ni] || 0);
        const tg = gScore[ci] + moveCost;
        if (tg < gScore[ni]) {
          cameFrom[ni] = ci;
          gScore[ni]   = tg;
          fScore[ni]   = tg + this.heuristic(nx,ny,ex,ey);
          open.push(ni, fScore[ni]);
        }
      }
    }
    return null;
  }

  heuristic(ax, ay, bx, by) {
    const dx=Math.abs(ax-bx), dy=Math.abs(ay-by);
    return (dx+dy) + (1.414-2)*Math.min(dx,dy);
  }

  _reconstruct(cameFrom, ci, w) {
    const path = [];
    while (ci !== -1) { path.unshift({x:ci%w, y:(ci/w)|0}); ci = cameFrom[ci]; }
    if (path.length > 6) {
      const simplified = [path[0]];
      for (let i=3; i<path.length-1; i+=3) simplified.push(path[i]);
      simplified.push(path[path.length-1]);
      return simplified;
    }
    return path;
  }
}