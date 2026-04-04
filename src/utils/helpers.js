// ============================================================
// helpers.js — Pure utility functions shared across modules
// ============================================================

function dist(a, b) { return Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2); }
function randInt(a, b) { return Math.floor(Math.random()*(b-a+1))+a; }
function randPick(a)   { return a[randInt(0, a.length-1)]; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function calcPower(party) {
  let p = 0;
  party.troops.forEach(t => p += t.count * TROOP_TIERS[t.tier].power);
  if (party.skills) p *= (1 + party.skills.tactics * 0.08);
  return Math.round(p);
}

function autoResolve(atk, def) {
  let ap = calcPower(atk), dp = calcPower(def);
  let at = atk.troops.reduce((s,t)=>s+t.count,0);
  let dt = def.troops.reduce((s,t)=>s+t.count,0);
  if (!at || !dt) return null;

  let r = clamp(ap/(ap+dp) + (Math.random()-0.5)*0.2, 0.05, 0.95);
  let win = r > 0.5;
  let aLR = win ? (1-r)*0.6 : (1-r)*0.9;
  let dLR = win ? r*0.9 : r*0.6;

  function applyLoss(troops, losses) {
    let rem = Math.round(losses);
    for (let i=0; i<troops.length && rem>0; i++) {
      let k = Math.min(troops[i].count, rem);
      troops[i].count -= k; rem -= k;
    }
    return troops.filter(t => t.count > 0);
  }

  atk.troops = applyLoss(atk.troops, at*aLR);
  def.troops = applyLoss(def.troops, dt*dLR);
  return { win, aLoss: Math.round(at*aLR), dLoss: Math.round(dt*dLR), loot: win ? Math.round(dt*dLR*5*Math.random()) : 0 };
}