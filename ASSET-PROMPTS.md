# Nos Technology — 素材生成プロンプト集 ＋ 渡すプロンプト

現行の本番デザイン（トップ＝ハブ＋各サービス独立ページ／真っ黒シネマティック・ゲーム調／白系も切替可／ネイビー×エレクトリックブルー）に合わせた、画像素材の生成プロンプトと、生成担当・画像生成AIへ**そのまま渡せる指示文**。
3Dパネル専用の細かい差分プロンプトは `panel-image-prompts.xlsx`（シート: Panel Image Prompts）を併用。

ブランド: near-black `#07080C` / navy `#16213A` / electric blue `#1A5CFF`・`#3D8BFF` / white `#F4F5F8`
配置先: `assets/{og,photos,works,textures,logo}/`。書き出し: 写真=WebP(+JPEG)、図版=SVG/PNG、表示サイズの2倍解像度。

---

## 0. 渡すプロンプト（生成担当／画像生成AIにそのまま貼る）

```
You are producing image assets for "Nos Technology", a premium studio that builds websites, AI automation, and admin systems for local businesses (salons, cafes, clinics).

BRAND & STYLE (apply to every image):
- Aesthetic: cinematic, premium, AAA game key-art lighting (think modern AAA 3D title splash art). Confident, high-end, trustworthy.
- Palette: deep near-black #07080C and navy #16213A base, with electric-blue accents #1A5CFF / #3D8BFF; clean white #F4F5F8 when a light variant is requested.
- Light: volumetric/soft rim light, gentle bloom, subtle film grain, shallow depth of field.
- NO text, NO words, NO logos, NO watermarks, NO UI gibberish. Leave calm negative space for overlay text.
- People: candid, no identifiable faces in focus, respect likeness rights; prefer over-the-shoulder / hands / silhouettes.
- Quality: ultra-detailed, photoreal where photographic, crisp, no artifacts.

HOW TO USE:
- Each asset below has: purpose, an English PROMPT, size, format, priority.
- Append the "GLOBAL STYLE SUFFIX" to every prompt.
- Deliver at 2× the listed display size, then export WebP (photos) or PNG/SVG (graphics).
- Name files lowercase-with-hyphens and place them in the listed assets/ folder.
- For state-variant 3D panel screens, use panel-image-prompts.xlsx instead.

GLOBAL STYLE SUFFIX (append):
", cinematic premium AAA game key-art lighting, near-black #07080C and navy #16213A with electric-blue #1A5CFF accents, volumetric soft light, subtle film grain, shallow depth of field, no text, no logo, generous negative space for overlay, ultra high quality, 8k"
LIGHT VARIANT SUFFIX (when a white background is requested): ", clean white #F4F5F8 background, airy, soft daylight, minimal, navy and electric-blue accents, premium, no text, ultra high quality"
```

---

## 1. ブランド表示まわり

### AST-OG-01 — OGP / SNSシェア画像
- 用途/配置: SNS共有カード（`assets/og/og-share.webp`、metaの og:image）
- サイズ/形式/優先: 1200×630 / WebP(+PNG) / ★★★
- PROMPT (EN):
```
Cinematic brand key visual for a tech studio: a glowing low-poly crystalline AI core orb floating on the right over a deep near-black to navy gradient, faint geometric network lines and particles, electric-blue volumetric glow, large empty space on the left for a headline, balanced premium composition
```
- 補足: 左の余白に後から「人の時間を、AIでつくる。」＋ロゴを重ねる前提。実ロゴ確定後に合成。

### AST-KEY-01 — ヒーロー/汎用 抽象キーアート（背景フォールバック）
- 用途/配置: 3Dが動かない端末の背景、セクション背景（`assets/textures/keyart-dark.webp`）
- サイズ/形式/優先: 1920×1080 / WebP / ★★
- PROMPT (EN):
```
Abstract cinematic dark tech background, near-black with deep navy and electric-blue volumetric light beams, drifting particles and soft bokeh, faint flowing energy lines, AAA game splash-art atmosphere, no subject, lots of empty space
```

---

## 2. 業種イメージ写真（Works / 各サービスページ）

### AST-PH-BEAUTY-01 — 美容室・サロン
- 用途/配置: Works/サービス導入（`assets/photos/salon.webp`）
- サイズ/形式/優先: 1600×1200 (4:3) / WebP / ★★
```
Modern minimal hair salon interior, elegant styling chairs and large mirror, warm soft light with a subtle cool blue accent, shallow depth of field, premium editorial photography, calm and high-end, no people in focus
```

### AST-PH-CAFE-01 — 飲食店・カフェ
- 用途/配置: 同上（`assets/photos/cafe.webp`）/ ★★
```
Cozy specialty coffee cafe counter, warm wood and matte black surfaces, natural window light, artisanal details, steam and shallow depth of field, premium food/interior photography, inviting
```

### AST-PH-CLINIC-01 — クリニック・整体
- 用途/配置: 同上（`assets/photos/clinic.webp`）/ ★★
```
Clean modern clinic reception and waiting area, white and navy palette, soft daylight, calm and trustworthy, minimal premium interior photography, no people in focus
```

### AST-PH-WORK-01 — 制作/打合せシーン（人物・要配慮）
- 用途/配置: About/Process（`assets/photos/working.webp`）/ ★
```
Over-the-shoulder shot of hands using a laptop showing an abstract dashboard, small modern studio, cinematic soft rim light with electric-blue accent, candid, no readable screen content, no identifiable face
```

---

## 3. Works サムネ（業種サイトのモックアップ画像）
現状はCSSモック。実写級のサイト・モックに差し替えると説得力UP。各 `assets/works/<slug>.webp`（1600×1200, ★★）。
共通: ", website homepage design shown on a clean device/browser frame, realistic UI, premium web design, soft studio shadow" ＋ GLOBAL/LIGHT SUFFIX。

- AST-WK-SALON `beauty salon website homepage, elegant serif headline area, soft imagery, booking button`
- AST-WK-DINER `local diner / cafe website homepage, warm appetizing hero photo, menu and map section`
- AST-WK-CLINIC `medical clinic website homepage, calm white-and-navy, trust badges, reservation CTA`
- AST-WK-GYM `fitness gym website homepage, bold dark hero, strong typography, join CTA`
- AST-WK-HOTEL `boutique hotel website homepage, refined imagery, rooms and access`

> 「デザインイメージ」表記のままでも可。実案件が出たら実スクショへ。

---

## 4. テクスチャ / グラフィック
- AST-TX-GRAIN-01 — フィルムグレイン（`assets/textures/grain.png`, 透過, ★）
```
Seamless fine film grain / noise texture, transparent, subtle, for dark website overlay, monochrome
```
- AST-TX-MESH-01 — グラデーションメッシュ（`assets/textures/mesh-blue.webp`, ★）
```
Smooth abstract gradient mesh, deep navy to electric blue, soft blurred blobs, premium, seamless, no text
```

---

## 5. 3Dパネル用スクリーン画像
→ **`panel-image-prompts.xlsx`（シート: Panel Image Prompts）** を使用（通常/アクション/完了の状態差分、13素材）。各プロンプトに上記 GLOBAL/LIGHT SUFFIX を足してもよい。

---

## 6. アイコン（私が作成 / 画像生成は非推奨）
サービス3本柱・できること・SNS（LINE/Instagram/Map）・UI微細は、配色追従の**SVGで私(Claude)が作成**します（画像生成だと線幅/視認が不安定なため）。ご希望があれば着手します。

---

## 命名 / 納品
- 例: `og-share.webp` / `salon@2x.webp` / `works-clinic.webp`
- 写真=WebP(+JPEG保険)、図版=SVG/PNG、表示2倍解像度。各 `assets/` 該当フォルダへ。
- 届いたらファイル名を教えてください → サイトへ反映します。
