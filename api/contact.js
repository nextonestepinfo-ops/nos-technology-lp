// api/contact.js : サーバーレス関数テンプレート（Vercel / 互換ランタイム想定）
// フロントの provider="endpoint" 時に POST /api/contact で呼ばれる。
//
// 秘密鍵はコードに直書きせず、環境変数で渡す（.env / ホスティングのSecrets）:
//   RESEND_API_KEY  … メール送信サービス Resend のAPIキー
//   CONTACT_TO      … 受信先メールアドレス
//   CONTACT_FROM    … 送信元（Resendで検証済みのドメイン）
//
// メール送信は一例（Resend）。SendGrid等に差し替え可能。

// サーバー側でも最低限の検証を行う（クライアント検証は信用しない）
function validate(body) {
  const name = (body.name || "").trim();
  const email = (body.email || "").trim();
  if (!name || !email) return "必須項目が未入力です。";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "メール形式が不正です。";
  if (name.length > 100 || email.length > 254) return "入力が長すぎます。";
  if ((body.message || "").length > 2000) return "メッセージが長すぎます。";
  return null;
}

export default async function handler(req, res) {
  // POST以外は弾く
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

    // ハニーポット：companyに値があればボットとみなし、成功を装って黙殺
    if (body.company) return res.status(200).json({ ok: true });

    const error = validate(body);
    if (error) return res.status(400).json({ error });

    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.CONTACT_TO;
    const from = process.env.CONTACT_FROM;
    if (!apiKey || !to || !from) {
      // 設定漏れはサーバー側の問題として500
      return res.status(500).json({ error: "メール送信が未設定です。" });
    }

    // Resend API へ送信
    const mail = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        reply_to: body.email,
        subject: `【無料相談】${body.name} 様（${body.type || "未選択"}）`,
        text: [
          `お名前/店舗名: ${body.name}`,
          `メール: ${body.email}`,
          `相談内容: ${body.type || ""}`,
          "",
          body.message || "(メッセージなし)",
        ].join("\n"),
      }),
    });

    if (!mail.ok) {
      const detail = await mail.text().catch(() => "");
      console.error("Resend送信失敗:", mail.status, detail);
      return res.status(502).json({ error: "送信に失敗しました。" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("contact handlerエラー:", err);
    return res.status(500).json({ error: "サーバーエラー" });
  }
}
