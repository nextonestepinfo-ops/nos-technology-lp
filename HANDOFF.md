# Nos Technology LP — 引き継ぎ書 / 継続プロンプト

> このフォルダ一式を引き継ぐためのドキュメントです。
> **次の担当者（人 / AI）へ:** まず本書を上から読み、次に `ASSETS.md` と実ファイル（`index.html` / `css/` / `js/`）を確認し、最後の「## 継続プロンプト」に従って作業を続けてください。
> 最終更新: 2026-06-18

---

## 0. 継続プロンプト（AIにそのまま渡す用）

```
あなたはこの静的Webサイト（Nos Technology のLP）の制作を引き継ぐエンジニア兼デザイナーです。
まず以下を読んで現状を把握してください:
1) HANDOFF.md（本書） … 経緯・構成・決定事項・TODO
2) ASSETS.md … 必要素材の一覧と仕様
3) index.html, css/base.css, css/hero.css, css/sections.css, js/*.js … 本制作の実体

制約（厳守）:
- ビルドツールなし。素のHTML/CSS/ES Modules。importmap で three と lenis をCDN読込。
- 起動は HTTPサーバー必須（`python -m http.server 5500`）。file:// 不可。
- コードのコメントは日本語。秘密情報は .env / config.js（gitignore）に置きコード直書き禁止。
- 「圧倒的なクオリティ」を維持・向上させる方針。参考は lusion.co の質感。

現在の最優先タスク（詳細は本書「## 6. TODO」）:
1. 配色を1つに確定し、配色スイッチャー（検討用UI）を撤去
2. ASSETS.md の★★★素材（ロゴ実データ/ファビコン/OGP/Worksサムネ）を実装
3. OGP・favicon・SEOメタ・本番デプロイ準備

作業後は毎回 `python -m http.server 5500` で起動し、ブラウザで表示・コンソールエラー無し・横スクロール無しを確認すること。
```

---

## 1. プロジェクト概要
- **何**: Nos Technology の自社トップページ（1ページLP）。静的サイト、ビルドレス。
- **目的**: 地域店舗（美容室・サロン・飲食店等）に「Web制作・集客導線 / AI業務自動化 / 管理画面開発」を訴求し、無料相談につなげる。
- **トーン**: lusion.co 級のクリエイティブ品質。AIを核にした技術力が伝わる、明るく上質な世界観。
- **段階**: 「動くデモ（本制作の土台）」。コピー・実績・素材は一部仮。

## 2. ブランド（支給ロゴより）
- 社名: **Nos Technology**（「Nos」太字＋「Technology」細字）
- タグライン: **Systems for human work.**（日本語: 人の時間を、AIでつくる。）
- カラー: ネイビー `#16213a` × エレクトリックブルー `#1a5cff` / `#3d8bff`、背景 白 `#f4f5f8`
- ロゴマーク: 幾何的な「N」＋右上のブルーの角
- **重要**: 現状ロゴは `index.html` 内に **themeable インラインSVGで再現**（配色に追従）。**実ロゴの高解像度PNG/ベクターが届いたら差し替える**（→ `assets/logo/`、ファビコン/OGPにも展開）。

## 3. 技術構成と起動
- 構成: 素のHTML/CSS/JS（ES Modules）。バンドラなし。
- 依存: `index.html` の importmap で `three@0.160.0`（ヒーロー3D）と `lenis@1.1.14`（慣性スクロール）をCDN読込。フォントは Google Fonts（Space Grotesk + Zen Kaku Gothic New）。
- **起動**: プロジェクト直下で `python -m http.server 5500` → `http://localhost:5500/`。`file://` ではESモジュールが動かない。
- ブラウザ自動起動（Windows/Git Bash）: `MSYS2_ARG_CONV_EXCL="*" MSYS_NO_PATHCONV=1 cmd.exe /c start "" "http://localhost:5500/index.html"`

## 4. ファイル構成と役割
```
index.html              本制作（完成形の土台）。全セクション＋配色スイッチャー
ASSETS.md               必要素材リスト（仕様・優先度・AIプロンプト例）
HANDOFF.md              本書
package.json            npm scripts（serve / test）
css/
  base.css              デザイントークン(CSS変数) / リセット / カーソル / ヘッダー /
                        ボタン / プリローダー / リビール / マーキー / 配色スイッチャー。
                        ★面・線・ガラスは color-mix で --paper/--ink から派生 → 全配色で破綻しない
  hero.css              ヒーロー / Manifesto
  sections.css          Services / Plan(3万円) / Works / Process / Contact / Footer
js/
  main.js               初期化エントリ（各モジュールを順に起動）
  utils.js              共有ポインター状態 / prefersReducedMotion / supportsWebGL 等
  zones.js              ★スクロール連動で“サイト全体”の背景を切替。起点(hero/services/works/contact)が画面中央に来たら
                        --paper/--ink を変更し、#sweep（カーテン）で全体フリップ。多重発火ガードあり
  hero-hybrid.js        ★ヒーローの A×B ハイブリッド3D（中央AIコア＋周回UIパネル＋流れる光）。
                        パネルはホバーでズーム＋ビルド＆LIVE演出＋英語ラベル(3D投影)、クリックで対応セクションへ Lenis スクロール。
                        中央AIコアもホバーで拡大/発光サージ/エネルギーリング。配色はブランド固定で初期化
  palette.js            （旧）配色スイッチャー。現在は未使用（zones.js による背景切替＋ブランド固定に置換）
  preloader.js          プリローダー（RAF不発火環境向けに setTimeout 安全網あり）
  cursor.js             カスタムカーソル＋マグネティック（fine pointer のみ）
  smooth.js             Lenis 慣性スクロール（失敗時 null=ネイティブ）
  reveal.js             data-reveal の line/words/fade/rise リビール＋ヘッダー＋マーキー
  showcase.js           ★Works の「流れるサイト・ショーケース」（2列が反対方向に無限スクロール、ホバーで停止）
  works.js              （旧）Worksの横ドラッグ。現在は showcase.js に置換され未使用
  contact.js            相談フォーム（検証/送信/ハニーポット/二重送信ガード）
  validate-contact.js   フォーム検証の純関数（テスト対象, 依存ゼロ）
  config.js             送信先設定（gitignore対象, コミットしない）
  config.sample.js      config のテンプレ（コミットする）
  analytics.js          計測イベント送出（任意）
api/
  contact.js            サーバーレス関数テンプレ（Resend, 秘密鍵は環境変数）
concepts/               ★デザイン検討の試作（単体ヒーローHTML, 自己完結）。本制作はこの比較の結論
assets/                 実素材の置き場（logo/favicon/og/works/services/photos/3d/video/textures）
```

## 5. これまでの意思決定の経緯（手戻り防止のため必読）
1. 当初 lusion.co を参考に **ダーク・シネマティック**（WebGLオーロラ）を実装 → ユーザー「事業イメージと違う」。
2. 別方向3案（A:明るい/B:フロー/C:エディトリアル）を `concepts/` に試作 → クリエイティブ路線は良いが**白ベース希望**に。
3. 白ベースのクリエイティブ2案（抽象/フロー）→ **抽象（一丸）版を採用**。ただし「何の会社か伝わらない」課題。
4. ヒーローを**リアルタイム3D**にする3案（A:UIパネル=制作力 / B:AIコア=AI / C:ワークフロー=自動化）。
5. **B（AIコア）を選択**。さらに配色を多数比較したい → 8配色スイッチャーを実装。
6. 最終的に **「Aの伝わりやすさ × Bのクオリティ」のいいとこ取り** を要望 → **A×Bハイブリッド**（`hero-hybrid.js`）に確定。
7. 支給ロゴから **Brandカラー（ネイビー×ブルー）を既定** に。
→ つまり現在の本制作 `index.html` は、この一連の比較の**結論**。`concepts/` は経緯資料として保持（消さなくてよい）。

## 6. TODO（優先順）
**A. 公開前提（★★★）**
- [x] 配色は **Brand（ネイビー×ブルー）に確定**。スイッチャー撤去済み。背景はスクロールのゾーン（zones.js）で白⇄ネイビーに切替。
- [ ] 実ロゴ差し替え（`assets/logo/`）＋ favicon 一式（`assets/favicon/`）＋ OGP/Twitter画像（`assets/og/`）を `<head>` に追加。
- [ ] SEO: title/description は設定済み。OGP/canonical/構造化データを追加。
- [ ] Works を実サムネの `<img>` に差し替え（現状 `--hue` グラデ仮）。
- [ ] フォーム本番化: `js/config.js` の `CONTACT_PROVIDER` を `demo`→`endpoint`(推奨) か `web3forms` に。`api/contact.js` をデプロイ、秘密鍵は環境変数。
- [ ] テキスト素材の本番化（会社情報 / お客様の声 / FAQ / 料金内訳 / 特商法・プライバシーポリシー）。
- [ ] 本番デプロイ（静的ホスティング: Vercel/Netlify/Cloudflare Pages 等）＋独自ドメイン。

**B. クオリティ向上（★★）**
- [ ] ヒーロー3Dの管理画面パネルを **実UIスクショ** のテクスチャに差替（`hero-hybrid.js` の `uiTexture()` を画像ロードに変更）。
- [ ] ポストプロセス bloom（three/addons）でブルー発光を強化（暗配色で特に映える）。
- [ ] Services にアイコン、各セクションに数値カウントアップやWorksの3Dチルト等のモーション追加。
- [ ] 店舗・人物写真の導入（信頼感）。

**C. 任意（★）**
- [ ] ヒーロー背景ループ動画、デモ動画、サウンド等。

## 7. 必要素材
→ **`ASSETS.md` を参照**（12カテゴリ、形式/サイズ/数量/優先度/AI生成プロンプト例つき）。
最小で効く3点: ①ロゴ実データ＋favicon＋OGP ②Works実サムネ5枚 ③管理画面UIスクショ4枚。

## 8. 既知の制約・ハマりどころ
- **プレビュー環境**: タブが `hidden` だと requestAnimationFrame / IntersectionObserver / スクショが動かない（実ブラウザでは正常）。検証は実ブラウザ推奨。
- **プリローダー**: RAF不発火時のために `setTimeout` 安全網あり（`preloader.js`）。これを消すとバックグラウンドタブで本文が固着するので残すこと。
- **canvas**: `<canvas>` は置換要素のため `inset:0` だけでは親に伸びない。必ず `width:100%;height:100%` を付ける（付けないと描画バッファ幅が暴走する）。
- **WebGL/Lenis 失敗時**: 自動でCSS背景／ネイティブスクロールにフォールバック（`try/catch`済み）。崩れない。
- **配色スイッチャー**: 検討用UI。確定後に撤去する前提（上記TODO）。
- **色設計**: 新色は `--paper` と `--ink` を基準に `color-mix` で面/線/グラスへ波及する。アクセントは `--mint`(主) / `--blue` / `--lav`。ブランドではこれらが青系。

## 9. 動作確認の手順（毎回）
1. `python -m http.server 5500` を起動。
2. `http://localhost:5500/` をブラウザで開く。
3. 確認: コンソールにエラーが無い / 横スクロールが出ない / プリローダー解除後にスクロールできる / 配色スイッチャーで全体色が変わる / モバイル幅(375px)で崩れない。
4. フォーム検証テスト: `npm test`（`node --test`、依存ゼロ。Jestではない）。

## 10. CLAUDE.md（ユーザーのグローバル方針）抜粋
- 応答・コメントは日本語。簡潔に。
- APIキー等の秘密情報は `.env` / 環境変数。コード直書き禁止。`.gitignore` に `.env` と `config.js`。
- エラーハンドリング必須。関数は1責務。命名: クラス=大文字始まり / 関数・変数=小文字＋アンダースコア（JSの既存コードは慣習に合わせてOK）。
- TypeScriptを使う場合 `any` 禁止、`async/await`、本番に `console.log` を残さない。
- 新しい関数にはテストを書く（純関数は `validate-contact.js` の例に倣う）。

---

以上。**まず `index.html` を起動して全体を体感 → `ASSETS.md` の★★★素材を用意 → 上記TODOのAから着手** してください。
