// validate-contact.js : フォーム検証の純関数（依存なし＝ブラウザ/Nodeどちらでもテスト可能）

// 入力上限（過大な送信・スパムを防ぐ）
export const LIMITS = { name: 100, email: 254, message: 2000 };
// メール形式の簡易チェック（厳密すぎると正当な値を弾くため緩めに）
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 入力値を検証する純関数（副作用なし）。
 * @param {{name?:string,email?:string,message?:string}} data
 * @returns {{valid:boolean, errors:Object<string,string>}}
 */
export function validateContact(data = {}) {
  const errors = {};
  const name = (data.name || "").trim();
  const email = (data.email || "").trim();
  const message = (data.message || "").trim();

  if (!name) errors.name = "お名前 / 店舗名を入力してください。";
  else if (name.length > LIMITS.name) errors.name = "お名前が長すぎます。";

  if (!email) errors.email = "メールアドレスを入力してください。";
  else if (!EMAIL_RE.test(email)) errors.email = "メールアドレスの形式を確認してください。";
  else if (email.length > LIMITS.email) errors.email = "メールアドレスが長すぎます。";

  if (message.length > LIMITS.message) errors.message = "メッセージが長すぎます。";

  return { valid: Object.keys(errors).length === 0, errors };
}
