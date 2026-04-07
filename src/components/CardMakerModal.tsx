import { useMemo, useRef, useState, useCallback, type PointerEvent as ReactPointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { ExtractedColor } from '../hooks/useColorExtraction'

interface CardMakerModalProps {
  colors: ExtractedColor[]
  isOpen: boolean
  onClose: () => void
  rgbToHex: (r: number, g: number, b: number) => string
}

interface TextElement {
  id: string
  text: string
  fontFamily: string
  fontSize: number
  textColor: string
  position: { x: number; y: number }
}

type BgMode = 'horizontal' | 'vertical' | 'gradient-h' | 'gradient-v' | 'gradient-dl' | 'gradient-dr'

const FONT_OPTIONS = [
  'Pretendard GOV',
  'Noto Sans KR',
  'Noto Serif KR',
  'Nanum Gothic',
  'Nanum Myeongjo',
  'Gowun Dodum',
  'Gothic A1',
  'Do Hyeon',
  'Jua',
  'Black Han Sans',
  'Sunflower',
  'Gamja Flower',
  'Gaegu',
  'Hi Melody',
  'Dongle',
  'Poor Story',
  'Single Day',
]

const BG_MODE_OPTIONS: { value: BgMode; labelKey: string }[] = [
  { value: 'horizontal', labelKey: 'bgHorizontal' },
  { value: 'vertical', labelKey: 'bgVertical' },
  { value: 'gradient-h', labelKey: 'bgGradientH' },
  { value: 'gradient-v', labelKey: 'bgGradientV' },
  { value: 'gradient-dl', labelKey: 'bgGradientDL' },
  { value: 'gradient-dr', labelKey: 'bgGradientDR' },
]

function colorToHex(c: ExtractedColor): string {
  return `#${[c.r, c.g, c.b].map(v => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}

function colorToRgb(c: ExtractedColor): string {
  return `rgb(${c.r}, ${c.g}, ${c.b})`
}

function getReadableColor(r: number, g: number, b: number): string {
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.55)'
}

function avgLuminance(colors: ExtractedColor[]): number {
  if (colors.length === 0) return 0.5
  const sum = colors.reduce((acc, c) => acc + (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255, 0)
  return sum / colors.length
}

let nextId = 1
function makeId() { return `te-${nextId++}` }

function createTextElement(overrides?: Partial<TextElement>): TextElement {
  return {
    id: makeId(),
    text: '세상의 모든 색깔',
    fontFamily: FONT_OPTIONS[0],
    fontSize: 34,
    textColor: '#FFFFFF',
    position: { x: 50, y: 50 },
    ...overrides,
  }
}

function buildBgStyle(colors: ExtractedColor[], mode: BgMode): React.CSSProperties {
  const hexes = colors.map(colorToHex)
  if (hexes.length === 0) return { backgroundColor: '#7C3AED' }
  if (hexes.length === 1) return { backgroundColor: hexes[0] }

  if (mode.startsWith('gradient')) {
    let dir = 'to right'
    if (mode === 'gradient-v') dir = 'to bottom'
    else if (mode === 'gradient-dl') dir = 'to bottom right'
    else if (mode === 'gradient-dr') dir = 'to bottom left'
    return { background: `linear-gradient(${dir}, ${hexes.join(', ')})` }
  }

  // Split mode — use CSS linear-gradient with hard stops
  const n = hexes.length
  const dir = mode === 'vertical' ? 'to bottom' : 'to right'
  const stops = hexes.flatMap((hex, i) => {
    const start = ((i / n) * 100).toFixed(2)
    const end = (((i + 1) / n) * 100).toFixed(2)
    return [`${hex} ${start}%`, `${hex} ${end}%`]
  })
  return { background: `linear-gradient(${dir}, ${stops.join(', ')})` }
}

function drawBgToCanvas(ctx: CanvasRenderingContext2D, w: number, h: number, colors: ExtractedColor[], mode: BgMode) {
  const hexes = colors.map(colorToHex)
  if (hexes.length === 0) {
    ctx.fillStyle = '#7C3AED'
    ctx.fillRect(0, 0, w, h)
    return
  }
  if (hexes.length === 1) {
    ctx.fillStyle = hexes[0]
    ctx.fillRect(0, 0, w, h)
    return
  }

  if (mode.startsWith('gradient')) {
    let x0 = 0, y0 = 0, x1 = w, y1 = 0
    if (mode === 'gradient-v') { x1 = 0; y1 = h }
    else if (mode === 'gradient-dl') { x1 = w; y1 = h }
    else if (mode === 'gradient-dr') { x0 = w; x1 = 0; y1 = h }
    const grad = ctx.createLinearGradient(x0, y0, x1, y1)
    hexes.forEach((hex, i) => grad.addColorStop(i / (hexes.length - 1), hex))
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
    return
  }

  // Split mode
  const n = hexes.length
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = hexes[i]
    if (mode === 'vertical') {
      const sy = (i / n) * h
      const sh = ((i + 1) / n) * h - sy
      ctx.fillRect(0, sy, w, sh)
    } else {
      const sx = (i / n) * w
      const sw = ((i + 1) / n) * w - sx
      ctx.fillRect(sx, 0, sw, h)
    }
  }
}

export function CardMakerModal({ colors, isOpen, onClose, rgbToHex }: CardMakerModalProps) {
  const { t } = useTranslation()
  const [textElements, setTextElements] = useState<TextElement[]>(() => [createTextElement()])
  const [activeElementId, setActiveElementId] = useState<string | null>(null)
  const [bgMode, setBgMode] = useState<BgMode>('horizontal')
  const [showColorCode, setShowColorCode] = useState(false)
  const [exportFeedback, setExportFeedback] = useState<'jpg' | 'clipboard' | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ elementId: string; offsetX: number; offsetY: number } | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const activeElement = textElements.find(el => el.id === activeElementId) ?? textElements[0] ?? null

  const colorCodeText = useMemo(() => {
    return colors.map(c => colorToHex(c)).join('  |  ')
  }, [colors])

  const codeColor = useMemo(() => {
    const lum = avgLuminance(colors)
    return lum > 0.5 ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.55)'
  }, [colors])

  const bgStyle = useMemo(() => buildBgStyle(colors, bgMode), [colors, bgMode])

  const updateElement = useCallback((id: string, updates: Partial<TextElement>) => {
    setTextElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el))
  }, [])

  const addTextElement = useCallback(() => {
    const el = createTextElement({ text: '', position: { x: 50, y: 30 + Math.random() * 40 } })
    setTextElements(prev => [...prev, el])
    setActiveElementId(el.id)
  }, [])

  const removeTextElement = useCallback((id: string) => {
    setTextElements(prev => {
      const next = prev.filter(el => el.id !== id)
      if (next.length === 0) return [createTextElement()]
      return next
    })
    setActiveElementId(prev => prev === id ? null : prev)
  }, [])

  const renderToCanvas = useCallback((): HTMLCanvasElement => {
    const canvas = document.createElement('canvas')
    const width = 600
    const height = 800
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!

    drawBgToCanvas(ctx, width, height, colors, bgMode)

    // Draw all text elements
    for (const el of textElements) {
      ctx.fillStyle = el.textColor
      ctx.font = `${el.fontSize * 2}px "${el.fontFamily}"`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const textX = (el.position.x / 100) * width
      const textY = (el.position.y / 100) * height
      const lines = el.text.split('\n')
      const lineHeight = el.fontSize * 2 * 1.25
      const startY = textY - ((lines.length - 1) / 2) * lineHeight
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], textX, startY + i * lineHeight)
      }
    }

    if (showColorCode) {
      ctx.fillStyle = codeColor
      ctx.font = `24px "Noto Sans KR", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.fillText(colorCodeText, width / 2, height - 24)
    }

    return canvas
  }, [colors, bgMode, textElements, showColorCode, codeColor, colorCodeText])

  const downloadJpg = useCallback(() => {
    const canvas = renderToCanvas()
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `color-card.jpg`
      a.click()
      URL.revokeObjectURL(url)
      setExportFeedback('jpg')
      setTimeout(() => setExportFeedback(null), 2000)
    }, 'image/jpeg', 0.95)
  }, [renderToCanvas])

  const copyToClipboard = useCallback(async () => {
    const canvas = renderToCanvas()
    canvas.toBlob(async (blob) => {
      if (!blob) return
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      } catch { /* */ }
      setExportFeedback('clipboard')
      setTimeout(() => setExportFeedback(null), 2000)
    }, 'image/png')
  }, [renderToCanvas])

  if (!isOpen || colors.length === 0) return null

  const startDrag = (elementId: string, event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const el = textElements.find(e => e.id === elementId)
    if (!el) return
    setDraggingId(elementId)
    setActiveElementId(elementId)
    dragState.current = {
      elementId,
      offsetX: event.clientX - rect.left - (rect.width * el.position.x / 100),
      offsetY: event.clientY - rect.top - (rect.height * el.position.y / 100),
    }
  }

  const onDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState.current || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const px = event.clientX - rect.left - dragState.current.offsetX
    const py = event.clientY - rect.top - dragState.current.offsetY
    const nextX = Math.max(0, Math.min(100, (px / rect.width) * 100))
    const nextY = Math.max(0, Math.min(100, (py / rect.height) * 100))
    updateElement(dragState.current.elementId, { position: { x: nextX, y: nextY } })
  }

  const endDrag = () => {
    dragState.current = null
    setDraggingId(null)
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-5xl rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('cardMaker')}</h3>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center">
            <span className="material-icons text-gray-600 dark:text-gray-300">close</span>
          </button>
        </div>

        {/* Selected colors chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('selectedColors')}:</span>
          {colors.map((c, i) => (
            <div key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: colorToHex(c) }} />
              <span className="text-xs text-gray-600 dark:text-gray-300">{colorToHex(c)}</span>
            </div>
          ))}
        </div>

        {/* Background mode selector */}
        {colors.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('bgLayout')}:</span>
            {BG_MODE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setBgMode(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${bgMode === opt.value ? 'text-white bg-violet-600' : 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >
                {t(opt.labelKey)}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
          {/* Left panel: text elements editor */}
          <div className="space-y-3 min-w-0">
            {/* Text element tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              {textElements.map((el, i) => (
                <button
                  key={el.id}
                  type="button"
                  onClick={() => setActiveElementId(el.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activeElement?.id === el.id ? 'text-white bg-violet-600' : 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                >
                  {t('textElement')} {i + 1}
                  {textElements.length > 1 && (
                    <span
                      className="material-icons ml-1 hover:text-red-400"
                      style={{ fontSize: 14 }}
                      onClick={(e) => { e.stopPropagation(); removeTextElement(el.id) }}
                    >close</span>
                  )}
                </button>
              ))}
              <button
                type="button"
                onClick={addTextElement}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors"
              >
                <span className="material-icons" style={{ fontSize: 14 }}>add</span>
                {t('addText')}
              </button>
            </div>

            {/* Active element editor */}
            {activeElement && (
              <div className="space-y-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('cardText')}
                  <textarea
                    value={activeElement.text}
                    onChange={e => updateElement(activeElement.id, { text: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 min-h-20 text-sm"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('font')}
                    <select
                      value={activeElement.fontFamily}
                      onChange={e => updateElement(activeElement.id, { fontFamily: e.target.value })}
                      className="mt-1 h-10 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 text-sm"
                    >
                      {FONT_OPTIONS.map(option => (
                        <option key={option} value={option} style={{ fontFamily: option }}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('fontColor')}
                    <input
                      type="color"
                      value={activeElement.textColor}
                      onChange={e => updateElement(activeElement.id, { textColor: e.target.value })}
                      className="mt-1 h-10 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-1"
                    />
                  </label>
                </div>
                {/* Font preview */}
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2">
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 block mb-1">{t('fontPreview')}</span>
                  <span style={{ fontFamily: activeElement.fontFamily, fontSize: '20px' }} className="text-gray-800 dark:text-gray-200">
                    가나다라 ABC 0123
                  </span>
                </div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                  {t('fontSize')}: {activeElement.fontSize}px
                  <input
                    type="range" min={14} max={72}
                    value={activeElement.fontSize}
                    onChange={e => updateElement(activeElement.id, { fontSize: Number(e.target.value) })}
                    className="mt-2 w-full accent-violet-600"
                  />
                </label>
              </div>
            )}

            {/* Options */}
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showColorCode}
                onChange={e => setShowColorCode(e.target.checked)}
                className="w-4 h-4 rounded accent-violet-600"
              />
              {t('showColorCodeOnCard')}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('dragHint')}</p>

            {/* Export buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={downloadJpg}
                className="flex-1 h-10 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-colors"
              >
                <span className="material-icons" style={{ fontSize: 18 }}>download</span>
                {exportFeedback === 'jpg' ? t('downloaded') : t('downloadJpg')}
              </button>
              <button
                type="button"
                onClick={copyToClipboard}
                className="flex-1 h-10 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-900/40 hover:bg-violet-200 dark:hover:bg-violet-900/60 transition-colors"
              >
                <span className="material-icons" style={{ fontSize: 18 }}>content_copy</span>
                {exportFeedback === 'clipboard' ? t('copiedToClipboard') : t('copyCardToClipboard')}
              </button>
            </div>
          </div>

          {/* Right panel: card preview */}
          <div className="flex items-start justify-center">
            <div
              ref={cardRef}
              className="relative w-72 sm:w-80 aspect-[3/4] rounded-2xl shadow-lg overflow-hidden"
              style={bgStyle}
              onPointerMove={onDrag}
              onPointerUp={endDrag}
              onPointerLeave={endDrag}
            >
              {textElements.map(el => (
                <div
                  key={el.id}
                  className={`absolute select-none px-2 text-center ${draggingId === el.id ? 'cursor-grabbing' : 'cursor-grab'} ${activeElement?.id === el.id ? 'ring-2 ring-white/50 rounded' : ''}`}
                  onPointerDown={(e) => startDrag(el.id, e)}
                  style={{
                    left: `${el.position.x}%`,
                    top: `${el.position.y}%`,
                    transform: 'translate(-50%, -50%)',
                    color: el.textColor,
                    fontFamily: el.fontFamily,
                    fontSize: `${el.fontSize}px`,
                    lineHeight: 1.25,
                    maxWidth: '90%',
                    whiteSpace: 'pre',
                    touchAction: 'none',
                  }}
                >
                  {el.text}
                </div>
              ))}
              {showColorCode && (
                <div
                  className="absolute bottom-3 left-0 right-0 text-center text-[10px] pointer-events-none px-2"
                  style={{ color: codeColor }}
                >
                  {colorCodeText}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
