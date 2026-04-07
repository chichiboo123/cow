import { useState } from 'react'
import { rgbToCmyk, type ExtractedColor } from '../hooks/useColorExtraction'

interface ColorCardProps {
  color: ExtractedColor
  rgbToHex: (r: number, g: number, b: number) => string
  showExtended: boolean
  onSelect?: (color: ExtractedColor) => void
  selectionIndex?: number
}

export function ColorCard({ color, rgbToHex, showExtended, onSelect, selectionIndex }: ColorCardProps) {
  const [copiedType, setCopiedType] = useState<'hex' | 'rgb' | null>(null)

  const hex = rgbToHex(color.r, color.g, color.b)
  const rgb = `rgb(${color.r}, ${color.g}, ${color.b})`
  const cmyk = rgbToCmyk(color.r, color.g, color.b)

  const luminance = (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) / 255
  const textClass = luminance > 0.5 ? 'text-black/70' : 'text-white/90'
  const btnClass = luminance > 0.5
    ? 'bg-black/10 hover:bg-black/20 text-black/70'
    : 'bg-white/15 hover:bg-white/25 text-white/90'

  const isSelected = selectionIndex !== undefined && selectionIndex >= 0

  const copy = async (text: string, type: 'hex' | 'rgb') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedType(type)
      setTimeout(() => setCopiedType(null), 1800)
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopiedType(type)
      setTimeout(() => setCopiedType(null), 1800)
    }
  }

  return (
    <div
      className={`relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 aspect-square flex flex-col justify-end cursor-pointer border-2 ${isSelected ? 'border-violet-500 ring-2 ring-violet-500/40' : 'border-transparent'}`}
      style={{ backgroundColor: hex }}
      onClick={() => onSelect?.(color)}
    >
      {/* Selection badge */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center shadow-md z-10">
          {selectionIndex! + 1}
        </div>
      )}
      {/* Color info overlay */}
      <div className="p-3 flex flex-col gap-1">
        <span className={`font-bold text-lg leading-tight tracking-wide ${textClass}`}>
          {hex}
        </span>
        <span className={`text-xs leading-tight ${textClass} opacity-80`}>
          {rgb}
        </span>
        <span className={`text-xs leading-tight ${textClass} opacity-90`}>
          {color.percentage.toFixed(2)}%
        </span>
        {showExtended && (
          <span className={`text-[11px] leading-tight ${textClass} opacity-90`}>
            CMYK: {cmyk.c}% {cmyk.m}% {cmyk.y}% {cmyk.k}%
          </span>
        )}
        <div className="flex gap-1 mt-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); copy(hex, 'hex') }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-150 whitespace-nowrap ${btnClass}`}
          >
            <span className="material-icons" style={{ fontSize: 12 }}>
              {copiedType === 'hex' ? 'check' : 'content_copy'}
            </span>
            <span>{copiedType === 'hex' ? '✓' : 'HEX'}</span>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); copy(rgb, 'rgb') }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-150 whitespace-nowrap ${btnClass}`}
          >
            <span className="material-icons" style={{ fontSize: 12 }}>
              {copiedType === 'rgb' ? 'check' : 'content_copy'}
            </span>
            <span>{copiedType === 'rgb' ? '✓' : 'RGB'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
