// ============================================================
// MinHeap.js — Binary min-heap used by A* pathfinders
// ============================================================
class MinHeap {
  constructor() { this.data = []; }
  size()  { return this.data.length; }
  push(val, pri) { this.data.push({val,pri}); this._up(this.data.length-1); }
  pop()  {
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0) { this.data[0] = last; this._down(0); }
    return top.val;
  }
  _up(i) {
    while (i > 0) {
      const p = (i-1)>>1;
      if (this.data[i].pri < this.data[p].pri) {
        [this.data[i], this.data[p]] = [this.data[p], this.data[i]]; i = p;
      } else break;
    }
  }
  _down(i) {
    const n = this.data.length;
    while (true) {
      let s=i; const l=2*i+1, r=2*i+2;
      if (l<n && this.data[l].pri<this.data[s].pri) s=l;
      if (r<n && this.data[r].pri<this.data[s].pri) s=r;
      if (s!==i) { [this.data[i],this.data[s]]=[this.data[s],this.data[i]]; i=s; }
      else break;
    }
  }
}