// ============================================================
// helpers.js — Pure utility functions shared across modules
// Depends on: config.js (TROOP_BY_ID, COMBAT_TRIANGLE)
// ============================================================

function dist(a, b) { return Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2); }
function randInt(a, b) { return Math.floor(Math.random()*(b-a+1))+a; }
function randPick(a)   { return a[randInt(0, a.length-1)]; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function totalTroops(party) {
  return party.troops.reduce((s, t) => s + t.count, 0);
}

function countKind(troops, kind) {
  return troops.filter(t => TROOP_BY_ID[t.id] && TROOP_BY_ID[t.id].kind === kind)
               .reduce((s, t) => s + t.count, 0);
}

function calcPower(party) {
  let p = 0;
  party.troops.forEach(t => {
    const def = TROOP_BY_ID[t.id];
    if (def) p += t.count * def.power;
  });
  if (party.skills) p *= (1 + party.skills.tactics * 0.08);
  return Math.round(p);
}

function calcEffectivePower(atk, def) {
  const defTotal = Math.max(1, totalTroops(def));
  const defFrac = { infantry:0, cavalry:0, archer:0, villager:0 };
  def.troops.forEach(t => {
    const d = TROOP_BY_ID[t.id]; if (!d) return;
    defFrac[d.kind] = (defFrac[d.kind] || 0) + t.count / defTotal;
  });
  let p = 0;
  atk.troops.forEach(t => {
    const d = TROOP_BY_ID[t.id]; if (!d) return;
    const row = COMBAT_TRIANGLE[d.kind] || COMBAT_TRIANGLE.villager;
    let mod = 0;
    Object.keys(defFrac).forEach(k => { mod += (defFrac[k] || 0) * (row[k] || 1.0); });
    p += t.count * d.power * mod;
  });
  if (atk.skills) p *= (1 + atk.skills.tactics * 0.08);
  return Math.round(p);
}

function autoResolve(atk, def) {
  let ap = calcEffectivePower(atk, def);
  let dp = calcEffectivePower(def, atk);
  let at = totalTroops(atk);
  let dt = totalTroops(def);
  if (!at || !dt) return null;

  let r   = clamp(ap/(ap+dp) + (Math.random()-0.5)*0.2, 0.05, 0.95);
  let win = r > 0.5;
  let aLR = win ? (1-r)*0.6 : (1-r)*0.9;
  let dLR = win ? r*0.9     : r*0.6;

  function applyLoss(troops, losses) {
    let rem = Math.round(losses);
    const sorted = [...troops].sort((a,b) => {
      const pa = TROOP_BY_ID[a.id]?.power ?? 1;
      const pb = TROOP_BY_ID[b.id]?.power ?? 1;
      return pa - pb;
    });
    for (let i=0; i<sorted.length && rem>0; i++) {
      const k = Math.min(sorted[i].count, rem);
      sorted[i].count -= k; rem -= k;
    }
    return troops.filter(t => t.count > 0);
  }

  atk.troops = applyLoss(atk.troops, at*aLR);
  def.troops = applyLoss(def.troops, dt*dLR);
  return {
    win,
    aLoss: Math.round(at*aLR),
    dLoss: Math.round(dt*dLR),
    loot:  win ? Math.round(dt*dLR*5*Math.random()) : 0,
  };
}

function calcSpeed(troops, baseSpeed) {
  const total = Math.max(1, troops.reduce((s,t)=>s+t.count,0));
  const cavCount = countKind(troops, 'cavalry');
  const cavRatio = cavCount / total;
  return Math.round(baseSpeed * (1.0 + cavRatio * 0.4));
}

// ---- Leader skill bonuses ----

/**
 * Get the effective leader skills for a party.
 * Only player and lords have leader bonuses.
 * @param {object} party  — { troops, skills? (player) or lordDef? }
 * @returns {{ tactics, leadership }}
 */
function leaderSkills(party) {
  if (party.skills) return party.skills;           // player
  if (party.lordDef) return party.lordDef.skills;  // named lord NPC
  return { tactics: 0, leadership: 0 };            // no leader (bandits, caravans, etc.)
}

/**
 * Effective power with leader skill bonuses applied.
 * tactics   → each point adds 8% power
 * leadership → each point adds 5% max troops (morale, not modelled here — adds flat 3% power instead)
 */
function calcLeaderPower(party) {
  const base = calcEffectivePower ? calcEffectivePower(party, party) : calcPower(party);
  const ls   = leaderSkills(party);
  const mult = 1 + (ls.tactics || 0)*0.08 + (ls.leadership || 0)*0.03;
  return Math.round(calcPower(party) * mult);
}

/**
 * Estimate win probability of attacker vs defender (0.0–1.0).
 * Uses effective power WITH leader bonuses and combat triangle.
 * Returns a number 0–100 (integer percent).
 */
function estimateWinRate(atkParty, defParty) {
  const ap = calcEffectivePowerWithLeader(atkParty, defParty);
  const dp = calcEffectivePowerWithLeader(defParty, atkParty);
  if (ap + dp === 0) return 50;
  const raw = ap / (ap + dp);
  // Clamp to 5–95% — no sure things
  return Math.round(clamp(raw, 0.05, 0.95) * 100);
}

function calcEffectivePowerWithLeader(atk, def) {
  const defTotal = Math.max(1, atk.troops ? def.troops.reduce((s,t)=>s+t.count,0) : 1);
  const defFrac  = { infantry:0, cavalry:0, archer:0, villager:0 };
  if (def.troops) def.troops.forEach(t => {
    const d = TROOP_BY_ID[t.id]; if (!d) return;
    defFrac[d.kind] = (defFrac[d.kind]||0) + t.count/defTotal;
  });

  let p = 0;
  if (atk.troops) atk.troops.forEach(t => {
    const d = TROOP_BY_ID[t.id]; if (!d) return;
    const row = COMBAT_TRIANGLE[d.kind] || COMBAT_TRIANGLE.villager;
    let mod = 0;
    Object.keys(defFrac).forEach(k => { mod += (defFrac[k]||0) * (row[k]||1.0); });
    p += t.count * d.power * mod;
  });

  const ls   = leaderSkills(atk);
  const mult = 1 + (ls.tactics||0)*0.08 + (ls.leadership||0)*0.03;
  return Math.round(p * mult);
}

/**
 * autoResolve WITH leader bonuses factored in.
 * Replaces the plain autoResolve for player encounters.
 */
function autoResolveWithLeader(atk, def) {
  let ap = calcEffectivePowerWithLeader(atk, def);
  let dp = calcEffectivePowerWithLeader(def, atk);
  let at = atk.troops.reduce((s,t)=>s+t.count,0);
  let dt = def.troops.reduce((s,t)=>s+t.count,0);
  if (!at || !dt) return null;

  let r   = clamp(ap/(ap+dp) + (Math.random()-0.5)*0.15, 0.05, 0.95);
  let win = r > 0.5;
  let aLR = win ? (1-r)*0.6 : (1-r)*0.9;
  let dLR = win ? r*0.9     : r*0.6;

  function applyLoss(troops, losses) {
    let rem = Math.round(losses);
    const sorted = [...troops].sort((a,b) => (TROOP_BY_ID[a.id]?.power??1)-(TROOP_BY_ID[b.id]?.power??1));
    for (let i=0; i<sorted.length && rem>0; i++) {
      const k = Math.min(sorted[i].count, rem); sorted[i].count -= k; rem -= k;
    }
    return troops.filter(t => t.count > 0);
  }

  atk.troops = applyLoss(atk.troops, at*aLR);
  def.troops = applyLoss(def.troops, dt*dLR);
  return { win, aLoss:Math.round(at*aLR), dLoss:Math.round(dt*dLR), loot:win?Math.round(dt*dLR*5*Math.random()):0 };
}