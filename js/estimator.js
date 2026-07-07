// estimator.js : かんたん見積り
// オプション選択 → 目安総額をライブ更新（カウントアップ）→「この内容で無料相談」で
// 相談フォームに内容を自動転記してスクロール。
// 価格はすべて“概算の目安”。変更はHTML側の data-price / data-unit を編集。
import { prefersReducedMotion } from "./utils.js";

const BASE_PRICE = 30000; // 店舗ページ一式
const PAGE_UNIT = 8000;   // ページ追加の単価
const PAGE_MAX = 4;

export function initEstimator() {
  const root = document.getElementById("estimator");
  if (!root) return;

  const list = document.getElementById("estList");
  const totalEl = document.getElementById("estTotal");
  const extraEl = document.getElementById("estExtra");
  const pickedEl = document.getElementById("estPicked");
  const pagesOut = document.getElementById("estPages");
  const kindSel = document.getElementById("est-kind");
  const cta = document.getElementById("estCta");
  if (!list || !totalEl || !pickedEl) return;

  const checks = [...list.querySelectorAll('input[type="checkbox"]')];
  let pages = 0;
  let shownTotal = BASE_PRICE; // カウントアップ表示中の値

  // ---- 集計 ----
  function collect() {
    let total = BASE_PRICE + pages * PAGE_UNIT;
    let monthly = 0;
    let hasQuote = false;
    const picked = ["店舗ページ一式"];

    if (pages > 0) picked.push(`ページ追加 ×${pages}`);
    checks.forEach((c) => {
      if (!c.checked) return;
      picked.push(c.dataset.name);
      if (c.dataset.price) total += Number(c.dataset.price);
      if (c.dataset.monthly) monthly += Number(c.dataset.monthly);
      if (c.dataset.quote) hasQuote = true;
    });
    return { total, monthly, hasQuote, picked };
  }

  // ---- 表示更新 ----
  const fmt = (n) => n.toLocaleString("ja-JP");
  let raf = null;

  function render() {
    const { total, monthly, hasQuote, picked } = collect();

    // 総額はカウントアップで“動く価格”に（モーション抑制時は即時）
    if (prefersReducedMotion) {
      shownTotal = total;
      totalEl.textContent = fmt(total);
    } else {
      cancelAnimationFrame(raf);
      const from = shownTotal;
      const start = performance.now();
      const DUR = 450;
      const tick = (now) => {
        const t = Math.min(1, (now - start) / DUR);
        const e = 1 - Math.pow(1 - t, 3); // easeOutCubic
        shownTotal = Math.round(from + (total - from) * e);
        totalEl.textContent = fmt(shownTotal);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    // 追記行（個別見積・月額）
    const extras = [];
    if (hasQuote) extras.push("＋ 業務改善ツールは個別見積");
    if (monthly > 0) extras.push(`＋ 月々 ¥${fmt(monthly)}`);
    extraEl.textContent = extras.join("　");

    // 選択リスト
    pickedEl.innerHTML = picked.map((p) => `<li>${p}</li>`).join("");
  }

  // ---- ページ追加ステッパー ----
  root.querySelectorAll(".opt__btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      pages = Math.min(PAGE_MAX, Math.max(0, pages + Number(btn.dataset.step)));
      if (pagesOut) pagesOut.textContent = String(pages);
      render();
    });
  });

  // ---- チェック変更 ----
  checks.forEach((c) => c.addEventListener("change", render));

  // ---- CTA：相談フォームへ内容を転記（スクロールは smooth.js のアンカー処理に任せる） ----
  if (cta) {
    cta.addEventListener("click", () => {
      const { total, monthly, hasQuote, picked } = collect();
      const msg = document.getElementById("f-msg");
      const typeSel = document.getElementById("f-type");

      if (msg) {
        msg.value = [
          `【かんたん見積りから】`,
          `業種: ${kindSel ? kindSel.value : "未選択"}`,
          `希望内容: ${picked.join(" / ")}`,
          `目安: ¥${fmt(total)}〜` +
            (monthly > 0 ? `（＋月々¥${fmt(monthly)}）` : "") +
            (hasQuote ? `（業務改善ツールは個別見積）` : ""),
          ``,
          `その他のご要望・ご予算感があればこちらへ:`,
        ].join("\n");
      }
      // 相談内容セレクトも合わせる（管理画面が選ばれていればそちらを優先）
      if (typeSel) typeSel.value = hasQuote ? "業務改善ツール・システム開発" : "Web制作・集客導線";
    });
  }

  render();
}
