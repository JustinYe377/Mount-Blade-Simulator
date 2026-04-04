// ============================================================
// Noise.js — Compact Perlin / Simplex Noise + FBM
// ============================================================
const Noise = (() => {
  const perm = new Uint8Array(512);
  const grad3 = [
    [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
    [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
    [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
  ];

  function seed(s) {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807 + 0) % 2147483647;
      const j = s % (i + 1);
      [p[i], p[j]] = [p[j], p[i]];
    }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  }

  function dot(g, x, y) { return g[0]*x + g[1]*y; }

  function noise2d(x, y) {
    const F2 = 0.5*(Math.sqrt(3)-1), G2 = (3-Math.sqrt(3))/6;
    const s = (x+y)*F2;
    const i = Math.floor(x+s), j = Math.floor(y+s);
    const t = (i+j)*G2;
    const X0 = i-t, Y0 = j-t;
    const x0 = x-X0, y0 = y-Y0;
    const i1 = x0>y0?1:0, j1 = x0>y0?0:1;
    const x1 = x0-i1+G2, y1 = y0-j1+G2;
    const x2 = x0-1+2*G2, y2 = y0-1+2*G2;
    const ii = i&255, jj = j&255;
    const gi0 = perm[ii+perm[jj]]%12;
    const gi1 = perm[ii+i1+perm[jj+j1]]%12;
    const gi2 = perm[ii+1+perm[jj+1]]%12;
    let n0=0, n1=0, n2=0;
    let t0 = 0.5-x0*x0-y0*y0; if(t0>0){t0*=t0; n0=t0*t0*dot(grad3[gi0],x0,y0);}
    let t1 = 0.5-x1*x1-y1*y1; if(t1>0){t1*=t1; n1=t1*t1*dot(grad3[gi1],x1,y1);}
    let t2 = 0.5-x2*x2-y2*y2; if(t2>0){t2*=t2; n2=t2*t2*dot(grad3[gi2],x2,y2);}
    return 70*(n0+n1+n2);
  }

  function fbm(x, y, octaves=4) {
    let val=0, amp=1, freq=1, max=0;
    for(let i=0; i<octaves; i++) {
      val += noise2d(x*freq, y*freq)*amp;
      max += amp; amp *= 0.5; freq *= 2;
    }
    return val/max;
  }

  seed(42);
  return { seed, fbm, noise2d };
})();