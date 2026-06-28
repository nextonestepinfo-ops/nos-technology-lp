/* =========================================================
   プレビュー用の簡易パスワードゲート（0000）
   ※ サーバ側認証ではない「軽い壁」。本番公開時はこの読み込みを外す。
   ========================================================= */
(function () {
  "use strict";

  // 認証済み（同タブ内）なら何もしない（イントロは main.js が開始）
  if (sessionStorage.getItem("koki_ok") === "1") return;

  // ゲートを出すので、イントロ開始はゲート解除後に行う（main.jsへ通知）
  window.__gateWillShow = true;

  // 本文のチラ見え防止（gate以外を隠す）
  var hide = document.createElement("style");
  hide.id = "koki-gate-hide";
  hide.textContent =
    "body{visibility:hidden!important}#koki-gate,#koki-gate *{visibility:visible!important}";
  document.head.appendChild(hide);

  // ゲートの見た目（サイトと同じ世界観）
  var css = document.createElement("style");
  css.textContent = [
    "#koki-gate{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;",
    "background:radial-gradient(120% 90% at 50% 28%,#0d1322,#08080b 70%);font-family:'Zen Kaku Gothic New',system-ui,sans-serif;}",
    "#koki-gate .box{width:100%;max-width:340px;text-align:center;}",
    "#koki-gate .mark{font-size:2rem;color:#c8102e;line-height:1;margin-bottom:16px;}",
    "#koki-gate .ttl{font-family:'Cormorant Garamond',serif;font-weight:600;font-size:1.7rem;letter-spacing:.22em;color:#ece7da;margin:0 0 6px;}",
    "#koki-gate .sub{font-size:.82rem;line-height:1.7;color:rgba(236,231,218,.6);margin:0 0 26px;letter-spacing:.04em;}",
    "#koki-gate input{width:100%;padding:.9em 1em;background:#050507;border:1px solid rgba(236,231,218,.16);color:#ece7da;font-size:1.1rem;text-align:center;letter-spacing:.4em;font-family:inherit;}",
    "#koki-gate input:focus{outline:none;border-color:#c2a366;}",
    "#koki-gate button{width:100%;margin-top:14px;padding:.9em 1em;background:#c8102e;color:#fff;border:none;font-size:.95rem;letter-spacing:.1em;cursor:pointer;transition:background .25s;}",
    "#koki-gate button:hover{background:#e11d3a;}",
    "#koki-gate .err{min-height:1.2em;margin:14px 0 0;font-size:.8rem;color:#e11d3a;opacity:0;transition:opacity .2s;}",
    "#koki-gate .err.show{opacity:1;}"
  ].join("");
  document.head.appendChild(css);

  function build() {
    var g = document.createElement("div");
    g.id = "koki-gate";
    g.innerHTML =
      '<form class="box" autocomplete="off">' +
      '<div class="mark">&#9824;</div>' +
      '<p class="ttl">KOKI</p>' +
      '<p class="sub">プレビュー版です。<br>パスワードを入力してください。</p>' +
      '<input type="password" inputmode="numeric" aria-label="パスワード" placeholder="••••" />' +
      '<button type="submit">表示する</button>' +
      '<p class="err">パスワードが違います。</p>' +
      "</form>";
    document.body.appendChild(g);

    var form = g.querySelector("form");
    var input = g.querySelector("input");
    var err = g.querySelector(".err");
    input.focus();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (input.value === "0000") {
        sessionStorage.setItem("koki_ok", "1");
        var h = document.getElementById("koki-gate-hide");
        if (h) h.remove();
        g.remove();
        if (window.__startIntro) window.__startIntro(); // ゲート解除後にイントロ開始
      } else {
        err.classList.add("show");
        input.value = "";
        input.focus();
      }
    });
  }

  if (document.body) build();
  else document.addEventListener("DOMContentLoaded", build);
})();
