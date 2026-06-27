/* =========================================================
   Client preview gate for GitHub Pages.
   PASS: 04
   This is a light preview barrier, not server-side authentication.
   ========================================================= */
(function () {
  "use strict";

  var STORAGE_KEY = "koki_preview_ok";
  var PASS = "04";

  if (sessionStorage.getItem(STORAGE_KEY) === "1") return;

  var hide = document.createElement("style");
  hide.id = "koki-gate-hide";
  hide.textContent =
    "body{visibility:hidden!important;overflow:hidden!important}#koki-gate,#koki-gate *{visibility:visible!important}";
  document.head.appendChild(hide);

  var css = document.createElement("style");
  css.textContent = [
    "#koki-gate{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;",
    "background:radial-gradient(120% 90% at 50% 20%,#121827,#050507 72%);font-family:'Zen Kaku Gothic New',system-ui,sans-serif;color:#ece7da;}",
    "#koki-gate .box{width:100%;max-width:360px;text-align:center;}",
    "#koki-gate .mark{width:42px;height:42px;margin:0 auto 16px;border:1px solid rgba(194,163,102,.7);border-radius:999px;display:flex;align-items:center;justify-content:center;color:#c8102e;font-size:1.45rem;}",
    "#koki-gate .ttl{font-family:'Cormorant Garamond',serif;font-weight:600;font-size:1.95rem;letter-spacing:.24em;margin:0 0 8px;}",
    "#koki-gate .sub{font-size:.82rem;line-height:1.8;color:rgba(236,231,218,.64);margin:0 0 24px;letter-spacing:.05em;}",
    "#koki-gate label{display:block;text-align:left;font-size:.72rem;letter-spacing:.12em;color:rgba(236,231,218,.62);margin:12px 0 7px;}",
    "#koki-gate input{box-sizing:border-box;width:100%;padding:.95em 1em;background:#050507;border:1px solid rgba(236,231,218,.16);color:#ece7da;font-size:1rem;font-family:inherit;}",
    "#koki-gate input:focus{outline:none;border-color:#c2a366;box-shadow:0 0 0 2px rgba(194,163,102,.14);}",
    "#koki-gate button{width:100%;margin-top:16px;padding:1em;background:#c8102e;color:#fff;border:none;font-size:.9rem;font-weight:700;letter-spacing:.12em;cursor:pointer;transition:background .25s,transform .25s;}",
    "#koki-gate button:hover{background:#e11d3a;transform:translateY(-1px);}",
    "#koki-gate .err{min-height:1.4em;margin:14px 0 0;font-size:.8rem;color:#ff4b65;opacity:0;transition:opacity .2s;}",
    "#koki-gate .err.show{opacity:1;}"
  ].join("");
  document.head.appendChild(css);

  function showGate() {
    var gate = document.createElement("div");
    gate.id = "koki-gate";
    gate.innerHTML =
      '<form class="box" autocomplete="off">' +
      '<div class="mark">&#9824;</div>' +
      '<p class="ttl">KOKI</p>' +
      '<p class="sub">クライアント確認用ページです。<br>共有されたパスワードを入力してください。</p>' +
      '<label for="koki-pass">PASSWORD</label>' +
      '<input id="koki-pass" name="pass" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="current-password" />' +
      '<button type="submit">表示する</button>' +
      '<p class="err">パスワードが違います。</p>' +
      "</form>";
    document.body.appendChild(gate);

    var form = gate.querySelector("form");
    var pass = gate.querySelector("#koki-pass");
    var err = gate.querySelector(".err");
    pass.focus();

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (pass.value === PASS) {
        sessionStorage.setItem(STORAGE_KEY, "1");
        var h = document.getElementById("koki-gate-hide");
        if (h) h.remove();
        document.body.style.overflow = "";
        gate.remove();
        return;
      }
      err.classList.add("show");
      pass.value = "";
      pass.focus();
    });
  }

  if (document.body) showGate();
  else document.addEventListener("DOMContentLoaded", showGate);
})();
