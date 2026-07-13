// est-preview.js : 見積りページの「完成イメージ・プレビュー」
// 業種セレクトに応じて実制作イメージ(assets/works)を切替え、
// 選択オプションをチップで反映。CTA押下時は内容をsessionStorageへ
// 持ち越し、トップの相談フォームに自動転記する（main.js側で読む）。

const KIND_MAP = {
  "美容室・サロン": "salon",
  "カフェ・喫茶": "cafe",
  "飲食店": "diner",
  "クリニック・整体": "seitai",
  "ジム・スタジオ": "gym",
  "教室・スクール": "school",
  "その他": "salon",
};

// data-name の部分一致 → プレビューに出す短いチップ名
const CHIP_RULES = [
  ["1から作る", "オリジナル設計"],
  ["簡易ヒアリング", "オリジナル設計"],
  ["ハイクオリティ", "動き・演出"],
  ["写真ギャラリー", "ギャラリー"],
  ["Googleマップ", "MEO強化"],
  ["LINE", "LINE予約"],
  ["ネット予約", "ネット予約"],
  ["AI自動返信", "AI自動返信"],
  ["口コミ", "口コミAI"],
  ["業務改善", "業務改善ツール"],
  ["運用サポート", "月次サポート"],
];

export function initEstPreview() {
  const kind = document.getElementById("est-kind");
  const web = document.getElementById("prevWeb");
  if (!kind || !web) return; // プレビューの無いページ（index等）では何もしない
  const sp = document.getElementById("prevSp");
  const chipsEl = document.getElementById("prevChips");
  const list = document.getElementById("estList");

  // 画像切替（ふわっとフェード）
  function swapImg(img, src) {
    if (!img || img.getAttribute("src") === src) return;
    img.classList.add("is-swap");
    const next = new Image();
    next.onload = () => { img.src = src; img.classList.remove("is-swap"); };
    next.onerror = () => img.classList.remove("is-swap");
    next.src = src;
  }
  function applyKind() {
    const k = KIND_MAP[kind.value] || "salon";
    swapImg(web, `assets/works/${k}-web.webp`);
    if (sp) swapImg(sp, `assets/works/${k}-mobile.webp`);
  }

  // 選択オプション → チップ
  function applyChips() {
    if (!chipsEl || !list) return;
    const names = [...list.querySelectorAll("input:checked")].map((c) => c.dataset.name || "");
    const out = [];
    CHIP_RULES.forEach(([key, label]) => {
      if (names.some((n) => n.includes(key)) && !out.includes(label)) out.push(label);
    });
    chipsEl.innerHTML = out.length
      ? out.map((t) => `<li>${t}</li>`).join("")
      : `<li class="none">基本セットのみ</li>`;
  }

  kind.addEventListener("change", applyKind);
  if (list) list.addEventListener("change", applyChips);

  // CTA：見積り内容をトップの相談フォームへ持ち越し
  const cta = document.getElementById("estCta");
  if (cta) {
    cta.addEventListener("click", () => {
      try {
        const picked = [...document.querySelectorAll("#estPicked li")].map((l) => l.textContent);
        const total = document.getElementById("estTotal")?.textContent || "";
        const extra = document.getElementById("estExtra")?.textContent || "";
        const msg = [
          "【かんたん見積りから】",
          `業種: ${kind.value}`,
          `希望内容: ${picked.join(" / ")}`,
          `目安: ¥${total}〜${extra ? `（${extra}）` : ""}`,
          "",
          "その他のご要望・ご予算感があればこちらへ:",
        ].join("\n");
        sessionStorage.setItem("nos-est-msg", msg);
      } catch (_) {}
    });
  }

  applyKind();
  applyChips();
}

// トップページ側：見積りページから持ち越した内容をフォームへ転記
export function applyEstHandoff() {
  try {
    const pre = sessionStorage.getItem("nos-est-msg");
    const msg = document.getElementById("f-msg");
    if (pre && msg && !msg.value) {
      msg.value = pre;
      const typeSel = document.getElementById("f-type");
      if (typeSel && pre.includes("業務改善ツール")) typeSel.value = "業務改善ツール・システム開発";
      sessionStorage.removeItem("nos-est-msg");
    }
  } catch (_) {}
}
