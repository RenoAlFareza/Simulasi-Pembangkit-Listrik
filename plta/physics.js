/*
 * PLTAPhysics — dependency-free UMD hydropower model (m, m³, s, m³/s, MW, MWh).
 * Browser: globalThis.PLTAPhysics; Node: require('./physics.js').
 * API: CONFIG, PRESETS, create(config), update(sim, config), step(sim, config, dt).
 * create returns a plain, JSON-serializable mutable state. update and step return
 * that same object; sim.config is a sanitized configuration snapshot. Partial
 * configs retain previous settings. initialH initializes operator mode only;
 * in basic mode it is the fixed head and can be changed with update().
 * Defaults: basic, initialH=60, flow=40, gate=40, inflow=55, otherRelease=0,
 * season=manual, scale=1, demandMW=50. Invalid numbers use the previous/default
 * value; finite numbers are clamped. demandMW is advisory, not a dispatch limit.
 * Changing season without supplying inflow selects that season's preset base;
 * an explicit inflow always overrides the preset. Seasonal sine starts at t=0.
 *
 * Operator: constant-area reservoir; head is above tailwater. Turbine release
 * reserves water down to minOperatingLevel; other release can drain to zero.
 * Other release has priority when water is scarce, and can use incoming water.
 * _lowWater is the serialized hysteresis latch: stop at <=15 m, restart only at
 * >=15.1 m. update() may change the latch, but never time or cumulative totals.
 * Each step consumes ALL finite nonnegative elapsed time, in <=30 simulated
 * second intervals anchored to the simulation clock. Inflow is integrated
 * analytically; turbine flow/head and energy use implicit midpoint integration.
 * Midpoint flow obeys gate, available water, and 50 MW limits. Endpoint q/power
 * are instantaneous snapshots, not interval averages. Spill removes excess
 * water immediately; cumulative volumes include actual constrained releases.
 * Rounding differences and boundary-crossing timing can vary for different
 * frame partitions; smooth trajectories converge at second order.
 *
 * Basic: h is fixed; q=flow; P=.0083385*h*q, up to 83.385 MW. Clock ALWAYS
 * advances in real seconds, regardless of scale. Energy is exact for fixed
 * settings. Its reservoir is externally maintained, so cumulative flow totals
 * are informational and the operator reservoir mass-balance rule does not apply.
 * No randomness, rainfall level jumps, external state, DOM, or clock access.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PLTAPhysics = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var CONFIG = Object.freeze({ area: 1e6, maxLevel: 100, minOperatingLevel: 15,
    ratedFlow: 100, ratedPowerMW: 50, tailwater: 0, lossAtRatedFlow: 3 });
  var PRESETS = Object.freeze({
    dry: Object.freeze({ h: 30, q: 20, inflow: 15, label: 'Kemarau' }),
    transition: Object.freeze({ h: 60, q: 40, inflow: 55, label: 'Pancaroba' }),
    wet: Object.freeze({ h: 85, q: 75, inflow: 130, label: 'Musim hujan' })
  });
  var DEFAULTS = { model: 'basic', initialH: 60, flow: 40, gate: 40,
    inflow: 55, otherRelease: 0, season: 'manual', scale: 1, demandMW: 50 };
  var EPS = 1e-10;
  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
  function finite(x) { return typeof x === 'number' && Number.isFinite(x); }
  function sanitize(input, previous) {
    input = input || {};
    var base = previous || DEFAULTS, c = {};
    c.model = input.model === 'basic' || input.model === 'operator' ? input.model : base.model;
    c.season = ['manual', 'dry', 'transition', 'wet'].indexOf(input.season) >= 0 ? input.season : base.season;
    [['initialH', 0, 100], ['flow', 0, 100], ['gate', 0, 100], ['inflow', 0, 200],
      ['otherRelease', 0, 30], ['demandMW', 1, 50]].forEach(function (field) {
      var key = field[0];
      c[key] = finite(input[key]) ? clamp(input[key], field[1], field[2]) : base[key];
    });
    if (!finite(input.inflow) && PRESETS[c.season] && (!previous || c.season !== base.season)) {
      c.inflow = PRESETS[c.season].inflow;
    }
    c.scale = [1, 60, 600].indexOf(input.scale) >= 0 ? input.scale : base.scale;
    return c;
  }
  function season(c) {
    return c.season === 'transition' ? [0.25, 43200] :
      c.season === 'manual' ? [0, 86400] : [0.15, 86400];
  }
  function inflowAt(c, t) {
    var s = season(c);
    return c.inflow * (1 + s[0] * Math.sin(2 * Math.PI * (t % s[1]) / s[1]));
  }
  function inflowIntegral(c, t, dt) {
    var s = season(c), w = 2 * Math.PI / s[1];
    // Stable cos(a)-cos(a+b) identity, including tiny intervals and many days.
    return c.inflow * dt * (1 + s[0] * Math.sin(w * ((t % s[1]) + dt / 2)) *
      (dt === 0 ? 1 : Math.sin(w * dt / 2) / (w * dt / 2)));
  }
  function performance(h, q) {
    var gross = Math.max(0, h - CONFIG.tailwater);
    var loss = CONFIG.lossAtRatedFlow * Math.pow(q / CONFIG.ratedFlow, 2);
    var eta = clamp(0.90 - 0.25 * Math.pow(q / 100 - 0.75, 2), 0.65, 0.9);
    var net = Math.max(0, gross - loss);
    return { grossHead: gross, headLoss: loss, netHead: net, efficiency: eta,
      powerMW: 0.00981 * q * net * eta };
  }
  function requested(h, c) {
    return Math.min(100, 100 * Math.sqrt(Math.max(0, h) / 80)) * c.gate / 100;
  }
  function cappedFlow(upper, allowed) {
    if (upper <= 0) return 0;
    if (allowed(upper)) return upper;
    var lo = 0, hi = upper;
    for (var i = 0; i < 48; i++) {
      var mid = (lo + hi) / 2;
      if (allowed(mid)) lo = mid; else hi = mid;
    }
    return lo;
  }
  function latch(sim) {
    if (sim.h <= CONFIG.minOperatingLevel + EPS) sim._lowWater = true;
    else if (sim.h >= CONFIG.minOperatingLevel + 0.1 - EPS) sim._lowWater = false;
  }
  function snapshot(sim, c) {
    sim.inflow = inflowAt(c, sim.simSeconds);
    sim.spillFlow = 0;
    if (c.model === 'basic') {
      sim.h = c.initialH;
      sim.q = c.flow;
      sim.grossHead = sim.h;
      sim.netHead = sim.h;
      sim.headLoss = 0;
      sim.efficiency = 0.85;
      sim.powerMW = 0.0083385 * sim.h * sim.q;
      sim.otherFlow = c.otherRelease;
      sim.status = 'basic';
      return sim;
    }
    latch(sim);
    sim.q = sim._lowWater ? 0 : cappedFlow(requested(sim.h, c), function (q) {
      return performance(sim.h, q).powerMW <= CONFIG.ratedPowerMW;
    });
    // At an empty reservoir only incoming water is immediately available.
    sim.otherFlow = sim.h <= 0 ? Math.min(c.otherRelease, sim.inflow) : c.otherRelease;
    Object.assign(sim, performance(sim.h, sim.q));
    if (sim.h >= CONFIG.maxLevel) sim.spillFlow = Math.max(0, sim.inflow - sim.q - sim.otherFlow);
    sim.status = sim._lowWater ? 'low-water' : sim.q > 0 ? 'generating' : 'gate-closed';
    return sim;
  }
  function update(sim, config) {
    sim.config = sanitize(config, sim.config);
    return snapshot(sim, sim.config);
  }
  function create(config) {
    var c = sanitize(config), sim = { h: c.initialH, simSeconds: 0, energyMWh: 0,
      turbineVolume: 0, inflowVolume: 0, otherVolume: 0, spillVolume: 0,
      initialVolume: c.initialH * CONFIG.area, _lowWater: c.initialH <= 15,
      config: c };
    return snapshot(sim, c);
  }
  function operatorInterval(sim, c, dt) {
    latch(sim);
    var h0 = sim.h, volume0 = h0 * CONFIG.area;
    var incoming = inflowIntegral(c, sim.simSeconds, dt);
    var other = Math.min(c.otherRelease * dt, volume0 + incoming);
    var available = Math.max(0, volume0 + incoming - other);
    var upper = sim._lowWater ? 0 : Math.min(100,
      Math.max(0, available - CONFIG.minOperatingLevel * CONFIG.area) / dt);
    function endHead(q) { return clamp((available - q * dt) / CONFIG.area, 0, 100); }
    var q = cappedFlow(upper, function (trial) {
      var midHead = (h0 + endHead(trial)) / 2;
      return trial <= requested(midHead, c) && performance(midHead, trial).powerMW <= 50;
    });
    var turbine = q * dt;
    var spill = Math.max(0, available - turbine - CONFIG.maxLevel * CONFIG.area);
    sim.h = clamp((available - turbine - spill) / CONFIG.area, 0, 100);
    sim.energyMWh += performance((h0 + sim.h) / 2, q).powerMW * dt / 3600;
    sim.turbineVolume += turbine;
    sim.inflowVolume += incoming;
    sim.otherVolume += other;
    sim.spillVolume += spill;
    sim.simSeconds += dt;
    latch(sim);
  }
  function step(sim, config, dtRealSeconds) {
    update(sim, config);
    if (!finite(dtRealSeconds) || dtRealSeconds <= 0) return sim;
    var c = sim.config;
    var elapsed = dtRealSeconds * (c.model === 'basic' ? 1 : c.scale);
    var target = sim.simSeconds + elapsed;
    if (!Number.isFinite(target)) return sim;
    if (c.model === 'basic') {
      sim.energyMWh += sim.powerMW * elapsed / 3600;
      sim.turbineVolume += sim.q * elapsed;
      sim.inflowVolume += inflowIntegral(c, sim.simSeconds, elapsed);
      sim.otherVolume += c.otherRelease * elapsed;
      sim.simSeconds = target;
    } else {
      while (sim.simSeconds < target) {
        var nextGrid = (Math.floor(sim.simSeconds / 30) + 1) * 30;
        var dt = Math.min(30, target - sim.simSeconds, nextGrid - sim.simSeconds);
        operatorInterval(sim, c, dt);
      }
      sim.simSeconds = target;
    }
    return snapshot(sim, c);
  }
  return Object.freeze({ create: create, step: step, update: update, CONFIG: CONFIG, PRESETS: PRESETS });
}));
