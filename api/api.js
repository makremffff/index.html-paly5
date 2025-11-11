export default function handler(req, res) {
  const { action, userID, amount, address } = req.query;
  if (!action) return res.status(400).json({ error: "Missing action" });

  switch (action) {
    case "getBalance":
      return res.json({ points: 0, usdt: 0, message: "Balance fetched" });

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

    case "swap":
      const pts = parseInt(amount);
      if (!pts || pts < 10000)
        return res.status(400).json({ error: "Min 10,000 points" });

      const usdt = ((pts / 10000) * 0.005).toFixed(3);
      return res.json({ success: true, usdt });

    case "withdraw":
      if (!userID || !amount || !address)
        return res.status(400).json({ error: "Missing params" });

      const telegramToken =
        "8222744961:AAE90Eehr8PqldV6oKxIS9Yo9hw69Zi83Us";
      const chatID = "8447940021";

      const msg = `🚨 New Withdrawal 🚨
👤 User: ${userID}
💰 Amount: ${amount} USDT
📍 Polygon Address: <code>${address}</code>
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

    default:
      return res.status(400).json({ error: "Invalid action" });
  }
}
