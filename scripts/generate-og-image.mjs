// public/og-image.png を pngjs 単体で生成する。1200 x 630、ダーク背景 + BrandIcon + 英字テキスト。
// 日本語グリフのラスタライズは追加ネイティブ依存を避けるため断念し、代わりに
// OG 内テキストは英字 (ロゴ「MiniDeck」+ サブラベル + URL) に統一している。
// og:title / og:description メタ（SeoHead.astro）は日本語のまま出力されるので、
// 各 SNS カードでは画像下に日本語キャッチコピーが同時に表示される想定。

import { promises as fs, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { rasterizeBrandIcon } from './lib/brand-icon-raster.mjs';
import { drawText, measureText } from './lib/bitmap-font.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(REPO_ROOT, 'public', 'og-image.png');

const WIDTH = 1200;
const HEIGHT = 630;

const BG = { r: 0x0a, g: 0x0a, b: 0x12 };
const SURFACE = { r: 0x0f, g: 0x17, b: 0x2a };
const ACCENT = { r: 0x38, g: 0xbd, b: 0xf8 };
const TEXT_STRONG = { r: 0xf8, g: 0xfa, b: 0xfc };
const TEXT_MUTED = { r: 0x94, g: 0xa3, b: 0xb8 };

const ICON_SIZE = 340;
const ICON_LEFT = 90;
const ICON_TOP = (HEIGHT - ICON_SIZE) / 2 - 20;

const TITLE = 'MiniDeck';
const SUBTITLE = 'One-tap PC launcher from your phone.';
const URL_TEXT = 'minideck.cothrivelabs.com';

const TITLE_SCALE = 13;
const SMALL_TEXT_SCALE = 3;

function fillBackground(buffer) {
  // 縦方向にわずかなグラデ (中央上明 → 下暗) を掛けて単色よりも奥行きを出す
  for (let y = 0; y < HEIGHT; y++) {
    const t = y / HEIGHT;
    const r = Math.round(BG.r + (SURFACE.r - BG.r) * (0.35 - Math.abs(t - 0.15) * 0.4));
    const g = Math.round(BG.g + (SURFACE.g - BG.g) * (0.35 - Math.abs(t - 0.15) * 0.4));
    const b = Math.round(BG.b + (SURFACE.b - BG.b) * (0.35 - Math.abs(t - 0.15) * 0.4));
    for (let x = 0; x < WIDTH; x++) {
      const idx = (y * WIDTH + x) << 2;
      buffer[idx] = Math.max(0, Math.min(255, r));
      buffer[idx + 1] = Math.max(0, Math.min(255, g));
      buffer[idx + 2] = Math.max(0, Math.min(255, b));
      buffer[idx + 3] = 0xff;
    }
  }

  // 左上・右下に淡いアクセント放射光 (accent-glow の再現)
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const dxTL = (x - 200) / 600;
      const dyTL = (y - 120) / 400;
      const dTL = Math.hypot(dxTL, dyTL);
      const gTL = Math.max(0, 1 - dTL) ** 2;

      const dxBR = (x - 1000) / 500;
      const dyBR = (y - 520) / 300;
      const dBR = Math.hypot(dxBR, dyBR);
      const gBR = Math.max(0, 1 - dBR) ** 2;

      const glow = gTL * 0.12 + gBR * 0.10;
      if (glow < 0.001) continue;
      const idx = (y * WIDTH + x) << 2;
      buffer[idx] = Math.min(255, buffer[idx] + Math.round(ACCENT.r * glow));
      buffer[idx + 1] = Math.min(255, buffer[idx + 1] + Math.round(ACCENT.g * glow));
      buffer[idx + 2] = Math.min(255, buffer[idx + 2] + Math.round(ACCENT.b * glow));
    }
  }
}

function pasteRaster(buffer, raster, size, dstX, dstY, tintColor) {
  // brand-icon-raster.mjs は「fg on bg」でブレンド済みの単色バッファを返す。
  // BG に近いピクセルは背景、fg に近いピクセルはアクセント色 tint を掛けて合成する。
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const srcIdx = (y * size + x) << 2;
      // 元 raster では bg=BG, fg=ACCENT で描画済み。fg 成分の強度 = (r - BG.r) / (ACCENT.r - BG.r) 相当。
      // ここでは緑チャンネル差分で近似 (BG.g=0x0a → ACCENT.g=0xbd なので差が最も大きい)。
      const cov = Math.max(
        0,
        Math.min(1, (raster[srcIdx + 1] - BG.g) / (ACCENT.g - BG.g)),
      );
      if (cov <= 0.001) continue;
      const px = dstX + x;
      const py = dstY + y;
      if (px < 0 || px >= WIDTH || py < 0 || py >= HEIGHT) continue;
      const dstIdx = (py * WIDTH + px) << 2;
      buffer[dstIdx] = Math.round(tintColor.r * cov + buffer[dstIdx] * (1 - cov));
      buffer[dstIdx + 1] = Math.round(tintColor.g * cov + buffer[dstIdx + 1] * (1 - cov));
      buffer[dstIdx + 2] = Math.round(tintColor.b * cov + buffer[dstIdx + 2] * (1 - cov));
      buffer[dstIdx + 3] = 0xff;
    }
  }
}

function drawAccentBar(buffer, x, y, w, h, color) {
  for (let py = y; py < y + h; py++) {
    if (py < 0 || py >= HEIGHT) continue;
    for (let px = x; px < x + w; px++) {
      if (px < 0 || px >= WIDTH) continue;
      const idx = (py * WIDTH + px) << 2;
      buffer[idx] = color.r;
      buffer[idx + 1] = color.g;
      buffer[idx + 2] = color.b;
      buffer[idx + 3] = 0xff;
    }
  }
}

async function main() {
  const png = new PNG({ width: WIDTH, height: HEIGHT });
  const buffer = png.data;

  fillBackground(buffer);

  const iconRaster = rasterizeBrandIcon(ICON_SIZE, { bg: BG, fg: ACCENT });
  pasteRaster(buffer, iconRaster, ICON_SIZE, ICON_LEFT, ICON_TOP, ACCENT);

  const textLeft = ICON_LEFT + ICON_SIZE + 80;

  const titleWidth = measureText(TITLE, TITLE_SCALE);
  const titleTop = 200;
  drawText(buffer, WIDTH, HEIGHT, TITLE, textLeft, titleTop, TITLE_SCALE, TEXT_STRONG);

  drawAccentBar(
    buffer,
    textLeft,
    titleTop + 7 * TITLE_SCALE + 20,
    Math.min(titleWidth, 260),
    5,
    ACCENT,
  );

  const subtitleTop = titleTop + 7 * TITLE_SCALE + 60;
  drawText(buffer, WIDTH, HEIGHT, SUBTITLE, textLeft, subtitleTop, SMALL_TEXT_SCALE, TEXT_MUTED);

  const urlTop = HEIGHT - 55;
  const urlWidth = measureText(URL_TEXT, SMALL_TEXT_SCALE);
  drawText(buffer, WIDTH, HEIGHT, URL_TEXT, WIDTH - urlWidth - 60, urlTop, SMALL_TEXT_SCALE, TEXT_MUTED);

  mkdirSync(path.dirname(OUTPUT), { recursive: true });
  const pngBuffer = PNG.sync.write(png);
  await fs.writeFile(OUTPUT, pngBuffer);
  console.log(`og-image.png written: ${WIDTH}x${HEIGHT} -> ${path.relative(REPO_ROOT, OUTPUT)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
