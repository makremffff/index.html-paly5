l// ✅ تخزين اللاعبين داخل الذاكرة (Memory Store) لأن Vercel لا يسمح بالكتابة للملفات
let players = {};

// ✅ إنشاء لاعب لو غير موجود
function ensurePlayer(userID) {
  if (!players[userID]) {
    players[userID] = {
      points: 0,
      invited: [],
      referrer: null,
      lastBox: 0,
      lastBonus: 0 // ✅ جديد: مكافأة كل 12 دقيقة
    };
  }
}

export default function handler(req, res) {
  const { action, userID, amount, address, ref } = req.query;

  if (!action) return res.status(400).json({ error: "Missing action" });

  // ✅ ضمان وجود اللاعب
  if (userID) ensurePlayer(userID);

  switch (action) {

    // ✅ تسجيل لاعب + نظام إحالات
    case "register":

      if (ref && players[ref] && ref !== userID) {
        // إذا اللاعب لم يأخذ ref من قبل
        if (!players[userID].referrer) {
          players[userID].referrer = ref;
          players[ref].invited.push(userID);

          // ✅ مكافأة 500 نقطة للمُحيل
          players[ref].points += 500;
        }
      }

      return res.json({
        success: true,
        message: "User registered ✅",
        referrer: players[userID].referrer
      });

    // ✅ جلب معلومات الإحالات
    case "getRefInfo":
      return res.json({
        success: true,
        invitedCount: players[userID].invited.length,
        invitedList: players[userID].invited,
        referrer: players[userID].referrer,
        points: players[userID].points
      });

    // ✅ فتح صندوق كل 5 دقائق
    case "openBox":
      const now = Date.now();
      const boxCooldown = 5 * 60 * 1000; // 5 دقائق

      if (now - players[userID].lastBox < boxCooldown) {
        const wait = Math.ceil((boxCooldown - (now - players[userID].lastBox)) / 1000);
        return res.json({ success: false, wait });
      }

      const boxReward = Math.floor(Math.random() * 100) + 10;
      players[userID].points += boxReward;
      players[userID].lastBox = now;

      return res.json({ success: true, reward: boxReward });

    // ✅ مكافأة Bonus كل 12 دقيقة
    case "bonus":
      const now2 = Date.now();
      const bonusCooldown = 12 * 60 * 1000; // 12 دقيقة

      if (now2 - players[userID].lastBonus < bonusCooldown) {
        const wait = Math.ceil((bonusCooldown - (now2 - players[userID].lastBonus)) / 1000);
        return res.json({ success: false, wait });
      }

      const bonusReward = 200; // ✅ غيّر المكافأة لو تريد
      players[userID].points += bonusReward;
      players[userID].lastBonus = now2;

      return res.json({ success: true, reward: bonusReward });

    // ✅ جلب رصيد اللاعب
    case "getBalance":
      return res.json({
        success: true,
        points: players[userID].points,
        invited: players[userID].invited.length,
        usdt: 0,
        message: "Balance fetched"
      });

    // ✅ المهام — يبقى كما هو
    case "claimMystery":
      return res.json({
        success: true,
        reward: Math.floor(Math.random() * (200 - 10 + 1)) + 10,
      });

    case "claimQuickBonus":
      return res.json({ success: true, reward: 500 });

    case "watchAd":
      return res.json({
        success: true,
        remaining: Math.max(0, (parseInt(req.query.counter) || 30) - 1),
      });

    case "claimTask":
      return res.json({ success: true, reward: 10000 });

    // ✅ swap
    case "swap":
      const pts = parseInt(amount);
      if (!pts || pts < 10000)
        return res.status(400).json({ error: "Min 10,000 points" });

      const usdt = ((pts / 10000) * 0.005).toFixed(3);
      return res.json({ success: true, usdt });

    // ✅ السحب — إرسال طلب إلى البوت
    case "withdraw":
      if (!userID || !amount || !address)
        return res.status(400).json({ error: "Missing params" });

      const telegramToken = "8222744961:AAE90Eehr8PqldV6oKxIS9Yo9hw69Zi83Us";
      const chatID = "8447940021";

      const msg = `🚨 New Withdrawal 🚨
👤 User: ${userID}
💰 Amount: ${amount} USDT
📍 Address: <code>${address}</code>
✅ Approve: <code>/approve ${address} ${amount}</code>
❌ Reject: <code>/reject ${address} ${amount}</code>`;

      fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatID,
          text: msg,
          parse_mode: "HTML",
        }),
      }).catch(() => {});

      return res.json({
        success: true,
        message: "Withdrawal request sent to admin!",
      });

    // ✅ في حالة Action غير معروف
    default:
      return res.status(400).json({ error: "Invalid action" });
  }
}