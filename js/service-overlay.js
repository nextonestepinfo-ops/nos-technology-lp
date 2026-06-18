// service-overlay.js : Servicesカードをクリックすると詳細がズームアップするオーバーレイ
// カード位置→画面中央へFLIPで拡大。ESC/背景/閉じるで閉。スクロールロック・フォーカストラップ・CTA→#contact。
import { prefersReducedMotion } from "./utils.js";

export function initServiceOverlay() {
  const cards = [...document.querySelectorAll(".svc[data-overlay]")];
  if (!cards.length) return;

  const main = document.getElementById("top");
  const header = document.querySelector(".header");

  // オーバーレイDOMを1つだけ生成
  const overlay = document.createElement("div");
  overlay.className = "svc-overlay";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML =
    '<div class="svc-overlay__backdrop"></div>' +
    '<div class="ov__panel" role="dialog" aria-modal="true">' +
    '<button class="ov__close" type="button" aria-label="閉じる" data-cursor="閉じる">×</button>' +
    '<div class="ov__inner"></div></div>';
  document.body.appendChild(overlay);

  const backdrop = overlay.querySelector(".svc-overlay__backdrop");
  const panel = overlay.querySelector(".ov__panel");
  const closeBtn = overlay.querySelector(".ov__close");
  const inner = overlay.querySelector(".ov__inner");

  let isOpen = false;
  let current = null;       // 開いたカード
  let lastFocused = null;   // 復帰先

  function lockScroll(lock) {
    if (lock) {
      window.__lenis?.stop();
      document.body.style.overflow = "hidden";
      if (main) main.inert = true;
      if (header) header.inert = true;
    } else {
      window.__lenis?.start();
      document.body.style.overflow = "";
      if (main) main.inert = false;
      if (header) header.inert = false;
    }
  }

  function open(card) {
    if (isOpen) return;
    const tpl = document.getElementById(card.dataset.overlay + "-detail");
    if (!tpl) return;

    current = card;
    lastFocused = document.activeElement;
    inner.innerHTML = "";
    inner.appendChild(tpl.content.cloneNode(true));
    const titleEl = inner.querySelector(".ov__title");
    if (titleEl && titleEl.id) panel.setAttribute("aria-labelledby", titleEl.id);

    overlay.setAttribute("aria-hidden", "false");
    overlay.classList.add("is-open");
    lockScroll(true);
    isOpen = true;

    // FLIP: カード位置から中央へ拡大（reduced-motion時はフェードのみ）
    if (!prefersReducedMotion) {
      const first = card.getBoundingClientRect();
      panel.style.transition = "none";
      panel.style.transform = "";
      const last = panel.getBoundingClientRect();
      const tx = (first.left + first.width / 2) - (last.left + last.width / 2);
      const ty = (first.top + first.height / 2) - (last.top + last.height / 2);
      const sx = Math.max(0.05, first.width / last.width);
      const sy = Math.max(0.05, first.height / last.height);
      panel.style.transformOrigin = "center center";
      panel.style.transform = `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`;
      inner.style.opacity = "0";
      panel.scrollTop = 0;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        panel.style.transition = "transform .5s var(--ease)";
        panel.style.transform = "";
        inner.style.opacity = "";
      }));
    } else {
      inner.style.opacity = "";
    }
    closeBtn.focus();
  }

  function finishClose() {
    panel.style.transition = "none";
    panel.style.transform = "";
    inner.style.opacity = "";
    inner.innerHTML = "";
    overlay.setAttribute("aria-hidden", "true");
    lockScroll(false);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
    current = null;
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    overlay.classList.remove("is-open");

    if (!prefersReducedMotion && current) {
      const first = current.getBoundingClientRect();
      const last = panel.getBoundingClientRect();
      const tx = (first.left + first.width / 2) - (last.left + last.width / 2);
      const ty = (first.top + first.height / 2) - (last.top + last.height / 2);
      const sx = Math.max(0.05, first.width / last.width);
      const sy = Math.max(0.05, first.height / last.height);
      panel.style.transition = "transform .45s var(--ease)";
      panel.style.transform = `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`;
      inner.style.opacity = "0";
      const onEnd = (e) => {
        if (e.propertyName !== "transform") return;
        panel.removeEventListener("transitionend", onEnd);
        finishClose();
      };
      panel.addEventListener("transitionend", onEnd);
    } else {
      finishClose();
    }
  }

  // CTA：閉じてから #contact へスクロール
  inner.addEventListener("click", (e) => {
    const cta = e.target.closest("[data-overlay-cta]");
    if (!cta) return;
    e.preventDefault();
    const href = cta.getAttribute("href") || "#contact";
    close();
    setTimeout(() => {
      const t = document.querySelector(href);
      if (!t) return;
      if (window.__lenis) window.__lenis.scrollTo(t, { offset: -10 });
      else t.scrollIntoView({ behavior: "smooth" });
    }, prefersReducedMotion ? 0 : 480);
  });

  // 閉じる操作
  closeBtn.addEventListener("click", close);
  backdrop.addEventListener("click", close);
  overlay.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { close(); return; }
    if (e.key !== "Tab") return;
    // フォーカストラップ
    const f = panel.querySelectorAll('a[href],button,[tabindex]:not([tabindex="-1"]),input,select,textarea');
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  // カードを開く（クリック＋キーボード）
  cards.forEach((card) => {
    card.addEventListener("click", () => open(card));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(card); }
    });
  });
}
