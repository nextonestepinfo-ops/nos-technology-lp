// config.sample.js : 設定テンプレート（このファイルはコミットする）
// 実運用では `config.js` にコピーして値を埋める。config.js は .gitignore 済み。
//
// CONTACT_PROVIDER の選択肢:
//   "demo"      … 送信せず成功表示のみ（ワイヤーフレーム確認用）
//   "web3forms" … バックエンド不要。WEB3FORMS_KEY に公開アクセスキーを設定
//   "endpoint"  … 自前のサーバーレス関数等。CONTACT_ENDPOINT にURLを設定（推奨）
export const config = {
  CONTACT_PROVIDER: "demo",

  // provider="endpoint" のとき: POST先（例: "/api/contact"）
  CONTACT_ENDPOINT: "/api/contact",

  // provider="web3forms" のとき: https://web3forms.com で取得する公開アクセスキー
  // （秘密鍵ではなく公開前提の識別子。ただし管理のためここに集約する）
  WEB3FORMS_KEY: "",

  // 計測ID（未設定なら計測しない）。例: GA4 "G-XXXX" / Plausibleドメイン等
  ANALYTICS_ID: "",
};
