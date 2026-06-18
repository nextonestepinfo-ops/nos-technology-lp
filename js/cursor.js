// cursor.js : カスタムカーソル（ドット＋遅延追従リング）とマグネティック効果
import { lerp, pointer, prefersReducedMotion, isCoarsePointer } from "./utils.js";

// カスタムカーソルを初期化。fine pointer 以外では何もしない
export function initCursor(cursorEl) {
  if (!cursorEl || isCoarsePointer || prefersReducedMotion) {
    if (cursorEl) cursorEl.style.display = "none";
    return;
  }

  const dot = cursorEl.querySelector(".cursor__dot");
  const ring = cursorEl.querySelector(".cursor__ring");
  const label = cursorEl.querySelector(".cursor__label");

  // ドットは即時、リングは遅延追従させて“慣性”を出す
  let rx = pointer.x, ry = pointer.y;

  function follow() {
    // ドットはポインターに張り付く
    dot.style.transform = `translate(${pointer.x}px, ${pointer.y}px) translate(-50%, -50%)`;
    // リングは少し遅れて寄る
    rx = lerp(rx, pointer.x, 0.18);
    ry = lerp(ry, pointer.y, 0.18);
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    label.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    requestAnimationFrame(follow);
  }
  requestAnimationFrame(follow);

  // ホバー対象に入ったらリングを拡大／ラベル表示
  const hoverTargets = "a, button, [data-cursor], input, select, textarea";
  document.addEventListener("pointerover", (e) => {
    const target = e.target.closest(hoverTargets);
    if (!target) return;
    const labelText = target.getAttribute("data-cursor");
    if (labelText) {
      label.textContent = labelText;
      cursorEl.classList.add("is-label");
    } else {
      cursorEl.classList.add("is-hover");
    }
  });
  document.addEventListener("pointerout", (e) => {
    const target = e.target.closest(hoverTargets);
    if (!target) return;
    cursorEl.classList.remove("is-hover", "is-label");
  });

  // 画面外に出たら消す
  document.addEventListener("mouseleave", () => (cursorEl.style.opacity = "0"));
  document.addEventListener("mouseenter", () => (cursorEl.style.opacity = "1"));
}

// data-magnetic を持つ要素にマグネティック効果を付与
export function initMagnetic() {
  if (isCoarsePointer || prefersReducedMotion) return;
  const els = document.querySelectorAll("[data-magnetic]");

  els.forEach((el) => {
    const strength = Number(el.getAttribute("data-magnetic")) || 0.4;

    el.addEventListener("pointermove", (e) => {
      const rect = el.getBoundingClientRect();
      // 要素中心からのオフセット分だけ引き寄せる
      const mx = e.clientX - (rect.left + rect.width / 2);
      const my = e.clientY - (rect.top + rect.height / 2);
      el.style.transform = `translate(${mx * strength}px, ${my * strength}px)`;
    });
    // 離れたら原位置へ戻す（CSS transition任せ）
    el.addEventListener("pointerleave", () => {
      el.style.transform = "";
    });
    el.style.transition = "transform 0.4s cubic-bezier(0.16,1,0.3,1)";
  });
}
