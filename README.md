# Greenlit

*Practice like it’s real.*

Free paper-trading site that teaches beginners to trade. Real (delayed) prices, price history, lessons, news, accounts, parties with friends, achievements and ranks, and a global leaderboard. Everything runs on free tiers.

## What's inside
- **Games with your own starting amount.** Each player picks $10k, $50k, $100k, $1M, or a custom amount. Rankings use percent return, so any amount is fair.
- **Parties.** Create a party, pick the starting money, and share the 6-letter code. Everyone starts equal and gets a private leaderboard. Switch games from the Game menu on the Trade tab.
- **Achievements and ranks.** Milestones give XP. Ranks: Starter, Trader, Pro, Expert.
- **Profile and settings.** Pick an interface color and light/dark mode, a profile picture, an accessory (crown, top hat, cap...), a banner color and effect. Cooler items unlock as you rank up and earn achievements.
- **Status of the day.** A short message (60 characters) shown on your profile and the leaderboards. It disappears after 24 hours and can be replaced any time. Bad words become ####.
- **Chart ranges:** Live, Today, Yesterday, Past week, Past month.
- **Closed-market orders** queue and fill at the next open.
- **Accounts** (email and password) save games, orders, achievements and lesson progress.

## Setup (about 30 minutes)

### 1. Get two free keys
1. **Finnhub** (finnhub.io): live prices and news headlines.
2. **Twelve Data** (twelvedata.com): price history for the chart. The free plan is about 800 calls a day and 8 a minute. Responses are cached so this is plenty.

### 2. Create the database (Supabase)
1. Sign up at supabase.com and create a new project.
2. **SQL Editor > New query**, paste all of `supabase/schema.sql`, click Run. (If you ran an older version, run the `drop table` line at the top of that file first.)
3. **Authentication**: make sure Email sign-in is on. By default Supabase emails a confirmation link; for quick testing you can turn off **Confirm email**.
4. **Project Settings > API**: copy the Project URL and the `anon` public key into `public/config.js`.
5. After deploying, add your Vercel URL under **Authentication > URL Configuration** (Site URL and Redirect URLs).

### 3. GitHub, then Vercel
1. Push this folder to a new GitHub repo.
2. In Vercel: **Add New > Project**, import the repo, framework preset **Other**, leave build settings empty.
3. Add environment variables `FINNHUB_KEY` and `TWELVE_KEY`.
4. Deploy.

### 4. Domain (optional)
You get a free `.vercel.app` address. For your domain, check the GitHub Student Developer Pack for a free domain, then add it in Vercel under Settings > Domains.

## Try it on your computer first
```
npm i -g vercel
vercel dev
```
Put `FINNHUB_KEY=...` and `TWELVE_KEY=...` in a file named `.env` first.

## Add real videos
Open `public/lessons.js` and put a YouTube video ID in each lesson's `yt` field (the part after `v=`). The video then plays inside the lesson.

## How closed-market orders work
- When the market is closed, Buy/Sell become **Queue buy / Queue sell**. Cash for queued buys is set aside and queued sells count against shares you own.
- Queued orders fill at **the day's opening price** the next time the site loads or is open after the market opens. They are saved to the account, so it works from any device.
- If a player doesn't visit for days, the order fills at the open of the day they return, because the free plans have no way to look up the exact historical open. A scheduled server job fixes this (see below).
- **Instant fills** (header button) is a testing mode.

## Word filter (important)
The status and display names are filtered in the browser and again in the database (the `blocked_words` table in `supabase/schema.sql`). The starter list is small on purpose. Before a public launch, load a maintained list into that table and into `BAD_EXACT` and `BAD_CONTAINS` in `public/app.js`, for example the open-source LDNOOBW list or the `bad-words` package list, and review it for slurs. No filter catches everything, so consider adding a "report" button later.

## Known limits (good next projects)
- **Leaderboards can be cheated.** The browser reports its own account value, so a technical user could fake it. Fix: do trades in an API function that checks prices and updates the database itself. A scheduled job (Vercel Cron plus a Supabase service key) could also fill everyone's queued orders at exactly 9:30. This is the best next upgrade and a great interview story.
- Free prices can be delayed. The site says so. For true real-time, look at Finnhub's or Alpaca's free streaming and check their current limits.
- Market holidays aren't handled by the clock.
- Only market orders so far. Add limit and stop orders next.
- Party members can see each other's names, returns and ranks, but never each other's positions.
