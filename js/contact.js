// contact.js : 相談フォームの検証・送信・UI制御
import { config } from "./config.js";
import { trackEvent } from "./analytics.js";
import { validateContact } from "./validate-contact.js";

// 純関数の検証はテスト用に再エクスポート
export { validateContact };

// 指数バックオフ付きリトライ（最大3回・1s→2s→4s）。API規約に準拠。
async function withRetry(fn, retries = 3, baseDelay = 1000) {
  let lastError;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      // 最後の試行ではもう待たない
      if (attempt < retries - 1) {
        const wait = baseDelay * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }
  throw lastError;
}

/**
 * 実送信。provider設定に応じて送信先を切り替える。
 * @returns {Promise<void>} 成功時に解決、失敗時に reject
 */
export async function submitContact(data) {
  const provider = config.CONTACT_PROVIDER;

  // デモ：実際には送らず、成功を模擬（ネットワーク往復を少し待つ）
  if (provider === "demo") {
    await new Promise((r) => setTimeout(r, 600));
    return;
  }

  if (provider === "web3forms") {
    return withRetry(async () => {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ access_key: config.WEB3FORMS_KEY, ...data }),
      });
      // 5xxはリトライ対象として例外化、4xxは確定失敗
      if (res.status >= 500) throw new Error(`server ${res.status}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) {
        throw new Error(json.message || `failed ${res.status}`);
      }
    });
  }

  // provider="endpoint"：自前のサーバーレス関数へ
  return withRetry(async () => {
    const res = await fetch(config.CONTACT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.status >= 500) throw new Error(`server ${res.status}`);
    if (!res.ok) throw new Error(`failed ${res.status}`);
  });
}

// 送信ボタン内のラベル（span）を差し替える。spanが無ければ要素直書き
function setButtonLabel(btn, text) {
  if (!btn) return;
  const span = btn.querySelector("span");
  if (span) span.textContent = text;
  else btn.textContent = text;
}

// フォーム要素にハンドラを取り付ける
export function initContactForm(form) {
  if (!form) return;
  const note = document.getElementById("formNote");
  const submitBtn = document.getElementById("contactSubmit");
  const defaultLabel = submitBtn?.querySelector("span")?.textContent || "送信";
  let sending = false; // 二重送信ガード

  // note に状態を反映。isError でコーラル表示に切替
  const setNote = (msg, isError = false) => {
    if (!note) return;
    note.textContent = msg;
    note.classList.toggle("is-error", isError);
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (sending) return;

    // ハニーポット：人間は空のはず。値があればボットとみなし、成功を装って黙殺
    if (form.company && form.company.value.trim() !== "") {
      setNote("送信しました。");
      form.reset();
      return;
    }

    const data = {
      name: form.name.value,
      email: form.email.value,
      type: form.type.value,
      message: form.message.value,
    };

    // 検証
    const { valid, errors } = validateContact(data);
    if (!valid) {
      setNote(Object.values(errors)[0], true);
      return;
    }

    // 送信中UI
    sending = true;
    if (submitBtn) submitBtn.disabled = true;
    setButtonLabel(submitBtn, "送信中…");
    setNote("送信しています…");

    try {
      await submitContact(data);
      const demo = config.CONTACT_PROVIDER === "demo";
      setNote(
        demo
          ? "送信しました（デモモードのため実際には送信されません）。"
          : "送信しました。担当より折り返しご連絡します。"
      );
      form.reset();
      trackEvent("contact_submit", { type: data.type });
    } catch (err) {
      setNote("送信に失敗しました。時間をおいて再度お試しください。", true);
    } finally {
      sending = false;
      if (submitBtn) submitBtn.disabled = false;
      setButtonLabel(submitBtn, defaultLabel);
    }
  });
}
