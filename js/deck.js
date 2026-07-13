// deck.js : スマホの署名「触れるカードデッキ」
// PCの3Dパネルに対する“指で触れる”翻訳。ライブラリ無しのバネ物理で、
// スワイプ/タップで実UIのカードを送る。触った瞬間の手応え＝技術力の証明。
import { prefersReducedMotion } from "./utils.js";

// 1フレームあたりのバネ係数（60fps基準・rAFで補正）
const STIFF = 0.16;   // 硬さ
const DAMP = 0.78;    // 減衰
const FLING_X = 90;   // これ以上引いたら送る(px)
const FLING_V = 0.9;  // これ以上の速度でも送る(px/ms)
const AUTO_MS = 4600; // 自動送りの間隔
const REST_MS = 9000; // 操作後に自動送りを休む時間

export function initDeck(root) {
  if (!root) return;
  const stage = root.querySelector("#deckStage");
  const cards = [...stage.querySelectorAll(".deck__card")];
  if (cards.length < 2) return;
  const tagEl = root.querySelector("#deckTag");
  const titleEl = root.querySelector("#deckTitle");
  const dotsEl = root.querySelector("#deckDots");

  // ドット生成
  const dots = cards.map(() => {
    const i = document.createElement("i");
    dotsEl && dotsEl.appendChild(i);
    return i;
  });

  // 並び順（order[0]が先頭）と、各カードの深度スプリング
  let order = cards.map((_, i) => i);
  const depth = cards.map((_, i) => ({ p: i, v: 0, t: i }));
  // 先頭カードの横位置スプリング
  const drag = { x: 0, v: 0, t: 0, dragging: false, flinging: false };

  let lastUser = 0; // 最後に触った時刻（自動送りの休止判定）
  let autoTimer = 0;

  function frontCard() { return cards[order[0]]; }

  function syncMetaFor(cardIndex) {
    const f = cards[cardIndex];
    if (tagEl) tagEl.textContent = f.dataset.tag || "";
    if (titleEl) titleEl.textContent = f.dataset.title || "";
    dots.forEach((d, i) => d.classList.toggle("on", i === cardIndex));
  }
  function syncMeta() { syncMetaFor(order[0]); }

  // 送る（dir: -1=左へ, 1=右へ）
  function fling(dir) {
    if (drag.flinging) return;
    drag.flinging = true;
    drag.t = dir * (stage.clientWidth * 1.25);
    syncMetaFor(order[1]); // ラベルは飛行中に次のカードへ先行更新
    wake();
  }

  // 先頭を最後尾へ回す
  function cycle() {
    const head = order.shift();
    order.push(head);
    order.forEach((ci, pos) => (depth[ci].t = pos));
    // 送ったカードは裏側で瞬時に中央へ戻す（深度3なので見えない）
    drag.x = 0; drag.v = 0; drag.t = 0; drag.flinging = false;
    syncMeta();
  }

  // ---- ポインタ操作 ----
  let downX = 0, downY = 0, lastX = 0, lastT = 0, moved = false, captured = false;
  stage.addEventListener("pointerdown", (e) => {
    if (drag.flinging) return;
    drag.dragging = true; moved = false; captured = false;
    downX = lastX = e.clientX; downY = e.clientY; lastT = e.timeStamp;
    drag.v = 0;
    lastUser = performance.now();
    wake();
  });
  window.addEventListener("pointermove", (e) => {
    if (!drag.dragging) return;
    const dx = e.clientX - downX, dy = e.clientY - downY;
    // 縦スクロール優先：横意図が明確になってからカードを掴む
    if (!captured) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
      captured = true;
      try { stage.setPointerCapture(e.pointerId); } catch (_) {}
    }
    moved = true;
    drag.x = dx;
    const dt = Math.max(1, e.timeStamp - lastT);
    drag.v = (e.clientX - lastX) / dt * 16; // px/frame相当
    lastX = e.clientX; lastT = e.timeStamp;
  });
  const up = (e) => {
    if (!drag.dragging) return;
    drag.dragging = false;
    lastUser = performance.now();
    const vms = (e.clientX - downX) / Math.max(1, e.timeStamp - lastT + 1);
    if (moved && (Math.abs(drag.x) > FLING_X || Math.abs(vms) > FLING_V)) {
      fling(Math.sign(drag.x || vms || -1));
    } else if (!moved) {
      // タップ：軽く左へ送る（次のカードへ）
      if (prefersReducedMotion) { cycle(); } else fling(-1);
    } else {
      drag.t = 0; // 中央へスプリングで戻す
    }
    wake();
  };
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);

  // ---- 自動送り（触っていない時だけ・タブ非表示中は止める） ----
  function tickAuto() {
    autoTimer = window.setTimeout(() => {
      // rAFがバックグラウンドで凍結し飛行中のまま残った場合は着地させる（復帰の保険）
      if (drag.flinging) { cycle(); wake(); }
      const idle = performance.now() - lastUser > REST_MS;
      if (!document.hidden && idle && !drag.dragging && !prefersReducedMotion) fling(-1);
      tickAuto();
    }, AUTO_MS);
  }

  // ---- 描画ループ（静止したら眠る＝無駄な再描画とバッテリー消費を防ぐ） ----
  let rafOn = false;
  let lastFrame = 0;
  function wake() {
    if (rafOn) return;
    rafOn = true;
    lastFrame = performance.now();
    requestAnimationFrame(render);
  }
  function render(now) {
    // 時間補正: 遅延フレーム(バックグラウンド等)では複数ステップ進めて挙動を保つ
    const steps = Math.min(6, Math.max(1, Math.round((now - lastFrame) / 16.7)));
    lastFrame = now;
    let settled = !drag.dragging && !drag.flinging;
    // 先頭の横位置（ドラッグ中は指に直結、離すとスプリング）
    if (!drag.dragging) {
      for (let k = 0; k < steps; k++) {
        const ax = (drag.t - drag.x) * STIFF;
        drag.v = (drag.v + ax) * DAMP;
        drag.x += drag.v;
      }
      if (drag.flinging && Math.abs(drag.t - drag.x) < 12) cycle();
      if (Math.abs(drag.v) > 0.02 || Math.abs(drag.t - drag.x) > 0.2) settled = false;
    }
    order.forEach((ci, pos) => {
      const d = depth[ci];
      for (let k = 0; k < steps; k++) {
        const a = (d.t - d.p) * STIFF;
        d.v = (d.v + a) * DAMP;
        d.p += d.v;
      }
      if (Math.abs(d.v) > 0.001 || Math.abs(d.t - d.p) > 0.002) settled = false;
      const card = cards[ci];
      const isFront = pos === 0;
      const x = isFront ? drag.x : 0;
      const rot = isFront ? x / 16 : 0;
      const lift = isFront ? -Math.abs(x) * 0.06 : 0;
      card.style.zIndex = String(20 - Math.round(d.p * 2));
      card.style.transform =
        `translate(${x}px,${d.p * 13 + lift}px) rotate(${rot}deg) scale(${1 - d.p * 0.055})`;
      card.style.filter = `brightness(${1 - d.p * 0.055})`;
      card.style.opacity = d.p > 2.6 ? String(Math.max(0, 1 - (d.p - 2.6) * 1.6)) : "1";
    });
    if (settled) { rafOn = false; return; }
    requestAnimationFrame(render);
  }

  syncMeta();
  // 登場演出：カードが奥から順に積み上がり、先頭は右からスライドイン
  // （バネ物理そのものが最初の一目で伝わる）。モーション抑制時は即整列。
  if (!prefersReducedMotion) {
    order.forEach((ci, pos) => { depth[ci].p = 3.2 + pos * 1.35; depth[ci].v = 0; });
    drag.x = stage.clientWidth * 0.5; drag.v = 0; drag.t = 0;
    setTimeout(wake, 340);
  } else {
    wake();
  }
  tickAuto();
  window.addEventListener("pagehide", () => clearTimeout(autoTimer));
}
