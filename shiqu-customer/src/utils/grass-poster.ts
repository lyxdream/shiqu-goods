import QRCode from 'qrcode'
import { resolveAssetUrl } from '@/utils/url'

export type PosterTemplate = 'xhs' | 'moments'

export interface GrassPosterInput {
  name: string
  price: number | string
  image?: string | null
  summary: string
  template: PosterTemplate
  /** 二维码跳转链接，传空则不绘制二维码 */
  productUrl?: string
}

const BRAND = '拾趣好物'

function formatPrice(price: number | string): string {
  const n = Number(price)
  return Number.isNaN(n) ? '见详情' : n.toFixed(2)
}

/** 清理文案：去 emoji / tag，压成一行再截断 */
export function truncateSummary(text: string, maxLen = 80): string {
  const cleaned = text
    .replace(/#[^\s#]+/g, '')
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, '')
    .replace(/[✨💰📍👉🎁🛍️❤️🌟⭐]/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned.length <= maxLen ? cleaned : `${cleaned.slice(0, maxLen)}…`
}

/** 逐字换行，超出 maxLines 末尾加省略号 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const lines: string[] = []
  let cur = ''
  for (const ch of text) {
    const next = cur + ch
    if (ctx.measureText(next).width > maxWidth && cur) {
      lines.push(cur)
      cur = ch
      if (lines.length >= maxLines) break
    } else {
      cur = next
    }
  }
  if (lines.length < maxLines && cur) lines.push(cur)
  if (lines.length === maxLines && text.length > lines.join('').length) {
    const last = lines[maxLines - 1]
    lines[maxLines - 1] = last.slice(0, Math.max(0, last.length - 1)) + '…'
  }
  return lines
}

/** 生成二维码，返回 HTMLImageElement，失败则返回 null */
async function buildQrImage(url: string, size: number): Promise<HTMLImageElement | null> {
  if (!url) return null
  try {
    const dataUrl = await QRCode.toDataURL(url, {
      width: size,
      margin: 1,
      color: { dark: '#1A1A1A', light: '#FFFFFF' },
      errorCorrectionLevel: 'M',
    })
    return loadImage(dataUrl)
  } catch {
    return null
  }
}

/** 绘制带白底圆角的二维码小卡片 */
function drawQrCard(
  ctx: CanvasRenderingContext2D,
  qrImg: HTMLImageElement,
  x: number,
  y: number,
  size: number,
  label: string,
) {
  const PAD = 10
  const LABEL_H = 28
  const cardW = size + PAD * 2
  const cardH = size + PAD * 2 + LABEL_H

  void label
  // 白底圆角卡片
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.15)'
  ctx.shadowBlur = 10
  ctx.fillStyle = '#FFFFFF'
  fillRoundRect(ctx, x, y, cardW, cardH - LABEL_H, 10)
  ctx.restore()

  // 二维码图片
  ctx.drawImage(qrImg, x + PAD, y + PAD, size, size)
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null)
    const img = new Image()
    if (/^https?:\/\//i.test(src)) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const scale = Math.max(w / img.width, h / img.height)
  const sw = w / scale
  const sh = h / scale
  const sx = (img.width - sw) / 2
  const sy = (img.height - sh) / 2
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
  ctx.fill()
}

// ─── 空图占位 ────────────────────────────────────────────────────────────────

function drawEmptyImage(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h)
  g.addColorStop(0, '#DFE9F3')
  g.addColorStop(1, '#C8D8E8')
  ctx.fillStyle = g
  ctx.fillRect(x, y, w, h)

  // 相机图标
  const cx = x + w / 2
  const cy = y + h / 2
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'
  ctx.lineWidth = 5
  ctx.lineJoin = 'round'
  // 机身
  ctx.beginPath()
  ctx.roundRect(cx - 56, cy - 34, 112, 80, 10)
  ctx.stroke()
  // 镜头
  ctx.beginPath()
  ctx.arc(cx, cy + 8, 26, 0, Math.PI * 2)
  ctx.stroke()
  // 闪光灯小矩形
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.beginPath()
  ctx.roundRect(cx + 28, cy - 32, 18, 10, 4)
  ctx.fill()

  // 文字
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.font = '26px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('暂无图片', cx, cy + 70)
  ctx.textAlign = 'left'
}

// ─── 小红书竖版 750×1100 ────────────────────────────────────────────────────

function drawXhs(
  ctx: CanvasRenderingContext2D,
  input: GrassPosterInput,
  img: HTMLImageElement | null,
  qrImg: HTMLImageElement | null,
) {
  const W = 750
  const H = 1100
  const IMAGE_H = 560
  const CARD_Y = IMAGE_H - 28 // 白卡压在图片底部 28px

  // ── 整体白底 ──
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, W, H)

  // ── 图片区（全出血，无内边距）──
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, W, IMAGE_H)
  ctx.clip()

  if (img) {
    drawCoverImage(ctx, img, 0, 0, W, IMAGE_H)
  } else {
    drawEmptyImage(ctx, 0, 0, W, IMAGE_H)
  }

  // 图片底部柔和渐变（让白卡过渡自然）
  const imgGrad = ctx.createLinearGradient(0, IMAGE_H - 100, 0, IMAGE_H)
  imgGrad.addColorStop(0, 'rgba(255,255,255,0)')
  imgGrad.addColorStop(1, 'rgba(255,255,255,0.35)')
  ctx.fillStyle = imgGrad
  ctx.fillRect(0, IMAGE_H - 100, W, 100)
  ctx.restore()

  // ── 图片顶部品牌标签 ──
  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  fillRoundRect(ctx, 28, 28, 164, 50, 25)
  ctx.fillStyle = '#1A1A1A'
  ctx.font = 'bold 26px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(BRAND, 110, 62)
  ctx.textAlign = 'left'
  ctx.restore()

  // ── 白色卡片（上圆角，压在图片底部）──
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.08)'
  ctx.shadowBlur = 20
  ctx.shadowOffsetY = -4
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.moveTo(32, CARD_Y)
  ctx.arcTo(W - 32, CARD_Y, W - 32, CARD_Y + 32, 32)
  ctx.lineTo(W - 32, H)
  ctx.lineTo(32, H)
  ctx.arcTo(32, CARD_Y, W - 32, CARD_Y, 32)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  // ── 卡片内容 ──
  const PAD = 52
  const CW = W - PAD * 2
  let y = CARD_Y + 52

  // 橙色「好物推荐」徽章
  ctx.fillStyle = '#FF5722'
  fillRoundRect(ctx, PAD, y, 128, 40, 8)
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 22px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('好物推荐', PAD + 64, y + 28)
  ctx.textAlign = 'left'
  y += 72 // 徽章高度 40 + 上下间距 32

  // 商品名称
  ctx.fillStyle = '#1A1A1A'
  ctx.font = 'bold 48px sans-serif'
  const nameLines = wrapText(ctx, input.name || '拾趣好物', CW, 2)
  for (const line of nameLines) {
    ctx.fillText(line, PAD, y)
    y += 66
  }
  y += 10

  // 价格
  ctx.fillStyle = '#EE0A24'
  ctx.font = 'bold 54px sans-serif'
  ctx.fillText(`¥${formatPrice(input.price)}`, PAD, y)
  y += 72

  // 分隔线
  ctx.strokeStyle = '#F2F2F2'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(PAD, y)
  ctx.lineTo(W - PAD, y)
  ctx.stroke()
  y += 36

  // 摘要
  ctx.fillStyle = '#999999'
  ctx.font = '27px sans-serif'
  const sumLines = wrapText(ctx, truncateSummary(input.summary, 90), CW, 3)
  for (const line of sumLines) {
    ctx.fillText(line, PAD, y)
    y += 42
  }

  // 底部区域：品牌水印（左）+ 二维码（右）
  const footerY = H - 110
  if (qrImg) {
    const QR_SIZE = 90
    drawQrCard(ctx, qrImg, W - PAD - QR_SIZE - 20, footerY - 10, QR_SIZE, '扫码查看')
    // 左侧品牌
    ctx.fillStyle = '#CCCCCC'
    ctx.font = '24px sans-serif'
    ctx.fillText(BRAND, PAD, footerY + 38)
    ctx.font = '22px sans-serif'
    ctx.fillText('支持自提', PAD, footerY + 68)
  } else {
    ctx.fillStyle = '#CCCCCC'
    ctx.font = '24px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${BRAND}  ·  支持自提`, W / 2, H - 44)
    ctx.textAlign = 'left'
  }
}

// ─── 朋友圈方图 750×750 ────────────────────────────────────────────────────
// 风格：全图背景 + 底部渐变遮罩 + 文字叠加

function drawMoments(
  ctx: CanvasRenderingContext2D,
  input: GrassPosterInput,
  img: HTMLImageElement | null,
  qrImg: HTMLImageElement | null,
) {
  const W = 750
  const H = 750

  // ── 背景图（全出血）──
  if (img) {
    drawCoverImage(ctx, img, 0, 0, W, H)
  } else {
    drawEmptyImage(ctx, 0, 0, W, H)
  }

  // ── 顶部渐变遮罩（品牌区）──
  const topGrad = ctx.createLinearGradient(0, 0, 0, 160)
  topGrad.addColorStop(0, 'rgba(0,0,0,0.55)')
  topGrad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = topGrad
  ctx.fillRect(0, 0, W, 160)

  // ── 底部渐变遮罩（内容区）──
  const bottomGrad = ctx.createLinearGradient(0, 320, 0, H)
  bottomGrad.addColorStop(0, 'rgba(0,0,0,0)')
  bottomGrad.addColorStop(0.4, 'rgba(0,0,0,0.55)')
  bottomGrad.addColorStop(1, 'rgba(0,0,0,0.82)')
  ctx.fillStyle = bottomGrad
  ctx.fillRect(0, 320, W, H - 320)

  // ── 顶部品牌（左上角）──
  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  ctx.font = 'bold 28px sans-serif'
  ctx.fillText(BRAND, 40, 66)

  // 品牌下方细线
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(40, 80)
  ctx.lineTo(40 + ctx.measureText(BRAND).width, 80)
  ctx.stroke()

  // ── 底部内容 ──
  const PAD = 40
  const CW = W - PAD * 2
  let y = H - 200

  // 商品名称（2行，粗体白色）
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 46px sans-serif'
  const nameLines = wrapText(ctx, input.name || '拾趣好物', CW, 2)
  for (const line of nameLines) {
    ctx.fillText(line, PAD, y)
    y += 60
  }
  y += 6

  // 价格（金色）
  ctx.fillStyle = '#FFD166'
  ctx.font = 'bold 40px sans-serif'
  ctx.fillText(`¥${formatPrice(input.price)}`, PAD, y)
  y += 56

  // 摘要（2行，白色半透明）
  ctx.fillStyle = 'rgba(255,255,255,0.72)'
  ctx.font = '25px sans-serif'
  const sumLines = wrapText(ctx, truncateSummary(input.summary, 56), CW, 2)
  for (const line of sumLines) {
    ctx.fillText(line, PAD, y)
    y += 36
  }

  // 右下角：二维码 + 水印文字
  if (qrImg) {
    const QR_SIZE = 90
    const cardW = QR_SIZE + 20
    const cardH = QR_SIZE + 20
    const qrX = W - PAD - cardW
    const qrY = H - PAD - cardH
    drawQrCard(ctx, qrImg, qrX, qrY, QR_SIZE, '扫码查看')
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.font = '22px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`${BRAND} · 支持自提`, W - PAD, H - 30)
    ctx.textAlign = 'left'
  }
}

// ─── 主入口 ────────────────────────────────────────────────────────────────

function drawPoster(
  ctx: CanvasRenderingContext2D,
  input: GrassPosterInput,
  img: HTMLImageElement | null,
  qrImg: HTMLImageElement | null,
) {
  if (input.template === 'xhs') {
    drawXhs(ctx, input, img, qrImg)
  } else {
    drawMoments(ctx, input, img, qrImg)
  }
}

export async function renderGrassPoster(input: GrassPosterInput): Promise<string> {
  const W = 750
  const H = input.template === 'xhs' ? 1100 : 750
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 不可用')

  const QR_PX = 110 // 生成的二维码分辨率（含 margin）
  const [img, qrImg] = await Promise.all([
    loadImage(resolveAssetUrl(input.image)),
    input.productUrl ? buildQrImage(input.productUrl, QR_PX) : Promise.resolve(null),
  ])

  drawPoster(ctx, input, img, qrImg)

  try {
    return canvas.toDataURL('image/png')
  } catch {
    // 跨域图片污染画布时降级为无图版本
    ctx.clearRect(0, 0, W, H)
    drawPoster(ctx, input, null, qrImg)
    return canvas.toDataURL('image/png')
  }
}

export async function downloadPosterDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
