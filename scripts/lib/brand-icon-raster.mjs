// MiniDeck ブランドロゴ（PC モニタ + スマートフォンの線画）を距離関数ベースで
// アンチエイリアス付きラスタライズする共通ロジック。native binding を持つ画像/SVG
// ライブラリを使わずに、pngjs だけで LP 用の og-image.png を生成するために使う。
//
// ジオメトリは MiniDeck 本体 (packages/electron/renderer/src/features/shell/Sidebar.tsx)
// の BrandIcon (viewBox 0 0 24 24) と同一。本体側の scripts/lib/brand-icon-raster.mjs
// からポート。座標の一貫性が LP のロゴを本体ロゴと視覚一致させるための要件。

export const BRAND_ICON_VIEWBOX = 24;
const STROKE_WIDTH = 2;
const STROKE_HALF = STROKE_WIDTH / 2;

const MONITOR_RECT = { x: 1.5, y: 4, w: 14, h: 10, r: 1.5 };
const STAND_BASE = { x1: 5.5, y1: 17, x2: 11.5, y2: 17 };
const STAND_LEG = { x1: 8.5, y1: 14, x2: 8.5, y2: 17 };
const PHONE_RECT = { x: 13.5, y: 9, w: 9, h: 14, r: 2 };
const PHONE_BUTTON = { x1: 17, y1: 20, x2: 19, y2: 20 };

export const BRAND_ICON_BOUNDS = { minX: 0.5, maxX: 23.5, minY: 3, maxY: 24 };

function sdRoundedRect(px, py, rect) {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const halfW = rect.w / 2;
  const halfH = rect.h / 2;
  const qx = Math.abs(px - cx) - (halfW - rect.r);
  const qy = Math.abs(py - cy) - (halfH - rect.r);
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  const inside = Math.min(Math.max(qx, qy), 0);
  return outside + inside - rect.r;
}

function distToSegment(px, py, seg) {
  const dx = seg.x2 - seg.x1;
  const dy = seg.y2 - seg.y1;
  const lenSq = dx * dx + dy * dy;
  const t =
    lenSq === 0
      ? 0
      : Math.max(0, Math.min(1, ((px - seg.x1) * dx + (py - seg.y1) * dy) / lenSq));
  return Math.hypot(px - (seg.x1 + t * dx), py - (seg.y1 + t * dy));
}

function distanceToStroke(px, py) {
  return Math.min(
    Math.abs(sdRoundedRect(px, py, MONITOR_RECT)),
    distToSegment(px, py, STAND_BASE),
    distToSegment(px, py, STAND_LEG),
    Math.abs(sdRoundedRect(px, py, PHONE_RECT)),
    distToSegment(px, py, PHONE_BUTTON),
  );
}

/**
 * ブランドロゴを RGBA バッファに描画する。
 * @param {number} size 正方形の一辺 (px)
 * @param {{ bg: {r:number,g:number,b:number}, fg: {r:number,g:number,b:number} }} colors
 * @param {{ scale?: number, originX?: number, originY?: number }} [layout]
 * @returns {Buffer} RGBA buffer, length = size*size*4
 */
export function rasterizeBrandIcon(size, colors, layout) {
  const scale = layout?.scale ?? size / BRAND_ICON_VIEWBOX;
  const originX = layout?.originX ?? BRAND_ICON_VIEWBOX / 2;
  const originY = layout?.originY ?? BRAND_ICON_VIEWBOX / 2;
  const canvasCenter = size / 2;
  const aa = 1 / scale;

  const buffer = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = (x + 0.5 - canvasCenter) / scale + originX;
      const py = (y + 0.5 - canvasCenter) / scale + originY;
      const d = distanceToStroke(px, py);
      const coverage = Math.max(0, Math.min(1, 0.5 - (d - STROKE_HALF) / aa));
      const idx = (size * y + x) << 2;
      buffer[idx] = Math.round(colors.fg.r * coverage + colors.bg.r * (1 - coverage));
      buffer[idx + 1] = Math.round(colors.fg.g * coverage + colors.bg.g * (1 - coverage));
      buffer[idx + 2] = Math.round(colors.fg.b * coverage + colors.bg.b * (1 - coverage));
      buffer[idx + 3] = 0xff;
    }
  }
  return buffer;
}
