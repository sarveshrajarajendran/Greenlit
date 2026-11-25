// General market headlines from Finnhub. We show headline + source and LINK OUT to the original article.
module.exports = async (req, res) => {
  const key = process.env.FINNHUB_KEY;
  if (!key) return res.status(500).json({ error: "Missing FINNHUB_KEY env var" });
  try {
    const r = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${key}`);
    const items = await r.json();
    const out = (Array.isArray(items) ? items : []).slice(0, 12).map((n) => ({
      headline: n.headline, source: n.source, url: n.url, time: n.datetime,
    }));
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=900");
    res.status(200).json(out);
  } catch (e) {
    res.status(502).json({ error: "News provider unavailable" });
  }
};
