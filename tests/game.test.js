const test = require("node:test");
const assert = require("node:assert");
const G = require("../public/game.js");

const day = (y, m, d, h = 12) => new Date(y, m - 1, d, h).getTime();

test("streak grows on back-to-back days and resets after a gap", () => {
  let s = G.touchStreak({}, day(2026, 3, 1));
  assert.equal(s.streak, 1);
  s = G.touchStreak(s, day(2026, 3, 1, 20));
  assert.equal(s.streak, 1, "same day does not double count");
  s = G.touchStreak(s, day(2026, 3, 2));
  assert.equal(s.streak, 2);
  s = G.touchStreak(s, day(2026, 3, 5));
  assert.equal(s.streak, 1);
  assert.equal(s.best, 2);
});

test("a freeze covers one missed day, and a week earns a freeze", () => {
  let s = {};
  for (let d = 1; d <= 7; d++) s = G.touchStreak(s, day(2026, 3, d));
  assert.equal(s.streak, 7);
  assert.equal(s.freezes, 1);
  assert.equal(G.liveStreak(s, day(2026, 3, 9)), 7, "freeze keeps it alive while you are away");
  s = G.touchStreak(s, day(2026, 3, 9));
  assert.equal(s.streak, 8);
  assert.equal(s.freezes, 0);
  assert.equal(G.liveStreak(s, day(2026, 3, 12)), 0);
});

test("streak survives a daylight saving change", () => {
  let s = G.touchStreak({}, day(2026, 3, 7, 23));
  s = G.touchStreak(s, day(2026, 3, 8, 1));
  assert.equal(s.streak, 2);
});

test("hearts drop on a mistake and refill one every 30 minutes", () => {
  const t = day(2026, 3, 1);
  let h = G.loseHeart(G.loseHeart({ n: 5, t }, t), t);
  assert.equal(h.n, 3);
  assert.equal(G.nextHeartMins(h, t), 30);
  assert.equal(G.hearts(h, t + 31 * 60000).n, 4);
  assert.equal(G.hearts(h, t + 10 * 3600000).n, 5);
  assert.equal(G.loseHeart({ n: 0, t }, t).n, 0, "never below zero");
  assert.equal(G.gainHeart({ n: 5, t }, t).n, 5, "never above five");
});

test("lessons unlock in order", () => {
  const units = [{ lessons: [{ id: "a" }, { id: "b" }] }, { lessons: [{ id: "c" }] }];
  assert.equal(G.nextLesson(units, {}), "a");
  assert.equal(G.isOpen(units, {}, "b"), false);
  assert.equal(G.isOpen(units, { a: 1 }, "b"), true);
  assert.equal(G.nextLesson(units, { a: 1, b: 1 }), "c");
  assert.equal(G.nextLesson(units, { a: 1, b: 1, c: 1 }), null);
  assert.equal(G.lessonXP(0), 15);
  assert.equal(G.lessonXP(2), 10);
});

test("daily quests: three different ones, same for everyone on a day", () => {
  const q = G.questsFor("2026-03-01");
  assert.equal(q.length, 3);
  assert.equal(new Set(q.map((x) => x.id)).size, 3);
  assert.deepEqual(G.questsFor("2026-03-01"), q);
  assert.equal(G.today({ k: "old" }, day(2026, 3, 1)).xp, 0);
});

test("Call it rounds are repeatable and the trend carries on about 65% of the time", () => {
  assert.deepEqual(G.round(42), G.round(42));
  const r = G.round(7);
  assert.equal(r.candles.length, 40);
  assert.equal(r.cut, 30);
  let same = 0;
  for (let i = 1; i <= 2000; i++) { const x = G.round(i); if (x.answer === x.trend) same++; }
  assert.ok(same / 2000 > 0.55 && same / 2000 < 0.8, "carry-on rate " + same / 2000);
});

test("a clock that goes back a day leaves the streak alone", () => {
  let s = G.touchStreak({}, day(2026, 3, 1));
  s = G.touchStreak(s, day(2026, 3, 2));
  const back = G.touchStreak(s, day(2026, 3, 1));
  assert.strictEqual(back.streak, 2);
  assert.strictEqual(back.last, s.last);
});
