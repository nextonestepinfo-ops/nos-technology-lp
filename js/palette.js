// palette.js : 配色の定義とスイッチャー
// CSS変数(--paper/--ink/--mint/--blue/--lav)を切替え、3Dへは "palette" イベントで通知する。

// AAAゲーム（FF級3D）の色使いを参考にしたシネマティック配色。すべて“真っ黒”ベース。
// 3つのアクセント(mint/blue/lav)はグラデ/発光/ライトに使われる。dark:true で3Dの発光を強める。
export const PALETTES = [
  // 既定：生成り×墨×藍（明るい脱AI配色）。白すぎない上質紙の白に、
  // 墨の文字と、ロゴ由来の藍（平らなインディゴ・光らせない）。鋼青を従に。
  { key:'shiro', label:'Shiro', css:{paper:'#F2F0EA',ink:'#1F2023',soft:'#6E6A5E',mint:'#2C4EC8',blue:'#56688C',lav:'#7E97D8'} },
  // 墨×真鍮（暗い脱AI配色・切替用に保持）
  { key:'sumi', label:'Sumi', dark:true, css:{paper:'#0D0E11',ink:'#F2EFE7',soft:'#99958B',mint:'#C9A05A',blue:'#8B9DC0',lav:'#E4CFA1'} },
  // 氷晶（クリスタル）。黒地に冷たいシアン〜ブルーの発光。
  { key:'aether', label:'Aether', dark:true, css:{paper:'#07080c',ink:'#eef3f8',soft:'#8b95a4',mint:'#36c5ff',blue:'#3d8bff',lav:'#9a8cff'} },
  // 炎（FFの召喚・火）。黒地に琥珀〜緋色。AI感を最も抑えた暖色。
  { key:'ember',  label:'Ember',  dark:true, css:{paper:'#0a0807',ink:'#f6efe6',soft:'#a89a8c',mint:'#ff8a3c',blue:'#ff5470',lav:'#ffd166'} },
  // 魔晄（FFVII）。黒地にエメラルド〜ティールのエネルギー。
  { key:'mako',   label:'Mako',   dark:true, css:{paper:'#06090a',ink:'#eaf6f1',soft:'#86a39a',mint:'#26e0b0',blue:'#16c0d0',lav:'#7df0c0'} },
  // 黄金（王道・荘厳）。黒地にゴールド。
  { key:'gold',   label:'Gold',   dark:true, css:{paper:'#0a0805',ink:'#f7f1e3',soft:'#a89c82',mint:'#f5c45e',blue:'#e0903c',lav:'#fff0c2'} },
  // 魔導（神秘・闇）。黒地にバイオレット〜マゼンタ。
  { key:'void',   label:'Void',   dark:true, css:{paper:'#08070c',ink:'#f1eefb',soft:'#998fb0',mint:'#b06cff',blue:'#ff5cf0',lav:'#6b6bff'} },
  // 信号（ブランド寄り・電光ブルー）。黒地にエレクトリックブルー。
  { key:'signal', label:'Signal', dark:true, css:{paper:'#06070a',ink:'#eef2f8',soft:'#8b94a3',mint:'#1a5cff',blue:'#3d8bff',lav:'#5b6bff'} },
  // --- 背景白系（明るい方向の比較用） ---
  { key:'paper', label:'Paper', css:{paper:'#f4f5f8',ink:'#16213a',soft:'#5b6478',mint:'#1a5cff',blue:'#3d8bff',lav:'#5b6bff'} },
  { key:'mist',  label:'Mist',  css:{paper:'#eef2fb',ink:'#16213a',soft:'#5b6478',mint:'#2f6df0',blue:'#38bdf8',lav:'#7c5cff'} },
  { key:'sand',  label:'Sand',  css:{paper:'#efeae0',ink:'#221d14',soft:'#6f6354',mint:'#c0813c',blue:'#0e9aa0',lav:'#b0673a'} },
];

const DEFAULT_INDEX = 0; // Shiro（生成り×墨×真鍮・明るい脱AI配色）

// 指定インデックスの配色を適用（CSS変数更新＋3Dへ通知）
function applyPalette(i, chips) {
  const p = PALETTES[i];
  const root = document.documentElement.style;
  root.setProperty('--paper', p.css.paper);
  root.setProperty('--ink', p.css.ink);
  root.setProperty('--ink-soft', p.css.soft);
  root.setProperty('--mint', p.css.mint);
  root.setProperty('--blue', p.css.blue);
  root.setProperty('--lav', p.css.lav);
  // 3D等が「明/暗どちらのテーマか」を参照できるようにdatasetへ公開
  document.documentElement.dataset.theme = p.dark ? 'dark' : 'light';
  if (chips) chips.forEach((c, j) => c.classList.toggle('on', j === i));
  // 3Dシーンへ配色を通知
  window.dispatchEvent(new CustomEvent('palette', { detail: p }));
}

// スイッチャーUIを生成し、既定配色を適用する
export function initPalette(switchEl) {
  let chips = [];
  if (switchEl) {
    chips = PALETTES.map((p, i) => {
      const btn = document.createElement('button');
      btn.className = 'chip';
      btn.type = 'button';
      btn.setAttribute('aria-label', `配色: ${p.label}`);
      btn.innerHTML =
        `<b style="background:${p.css.paper};border-color:color-mix(in srgb,${p.css.ink} 18%,transparent)">` +
        `<u style="background:conic-gradient(from 200deg, ${p.css.mint}, ${p.css.blue}, ${p.css.lav}, ${p.css.mint})"></u></b>` +
        `<small>${p.label}</small>`;
      btn.addEventListener('click', () => applyPalette(i, chips));
      switchEl.appendChild(btn);
      return btn;
    });
  }
  applyPalette(DEFAULT_INDEX, chips);
}
