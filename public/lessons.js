// The lesson path. Each lesson: a few short reading cards, then a quiz.
// Quiz kinds: "mc" (pick one, c = index of the right answer) and "tf" (true or false, c = true/false).
// To embed a video, set yt to a YouTube video ID (the part after v=). Otherwise a "find videos" link shows.
// Lesson ids are saved in player progress, so don't rename them once people have played.
window.UNITS = [
 { t: "Unit 1", n: "How the market works", c: "#2e7d4f", lessons: [
  { id: "stock", t: "What is a stock?", q: "what is a stock for beginners", yt: "",
    cards: ["A stock is a tiny slice of ownership in a company. Own one share of Coca-Cola and you own a sliver of the whole business.",
            "If the company grows and more people want its shares, the price tends to rise. If it struggles, the price tends to fall."],
    tip: "You're not betting on a ticker symbol. You're buying part of a business.",
    quiz: [
     { k: "mc", q: "You buy one share of Disney. What do you own?", a: ["A tiny piece of Disney", "A loan you gave Disney", "Store credit at Disney"], c: 0, why: "A share is ownership. A bond would be a loan." },
     { k: "tf", q: "A stock's price is set by the company once a year.", c: false, why: "Buyers and sellers set the price all day, every trading day." },
     { k: "mc", q: "More people want to buy a stock than sell it. The price usually…", a: ["Goes up", "Goes down", "Stays exactly the same"], c: 0, why: "More demand than supply pushes the price up." }
    ] },
  { id: "hours", t: "When the market is open", q: "stock market hours explained beginners", yt: "",
    cards: ["US stocks trade 9:30 AM to 4:00 PM Eastern, Monday to Friday. Outside those hours there's thinner \"extended\" trading.",
            "The first and last minutes of the day are usually the wildest. Prices can also jump overnight when news lands while the market is shut."],
    tip: "Lots of beginners do better skipping the first 15 minutes after the open.",
    quiz: [
     { k: "mc", q: "When does the regular US market open?", a: ["9:30 AM Eastern", "8:00 AM Pacific", "Noon Eastern"], c: 0, why: "Regular hours run 9:30 AM to 4:00 PM Eastern." },
     { k: "tf", q: "An order you queue on Saturday fills at Friday's closing price.", c: false, why: "It fills at Monday's opening price, which can be very different. In Greenlit too." },
     { k: "mc", q: "A stock closed at $50. Big news comes out overnight. The next morning it opens at $56. That's called…", a: ["A gap up", "A dividend", "A stock split"], c: 0, why: "When the open jumps away from the last close, traders call it a gap." }
    ] },
  { id: "etf", t: "Index funds and ETFs", q: "what is an ETF index fund explained", yt: "",
    cards: ["An ETF is a basket of many stocks you can buy like a single stock. SPY, in Greenlit, holds the 500 big companies in the S&P 500.",
            "One company having a terrible year barely dents a basket of 500. That's why lots of long-term investors just hold an index fund."],
    tip: "When you don't know what to buy, the whole market is a pretty good answer.",
    quiz: [
     { k: "mc", q: "SPY is…", a: ["A fund of 500 big US companies", "One big US tech company", "A bank savings account"], c: 0, why: "SPY tracks the S&P 500 index." },
     { k: "tf", q: "If one company in the S&P 500 drops 30%, SPY also drops 30%.", c: false, why: "It's one of 500, so the hit to the fund is small." },
     { k: "mc", q: "Why do beginners often start with index funds?", a: ["One bad company can't sink them", "They always go up each year", "They can never lose money"], c: 0, why: "Index funds still fall in bad markets. They just spread out the risk." }
    ] }
 ] },
 { t: "Unit 2", n: "Reading charts and placing orders", c: "#2f6690", lessons: [
  { id: "charts", t: "Reading a price chart", q: "how to read stock charts beginners", yt: "",
    cards: ["A line chart connects prices over time. Up means buyers are winning, down means sellers are.",
            "A candle shows four prices for one stretch of time: open, high, low and close. Green means it closed higher than it opened. Red means lower.",
            "Look at the bigger trend first, then zoom in. One red candle is noise. A trend is many."],
    tip: "Practice reading charts in Call it. It's on the Learn page.",
    quiz: [
     { k: "mc", q: "A green candle means the price…", a: ["Closed higher than it opened", "Hit its highest price ever", "Paid its owners a dividend"], c: 0, why: "Green just means close above open for that stretch." },
     { k: "mc", q: "The long thin lines above and below a candle show…", a: ["The high and low", "Trading volume", "The company's profit"], c: 0, why: "Those wicks show how far the price swung." },
     { k: "tf", q: "One big red candle means the trend has flipped down.", c: false, why: "One candle is noise. Look at the bigger picture." }
    ] },
  { id: "orders", t: "Order types", q: "market order vs limit order vs stop order", yt: "",
    cards: ["A market order trades right now at whatever the price is.",
            "A limit order only trades at your price or better. A stop order sells automatically if the price falls to a level you picked."],
    tip: "Limit orders stop you paying more than you meant to.",
    quiz: [
     { k: "mc", q: "You want to buy Tesla, but not for more than $200. Which order?", a: ["Limit order at $200", "Market order right now", "Stop order at $200"], c: 0, why: "A limit caps the price you'll pay." },
     { k: "mc", q: "A stop order is mostly used to…", a: ["Limit a loss", "Buy faster", "Get a dividend"], c: 0, why: "It sells for you if the price drops to your level." },
     { k: "tf", q: "A market order can fill at a different price than the one you saw a second ago.", c: true, why: "Prices move. Market orders take whatever the price is when they fill." }
    ] },
  { id: "spread", t: "The spread: the hidden cost", q: "bid ask spread explained for beginners", yt: "",
    cards: ["Every stock has two prices: the bid (what buyers pay) and the ask (what sellers want). The gap is the spread.",
            "Buy and instantly sell, and you lose the spread even if the price didn't move. Greenlit charges a small spread on every trade so you feel this."],
    tip: "Flipping the same stock over and over mostly pays the spread.",
    quiz: [
     { k: "tf", q: "If you buy and sell straight away at the same quoted price, you break even.", c: false, why: "You pay a little above and sell a little below. That's the spread." },
     { k: "mc", q: "Who mostly wins from lots of tiny in-and-out trades?", a: ["Whoever collects the spread", "The trader making them", "Nobody, it evens out"], c: 0, why: "Every round trip pays the spread." },
     { k: "mc", q: "The gap between the bid and ask is called…", a: ["The spread", "The margin", "The yield"], c: 0, why: "Bid, ask, spread." }
    ] }
 ] },
 { t: "Unit 3", n: "Staying in the game", c: "#a4552a", lessons: [
  { id: "risk", t: "How much to risk on one trade", q: "position sizing risk management trading", yt: "",
    cards: ["Decide what you can lose before you buy. Lots of traders risk only 1 to 2 percent of their account on one idea.",
            "Losses are lopsided. Drop 50% and you need a 100% gain just to get back to even."],
    tip: "Write down your exit before you enter.",
    quiz: [
     { k: "mc", q: "Your account drops 50%. What gain gets you back to even?", a: ["100%", "50%", "25%"], c: 0, why: "$100 → $50 needs to double to get back to $100." },
     { k: "mc", q: "You have $10,000. Risking 2% on one trade means a max loss of about…", a: ["$200", "$2,000", "$20"], c: 0, why: "2% of $10,000 is $200." },
     { k: "tf", q: "The best time to pick your exit is after the trade starts losing.", c: false, why: "Pick it before you buy, while you're calm." }
    ] },
  { id: "diversify", t: "Don't put it all in one stock", q: "diversification explained for beginners", yt: "",
    cards: ["Owning several different stocks, or an index fund, means one bad company can't wreck you.",
            "Putting everything in one stock is how accounts blow up. Greenlit's coach warns you when one stock is over 40% of your account."],
    tip: "Spread across companies that do different things, not five tech stocks.",
    quiz: [
     { k: "mc", q: "Which is more spread out?", a: ["Apple, Coca-Cola, Disney and SPY", "Apple, Microsoft and Nvidia", "All of it in Tesla stock"], c: 0, why: "Different industries, plus a 500-stock fund." },
     { k: "tf", q: "Diversifying means you can never lose money.", c: false, why: "It lowers the damage from one company. Whole markets still fall." },
     { k: "mc", q: "Greenlit warns you when one stock is more than what share of your account?", a: ["40%", "5%", "90%"], c: 0, why: "Over 40% in one stock is a lot of eggs in one basket." }
    ] },
  { id: "plan", t: "Build a trading plan", q: "how to make a trading plan beginners", yt: "",
    cards: ["Before every trade, answer three things: why am I buying, where do I take profit, and where do I get out if I'm wrong?",
            "Then keep a journal. After a week, read your losers. You'll usually see the same mistake twice."],
    tip: "If you can't say why you're buying in one sentence, skip it.",
    quiz: [
     { k: "mc", q: "Which is NOT one of the three plan questions?", a: ["What will my friends think?", "Why am I buying?", "Where do I get out if I'm wrong?"], c: 0, why: "Reason, target, exit. That's the plan." },
     { k: "tf", q: "A trading journal is only useful for winning trades.", c: false, why: "Losers teach the most." },
     { k: "mc", q: "You can't explain why you want a stock. Best move?", a: ["Skip the trade", "Buy a little anyway", "Buy a lot to make it count"], c: 0, why: "No reason, no trade." }
    ] }
 ] },
 { t: "Unit 4", n: "Thinking like a trader", c: "#6b4c9a", lessons: [
  { id: "daytrade", t: "The truth about day trading", q: "is day trading profitable truth beginners", yt: "",
    cards: ["Day trading means buying and selling within the same day. Studies of regular people who day trade keep finding that most lose money after costs.",
            "US rules have also set minimums for frequent day trading in margin accounts, so check the current rule before you try it with real money."],
    tip: "Use this simulator to find out if you have an edge before real money is involved.",
    quiz: [
     { k: "tf", q: "Most regular people who day trade make money.", c: false, why: "Study after study finds most lose after costs." },
     { k: "mc", q: "What's the cheapest way to test a day-trading idea?", a: ["Paper trading first", "Borrowing money", "Copying a stranger online"], c: 0, why: "Pretend money, real lessons." },
     { k: "mc", q: "Day trading means…", a: ["Buying and selling in one day", "Holding a stock for a year", "Trading only on weekdays"], c: 0, why: "In and out the same day." }
    ] },
  { id: "news", t: "Reading the news without panic", q: "how news moves the stock market", yt: "",
    cards: ["Earnings, interest rate decisions and economic reports move prices. But markets react to the surprise, not the news itself.",
            "A company can report record profit and still fall, if everyone expected even more."],
    tip: "Ask what's already priced in before you act.",
    quiz: [
     { k: "mc", q: "A company beats last year's profit, but the stock falls. Most likely why?", a: ["People expected even more", "The news was fake", "Stocks always fall on news"], c: 0, why: "Prices move on surprise versus expectations." },
     { k: "tf", q: "Headlines are written to tell you what to buy.", c: false, why: "They're written to get clicks." },
     { k: "mc", q: "\"Priced in\" means…", a: ["The market already expected it", "The stock is cheap right now", "The trade has no fees"], c: 0, why: "If everyone saw it coming, it's already in the price." }
    ] },
  { id: "mistakes", t: "Why traders lose (and the fix)", q: "why most day traders lose money and how to avoid it", yt: "",
    cards: ["The usual suspects: no exit plan, chasing big jumps, trading too often, betting too big on one stock and panic selling.",
            "Every losing trade in Greenlit comes with a review that tells you which one it was. Read them. They're the real lessons."],
    tip: "Losing is part of trading. Keeping losses small is the skill.",
    quiz: [
     { k: "mc", q: "A stock is up 12% today and you buy because you don't want to miss out. That's…", a: ["Chasing", "Diversifying", "Hedging"], c: 0, why: "Buying a spike out of FOMO is chasing." },
     { k: "mc", q: "Your stock drops 3% in a minute and you sell in a panic, with no plan. The fix?", a: ["Decide your exit before you buy", "Check the price more often", "Buy more when it drops"], c: 0, why: "A plan made while calm beats a decision made while scared." },
     { k: "tf", q: "Good traders win almost every trade.", c: false, why: "Plenty of good traders lose often. They keep the losses small." }
    ] }
 ] }
];
// Flat list, oldest code paths (and the "Straight-A student" achievement) still read this.
window.LESSONS = [].concat.apply([], window.UNITS.map(function (u) { return u.lessons; }));
