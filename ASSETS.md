# Nos Technology LP — 素材リスト（制作仕様書 / 2026-06-24 更新）

現在の本番デザイン（トップ＝ハブ＋各サービス独立ページ／真っ黒シネマティック・ゲーム調／3DシネマティックHero／流れる光／9配色スイッチャー）に合わせた、必要素材と作成分担。

## 作成分担（凡例）
- 🟦 **私(Claude)が直接作成**（SVG / コード / 図版 / デモページ）
- 🟨 **私がAI生成プロンプトを用意 → あなたが画像生成**（写真・リッチ画像）
- 🟥 **あなたが実データ提供**

## いま決まっている方針
- ロゴ＝🟥 **実データあり**（高解像度PNG/SVG/AI）。→ `assets/logo/` に置いてファイル名を教えてください。届き次第 ヘッダー/フッター/favicon/OGP に正式反映（現状は themeable SVG 再現で暫定運用中）。
- 写真＝🟨 **AI生成**（下の「AI生成プロンプト集」を使用）。
- Works＝🟦 **デモ作品を作り込む**（実績はまだ→ダミー店舗の実ページを制作し、それを実績ビジュアルに）。
- リッチでないUI/図版/アイコン＝🟦 私が作成。

---

## カテゴリ別・必要素材

### 1. ブランド / ロゴ 🟥→🟦
| 素材 | 用途 | 形式 | 状態 |
|---|---|---|---|
| ロゴ（マーク／横ロックアップ／白抜き） | ヘッダー/フッター/OGP/favicon元 | PNG透過＋できればSVG | 🟥 実データ待ち（`assets/logo/`へ） |
| ブランドカラー確定 | 全体 | — | 黒#07080c基調＋9配色で検討中。1つに確定したい |

### 2. favicon / OGP 🟦
| 素材 | 形式 | サイズ | 状態 |
|---|---|---|---|
| favicon / apple-touch | SVG/PNG | 512,180,32 | 🟦 暫定SVG有。ロゴ確定後に正式化 |
| OGP / Twitter | PNG/SVG | 1200×630 | 🟦 暫定SVG有。黒地×ブルー＋ロゴで本番化予定 |

### 3. アイコンセット 🟦（今ほぼ無い→ここで密度UP）
- サービス3本柱（Web/AI/管理画面）、できること項目、SNS・連絡（LINE/Instagram/Map/電話/メール）、UI微細（矢印/チェック/外部リンク）。
- 形式：SVG・線2px統一・24グリッド・`currentColor`/`var(--mint)`対応（配色追従）。

### 4. Works デモ作品 🟦（実績の代わりに“作れる証拠”）
- 各業種の**実ページを制作**（`works-demo/<slug>/index.html` 等）→ スクショ/フレーム埋め込みで Works に掲載。
- 提案業種（まずは3つ）：**美容室・サロン / 飲食店・カフェ / クリニック・整体**。＋管理画面デモ（予約/顧客）。
- 各デモ＝Hero＋特徴＋予約/問い合わせ導線まで作り込み、ブランド外の“クライアントらしい”配色で。

### 5. サービスHero / 管理画面UIモック 🟦（🟨で補強可）
- 現状：`service-hero.js` が手続き的に“制作中UI”を描画。より作り込み or 実UIスクショ差し替え。
- 管理画面（system.html「画面イメージ」）：🟦 実っぽいダッシュボードUIをコード/SVGで作成。

### 6. 写真（店舗 / 人物 / 現場 / 質感） 🟨
- ヒーロー背景の空気感、店舗（美容/飲食/サロン）、接客・作業シーン、抽象テクスチャ。→ 下のプロンプト集参照。

### 7. テクスチャ / グラフィック 🟦
- フィルムグレイン（実装済）/ グラデーションメッシュ / 罫線・ドット / 光のパーティクル素材。SVG/CSS/canvasで作成。

### 8. テキスト素材 🟥（私が叩き台→あなたが確定）
- 会社情報 / お客様の声 / FAQ / 料金内訳 / 特定商取引法・プライバシーポリシー（申込み導入時は必須）。

---

## AI生成プロンプト集（写真・リッチ画像）🟨
画像生成（Midjourney/DALL·E/Imagen等）にコピペで使える想定。共通方針：**ダーク・シネマティック、ネイビー〜エレクトリックブルーの差し色、上質・実写級、文字なし、被写体に余白**。

**ヒーロー背景の空気感（抽象）**
```
Abstract cinematic dark background, near-black with deep navy and electric blue volumetric light, subtle particles and soft bokeh, premium tech atmosphere, AAA game key-art lighting, no text, no logo, 16:9
```
**美容室サイト用イメージ**
```
Modern minimal hair salon interior, warm soft light, elegant, shallow depth of field, premium photography, muted tones with subtle blue accent, no text, 4:3
```
**飲食店・カフェ用イメージ**
```
Cozy specialty cafe counter, natural light, artisanal, warm wood and matte black, food styling, premium editorial photography, no text, 4:3
```
**クリニック・整体用イメージ**
```
Clean modern clinic reception, trustworthy, soft daylight, white and navy palette, calm professional atmosphere, premium photography, no text, 4:3
```
**接客・作業シーン（人物・要権利配慮）**
```
Over-the-shoulder shot of a professional using a laptop dashboard in a small studio, cinematic, soft rim light, navy/blue accent, candid, no readable text on screen, 16:9
```
**質感テクスチャ**
```
Subtle dark noise gradient texture, near-black to deep blue, fine grain, seamless, for website background overlay, no text, square
```
> 人物は権利・違和感に注意。各画像は WebP 化＋表示サイズの2倍解像度で書き出し、`assets/photos/` 等へ。

---

## いま私が着手できる（コード/SVG）🟦
1. **アイコンセット**（サービス/できること/SNS）を SVG で作成 → 各ページに反映。
2. **OGP/favicon の本番化**（ロゴ確定後すぐ）。
3. **Works デモ作品**を業種ごとに制作（まず美容室）。
4. **管理画面ダッシュボードUI**を作り込み（system.html）。
5. テクスチャ/グラフィックの追加。

## あなたにお願いしたいこと
- ① **実ロゴを `assets/logo/` に配置**し、ファイル名を教えてください（→ 即反映）。
- ② 上の**写真プロンプトで画像生成** → `assets/photos/` に置いて教えてください（→ 配置）。
- ③ **Works デモ作品の業種**：提案（美容室/飲食/クリニック）でよいか、変更したいか。
- ④ テキスト素材（会社情報/料金/お客様の声 等）は、叩き台を私が作るので**確定値**をください。

---

## 命名 / 書き出し
- 小文字＋ハイフン、`@2x` 倍率指定、写真=WebP(+JPEG)、図版/アイコン=SVG、透過=PNG。
- 配置：`assets/{logo,favicon,og,works,services,photos,textures}/`（作成済みフォルダ）。
