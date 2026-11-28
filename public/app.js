(function () {
var TK = [["AAPL","Apple"],["MSFT","Microsoft"],["NVDA","Nvidia"],["TSLA","Tesla"],["AMZN","Amazon"],["SPY","S&P 500 ETF"],["KO","Coca-Cola"],["DIS","Disney"]];
var $ = function (i) { return document.getElementById(i); };
var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); };
var money = function (n) { return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }); };
var fmtp = function (n) { return (n >= 0 ? "+" : "") + n.toFixed(2) + "%"; };
var ico = function (n, cls) { return "<svg class='ico" + (cls ? " " + cls : "") + "' aria-hidden='true'><use href='#i-" + n + "'/></svg>"; };
var G = window.GAME, UNITS = window.UNITS || [];

/* ---------- ranks and achievements ---------- */
var RANKS = [[0, "Starter"], [50, "Trader"], [150, "Pro"], [300, "Expert"], [700, "Legend"]];
function rankOf(xp) { var r = RANKS[0]; RANKS.forEach(function (x) { if (xp >= x[0]) r = x; }); return r; }
function doneCount() { return Object.keys(S.done).length; }
function retPct() { return S.start > 0 ? (total() / S.start - 1) * 100 : 0; }
var ACH = [
  { id: "first", t: "First trade", d: "Place your first trade.", xp: 20, ok: function () { return S.stats.trades >= 1; } },
  { id: "night", t: "Night owl", d: "Queue an order while the market is closed.", xp: 15, ok: function () { return S.stats.queued >= 1; } },
  { id: "win", t: "In the green", d: "Sell a stock for a profit.", xp: 30, ok: function () { return S.stats.wins >= 1; } },
  { id: "cut", t: "Cut it short", d: "Sell a loser before it falls 5%.", xp: 25, ok: function () { return S.stats.cuts >= 1; } },
  { id: "div", t: "Spread it out", d: "Hold 3 different stocks at once.", xp: 30, ok: function () { return Object.keys(S.pos).length >= 3; } },
  { id: "ten", t: "Getting busy", d: "Make 10 trades.", xp: 40, ok: function () { return S.stats.trades >= 10; } },
  { id: "l1", t: "Class is in session", d: "Finish your first lesson.", xp: 10, ok: function () { return doneCount() >= 1; } },
  { id: "all", t: "Straight-A student", d: "Finish every lesson.", xp: 50, ok: function () { var n = (window.LESSONS || []).length; return n > 0 && doneCount() >= n; } },
  { id: "up5", t: "Up 5%", d: "Grow a game 5% above your starting cash.", xp: 50, ok: function () { return S.start > 0 && S.stats.trades >= 1 && retPct() >= 5; } },
  { id: "up10", t: "Up 10%", d: "Grow a game 10% above your starting cash.", xp: 80, ok: function () { return S.start > 0 && S.stats.trades >= 1 && retPct() >= 10; } },
  { id: "party", t: "Better together", d: "Create or join a party.", xp: 20, ok: function () { return PARTIES.length >= 1; } },
  { id: "flawless", t: "Flawless", d: "Finish a lesson with no mistakes.", xp: 15, ok: function () { return S.stats.perfect >= 1; } },
  { id: "streak3", t: "On a roll", d: "Keep a 3-day streak.", xp: 20, ok: function () { return (S.g.streak.best || 0) >= 3; } },
  { id: "streak7", t: "Week one", d: "Keep a 7-day streak.", xp: 50, ok: function () { return (S.g.streak.best || 0) >= 7; } },
  { id: "caller", t: "Chart reader", d: "Win 10 Call it rounds.", xp: 25, ok: function () { return S.stats.calls >= 10; } }
];
function xpNow() { var x = S.g.lx || 0; ACH.forEach(function (a) { if (S.ach[a.id]) x += a.xp; }); return x; }
var achTimer;
function unlockedSet() { var a = []; ["avatar", "banner", "effect", "acc", "accent"].forEach(function (k) { CAT[k].forEach(function (it) { if (it.id !== "none" && isUnlocked(it)) a.push(k + ":" + it.id); }); }); return a; }
function checkAch() {
  var got = [], gain = 0, before = unlockedSet();
  ACH.forEach(function (a) { if (!S.ach[a.id] && a.ok()) { S.ach[a.id] = Date.now(); got.push(a.t); gain += a.xp; } });
  if (!got.length) return;
  var after = unlockedSet(), news = after.filter(function (x) { return before.indexOf(x) < 0; }).map(function (x) { var kv = x.split(":"); return find(CAT[kv[0]], kv[1]).n + " " + KN[kv[0]]; });
  flash("Achievement: " + got.join(", ") + " (+" + gain + " XP)" + (news.length ? ". New in your profile: " + news.join(", ") : ""));
  persist(); sync(); mine(); if ($("profile").className === "") profileUI();
}
var flashAt = 0;
function flash(t) { var b = $("achbar"); if (Date.now() - flashAt < 1500 && b.className === "achbar show") t = b.textContent + ". " + t; flashAt = Date.now(); b.textContent = t; b.className = "achbar show"; clearTimeout(achTimer); achTimer = setTimeout(function () { b.className = "achbar"; }, 6000); }
function mine() {
  var xp = xpNow(), rk = rankOf(xp), nx = RANKS.filter(function (r) { return r[0] > xp; })[0];
  $("mine").innerHTML = "<h2>" + rk[1] + "</h2><p class='mute small' style='margin:4px 0 8px'>" + xp + " XP" + (nx ? " · " + (nx[0] - xp) + " XP to " + nx[1] : " · top rank reached") + "</p><div class='bar'><i style='width:" + (nx ? (xp - rk[0]) / (nx[0] - rk[0]) * 100 : 100) + "%'></i></div><div class='achg'>" +
    ACH.map(function (a) { var on = S.ach[a.id]; return "<div class='at" + (on ? "" : " locked") + "'><b>" + ico(on ? "trophy" : "lock") + esc(a.t) + "</b><span class='small mute'>" + esc(a.d) + " +" + a.xp + " XP</span></div>"; }).join("") + "</div>";
  $("rank").innerHTML = ico("bolt") + "<span>" + xp + "</span><span class='mute small'>" + rk[1] + "</span>";
  hud();
}
function hud() {
  var now = Date.now(), st = G.liveStreak(S.g.streak, now), lit = S.g.streak.last === G.dayKey(now);
  S.g.hearts = G.hearts(S.g.hearts, now);
  $("hstreak").className = "pill " + (lit ? "fl" : "off"); $("hstreak").innerHTML = ico("flame") + st;
  $("hstreak").title = st + "-day streak" + (lit ? "" : ". Do a lesson or a Call it round today to keep it.");
  var m = G.nextHeartMins(S.g.hearts, now), hh = ico("heart") + S.g.hearts.n;
  $("hhearts").innerHTML = hh; $("phearts").innerHTML = hh; $("hhearts").title = S.g.hearts.n + " hearts" + (m ? ". Next one in " + m + " min" : "");
}

/* ---------- cosmetics: avatars, banners, effects, accessories, colors (unlocked by rank and achievements) ---------- */
var CAT = {
  avatar: [{id:"turtle",e:"🐢",n:"Turtle"},{id:"fox",e:"🦊",n:"Fox"},{id:"panda",e:"🐼",n:"Panda"},{id:"bull",e:"🐂",n:"Bull",xp:50},{id:"bear",e:"🐻",n:"Bear",xp:50},{id:"owl",e:"🦉",n:"Owl",xp:50},
    {id:"shark",e:"🦈",n:"Shark",xp:150},{id:"eagle",e:"🦅",n:"Eagle",xp:150},{id:"wolf",e:"🐺",n:"Wolf",xp:150},{id:"dragon",e:"🐉",n:"Dragon",xp:300},{id:"unicorn",e:"🦄",n:"Unicorn",xp:300},
    {id:"alien",e:"👽",n:"Alien",ach:"night"},{id:"rocket",e:"🚀",n:"Rocket",ach:"up5"},{id:"robot",e:"🤖",n:"Robot",ach:"all"},{id:"diamond",e:"💎",n:"Diamond",ach:"up10"}],
  banner: [{id:"forest",n:"Forest",g:"linear-gradient(120deg,#0f3d2c,#1f8f62)"},{id:"slate",n:"Slate",g:"linear-gradient(120deg,#1f2a36,#4a5b6c)"},
    {id:"sunrise",n:"Sunrise",g:"linear-gradient(120deg,#ff7e5f,#feb47b)",xp:50},{id:"ocean",n:"Ocean",g:"linear-gradient(120deg,#0f4c81,#2bb3c0)",xp:50},
    {id:"neon",n:"Neon",g:"linear-gradient(120deg,#7b2ff7,#f107a3)",xp:150},{id:"gold",n:"Gold",g:"linear-gradient(120deg,#8a6d1d,#f6d365)",xp:150},
    {id:"royal",n:"Royal",g:"linear-gradient(120deg,#2b1055,#7597de)",xp:300},{id:"obsidian",n:"Obsidian",g:"linear-gradient(120deg,#0b0f14,#2c3e50)",xp:300}],
  effect: [{id:"none",n:"None"},{id:"shimmer",n:"Shimmer",ach:"first"},{id:"twinkle",n:"Twinkle",xp:50},{id:"aurora",n:"Aurora",xp:150},{id:"glow",n:"Glow",xp:300}],
  acc: [{id:"none",n:"None"},{id:"cap",e:"🧢",n:"Cap",xp:50,pos:"top"},{id:"grad",e:"🎓",n:"Grad cap",ach:"l1",pos:"top"},{id:"shades",e:"🕶️",n:"Shades",ach:"win",pos:"eyes"},
    {id:"star",e:"⭐",n:"Star",ach:"party",pos:"top"},{id:"flame",e:"🔥",n:"Flame",ach:"ten",pos:"top"},{id:"tophat",e:"🎩",n:"Top hat",xp:150,pos:"top"},{id:"crown",e:"👑",n:"Crown",xp:300,pos:"top"}],
  accent: [{id:"green",n:"Green",c:"#2fd48b",ink:"#04261a"},{id:"blue",n:"Blue",c:"#4da3ff",ink:"#041a33"},{id:"purple",n:"Purple",c:"#a78bfa",ink:"#1b0a3a",xp:50},{id:"orange",n:"Orange",c:"#ffa94d",ink:"#331a00",xp:50},
    {id:"pink",n:"Pink",c:"#ff7eb6",ink:"#3a0a22",xp:150},{id:"gold",n:"Gold",c:"#f6c945",ink:"#3a2a00",xp:300}],
  mode: [{id:"auto",n:"Auto"},{id:"light",n:"Light"},{id:"dark",n:"Dark"}]
};
var KN = { avatar: "avatar", banner: "banner", effect: "effect", acc: "accessory", accent: "color" };
function find(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
function isUnlocked(it) { if (it.xp) return xpNow() >= it.xp; if (it.ach) return !!S.ach[it.ach]; return true; }
function reqText(it) { if (it.xp) return "Reach " + rankOf(it.xp)[1]; if (it.ach) { var a = ACH.filter(function (q) { return q.id === it.ach; })[0]; return "Unlock “" + (a ? a.t : it.ach) + "”"; } return ""; }
function applyLook() {
  ["avatar", "banner", "effect", "acc", "accent"].forEach(function (k) { var it = find(CAT[k], S.look[k]); if (!it || !isUnlocked(it)) S.look[k] = CAT[k][0].id; });
  var a = find(CAT.accent, S.look.accent), r = document.documentElement;
  r.style.setProperty("--hi", a.c); r.style.setProperty("--hiink", a.ink);
  if (S.look.mode === "light" || S.look.mode === "dark") r.setAttribute("data-theme", S.look.mode); else r.removeAttribute("data-theme");
}
function avatarHTML(look, size) {
  look = look || {}; var av = find(CAT.avatar, look.avatar) || CAT.avatar[0], ac = find(CAT.acc, look.acc), z = size || 40;
  return "<span class='av' style='width:" + z + "px;height:" + z + "px;font-size:" + Math.round(z * 0.58) + "px'>" + av.e + (ac && ac.e ? "<span class='ac " + ac.pos + "' style='font-size:" + Math.round(z * 0.48) + "px'>" + ac.e + "</span>" : "") + "</span>";
}
/* word filter: bad words become ####. This is a small starter list. For real use, add a maintained list (see README). The same check runs in the database. */
var BAD_EXACT = ["ass", "bastard", "dick", "piss", "slut", "prick"], BAD_CONTAINS = ["fuck", "shit", "cunt", "bitch", "asshole", "whore"];
function normTok(t) { return t.toLowerCase().replace(/0/g, "o").replace(/@/g, "a").replace(/[1!|]/g, "i").replace(/3/g, "e").replace(/4/g, "a").replace(/[5$]/g, "s").replace(/7/g, "t").replace(/[^a-z]/g, ""); }
function isBadTok(t) { var n = normTok(t); if (!n) return false; if (BAD_EXACT.indexOf(n) >= 0) return true; return BAD_CONTAINS.some(function (w) { return n.indexOf(w) >= 0; }); }
function cleanText(t) { return String(t).trim().split(/\s+/).map(function (w) { return isBadTok(w) ? new Array(w.length + 1).join("#") : w; }).join(" "); }
function badName(n) { return cleanText(n) !== n.replace(/\s+/g, " ").trim(); }

/* ---------- state: S holds the game you are playing (cash, pos, log, queue, start) plus your account stuff ---------- */
function newGame(start) { return { start: start || 0, cash: start || 0, pos: {}, log: [], queue: [] }; }
function freshG() { return { lx: 0, streak: {}, hearts: { n: G.HEART_MAX, t: Date.now() }, day: null, goal: 30, cseed: Math.floor(Math.random() * 1e9) }; }
function freshStats() { return { trades: 0, wins: 0, cuts: 0, queued: 0, perfect: 0, calls: 0 }; }
function fresh() { return { look: { accent: "green", mode: "auto", avatar: "turtle", banner: "forest", effect: "none", acc: "none" }, status: { text: "", t: 0 }, hide: 0, prac: 0, name: "", done: {}, ach: {}, stats: freshStats(), g: freshG(), cur: "solo", games: {}, start: 0, cash: 0, pos: {}, log: [], queue: [] }; }
// Older saves marked lessons done by position (0, 1, 2...). Lessons now have ids, so map the old positions over.
var OLD_ORDER = ["stock", "hours", "charts", "orders", "risk", "diversify", "daytrade", "news", "mistakes"];
function fixDone(d) { var o = {}; Object.keys(d || {}).forEach(function (k) { o[/^\d+$/.test(k) ? OLD_ORDER[+k] || k : k] = 1; }); return o; }
function fixUp() {
  S.g = Object.assign(freshG(), S.g); S.g.lx = Math.max(0, Math.min(90000, +S.g.lx || 0)); S.g.cseed = (+S.g.cseed || 0) >>> 0;
  if ([10, 30, 50].indexOf(+S.g.goal) < 0) S.g.goal = 30; else S.g.goal = +S.g.goal;
  S.g.streak = S.g.streak && typeof S.g.streak === "object" ? S.g.streak : {}; ["streak", "best", "freezes"].forEach(function (k) { S.g.streak[k] = Math.max(0, Math.floor(+S.g.streak[k] || 0)); });
  if (!/^\d{4}-\d\d-\d\d$/.test(S.g.streak.last)) S.g.streak.last = "";
  var h = S.g.hearts || {}; S.g.hearts = { n: Math.max(0, Math.min(G.HEART_MAX, Math.floor(+h.n || 0))), t: +h.t || Date.now() };
  var d = S.g.day;
  if (!d || typeof d !== "object" || !/^\d{4}-\d\d-\d\d$/.test(d.k)) S.g.day = null;
  else { ["xp", "lessons", "perfect", "calls", "rounds", "trades"].forEach(function (k) { d[k] = Math.max(0, Math.floor(+d[k] || 0)); }); d.paid = d.paid && typeof d.paid === "object" ? d.paid : {}; } S.stats = Object.assign(freshStats(), S.stats); S.done = fixDone(S.done); }
var S = fresh(), PARTIES = [], PB = {}, sb = null, user = null;
try { var raw = localStorage.getItem("dt3"); if (raw) S = Object.assign(S, JSON.parse(raw)); } catch (e) {}
fixUp();
function stash() { S.games[S.cur] = { start: S.start, cash: S.cash, pos: S.pos, log: S.log, queue: S.queue }; }
function loadGame(slot) {
  var g = S.games[slot];
  if (!g) { var p = PARTIES.filter(function (x) { return x.id === slot; })[0]; g = newGame(p ? Number(p.start_cash) : 0); }
  S.cur = slot; S.start = g.start; S.cash = g.cash; S.pos = g.pos || {}; S.log = g.log || []; S.queue = g.queue || [];
}
function persist() { try { localStorage.setItem("dt3", JSON.stringify(S)); } catch (e) {} }
function save() { stash(); persist(); sync(); }
function valOf(c, pos) { var v = c; for (var s in pos) v += pos[s].q * (P[s] || pos[s].avg); return v; }
function total() { return valOf(S.cash, S.pos); }

var P = {}, OPEN = {}, REAL = {}, PREV = {}, CHG = {}, H = {}, lastChips = "", lastGB = "", SP = 0.0005, sel = "AAPL", RANGE = "live", LC = {}, MODE = "candle";
if (window.supabase && window.CFG && CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY) sb = supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);

/* ---------- market clock (US Eastern, Mon-Fri 9:30-16:00; holidays not handled) ---------- */
var fmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "numeric", hour12: false });
function mkt() {
  var p = {}; fmt.formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
  var d = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(p.weekday), m = (parseInt(p.hour) % 24) * 60 + parseInt(p.minute);
  if (d >= 1 && d <= 5 && m >= 570 && m < 960) return { open: 1, mins: 960 - m };
  for (var i = 0; i <= 7; i++) { var dd = (d + i) % 7; if (dd >= 1 && dd <= 5) { var w = i * 1440 + 570 - m; if (w > 0) return { open: 0, mins: w }; } }
  return { open: 0, mins: 0 };
}
function dur(m) { var h = Math.floor(m / 60); return (h >= 24 ? Math.floor(h / 24) + "d " : "") + (h % 24) + "h " + (m % 60) + "m"; }
function tradable() { return mkt().open || S.prac; }
function clock() {
  var k = mkt(); $("dot").className = "dot" + (k.open ? " on" : "");
  $("clk").textContent = k.open ? "Market open · closes in " + dur(k.mins) : "Market closed · opens in " + dur(k.mins) + " · orders wait for the open";
  $("prac").setAttribute("aria-pressed", S.prac ? "true" : "false");
  var t = tradable(); $("buy").textContent = t ? "Buy" : "Queue buy"; $("sell").textContent = t ? "Sell" : "Queue sell";
}

/* ---------- live prices ---------- */
function prices(one) {
  return fetch("/api/quotes" + (one ? "?symbol=" + one : "")).then(function (r) { return r.json(); }).then(function (d) {
    if (d.error) throw new Error(d.error);
    Object.keys(d).forEach(function (s) {
      P[s] = REAL[s] = d[s].price; OPEN[s] = d[s].open; PREV[s] = d[s].prevClose; CHG[s] = d[s].changePct;
      H[s] = H[s] || [d[s].prevClose]; H[s].push(d[s].price); if (H[s].length > 300) H[s].shift(); if (mkt().open) addTick(s, d[s].price);
    });
    $("src").textContent = "Prices from Finnhub. The stock you’re watching updates every 5 seconds and the rest every minute. Small ticks in between are simulated. Free data can be delayed.";
  }).catch(function () { $("src").textContent = "Couldn’t load prices. Check that FINNHUB_KEY is set in Vercel."; }).then(function () { processQueue(); draw(); });
}
function addTick(s, p) {
  var a = LC[s] = LC[s] || [], now = Date.now(), k = a[a.length - 1];
  if (!k || now - k.t0 >= 15000) { a.push({ o: p, h: p, l: p, c: p, t0: now }); if (a.length > 60) a.shift(); }
  else { k.c = p; if (p > k.h) k.h = p; if (p < k.l) k.l = p; }
}
function tick() {
  if (!mkt().open) return;
  TK.forEach(function (t) {
    var s = t[0], r = REAL[s]; if (!r || !H[s]) return;
    var cur = P[s] || r; P[s] = cur + (r - cur) * 0.2 + r * (Math.random() - 0.5) * 0.0004;
    CHG[s] = (P[s] / PREV[s] - 1) * 100; H[s].push(P[s]); if (H[s].length > 300) H[s].shift(); addTick(s, P[s]);
  });
  draw();
}

/* ---------- price history: today, yesterday, week, month ---------- */
var HC = {}, HP = {}, RLAB = { live: "this session", today: "today", yesterday: "yesterday", week: "past week", month: "past month" };
function getHist(sym, range) {
  var r2 = (range === "today" || range === "yesterday") ? "intraday" : range, k = sym + ":" + r2, c = HC[k];
  if (c && Date.now() - c.at < (c.err ? 20000 : 600000)) return c;
  if (HP[k]) return c || null;
  HP[k] = 1;
  fetch("/api/history?symbol=" + sym + "&range=" + r2).then(function (r) { return r.json(); }).then(function (d) {
    if (d.error) throw new Error(d.error); HC[k] = { at: Date.now(), d: d };
  }).catch(function (e) { HC[k] = { at: Date.now(), err: String(e.message || e) }; }).then(function () { delete HP[k]; draw(); });
  return c || null;
}
function series(sym, range) {
  var c = getHist(sym, range); if (!c) return { loading: 1 }; if (c.err) return { err: c.err };
  var d = c.d, pts;
  if (range === "today") pts = (d.days[d.days.length - 1] || {}).points; else if (range === "yesterday") pts = (d.days[d.days.length - 2] || {}).points; else pts = d.points;
  return { pts: pts || [] };
}
function lab(t, r) { if (r === "today" || r === "yesterday") { var h = +t.slice(11, 13); return (h % 12 || 12) + ":" + t.slice(14, 16) + (h < 12 ? " AM" : " PM"); } return t.slice(5, 7) + "/" + t.slice(8, 10); }
function scaleOf(c) { var mn = Infinity, mx = -Infinity; c.forEach(function (k) { if (k.l < mn) mn = k.l; if (k.h > mx) mx = k.h; }); return { mn: mn, mx: mx, y: function (v) { return 200 - (v - mn) / ((mx - mn) || 1) * 170; } }; }
function frame(sc, base, l1, l2) {
  return "<line x1='0' x2='600' y1='" + sc.y(base).toFixed(1) + "' y2='" + sc.y(base).toFixed(1) + "' stroke='var(--mute)' stroke-dasharray='4 4' opacity='.6'/>" +
    "<text x='4' y='14' fill='var(--mute)' font-size='12'>high " + sc.mx.toFixed(2) + "</text><text x='596' y='14' text-anchor='end' fill='var(--mute)' font-size='12'>low " + sc.mn.toFixed(2) + "</text>" +
    "<text x='4' y='216' fill='var(--mute)' font-size='12'>" + esc(l1) + "</text><text x='596' y='216' text-anchor='end' fill='var(--mute)' font-size='12'>" + esc(l2) + "</text>";
}
function candleSVG(c, l1, l2) { // green candle = price rose, red candle = price fell; dashed line = where the period started
  var sc = scaleOf(c), W = 600 / c.length, bw = Math.max(1, Math.min(14, W * 0.6)), s = frame(sc, c[0].o, l1, l2);
  c.forEach(function (k, i) {
    var x = i * W + W / 2, col = k.c >= k.o ? "var(--up)" : "var(--down)", y1 = sc.y(Math.max(k.o, k.c)), y2 = sc.y(Math.min(k.o, k.c));
    s += "<line x1='" + x.toFixed(1) + "' x2='" + x.toFixed(1) + "' y1='" + sc.y(k.h).toFixed(1) + "' y2='" + sc.y(k.l).toFixed(1) + "' stroke='" + col + "'/><rect x='" + (x - bw / 2).toFixed(1) + "' y='" + y1.toFixed(1) + "' width='" + bw.toFixed(1) + "' height='" + Math.max(1.5, y2 - y1).toFixed(1) + "' fill='" + col + "'/>";
  });
  return s;
}
function lineSVG(c, l1, l2) { // green while above where the period started, red while below
  var sc = scaleOf(c), base = c[0].o, W = 600 / (c.length - 1), s = frame(sc, base, l1, l2);
  for (var i = 1; i < c.length; i++) s += "<line x1='" + ((i - 1) * W).toFixed(1) + "' y1='" + sc.y(c[i - 1].c).toFixed(1) + "' x2='" + (i * W).toFixed(1) + "' y2='" + sc.y(c[i].c).toFixed(1) + "' stroke='" + (c[i].c >= base ? "var(--up)" : "var(--down)") + "' stroke-width='2.2'/>";
  return s;
}

/* ---------- drawing ---------- */
function draw() {
  $("tick").innerHTML = TK.filter(function (t) { return P[t[0]]; }).map(function (t) { var c = CHG[t[0]] || 0; return "<span>" + t[0] + " " + P[t[0]].toFixed(2) + " <span class='" + (c >= 0 ? "up" : "dn") + "'>" + fmtp(c) + "</span></span>"; }).join("") || "<span class='mute'>Loading prices…</span>";
  var cs = TK.map(function (t) { return "<button class='chip' data-s='" + t[0] + "' aria-pressed='" + (t[0] === sel) + "'>" + t[0] + "</button>"; }).join("");
  if (cs !== lastChips) { $("chips").innerHTML = cs; lastChips = cs; }
  document.querySelectorAll("#ranges [data-r]").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.r === RANGE); });
  var t = TK.filter(function (x) { return x[0] === sel; })[0], p = P[sel];
  $("nm").textContent = t[1]; $("px").textContent = p ? money(p) : "…";
  var cds = null, l1 = "", l2 = "", note = "";
  if (RANGE === "live") {
    var lc = LC[sel] || [];
    if (lc.length > 1) { cds = lc; l1 = "15-second candles"; l2 = "now"; } else note = mkt().open ? "Collecting prices…" : "Market is closed. Try Today, Yesterday, or Past week.";
  } else {
    var sr = series(sel, RANGE);
    if (sr.loading) note = "Loading…"; else if (sr.err) note = /TWELVE_KEY/.test(sr.err) ? "History needs a free Twelve Data key (TWELVE_KEY). See the README." : sr.err;
    else if (sr.pts.length < 2) note = "No data for that period yet.";
    else { cds = sr.pts.map(function (x) { return { o: x.o || x.c, h: x.h || x.c, l: x.l || x.c, c: x.c }; }); l1 = lab(sr.pts[0].t, RANGE); l2 = lab(sr.pts[sr.pts.length - 1].t, RANGE); }
  }
  if (cds) { var pc = (cds[cds.length - 1].c / cds[0].o - 1) * 100; $("chg").innerHTML = "<span class='" + (pc >= 0 ? "up" : "dn") + "'>" + fmtp(pc) + "</span> " + RLAB[RANGE]; } else $("chg").textContent = "";
  document.querySelectorAll("#modes [data-mode]").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.mode === MODE); });
  $("chart").innerHTML = cds ? (MODE === "candle" ? candleSVG(cds, l1, l2) : lineSVG(cds, l1, l2)) : "<text x='300' y='110' text-anchor='middle' fill='var(--mute)' font-size='14'>" + esc(note) + "</text>";
  var q = Math.max(1, parseInt($("qty").value) || 1); $("est").textContent = p ? "Estimated cost: " + money(q * p * (1 + SP)) + " (includes a small spread)" : "";
  $("queue").innerHTML = S.queue.length ? S.queue.map(function (o) { return "<div class='coach'><b>" + esc(o.side) + " " + o.q + " " + esc(o.s) + "</b> · fills at the next open <button class='b ghost' data-q='" + esc(o.id) + "' style='padding:2px 10px;margin-left:8px'>Cancel</button></div>"; }).join("") + "<p class='small mute'>Cash set aside for queued buys: " + money(reserved()) + "</p>" : "<p class='mute'>No queued orders. Orders placed while the market is closed wait here until it opens.</p>";
  var v = total(); $("tv").textContent = money(v); $("cash").textContent = money(S.cash);
  var r = S.start > 0 ? retPct() : 0; $("ret").innerHTML = "<span class='" + (r >= 0 ? "up" : "dn") + "'>" + fmtp(r) + "</span>";
  var rows = Object.keys(S.pos).map(function (s) { var o = S.pos[s], now = P[s] || o.avg, pl = (now - o.avg) * o.q; return "<tr><td>" + esc(s) + "</td><td>" + o.q + "</td><td>" + o.avg.toFixed(2) + "</td><td>" + now.toFixed(2) + "</td><td class='" + (pl >= 0 ? "up" : "dn") + "'>" + money(pl) + "</td></tr>"; }).join("");
  $("pos").innerHTML = rows ? "<table><tr><th>Stock</th><th>Shares</th><th>Avg cost</th><th>Now</th><th>P&amp;L</th></tr>" + rows + "</table>" : "<p class='mute'>No positions yet. Pick a stock and buy your first shares.</p>";
  $("log").innerHTML = S.log.length ? S.log.slice(0, 8).map(function (l) { return "<div class='coach'><b>" + esc(l.side) + " " + l.q + " " + esc(l.s) + "</b> at " + l.p.toFixed(2) + "<br><span class='small'>" + esc(l.note) + "</span>" + (l.rev ? "<details><summary style='font-size:15px'>Why did I lose money? How do I improve?</summary>" + reviewHTML(l.rev) + "</details>" : "") + "</div>"; }).join("") : "<p class='mute'>Your trades and the coach’s notes will show up here.</p>";
  var has = S.start > 0; $("pick").className = "card" + (has ? " hide" : ""); $("play").className = has ? "" : "hide";
  $("reset").style.display = S.cur === "solo" ? "" : "none";
  gameBar(); checkAch();
}
function gameBar() {
  var ss = S.cur === "solo" ? S.start : (S.games.solo && S.games.solo.start);
  var opts = [["solo", "My game" + (ss ? " (" + money(ss) + " start)" : "")]].concat(PARTIES.map(function (p) { return [p.id, "Party: " + p.name + " (" + money(Number(p.start_cash)) + " start)"]; }));
  var h = opts.map(function (o) { return "<option value='" + esc(o[0]) + "'" + (o[0] === S.cur ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("");
  if (h !== lastGB) { $("gsel").innerHTML = h; lastGB = h; }
  $("gbar").className = "card row" + (PARTIES.length ? "" : " hide");
}

/* ---------- trading + coach ---------- */
function reserved() { var r = 0; S.queue.forEach(function (o) { if (o.side === "Buy") r += o.q * o.est; }); return r; }
function queuedSell(sym) { var n = 0; S.queue.forEach(function (o) { if (o.side === "Sell" && o.s === sym) n += o.q; }); return n; }
var VID = { stop: "how to use a stop loss beginners", fomo: "FOMO trading how to stop chasing stocks", short: "overtrading explained day trading mistakes", panic: "trading psychology panic selling", size: "position sizing risk management trading", spread: "bid ask spread explained for beginners", journal: "trading journal how to review your trades" };
function lossReview(sym, pos, sellP, q, pl) {
  var cost = pos.avg * q, pct = pl / cost * 100, mid = P[sym] || sellP, why = [], fix = [], vids = [], mins = pos.t ? Math.round((Date.now() - pos.t) / 60000) : null;
  function add(w, f, v) { why.push(w); fix.push(f); vids.push(v); }
  if (pct <= -5) add("The loss grew to " + Math.abs(pct).toFixed(1) + "% before you sold. With no exit planned in advance, small losses tend to grow.", "Choose an exit price before you buy (a stop-loss), for example 3 to 5% below your entry, and stick to it.", "stop");
  if ((pos.chg || 0) > 1.5) add("You bought after a big rise (the stock was up " + pos.chg.toFixed(1) + "% that day). Fast jumps often pull back.", "Wait for a pullback or a calm moment to enter instead of chasing a spike.", "fomo");
  if (mins !== null && mins < 15) add("You held for only " + Math.max(mins, 1) + " minute(s). Moves that short are mostly noise, and the spread takes a bite every round trip.", "Make fewer, more deliberate trades. Write down a reason and a target before you buy.", "short");
  if ((CHG[sym] || 0) < -1.5) add("You sold while the stock was down " + Math.abs(CHG[sym]).toFixed(1) + "% today. Selling into a sharp drop often locks in the low.", "Plan your sell conditions ahead of time so a scary moment doesn’t pick your exit.", "panic");
  if ((pos.sz || 0) > 0.25) add("This stock was " + Math.round(pos.sz * 100) + "% of your account when you bought, so one bad move hurt a lot.", "Risk only about 1 to 2% of your account on one idea, and spread money across several stocks.", "size");
  var spreadCost = q * mid * SP * 2;
  if (-pl < spreadCost * 1.5) add("Most of this loss (about " + money(spreadCost) + ") is the buy-sell spread. In-and-out trades cost money every time, even if the price doesn’t move.", "Skip trades that can’t realistically beat the spread, and avoid flipping the same stock repeatedly.", "spread");
  if (!why.length) add("The price simply moved against you. That is normal. Even good traders lose on a large share of trades.", "Keep losses small and winners bigger. Keep a trade journal and review your losers each week.", "journal");
  return { s: sym, loss: -pl, pct: pct, why: why, fix: fix, v: vids };
}
function reviewHTML(r) {
  return "<h3 style='margin-bottom:6px'>Why " + esc(r.s) + " lost " + money(r.loss) + " (" + r.pct.toFixed(1) + "%)</h3>" + r.why.map(function (w, i) {
    return "<div class='coach'><b>What happened:</b> " + esc(w) + "<br><b>How to improve:</b> " + esc(r.fix[i]) + "<br><a class='small' target='_blank' rel='noopener noreferrer' href='https://www.youtube.com/results?search_query=" + encodeURIComponent(VID[r.v[i]]) + "'>▶ Watch: " + esc(VID[r.v[i]]) + "</a></div>";
  }).join("");
}
function showReview(r) { var el = $("review"); el.innerHTML = reviewHTML(r) + "<button class='b ghost' data-rv='1'>Got it</button>"; el.className = "card"; }
function sold(pl, cost) { S.stats.trades++; if (pl > 0) S.stats.wins++; else if (pl < 0 && -pl / cost < 0.05) S.stats.cuts++; }
function queueOrder(side, q, p) {
  var est = p * (1 + SP);
  if (side === "Buy") { if (q * est > S.cash - reserved()) { $("toast").textContent = "Not enough available cash for that order (queued buys set cash aside). Try fewer shares."; return; } }
  else { var own = S.pos[sel] ? S.pos[sel].q : 0; if (own - queuedSell(sel) < q) { $("toast").textContent = "You don’t own that many shares of " + sel + " (counting sells already queued)."; return; } }
  S.queue.push({ id: String(Date.now()) + Math.random().toString(36).slice(2, 6), side: side, s: sel, q: q, est: est, t: Date.now() });
  S.stats.queued++; award(0, { trades: 1 });
  $("toast").textContent = side + " order for " + q + " " + sel + " queued. It fills at the next market open.";
  $("coach").innerHTML = "<div class='coach'><b>Coach:</b> Orders placed while the market is closed fill at the next <i>opening</i> price, which can be quite different from the last close. News often lands overnight, so the price can gap up or down. That is a real risk of after-hours orders.</div>";
  save(); draw();
}
function openedAt() { var k = mkt(); return k.open ? Date.now() - (390 - k.mins) * 60000 : 0; }
function processQueue() {
  if (!S.queue.length || !mkt().open) return;
  var since = openedAt(), left = [], changed = 0, filled = 0;
  S.queue.forEach(function (o) {
    var op = OPEN[o.s]; if (o.t >= since || !op) { left.push(o); return; }
    changed = 1;
    var fp = o.side === "Buy" ? op * (1 + SP) : op * (1 - SP), note, rev = null;
    if (o.side === "Buy") {
      if (o.q * fp > S.cash) { S.log.unshift({ side: "Canceled buy", q: o.q, s: o.s, p: op, note: "Not enough cash at the open, so the order was canceled." }); return; }
      var c = S.pos[o.s] || { q: 0, avg: 0 };
      S.cash -= o.q * fp; S.pos[o.s] = { q: c.q + o.q, avg: (c.avg * c.q + fp * o.q) / (c.q + o.q) }; S.stats.trades++;
      S.pos[o.s].t = c.t || Date.now(); S.pos[o.s].chg = CHG[o.s] || 0; S.pos[o.s].sz = Math.max(c.sz || 0, S.pos[o.s].q * fp / total());
      note = "Queued order filled at the opening price. The open can differ a lot from the last close.";
    } else {
      var h = S.pos[o.s];
      if (!h || h.q < o.q) { S.log.unshift({ side: "Canceled sell", q: o.q, s: o.s, p: op, note: "You no longer held enough shares, so the order was canceled." }); return; }
      var pl = (fp - h.avg) * o.q; sold(pl, h.avg * o.q); rev = pl < 0 ? lossReview(o.s, h, fp, o.q, pl) : null; S.cash += o.q * fp; h.q -= o.q; if (h.q === 0) delete S.pos[o.s];
      note = "Queued sell filled at the open, " + (pl >= 0 ? "a gain of " : "a loss of ") + money(Math.abs(pl)) + ".";
    }
    S.log.unshift({ side: o.side, q: o.q, s: o.s, p: fp, note: note, rev: rev }); filled++; if (rev) showReview(rev);
  });
  S.queue = left; S.log = S.log.slice(0, 40);
  if (filled) $("toast").textContent = filled + " queued order" + (filled > 1 ? "s" : "") + " filled at the open.";
  if (changed) save();
}
function trade(side) {
  var p = P[sel]; if (!p) { $("toast").textContent = "Prices haven’t loaded yet. Try again in a moment."; return; }
  var q = Math.max(1, parseInt($("qty").value) || 1), note = "", rev = null;
  if (!tradable()) { queueOrder(side, q, p); return; }
  p = side === "Buy" ? p * (1 + SP) : p * (1 - SP); // the spread: buyers pay slightly more, sellers get slightly less
  if (side === "Buy") {
    if (q * p > S.cash - reserved()) { $("toast").textContent = "Not enough available cash for that order. Try fewer shares."; return; }
    var o = S.pos[sel] || { q: 0, avg: 0 }, ch = CHG[sel] || 0;
    S.cash -= q * p; S.pos[sel] = { q: o.q + q, avg: (o.avg * o.q + p * q) / (o.q + q) }; S.stats.trades++;
    S.pos[sel].t = o.t || Date.now(); S.pos[sel].chg = ch; S.pos[sel].sz = Math.max(o.sz || 0, S.pos[sel].q * p / total());
    note = ch > 1.5 ? "You bought after a big rise today. Chasing price is a classic beginner habit. Ask what changed first."
      : ch < -1.5 ? "You bought a dip. That can work, but dips sometimes keep dipping. Have a plan if it falls more."
      : "A calm entry. Write down why you bought so you can judge the trade later.";
    if (S.pos[sel].q * p / total() > 0.4) note += " Heads up: over 40% of your account is now in " + sel + ". Spreading across stocks limits the damage if one drops.";
  } else {
    var o2 = S.pos[sel]; if (!o2 || o2.q - queuedSell(sel) < q) { $("toast").textContent = "You don’t own that many shares of " + sel + " (counting sells already queued)."; return; }
    var pl = (p - o2.avg) * q; sold(pl, o2.avg * q); rev = pl < 0 ? lossReview(sel, o2, p, q, pl) : null; S.cash += q * p; o2.q -= q; if (o2.q === 0) delete S.pos[sel];
    note = pl >= 0 ? "Locked in " + money(pl) + ". Ask yourself: did you sell by plan, or out of nerves?" : "Took a " + money(-pl) + " loss. Cutting losses early is a skill. Small losses are survivable.";
  }
  S.log.unshift({ side: side, q: q, s: sel, p: p, note: note, rev: rev }); S.log = S.log.slice(0, 40);
  $("toast").textContent = side + " " + q + " " + sel + " filled at " + money(p) + ", which includes a small spread.";
  $("coach").innerHTML = "<div class='coach'><b>Coach:</b> " + esc(note) + "</div>";
  if (rev) showReview(rev); else $("review").className = "card hide";
  award(0, { trades: 1 }); save(); draw();
}
function startGame(amt) {
  amt = Math.round(Number(amt));
  if (!(amt >= 1000 && amt <= 10000000)) { $("pickmsg").textContent = "Pick an amount from $1,000 to $10,000,000."; return; }
  S.start = S.cash = amt; S.pos = {}; S.log = []; S.queue = []; $("coach").innerHTML = ""; $("toast").textContent = ""; $("pickmsg").textContent = ""; save(); draw();
}

/* ---------- profile tab: look, colors, status of the day ---------- */
var stDraft = "";
function statusLive() { return !!(S.status && S.status.text && Date.now() - S.status.t < 864e5); }
function expLeft() { var m = Math.max(0, Math.ceil((864e5 - (Date.now() - S.status.t)) / 6e4)); return "expires in " + Math.floor(m / 60) + "h " + (m % 60) + "m"; }
function expireStatus() { if (S.status && S.status.text && !statusLive()) { S.status = { text: "", t: 0 }; persist(); sync(); if ($("profile").className === "") profileUI(); } }
function optBtn(kind, it, label) {
  var on = S.look[kind] === it.id, ok = isUnlocked(it);
  return "<button class='opt' data-pick='" + kind + ":" + it.id + "' aria-pressed='" + on + "'" + (ok ? "" : " disabled") + ">" + label + "<span>" + esc(it.n) + "</span>" + (ok ? "" : "<small>" + ico("lock") + " " + esc(reqText(it)) + "</small>") + "</button>";
}
function sect(title, kind, labelFn, note) { return "<div class='card'><h3>" + title + "</h3>" + (note ? "<p class='mute small' style='margin:4px 0 0'>" + note + "</p>" : "") + "<div class='opts'>" + CAT[kind].map(function (it) { return optBtn(kind, it, labelFn(it)); }).join("") + "</div></div>"; }
function profileUI() {
  var b = find(CAT.banner, S.look.banner), rk = rankOf(xpNow()), live = statusLive();
  $("pview").innerHTML =
    "<div class='pcard' style='margin-bottom:14px'><div class='banner fx-" + esc(S.look.effect) + "' style='background-image:" + b.g + "'></div><div class='pbody'>" + avatarHTML(S.look, 84) +
    "<div><b style='font:800 24px Bricolage Grotesque,sans-serif'>" + esc(S.name || "You") + "</b> <span class='mute small'>" + rk[1] + " · " + xpNow() + " XP</span>" + (live ? "<div class='small'>“" + esc(S.status.text) + "” <span class='mute'>· " + expLeft() + "</span></div>" : "") + "</div></div></div>" +
    "<div class='card'><h3>Status of the day</h3><p class='mute small' style='margin:4px 0 8px'>A short message on your profile and the leaderboards. It disappears after 24 hours, and you can replace or delete it any time. Bad words are replaced with ####.</p><div class='row'><input type='text' id='stin' maxlength='60' placeholder='What’s on your mind?' aria-label='Status of the day' value='" + esc(stDraft || (live ? S.status.text : "")) + "'><button class='b ghost' id='stpost'>Post</button>" + (live ? "<button class='b ghost' id='stdel'>Delete now</button>" : "") + "</div><div class='toast' id='stmsg' aria-live='polite'></div></div>" +
    sect("Interface color", "accent", function (it) { return "<span class='dotc' style='background:" + it.c + "'></span>"; }) +
    sect("Light or dark", "mode", function (it) { return "<span class='sw' style='border:2px solid var(--line);background:" + (it.id === "auto" ? "linear-gradient(90deg,#f6f2e8 50%,#15130f 50%)" : it.id === "light" ? "#f6f2e8" : "#15130f") + "'></span>"; }) +
    sect("Profile picture", "avatar", function (it) { return "<span class='e'>" + it.e + "</span>"; }, "Cooler ones unlock as you rank up and earn achievements.") +
    sect("Accessory", "acc", function (it) { return "<span class='e'>" + (it.e || "&nbsp;") + "</span>"; }, "Sits on top of your picture.") +
    sect("Banner color", "banner", function (it) { return "<span class='sw' style='background-image:" + it.g + "'></span>"; }) +
    sect("Banner effect", "effect", function (it) { return "<span class='sw fx-" + it.id + "' style='position:relative;overflow:hidden;background:#1f5e3b'></span>"; });
  $("stin").oninput = function () { stDraft = this.value; };
  $("stpost").onclick = function () {
    var raw = $("stin").value.trim(); if (!raw) { $("stmsg").textContent = "Type something first."; return; }
    var c = cleanText(raw).slice(0, 60); S.status = { text: c, t: Date.now() }; stDraft = ""; save(); profileUI();
    $("stmsg").textContent = c !== raw ? "Posted. We replaced some words with ####. It lasts 24 hours." : "Posted. It lasts 24 hours.";
  };
  if ($("stdel")) $("stdel").onclick = function () { S.status = { text: "", t: 0 }; stDraft = ""; save(); profileUI(); };
}

/* ---------- learn: lesson path, daily goal, quests, Call it ---------- */
function day() { S.g.day = G.today(S.g.day, Date.now()); return S.g.day; }
// Adds XP and bumps today's counters, then pays out any quest that's now complete (+10 XP each).
function award(xp, what) {
  var d = day(), paid = [], more = true;
  S.g.lx += xp; d.xp += xp;
  Object.keys(what || {}).forEach(function (k) { d[k] = (d[k] || 0) + what[k]; });
  while (more) {
    more = false;
    G.questsFor(d.k).forEach(function (q) { if (!d.paid[q.id] && (d[q.k] || 0) >= q.n) { d.paid[q.id] = 1; S.g.lx += 10; d.xp += 10; paid.push(q.t); more = true; } });
  }
  if (paid.length) flash("Quest done: " + paid.join(", ") + " (+" + paid.length * 10 + " XP)");
  persist(); sync(); checkAch(); mine(); goalUI(); questsUI();
}
function learnUI() {
  var done = S.done, nx = G.nextLesson(UNITS, done);
  $("path").innerHTML = UNITS.map(function (u) {
    var c = u.lessons.filter(function (l) { return done[l.id]; }).length;
    return "<div class='unit' style='--uc:" + u.c + "'><small>" + esc(u.t) + " · " + c + " of " + u.lessons.length + " done</small><h2>" + esc(u.n) + "</h2></div><div class='path' style='--uc:" + u.c + "'>" +
      u.lessons.map(function (l) {
        var open = G.isOpen(UNITS, done, l.id), d = done[l.id], cur = l.id === nx;
        return "<div class='nodewrap'>" + (cur ? "<span class='bub'>" + (doneCount() ? "Next up" : "Start here") + "</span>" : "") +
          "<button class='node" + (open ? "" : " locked") + (cur ? " cur" : "") + "' data-lesson='" + esc(l.id) + "'" + (open ? "" : " disabled") + " aria-label='" + esc(l.t) + (d ? ", done" : open ? "" : ", locked") + "'>" + ico(d ? "check" : open ? "star" : "lock") + "</button>" + esc(l.t) + "</div>";
      }).join("") + "</div>";
  }).join("");
  goalUI(); questsUI(); callUI();
}
function goalUI() {
  var d = day(), g = S.g.goal, pct = Math.min(100, d.xp / g * 100), fz = Number(S.g.streak.freezes) || 0;
  $("goal").innerHTML = "<h3>Daily goal</h3><p class='mute small' style='margin:4px 0 8px'>" + (d.xp >= g ? "Goal met. See you tomorrow." : (g - d.xp) + " XP to go today.") + "</p>" +
    "<b>" + d.xp + "</b> <span class='mute'>/ " + g + " XP</span><div class='bar' style='margin:8px 0 12px'><i style='width:" + pct + "%'></i></div>" +
    "<div class='chips'>" + [[10, "Easy"], [30, "Steady"], [50, "Serious"]].map(function (o) { return "<button class='chip' data-goal='" + o[0] + "' aria-pressed='" + (o[0] === g) + "'>" + o[1] + " · " + o[0] + "</button>"; }).join("") + "</div>" +
    "<p class='mute small' style='margin:0'>" + ico("snow") + " " + fz + " streak freeze" + (fz === 1 ? "" : "s") + ". A freeze covers one missed day, and you earn one every 7 days in a row.</p>";
}
function questsUI() {
  var d = day();
  $("quests").innerHTML = G.questsFor(d.k).map(function (q) {
    var v = Math.min(q.n, d[q.k] || 0), ok = d.paid[q.id];
    return "<li class='" + (ok ? "ok" : "") + "'>" + ico(ok ? "check" : "bolt") + "<div style='flex:1'><b>" + esc(q.t) + "</b><div class='bar' style='margin-top:6px'><i style='width:" + v / q.n * 100 + "%'></i></div></div><span class='small mute'>" + v + "/" + q.n + "</span></li>";
  }).join("");
}

/* Call it: guess where a made-up chart goes next. */
var CR = null;
function callSVG(show) {
  var all = CR.candles, c = show ? all : all.slice(0, CR.cut), sc = scaleOf(c), W = 600 / all.length, bw = W * 0.6, x0 = CR.cut * W, s = "";
  c.forEach(function (k, i) {
    var x = i * W + W / 2, col = k.c >= k.o ? "var(--up)" : "var(--down)", y1 = sc.y(Math.max(k.o, k.c)), y2 = sc.y(Math.min(k.o, k.c));
    s += "<line x1='" + x.toFixed(1) + "' x2='" + x.toFixed(1) + "' y1='" + sc.y(k.h).toFixed(1) + "' y2='" + sc.y(k.l).toFixed(1) + "' stroke='" + col + "'/><rect x='" + (x - bw / 2).toFixed(1) + "' y='" + y1.toFixed(1) + "' width='" + bw.toFixed(1) + "' height='" + Math.max(1.5, y2 - y1).toFixed(1) + "' fill='" + col + "'/>";
  });
  s += "<line x1='" + x0 + "' x2='" + x0 + "' y1='20' y2='206' stroke='var(--mute)' stroke-dasharray='3 5'/>";
  if (!show) s += "<text x='" + (x0 + (600 - x0) / 2) + "' y='125' text-anchor='middle' fill='var(--mute)' font-size='44' font-weight='800'>?</text>";
  return s;
}
function callUI() {
  if (!CR) CR = G.round(S.g.cseed);
  $("cchart").innerHTML = callSVG(CR.done);
  $("cbtns").innerHTML = CR.done ? "<button class='b go' data-call='next'>Next chart</button>" : "<button class='b buy' data-call='up'>Up</button><button class='b sell' data-call='down'>Down</button>";
  $("cmsg").innerHTML = CR.msg || "";
}
function callIt(dir) {
  if (dir === "next") { CR = null; callUI(); return; }
  if (!CR || CR.done) return;
  var win = dir === CR.answer, now = Date.now(), kept = CR.answer === CR.trend;
  CR.done = 1; S.g.cseed = (S.g.cseed + 1) >>> 0;
  if (win) { S.stats.calls++; S.g.hearts = G.gainHeart(S.g.hearts, now); }
  S.g.streak = G.touchStreak(S.g.streak, now);
  CR.msg = (win ? "<b class='up'>Good call.</b> +5 XP and a heart. " : "<b class='dn'>Not this time.</b> ") + (kept ? "The trend kept going, which happens more often than not." : "The trend flipped. A trend tilts the odds, it doesn't promise anything.");
  callUI(); award(win ? 5 : 0, { rounds: 1, calls: win ? 1 : 0 });
}

/* The lesson player: a few reading cards, then a quiz. A wrong answer costs a heart and comes back at the end. */
var PL = null;
function shuffle(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); for (var j = n - 1; j > 0; j--) { var k = Math.floor(Math.random() * (j + 1)), t = a[j]; a[j] = a[k]; a[k] = t; } return a; }
function ask(q) { return { k: "q", q: q, order: q.k === "tf" ? [0, 1] : shuffle(q.a.length) }; }
function optLabel(q, j) { return q.k === "tf" ? (j === 0 ? "True" : "False") : q.a[j]; }
function isRight(q, j) { return q.k === "tf" ? (j === 0) === q.c : j === q.c; }
function videoHTML(l) {
  return (l.yt ? "<div class='vid'><iframe loading='lazy' title='" + esc(l.t) + "' src='https://www.youtube-nocookie.com/embed/" + encodeURIComponent(l.yt) + "' allowfullscreen></iframe></div>" : "") +
    "<p><a target='_blank' rel='noopener noreferrer' href='https://www.youtube.com/results?search_query=" + encodeURIComponent(l.q) + "'>Find videos on this</a></p>";
}
function openLesson(id) {
  var f = G.flat(UNITS).filter(function (x) { return x.l.id === id; })[0];
  if (!f || !G.isOpen(UNITS, S.done, id)) return;
  var l = f.l, steps = l.cards.map(function (t) { return { k: "read", t: t }; });
  steps.push({ k: "read", t: l.tip, tip: 1 });
  l.quiz.forEach(function (q) { steps.push(ask(q)); });
  PL = { l: l, s: steps, i: 0, mis: 0, good: 0, need: steps.length, mode: "read", pick: null };
  $("player").className = "overlay"; document.body.style.overflow = "hidden"; document.querySelector(".wrap").inert = true;
  S.g.hearts = G.hearts(S.g.hearts, Date.now());
  if (S.g.hearts.n <= 0) outOfHearts(); else step();
}
function step() {
  var st = PL.s[PL.i];
  $("pprog").style.width = PL.good / PL.need * 100 + "%"; $("pfoot").className = "pfoot"; $("pmsgx").innerHTML = ""; $("pnext").disabled = false; hud();
  if (st.k === "read") {
    $("pmain").innerHTML = "<p class='mute small'>" + esc(PL.l.t) + "</p><h2 id='ptitle'>" + (st.tip ? "Remember this" : "Read") + "</h2><p class='read'>" + esc(st.t) + "</p>" + (st.tip ? videoHTML(PL.l) : "");
    PL.mode = "read"; $("pnext").textContent = "Continue"; $("pnext").focus();
  } else {
    var q = st.q;
    $("pmain").innerHTML = "<p class='mute small'>" + (q.k === "tf" ? "True or false?" : "Pick one") + "</p><h2 id='ptitle'>" + esc(q.q) + "</h2><div class='ans'>" +
      st.order.map(function (j) { return "<button data-ans='" + j + "' aria-pressed='false'>" + esc(optLabel(q, j)) + "</button>"; }).join("") + "</div>";
    PL.mode = "ask"; PL.pick = null; $("pnext").textContent = "Check"; $("pnext").disabled = true;
    var b = document.querySelector("#pmain [data-ans]"); if (b) b.focus();
  }
}
function pickAns(btn) {
  if (!PL || PL.mode !== "ask") return;
  PL.pick = +btn.dataset.ans;
  document.querySelectorAll("#pmain [data-ans]").forEach(function (b) { b.setAttribute("aria-pressed", b === btn); });
  $("pnext").disabled = false;
}
function nextStep() {
  if (!PL) return;
  if (PL.mode === "read") { PL.good++; advance(); return; }
  if (PL.mode === "ask") {
    if (PL.pick === null) return;
    var q = PL.s[PL.i].q, now = Date.now(), right = q.k === "tf" ? (q.c ? 0 : 1) : q.c;
    document.querySelectorAll("#pmain [data-ans]").forEach(function (b) { b.disabled = true; });
    if (isRight(q, PL.pick)) { PL.good++; $("pfoot").className = "pfoot good"; $("pmsgx").innerHTML = "<b>" + ico("check") + " Correct.</b> " + esc(q.why); }
    else {
      PL.mis++; S.g.hearts = G.loseHeart(S.g.hearts, now); PL.s.push(ask(q)); persist(); hud();
      $("pfoot").className = "pfoot bad"; $("pmsgx").innerHTML = "<b>" + ico("x") + " The answer: " + esc(optLabel(q, right)) + ".</b> " + esc(q.why) + " This one comes back at the end.";
    }
    $("pprog").style.width = PL.good / PL.need * 100 + "%";
    PL.mode = "after"; $("pnext").textContent = "Continue"; $("pnext").focus(); return;
  }
  if (PL.mode === "after") { if (S.g.hearts.n <= 0) outOfHearts(); else advance(); return; }
  closeLesson();
}
function advance() { PL.i++; if (PL.i >= PL.s.length) finish(); else step(); }
function finish() {
  var l = PL.l, first = !S.done[l.id], xp = first ? G.lessonXP(PL.mis) : 5, now = Date.now(), was = G.liveStreak(S.g.streak, now), lit = S.g.streak.last === G.dayKey(now);
  S.done[l.id] = 1; if (!PL.mis) S.stats.perfect++;
  S.g.streak = G.touchStreak(S.g.streak, now);
  award(xp, { lessons: 1, perfect: PL.mis ? 0 : 1 });
  var n = S.g.streak.streak;
  $("pprog").style.width = "100%";
  $("pmain").innerHTML = "<div class='done-big'>" + ico("star") + "<h2 id='ptitle'>" + (PL.mis ? "Lesson done" : "Perfect lesson") + "</h2><p class='mute'>" + esc(l.t) + "</p>" +
    "<div class='tiles'><div class='tile'><span class='small mute'>XP</span><b>+" + xp + "</b></div><div class='tile'><span class='small mute'>Streak</span><b>" + n + " day" + (n === 1 ? "" : "s") + "</b></div><div class='tile'><span class='small mute'>Mistakes</span><b>" + PL.mis + "</b></div></div>" +
    (!lit ? "<p>" + (n > 1 && n > was ? "Your streak is now " + n + " days." : "You started a streak. Come back tomorrow to keep it going.") + "</p>" : "") + (first ? "" : "<p class='mute small'>Replays earn 5 XP.</p>") + "</div>";
  $("pfoot").className = "pfoot good"; $("pmsgx").innerHTML = ""; $("pnext").textContent = "Continue"; $("pnext").disabled = false; $("pnext").focus();
  PL.mode = "done"; learnUI();
}
function outOfHearts() {
  var m = G.nextHeartMins(S.g.hearts, Date.now());
  $("pmain").innerHTML = "<div class='done-big'>" + ico("heart") + "<h2 id='ptitle'>Out of hearts</h2><p>One comes back every 30 minutes. The next one is in " + m + " min.</p><p class='mute'>Or win a round of Call it on the Learn page to earn one now.</p></div>";
  $("pprog").style.width = "0%"; $("pfoot").className = "pfoot bad"; $("pmsgx").innerHTML = ""; $("pnext").textContent = "Back to the path"; $("pnext").disabled = false; $("pnext").focus();
  PL.mode = "out"; hud();
}
function closeLesson() {
  if (PL && (PL.mode === "ask" || PL.mode === "after" || (PL.mode === "read" && PL.i > 0)) && !confirm("Quit this lesson? You'll start it over next time.")) return;
  var id = PL && PL.l.id; PL = null; $("player").className = "overlay hide"; document.body.style.overflow = ""; document.querySelector(".wrap").inert = false; learnUI(); hud();
  var n = id && document.querySelector("[data-lesson='" + id + "']"); if (n) n.focus();
}

/* ---------- headlines ---------- */
function news() {
  fetch("/api/news").then(function (r) { return r.json(); }).then(function (d) {
    if (!Array.isArray(d) || !d.length) throw new Error("none");
    $("headlines").innerHTML = d.filter(function (n) { return /^https:\/\//.test(n.url); }).map(function (n) {
      return "<a href='" + esc(n.url) + "' target='_blank' rel='noopener noreferrer'><b>" + esc(n.headline) + "</b><br><span class='mute small'>" + esc(n.source) + " · " + new Date(n.time * 1000).toLocaleString() + "</span></a>";
    }).join("");
  }).catch(function () { $("headlines").textContent = "Couldn’t load headlines right now."; });
}

/* ---------- accounts, cloud saves, leaderboards, parties (Supabase) ---------- */
var authMode = "signup", recovery = false, PRIMARY = "background:var(--btn);color:var(--btnink)", syncTimer;
function amsg(t) { if ($("authmsg")) $("authmsg").textContent = t; }
function authUI() {
  var a = $("auth");
  if (!sb) { a.className = "card hide"; return; }
  a.className = "card";
  if (recovery) {
    a.innerHTML = "<h2>Choose a new password</h2><div class='row'><input type='password' id='pw' minlength='8' autocomplete='new-password' placeholder='New password (8+ characters)' aria-label='New password'><button class='b' style='" + PRIMARY + "' id='go'>Save password</button></div><div class='small' id='authmsg'></div>";
    $("go").onclick = function () { var pw = $("pw").value; if (pw.length < 8) { amsg("Use at least 8 characters."); return; } sb.auth.updateUser({ password: pw }).then(function (r) { if (r.error) amsg(r.error.message); else { recovery = false; authUI(); } }); };
  } else if (!user) {
    var su = authMode === "signup";
    a.innerHTML = "<h2>Save your progress, join parties, and rank up</h2><div class='chips'><button class='chip' data-m='signup' aria-pressed='" + su + "'>Sign up</button><button class='chip' data-m='login' aria-pressed='" + !su + "'>Log in</button></div>" +
      "<div class='row'>" + (su ? "<input type='text' id='dn' maxlength='20' placeholder='Display name (public)' aria-label='Display name'>" : "") +
      "<input type='email' id='em' autocomplete='email' placeholder='Email' aria-label='Email'><input type='password' id='pw' minlength='8' autocomplete='" + (su ? "new-password" : "current-password") + "' placeholder='Password (8+ characters)' aria-label='Password'>" +
      "<button class='b' style='" + PRIMARY + "' id='go'>" + (su ? "Create account" : "Log in") + "</button>" + (su ? "" : "<button class='chip' id='fg'>Forgot password?</button>") + "</div><div class='small' id='authmsg'></div>";
    a.querySelectorAll("[data-m]").forEach(function (b) { b.onclick = function () { authMode = b.dataset.m; authUI(); }; });
    $("go").onclick = function () {
      var e = $("em").value.trim(), pw = $("pw").value;
      if (!e || pw.length < 8) { amsg("Enter your email and a password of at least 8 characters."); return; }
      if (su) {
        var n = $("dn").value.trim(); if (n.length < 2) { amsg("Choose a display name (2 to 20 characters). It shows on the leaderboards."); return; }
        if (badName(n)) { amsg("Please choose a different display name."); return; }
        sb.auth.signUp({ email: e, password: pw, options: { data: { display_name: n }, emailRedirectTo: location.origin } }).then(function (r) { amsg(r.error ? r.error.message : (r.data.session ? "Account created. You’re in!" : "Check your email to confirm your account, then come back and log in.")); });
      } else sb.auth.signInWithPassword({ email: e, password: pw }).then(function (r) { if (r.error) amsg(r.error.message); });
    };
    if (!su) $("fg").onclick = function () { var e = $("em").value.trim(); if (!e) { amsg("Type your email first."); return; } sb.auth.resetPasswordForEmail(e, { redirectTo: location.origin }).then(function () { amsg("If that email has an account, a reset link is on its way."); }); };
  } else {
    a.innerHTML = "<h2>You’re signed in</h2><p class='mute small' style='margin:4px 0 8px'>Your games, orders, achievements, and lesson progress save automatically.</p><div class='row'><label for='dn'>Display name</label><input type='text' id='dn' maxlength='20' value='" + esc(S.name) + "'><button class='b ghost' id='sn'>Save name</button><button class='b ghost' id='so'>Log out</button></div><div class='small' id='authmsg'></div>";
    $("sn").onclick = function () { var n = $("dn").value.trim(); if (n.length < 2) { amsg("Name must be at least 2 characters."); return; } if (badName(n)) { amsg("Please choose a different display name."); return; } S.name = n; persist(); doSync(true); amsg("Saved."); };
    $("so").onclick = function () { sb.auth.signOut().then(function () { var h = S.hide; S = fresh(); S.hide = h; user = null; PARTIES = []; PB = {}; CR = null; persist(); authUI(); learnUI(); draw(); partiesUI(); mine(); $("coach").innerHTML = ""; }); };
  }
}
function gameOf(slot) { return slot === S.cur ? { start: S.start, cash: S.cash, pos: S.pos, log: S.log, queue: S.queue } : S.games[slot]; }
function pushRow(slot) {
  var g = gameOf(slot); if (!sb || !user || !S.name || !g || !(g.start > 0)) return Promise.resolve();
  return sb.from("portfolios").upsert({ user_id: user.id, slot: slot, display_name: S.name, start_cash: g.start, cash: g.cash, positions: g.pos, queue: g.queue, log: g.log, total_value: Math.round(valOf(g.cash, g.pos) * 100) / 100, updated_at: new Date().toISOString() })
    .then(function (r) { if (r.error) amsg("Couldn’t save your game: " + r.error.message); });
}
function sync() { clearTimeout(syncTimer); syncTimer = setTimeout(doSync, 800); }
function doSync(boards) {
  if (!sb || !user || !S.name) return;
  Promise.all([
    sb.from("profiles").upsert({ user_id: user.id, display_name: S.name, xp: xpNow(), achievements: { ach: S.ach, stats: S.stats, done: S.done, g: S.g }, look: S.look, status: (statusLive() ? S.status.text : null) }).then(function (r) { if (r.error) amsg("Couldn’t save your profile: " + r.error.message); }),
    pushRow(S.cur)
  ]).then(function () { if (boards !== false) { loadBoard(); } });
}
function badge(xp) { return "<span class='mute small'>" + rankOf(xp || 0)[1] + "</span>"; }
function row(avLook, xp, name, status, right) {
  return "<li>" + avatarHTML(avLook, 28) + " " + esc(name) + " " + badge(xp) + "<span>" + right + "</span>" + (status ? "<div class='small mute' style='margin-left:36px'>“" + esc(status) + "”</div>" : "") + "</li>";
}
function loadBoard() {
  if (!sb) { $("lb").innerHTML = "<li class='mute'>Leaderboard isn’t set up yet.</li>"; return; }
  sb.from("global_leaderboard").select("display_name,return_pct,total_value,xp,look,status").order("return_pct", { ascending: false }).limit(20).then(function (r) {
    $("lb").innerHTML = r.error || !r.data.length ? "<li class='mute'>No one is on the board yet. Be the first.</li>" : r.data.map(function (x) { return row(x.look, x.xp, x.display_name, x.status, fmtp(Number(x.return_pct)) + " · " + money(Number(x.total_value))); }).join("");
  });
}
function loadXP() {
  if (!sb) { $("xlb").innerHTML = "<li class='mute'>The league isn’t set up yet.</li>"; return; }
  if (!user) { $("xlb").innerHTML = "<li class='mute'>Log in on the Trade tab to see the XP league.</li>"; return; }
  sb.from("profiles").select("display_name,xp,look,status,status_at").order("xp", { ascending: false }).limit(20).then(function (r) {
    $("xlb").innerHTML = r.error || !r.data.length ? "<li class='mute'>No one has earned XP yet.</li>" : r.data.map(function (x) { var live = x.status && x.status_at && Date.now() - Date.parse(x.status_at) < 864e5; return row(x.look, x.xp, x.display_name, live ? x.status : "", Number(x.xp) + " XP"); }).join("");
  });
}
function loadPartyBoard(p) {
  sb.from("portfolios").select("user_id,display_name,start_cash,total_value").eq("slot", p.id).then(function (r) {
    var rows = r.data || [];
    function show(info) {
      rows.forEach(function (x) { x.ret = (Number(x.total_value) / Number(x.start_cash) - 1) * 100; }); rows.sort(function (a, b) { return b.ret - a.ret; });
      PB[p.id] = rows.length ? rows.map(function (x) { var f = info[x.user_id] || {}, live = f.status && f.status_at && Date.now() - Date.parse(f.status_at) < 864e5; return row(f.look, f.xp, x.display_name, live ? f.status : "", fmtp(x.ret) + " · " + money(Number(x.total_value))); }).join("") : "<li class='mute'>No one has joined the game yet.</li>";
      var el = $("pb-" + p.id); if (el) el.innerHTML = PB[p.id];
    }
    if (!rows.length) { show({}); return; }
    sb.from("profiles").select("user_id,xp,look,status,status_at").in("user_id", rows.map(function (x) { return x.user_id; })).then(function (q) { var info = {}; (q.data || []).forEach(function (x) { info[x.user_id] = x; }); show(info); });
  });
}
function partiesUI() {
  var m = $("pmsg"), f = $("pforms"), l = $("plist");
  if (!sb) { m.textContent = "Parties need the Supabase setup. See the README."; f.className = "hide"; l.innerHTML = ""; return; }
  if (!user) { m.textContent = "Log in on the Trade tab to create or join a party."; f.className = "hide"; l.innerHTML = ""; return; }
  m.textContent = "Everyone in a party starts with the same money and gets a private leaderboard. Share your party’s code with friends."; f.className = "";
  l.innerHTML = PARTIES.length ? PARTIES.map(function (p) {
    return "<div class='card'><h2>" + esc(p.name) + "</h2><p class='mute small' style='margin:4px 0 8px'>Invite code: <b>" + esc(p.code) + "</b> · Everyone starts with " + money(Number(p.start_cash)) + "</p><button class='b ghost' data-play='" + esc(p.id) + "'>" + (S.cur === p.id ? "Playing now" : "Play this game") + "</button><ol class='lb' style='margin-top:10px' id='pb-" + esc(p.id) + "'>" + (PB[p.id] || "<li class='mute'>Loading…</li>") + "</ol></div>";
  }).join("") : "<p class='mute'>You’re not in a party yet.</p>";
}
function loadParties() {
  if (!sb || !user) { PARTIES = []; partiesUI(); return Promise.resolve(); }
  return sb.from("parties").select("*").order("created_at").then(function (r) { PARTIES = r.data || []; partiesUI(); PARTIES.forEach(loadPartyBoard); });
}
function pfm(t) { $("pfm").textContent = t; }
function partyAdded(p) {
  if (!PARTIES.some(function (x) { return x.id === p.id; })) PARTIES.push(p);
  if (!S.games[p.id]) S.games[p.id] = newGame(Number(p.start_cash));
  persist(); pushRow(p.id).then(function () { PARTIES.forEach(loadPartyBoard); });
  partiesUI(); draw(); pfm("You’re in “" + p.name + "”. Share the code " + p.code + " with friends.");
}
function switchGame(slot) {
  stash(); loadGame(slot); stash(); persist(); $("toast").textContent = ""; $("coach").innerHTML = ""; setTab("trade"); draw(); if (S.start > 0) sync();
}
function onUser(u) {
  user = u; authUI();
  if (!u) { partiesUI(); return; }
  Promise.all([
    sb.from("portfolios").select("*").eq("user_id", u.id),
    sb.from("profiles").select("*").eq("user_id", u.id).maybeSingle(),
    sb.from("parties").select("*").order("created_at")
  ]).then(function (rs) {
    var rows = rs[0].data || [], prof = rs[1].data; PARTIES = rs[2].data || [];
    if (S.uid && S.uid !== u.id) { var hd = S.hide; S = fresh(); S.hide = hd; } // this browser last held someone else's account
    var wasGuest = !S.uid; S.uid = u.id;
    var guest = S.cur === "solo" && S.start > 0 ? { start: S.start, cash: S.cash, pos: S.pos, log: S.log, queue: S.queue } : null;
    if (rows.length || prof) {
      S.games = {}; rows.forEach(function (x) { S.games[x.slot] = { start: Number(x.start_cash), cash: Number(x.cash), pos: x.positions || {}, log: x.log || [], queue: x.queue || [] }; });
      if (!S.games.solo && guest) S.games.solo = guest;
      if (prof) { var a = prof.achievements || {}; S.name = prof.display_name; S.ach = a.ach || {}; S.stats = a.stats || S.stats; S.done = Object.assign(fixDone(a.done), S.done);
        if (a.g) { var lg = S.g; S.g = a.g; CR = null;
          if (wasGuest) { S.g.lx = (+a.g.lx || 0) + (lg.lx || 0); if (lg.streak.last && !(a.g.streak && a.g.streak.last > lg.streak.last)) S.g.streak = lg.streak; }
          else if ((lg.lx || 0) > (+a.g.lx || 0)) S.g = lg; }
        fixUp(); S.look = Object.assign({}, S.look, prof.look || {}); S.status = { text: prof.status || "", t: prof.status_at ? Date.parse(prof.status_at) : 0 }; }
      loadGame(S.games.solo ? "solo" : "solo");
    } else {
      var m = (u.user_metadata && u.user_metadata.display_name) || ""; if (m) S.name = m; stash(); // first login: keep what you did as a guest
    }
    applyLook(); expireStatus(); persist(); authUI(); learnUI(); partiesUI(); PARTIES.forEach(loadPartyBoard); processQueue(); draw(); mine(); doSync();
  });
}
if (sb) {
  sb.auth.getSession().then(function (r) { onUser(r.data.session ? r.data.session.user : null); });
  sb.auth.onAuthStateChange(function (ev, sess) { if (ev === "PASSWORD_RECOVERY") { recovery = true; authUI(); } else if (ev === "SIGNED_IN" && (!user || !sess || user.id !== sess.user.id)) onUser(sess ? sess.user : null); });
} else authUI();

/* ---------- tabs and wiring ---------- */
function setTab(name) {
  document.querySelectorAll("nav button").forEach(function (b) { b.setAttribute("aria-selected", b.dataset.t === name); });
  ["learn", "trade", "party", "board", "profile"].forEach(function (s) { $(s).className = s === name ? "" : "hide"; });
  if (name === "board") { loadBoard(); loadXP(); mine(); }
  if (name === "learn") learnUI();
  if (name === "profile") profileUI();
  if (name === "party") { partiesUI(); PARTIES.forEach(loadPartyBoard); }
}
document.addEventListener("click", function (e) {
  var t = e.target.closest("[data-t]"), c = e.target.closest("[data-s]"), ls = e.target.closest("[data-lesson]"), an = e.target.closest("[data-ans]"), gl = e.target.closest("[data-goal]"), ca = e.target.closest("[data-call]"), r = e.target.closest("[data-r]"), q = e.target.closest("[data-q]"), pl = e.target.closest("[data-play]"), am = e.target.closest("[data-amt]"), md = e.target.closest("[data-mode]"), rv = e.target.closest("[data-rv]"), pk = e.target.closest("[data-pick]");
  if (t) setTab(t.dataset.t);
  if (c) { sel = c.dataset.s; draw(); }
  if (r) { RANGE = r.dataset.r; draw(); }
  if (ls && !ls.disabled) openLesson(ls.dataset.lesson);
  if (an && !an.disabled) pickAns(an);
  if (gl) { S.g.goal = +gl.dataset.goal; persist(); sync(); goalUI(); }
  if (ca) callIt(ca.dataset.call);
  if (q) { S.queue = S.queue.filter(function (o) { return o.id !== q.dataset.q; }); save(); draw(); }
  if (pl) switchGame(pl.dataset.play);
  if (am) startGame(am.dataset.amt);
  if (md) { MODE = md.dataset.mode; draw(); }
  if (rv) $("review").className = "card hide";
  if (pk && !pk.disabled) { var kv = pk.dataset.pick.split(":"); S.look[kv[0]] = kv[1]; applyLook(); persist(); sync(); profileUI(); mine(); }
});
$("pnext").onclick = nextStep; $("pclose").onclick = closeLesson;
document.addEventListener("keydown", function (e) { if (e.key === "Escape" && PL) closeLesson(); });
$("buy").onclick = function () { trade("Buy"); }; $("sell").onclick = function () { trade("Sell"); };
$("qty").oninput = draw;
$("amtgo").onclick = function () { startGame($("amt").value); };
$("gsel").onchange = function () { switchGame(this.value); };
$("prac").onclick = function () { S.prac = S.prac ? 0 : 1; persist(); clock(); };
$("gotit").onclick = function () { S.hide = 1; persist(); $("start").className = "card hide"; };
$("reset").onclick = function () {
  if (S.cur !== "solo" || !confirm("Start a new game? Your current account and positions will be erased, and you can pick a new starting amount.")) return;
  var go = function () { S.start = S.cash = 0; S.pos = {}; S.log = []; S.queue = []; $("coach").innerHTML = ""; $("toast").textContent = ""; stash(); persist(); draw(); };
  if (sb && user) sb.from("portfolios").delete().eq("user_id", user.id).eq("slot", "solo").then(go); else go();
};
if (sb) {
  $("pcreate").onclick = function () {
    var n = $("pn").value.trim(); if (n.length < 2) { pfm("Give your party a name (2 to 30 characters)."); return; }
    sb.rpc("create_party", { p_name: n, p_start: Number($("pa").value) }).then(function (r) { if (r.error) pfm(r.error.message); else { $("pn").value = ""; partyAdded(r.data); } });
  };
  $("pjoin").onclick = function () {
    var c = $("pc").value.trim(); if (!c) { pfm("Type the 6-letter code from your friend."); return; }
    sb.rpc("join_party", { p_code: c }).then(function (r) { if (r.error) pfm(r.error.message); else { $("pc").value = ""; partyAdded(r.data); } });
  };
  document.addEventListener("visibilitychange", function () { if (document.hidden) doSync(false); });
  setInterval(function () { if (user && S.start > 0) doSync(false); }, 300000);
}
if (S.hide) $("start").className = "card hide";
loadGame(S.cur); applyLook(); expireStatus(); learnUI(); draw(); clock(); prices(); news(); loadBoard(); mine(); partiesUI();
window.__refresh = function () { clock(); prices(); };
setInterval(function () { prices(); }, 60000); setInterval(function () { if (mkt().open) prices(sel); }, 5000); setInterval(tick, 1000); setInterval(function () { clock(); expireStatus(); hud(); }, 15000);
})();
