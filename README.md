# minideck-web

MiniDeck 公開ダウンロード LP。Astro 6 + Tailwind CSS 4 の純静的サイト、GitHub Pages で配信。

- 本番 URL: https://minideck.cothrivelabs.com
- 本体: https://github.com/CoThriveLabs/minideck

## 開発

前提: Node 22 LTS / pnpm 10 系。

```bash
pnpm install
pnpm dev        # localhost:4321
pnpm build      # OG 画像を再生成した上で dist/ に静的出力
pnpm preview    # ビルド成果物をローカル配信
pnpm typecheck  # astro check
pnpm og         # public/og-image.png のみ再生成
```

`pnpm build` は `prebuild` で `scripts/generate-og-image.mjs` を実行し、`public/og-image.png` を毎回作り直す。

## ディレクトリ

```
src/
  layouts/BaseLayout.astro
  components/
    common/    # BrandIcon / SeoHead / CtaButton / DownloadIcon
    sections/  # Hero / Features / Setup / Faq / Footer
  pages/       # index.astro / 404.astro
  lib/         # constants.ts / jsonld.ts / format-inline-code.ts
  styles/globals.css
public/        # favicon.svg / og-image.png / robots.txt
scripts/
  generate-og-image.mjs
  lib/brand-icon-raster.mjs  # MiniDeck 本体のロゴラスタライザを LP 用にコピー
```

## GitHub Pages デプロイ手順（初回のみ）

`main` ブランチへの push で `.github/workflows/deploy.yml` が起動し、ビルド成果物 (`dist/`) が自動でデプロイされる。初回のみ以下を GitHub / DNS 側で設定する。

1. GitHub リポジトリ Settings → Pages → **Source を `GitHub Actions` に設定**
2. GitHub リポジトリ Settings → Pages → **Custom domain に `minideck.cothrivelabs.com` を入力**
3. Cloudflare の `cothrivelabs.com` DNS ゾーンに CNAME レコードを追加
   - Name: `minideck`
   - Target: `cothrivelabs.github.io`（Organization 名の GitHub Pages ホスト名）
4. GitHub Pages 側の DNS 検証と HTTPS 発行を待つ（数分〜1時間）
5. Settings → Pages → **Enforce HTTPS を ON**

CNAME の Cloudflare 側 Proxy 設定（オレンジ雲 / DNS only）は HP `cothrivelabs.com` の運用実態に合わせる。

## 更新運用

インストーラのバージョンアップ時は `src/lib/constants.ts` の `VERSION` / `INSTALLER_FILENAME` / `INSTALLER_SIZE_MB` を書き換えて `main` に push するだけ。GitHub Actions が自動で再ビルド・再デプロイする。全セクションが定数を参照する。

## ライセンス

[PolyForm Noncommercial License 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0)（本体 [CoThriveLabs/minideck](https://github.com/CoThriveLabs/minideck) と同一ライセンス）。詳細は `LICENSE` を参照。
