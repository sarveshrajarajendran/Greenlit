// Fetches prices from Finnhub. The key stays secret on the server (Vercel env var FINNHUB_KEY).
// /api/quotes            -> all stocks, cached 60s
// /api/quotes?symbol=AAPL -> one stock, cached 5s (used for the stock the visitor is watching)
// Vercel's cache means all visitors share the same calls, which keeps us inside the free limits.
const SYMS = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "SPY", "KO", "DIS"];

module.exports = async (req, res) => {
  const key = process.env.FINNHUB_KEY;
  if (!key) return res.status(500).json({ error: "Missing FINNHUB_KEY env var" });
  const one = String((req.query && req.query.symbol) || "").toUpperCase();
  const list = SYMS.includes(one) ? [one] : SYMS;
  try {
    const out = {};
    await Promise.all(list.map(async (s) => {
      const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${s}&token=${key}`);
      const q = await r.json();
      if (q && q.c) out[s] = { price: q.c, open: q.o, changePct: q.dp, prevClose: q.pc, time: q.t };
    }));
    const ttl = list.length === 1 ? 5 : 60;
    res.setHeader("Cache-Control", `s-maxage=${ttl}, stale-while-revalidate=${ttl * 5}`);
    res.status(200).json(out);
  } catch (e) {
    res.status(502).json({ error: "Price provider unavailable" });
  }
};
