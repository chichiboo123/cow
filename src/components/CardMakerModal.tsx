import { useMemo, useRef, useState, useCallback, type PointerEvent as ReactPointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { ExtractedColor } from '../hooks/useColorExtraction'

interface CardMakerModalProps {
  color: ExtractedColor | null
  isOpen: boolean
  onClose: () => void
}

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

function getReadableColor(r: number, g: number, b: number): string {
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.55)'
}

export function CardMakerModal({ color, isOpen, onClose }: CardMakerModalProps) {
  const { t } = useTranslation()
  const [text, setText] = useState('세상의 모든 색깔')
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0])
  const [fontSize, setFontSize] = useState(34)
  const [textColor, setTextColor] = useState('#FFFFFF')
  const [position, setPosition] = useState({ x: 50, y: 50 })
  const [isDragging, setIsDragging] = useState(false)
  const [showColorCode, setShowColorCode] = useState(false)
  const [exportFeedback, setExportFeedback] = useState<'jpg' | 'clipboard' | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ offsetX: number, offsetY: number } | null>(null)

  const hex = useMemo(() => {
    if (!color) return '#7C3AED'
    return `#${[color.r, color.g, color.b].map(v => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase()
  }, [color])

  const rgb = useMemo(() => {
    if (!color) return 'rgb(124, 58, 237)'
    return `rgb(${color.r}, ${color.g}, ${color.b})`
  }, [color])

  const codeColor = useMemo(() => {
    if (!color) return 'rgba(255,255,255,0.55)'
    return getReadableColor(color.r, color.g, color.b)
  }, [color])

  const renderToCanvas = useCallback((): HTMLCanvasElement => {
    const canvas = document.createElement('canvas')
    const width = 600
    const height = 800
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!

    // Background
    ctx.fillStyle = hex
    ctx.fillRect(0, 0, width, height)

    // User text
    ctx.fillStyle = textColor
    ctx.font = `${fontSize * 2}px "${fontFamily}"`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const textX = (position.x / 100) * width
    const textY = (position.y / 100) * height
    const lines = text.split('\n')
    const lineHeight = fontSize * 2 * 1.25
    const startY = textY - ((lines.length - 1) / 2) * lineHeight
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], textX, startY + i * lineHeight)
    }

    // Color code at bottom
    if (showColorCode) {
      ctx.fillStyle = codeColor
      ctx.font = `24px "Noto Sans KR", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.fillText(`${hex}  |  ${rgb}`, width / 2, height - 24)
    }

    return canvas
  }, [hex, rgb, textColor, fontFamily, fontSize, position, text, showColorCode, codeColor])

  const downloadJpg = useCallback(() => {
    const canvas = renderToCanvas()
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `color-card-${hex.slice(1)}.jpg`
      a.click()
      URL.revokeObjectURL(url)
      setExportFeedback('jpg')
      setTimeout(() => setExportFeedback(null), 2000)
    }, 'image/jpeg', 0.95)
  }, [renderToCanvas, hex])

  const copyToClipboard = useCallback(async () => {
    const canvas = renderToCanvas()
    canvas.toBlob(async (blob) => {
      if (!blob) return
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ])
      } catch {
        // fallback: do nothing
      }
      setExportFeedback('clipboard')
      setTimeout(() => setExportFeedback(null), 2000)
    }, 'image/png')
  }, [renderToCanvas])

  if (!isOpen || !color) return null

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsDragging(true)
    dragState.current = {
      offsetX: event.clientX - rect.left - (rect.width * position.x / 100),
      offsetY: event.clientY - rect.top - (rect.height * position.y / 100),
    }
  }

  const onDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState.current || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const px = event.clientX - rect.left - dragState.current.offsetX
    const py = event.clientY - rect.top - dragState.current.offsetY
    const nextX = Math.max(0, Math.min(100, (px / rect.width) * 100))
    const nextY = Math.max(0, Math.min(100, (py / rect.height) * 100))
    setPosition({ x: nextX, y: nextY })
  }

  const endDrag = () => {
    dragState.current = null
    setIsDragging(false)
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-4xl rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('cardMaker')}</h3>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <span className="material-icons text-gray-600 dark:text-gray-300">close</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('cardText')}
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 min-h-24"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('font')}
                <select
                  value={fontFamily}
                  onChange={e => setFontFamily(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2"
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
                <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-1" />
              </label>
            </div>
            {/* Font preview */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2">
              <span className="text-[11px] text-gray-400 dark:text-gray-500 block mb-1">{t('fontPreview')}</span>
              <span style={{ fontFamily, fontSize: '20px' }} className="text-gray-800 dark:text-gray-200">
                가나다라 ABC 0123
              </span>
            </div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
              {t('fontSize')}: {fontSize}px
              <input type="range" min={14} max={72} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="mt-2 w-full accent-violet-600" />
            </label>
            {/* Show color code toggle */}
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

          <div className="flex items-center justify-center">
            <div
              ref={cardRef}
              className="relative w-full max-w-md aspect-[3/4] rounded-2xl shadow-lg overflow-hidden"
              style={{ backgroundColor: hex }}
              onPointerMove={onDrag}
              onPointerUp={endDrag}
              onPointerLeave={endDrag}
            >
              <div
                className={`absolute select-none px-2 text-center ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                onPointerDown={startDrag}
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  transform: 'translate(-50%, -50%)',
                  color: textColor,
                  fontFamily,
                  fontSize: `${fontSize}px`,
                  lineHeight: 1.25,
                  maxWidth: '90%',
                  whiteSpace: 'pre',
                  touchAction: 'none',
                }}
              >
                {text}
              </div>
              {showColorCode && (
                <div
                  className="absolute bottom-3 left-0 right-0 text-center text-xs pointer-events-none"
                  style={{ color: codeColor }}
                >
                  {hex}  |  {rgb}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
