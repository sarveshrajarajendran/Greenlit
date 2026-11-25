// Price history for the chart (Today, Yesterday, Past week, Past month) from Twelve Data's free plan.
// Free limits are about 8 calls/minute and 800/day, so every response is cached on Vercel's edge.
// "intraday" returns the last 3 trading days of 5-minute prices (the page picks today and yesterday from it).
const SYMS = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "SPY", "KO", "DIS"];
const CFG = { intraday: ["5min", 300, 300], week: ["1h", 80, 900], month: ["1day", 40, 3600] }; // interval, rows, cache seconds

module.exports = async (req, res) => {
  const key = process.env.TWELVE_KEY;
  if (!key) return res.status(500).json({ error: "Missing TWELVE_KEY env var (free key from twelvedata.com)" });
  const sym = String((req.query && req.query.symbol) || "").toUpperCase();
  const range = String((req.query && req.query.range) || "");
  const cfg = CFG[range];
  if (!SYMS.includes(sym) || !cfg) return res.status(400).json({ error: "Bad request" });
  try {
    const url = `https://api.twelvedata.com/time_series?symbol=${sym}&interval=${cfg[0]}&outputsize=${cfg[1]}&order=ASC&timezone=America/New_York&apikey=${key}`;
    const d = await (await fetch(url)).json();
    if (d.status === "error" || !Array.isArray(d.values)) return res.status(502).json({ error: d.message || "History unavailable" });
    const pts = d.values.map((v) => ({ t: String(v.datetime), o: Number(v.open), h: Number(v.high), l: Number(v.low), c: Number(v.close) })).filter((p) => p.c > 0).sort((a, b) => (a.t < b.t ? -1 : 1));
    const days = [...new Set(pts.map((p) => p.t.slice(0, 10)))];
    let out;
    if (range === "intraday") out = { days: days.slice(-3).map((date) => ({ date, points: pts.filter((p) => p.t.startsWith(date)) })) };
    else if (range === "week") { const keep = new Set(days.slice(-5)); out = { points: pts.filter((p) => keep.has(p.t.slice(0, 10))) }; }
    else out = { points: pts.slice(-22) };
    res.setHeader("Cache-Control", `s-maxage=${cfg[2]}, stale-while-revalidate=${cfg[2] * 3}`);
    res.status(200).json(out);
  } catch (e) {
    res.status(502).json({ error: "History provider unavailable" });
  }
};
