import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
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
  'Nanum Gothic',
  'Gowun Dodum',
  'Do Hyeon',
]

export function CardMakerModal({ color, isOpen, onClose }: CardMakerModalProps) {
  const { t } = useTranslation()
  const [text, setText] = useState('세상의 모든 색깔')
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0])
  const [fontSize, setFontSize] = useState(34)
  const [textColor, setTextColor] = useState('#FFFFFF')
  const [position, setPosition] = useState({ x: 50, y: 50 })
  const cardRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ offsetX: number, offsetY: number } | null>(null)

  const hex = useMemo(() => {
    if (!color) return '#7C3AED'
    return `#${[color.r, color.g, color.b].map(v => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase()
  }, [color])

  if (!isOpen || !color) return null

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
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
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-4xl rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 sm:p-6 space-y-4"
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
                <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2">
                  {FONT_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('fontColor')}
                <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-1" />
              </label>
            </div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
              {t('fontSize')}: {fontSize}px
              <input type="range" min={14} max={72} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="mt-2 w-full accent-violet-600" />
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('dragHint')}</p>
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
                className="absolute cursor-grab active:cursor-grabbing select-none whitespace-pre-wrap break-words px-2 text-center"
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
                }}
              >
                {text}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
