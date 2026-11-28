// Game rules that don't touch the page: streaks, hearts, daily quests, lesson unlocks and the "Call it" chart rounds.
// Works in the browser (window.GAME) and in Node for the tests (require("./public/game.js")).
(function (root, make) { if (typeof module === "object" && module.exports) module.exports = make(); else root.GAME = make(); })(this, function () {
  var HEART_MAX = 5, HEART_MS = 30 * 60000;
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function dayKey(t) { var d = new Date(t); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function gap(a, b) { var x = a.split("-"), y = b.split("-"); return Math.round((Date.UTC(y[0], y[1] - 1, y[2]) - Date.UTC(x[0], x[1] - 1, x[2])) / 864e5); }

  // Streak: one lesson or one Call-it round a day keeps it alive. A freeze covers one missed day.
  function touchStreak(s, now) {
    var k = dayKey(now), n = { streak: s.streak || 0, best: s.best || 0, last: s.last || "", freezes: s.freezes || 0 };
    if (n.last === k) return n;
    var g = n.last ? gap(n.last, k) : 0;
    if (g < 0) return n; // the clock went back a day (a flight west, say). Keep the streak as it is.
    if (g === 1) n.streak++;
    else if (g === 2 && n.freezes > 0) { n.freezes--; n.streak++; }
    else n.streak = 1;
    n.last = k; n.best = Math.max(n.best, n.streak);
    if (n.streak % 7 === 0 && n.freezes < 2) n.freezes++; // a free freeze every week you keep it going
    return n;
  }
  function liveStreak(s, now) {
    if (!s || !s.last) return 0;
    var g = gap(s.last, dayKey(now));
    return g <= 1 || (g === 2 && s.freezes > 0) ? s.streak : 0;
  }

  // Hearts: a wrong answer costs one. One comes back every 30 minutes, up to 5.
  function hearts(h, now) {
    h = h || { n: HEART_MAX, t: now };
    if (h.n >= HEART_MAX) return { n: HEART_MAX, t: now };
    var got = Math.floor((now - h.t) / HEART_MS);
    if (got <= 0) return { n: h.n, t: h.t };
    var n = Math.min(HEART_MAX, h.n + got);
    return { n: n, t: n >= HEART_MAX ? now : h.t + got * HEART_MS };
  }
  function loseHeart(h, now) { h = hearts(h, now); return { n: Math.max(0, h.n - 1), t: h.n >= HEART_MAX ? now : h.t }; }
  function gainHeart(h, now) { h = hearts(h, now); return { n: Math.min(HEART_MAX, h.n + 1), t: h.t }; }
  function nextHeartMins(h, now) { h = hearts(h, now); return h.n >= HEART_MAX ? 0 : Math.ceil((h.t + HEART_MS - now) / 60000); }

  // Lessons unlock in order across all units.
  function flat(units) { var a = []; (units || []).forEach(function (u, ui) { u.lessons.forEach(function (l) { a.push({ unit: ui, l: l }); }); }); return a; }
  function nextLesson(units, done) { var f = flat(units); for (var i = 0; i < f.length; i++) if (!done[f[i].l.id]) return f[i].l.id; return null; }
  function isOpen(units, done, id) { var f = flat(units); for (var i = 0; i < f.length; i++) { if (f[i].l.id === id) return true; if (!done[f[i].l.id]) return false; } return false; }
  function lessonXP(mistakes) { return 10 + (mistakes === 0 ? 5 : 0); }

  // Daily quests: three picked from the pool by the date, so everyone gets the same three each day.
  var QUESTS = [
    { id: "lesson1", t: "Finish a lesson", k: "lessons", n: 1 },
    { id: "lesson2", t: "Finish 2 lessons", k: "lessons", n: 2 },
    { id: "perfect", t: "Finish a lesson with no mistakes", k: "perfect", n: 1 },
    { id: "call2", t: "Win 2 Call it rounds", k: "calls", n: 2 },
    { id: "call3", t: "Play 3 Call it rounds", k: "rounds", n: 3 },
    { id: "trade", t: "Place a trade (or queue one)", k: "trades", n: 1 },
    { id: "xp30", t: "Earn 30 XP", k: "xp", n: 30 }
  ];
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function questsFor(k) {
    var pool = QUESTS.slice(), out = [], h = hash(k);
    while (out.length < 3) { out.push(pool.splice(h % pool.length, 1)[0]); h = hash(String(h)); }
    return out;
  }
  function freshDay(now) { return { k: dayKey(now), xp: 0, lessons: 0, perfect: 0, calls: 0, rounds: 0, trades: 0, paid: {} }; }
  function today(d, now) { return d && d.k === dayKey(now) ? d : freshDay(now); }

  // "Call it": a made-up chart. Will the next stretch go up or down? Trends carry on 65% of the time,
  // which is roughly the lesson: momentum is a tilt, never a promise.
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function round(seed) {
    var r = rng(seed), dir = r() < 0.5 ? 1 : -1, keep = r() < 0.65, p = 50 + r() * 150, c = [];
    function walk(n, drift) {
      for (var i = 0; i < n; i++) {
        var o = p, ch = p * (drift * 0.006 + (r() - 0.5) * 0.02); p = Math.max(1, p + ch);
        c.push({ o: o, c: p, h: Math.max(o, p) * (1 + r() * 0.006), l: Math.min(o, p) * (1 - r() * 0.006) });
      }
    }
    walk(30, dir); var cut = c.length, before = p;
    walk(10, keep ? dir : -dir);
    return { candles: c, cut: cut, answer: p >= before ? "up" : "down", trend: dir > 0 ? "up" : "down" };
  }

  return { HEART_MAX: HEART_MAX, dayKey: dayKey, gap: gap, touchStreak: touchStreak, liveStreak: liveStreak, hearts: hearts, loseHeart: loseHeart, gainHeart: gainHeart,
    nextHeartMins: nextHeartMins, flat: flat, nextLesson: nextLesson, isOpen: isOpen, lessonXP: lessonXP, QUESTS: QUESTS, questsFor: questsFor, today: today, freshDay: freshDay, round: round };
});
