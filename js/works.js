// works.js : Works/Demo の横スクロール（ドラッグ操作対応）

export function initWorks(track) {
  if (!track) return;

  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  track.addEventListener("pointerdown", (e) => {
    isDown = true;
    moved = false;
    startX = e.clientX;
    startScroll = track.scrollLeft;
    track.classList.add("is-dragging");
    track.setPointerCapture(e.pointerId);
  });

  track.addEventListener("pointermove", (e) => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 4) moved = true;
    track.scrollLeft = startScroll - dx;
  });

  const end = (e) => {
    isDown = false;
    track.classList.remove("is-dragging");
    if (e.pointerId !== undefined && track.hasPointerCapture?.(e.pointerId)) {
      track.releasePointerCapture(e.pointerId);
    }
  };
  track.addEventListener("pointerup", end);
  track.addEventListener("pointercancel", end);

  // ドラッグ直後のクリックでリンク誤発火を防ぐ
  track.addEventListener("click", (e) => {
    if (moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  // マウスホイールの縦回転を横スクロールへ変換（PCの操作性向上）
  track.addEventListener(
    "wheel",
    (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        track.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    },
    { passive: false }
  );
}
