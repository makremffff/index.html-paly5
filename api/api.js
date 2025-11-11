// ✅ تخزين اللاعبين داخل الذاكرة (Memory Store)
if (!global.players) global.players = {};
const players = global.players;

// ✅ إنشاء لاعب إذا غير موجود
function ensurePlayer(userID) {
  if (!players[userID]) {
    players[userID] = {
      points: 0,
      invited: [],
      referrer: null,
      lastBox: 0,
      lastBonus: 0
    };
  }
}

export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  const { action, userID, amount, address, ref } = req.query;
  if (!action) return res.status(400).json({ error: "Missing action" });
  if (userID) ensurePlayer(userID);

  const user = players[userID];

  switch (action) {

    // ✅ تسجيل لاعب + إحالات
    case "register":
      if (ref && players[ref] && ref !== userID) {
        if (!user.referrer) {
          user.referrer = ref;
          players[ref].invited.push(userID);
          players[ref].points += 500;
        }
      }
      return res.json({
        success: true,
        referrer: user.referrer
      });

    // ✅ بيانات الإحالة
    case "getRefInfo":
      return res.json({
        success: true,
        invitedCount: user.invited.length,
        invitedList: user.invited,
        referrer: user.referrer,
        points: user.points
      });

    // ✅ صندوق كل 5 دقائق
    case "openBox":
      const now = Date.now();
      const boxCooldown = 5 * 60 * 1000;

      if (now - user.lastBox < boxCooldown) {
        return res.json({
          success: false,
          wait: Math.ceil((boxCooldown - (now - user.lastBox)) / 1000)
        });
      }

      const reward = Math.floor(Math.random() * 100) + 10;
      user.points += reward;
      user.lastBox = now;

      return res.json({ success: true, reward });

    // ✅ Bonus كل 12 دقيقة
    case "bonus":
      const now2 = Date.now();
      const bonusCooldown = 12 * 60 * 1000;

      if (now2 - user.lastBonus < bonusCooldown) {
        return res.json({
          success: false,
          wait: Math.ceil((bonusCooldown - (now2 - user.lastBonus)) / 1000)
        });
      }

      const bonusReward = 200;
      user.points += bonusReward;
      user.lastBonus = now2;

      return res.json({ success: true, reward: bonusReward });

    // ✅ الرصيد
    case "getBalance":
      return res.json({
        success: true,
        points: user.points,
        invited: user.invited.length,
        usdt: 0
      });

    // ✅ swap
    case "swap":
      const pts = parseInt(amount);
      if (!pts || pts < 10000)
        return res.status(400).json({ error: "Min 10000 points" });

      const usdt = ((pts / 10000) * 0.005).toFixed(3);
      return res.json({ success: true, usdt });

    // ✅ إرسال طلب سحب إلى التلغرام
    case "withdraw":
      if (!userID || !amount || !address)
        return res.status(400).json({ error: "Missing params" });

      const token = "8222744961:AAE90Eehr8PqldV6oKxIS9Yo9hw69Zi83Us";
      const chatID = "8447940021";

      const msg = `🚨 Withdrawal
User: ${userID}
Amount: ${amount} USDT
Address: ${address}`;

      fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatID,
          text: msg
        }),
      });

      return res.json({
        success: true,
        message: "Withdrawal sent!"
      });

    default:
      return res.status(400).json({ error: "Invalid action" });
  }
}