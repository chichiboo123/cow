import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ColorCard } from './ColorCard'
import { CardMakerModal } from './CardMakerModal'
import type { ExtractedColor } from '../hooks/useColorExtraction'

interface ColorPaletteProps {
  colors: ExtractedColor[]
  isLoading: boolean
  rgbToHex: (r: number, g: number, b: number) => string
  onColorSelect?: (color: ExtractedColor) => void
}

export function ColorPalette({ colors, isLoading, rgbToHex, onColorSelect }: ColorPaletteProps) {
  const { t } = useTranslation()
  const [sortMode, setSortMode] = useState<'percentage' | 'similar'>('percentage')
  const [showExtended, setShowExtended] = useState(false)
  const [isCardMode, setIsCardMode] = useState(false)
  const [modalColor, setModalColor] = useState<ExtractedColor | null>(null)

  const sortedColors = useMemo(() => {
    const cloned = [...colors]

    if (sortMode === 'similar') {
      return cloned.sort((a, b) => {
        const byGroup = a.group.localeCompare(b.group)
        if (byGroup !== 0) return byGroup
        return b.percentage - a.percentage
      })
    }

    return cloned.sort((a, b) => b.percentage - a.percentage)
  }, [colors, sortMode])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-500 dark:text-gray-400 font-medium">{t('processing')}</span>
      </div>
    )
  }

  if (colors.length === 0) return null

  const handleColorPick = (color: ExtractedColor) => {
    if (isCardMode) {
      setModalColor(color)
      return
    }
    onColorSelect?.(color)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t('sortBy')}
          </label>
          <select
            value={sortMode}
            onChange={e => setSortMode(e.target.value as 'percentage' | 'similar')}
            className="h-9 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 px-2"
          >
            <option value="percentage">{t('sortByPercentage')}</option>
            <option value="similar">{t('sortBySimilar')}</option>
          </select>
        </div>
        <div className="flex items-center justify-end gap-2 sm:ml-auto">
          <button
            type="button"
            onClick={() => setShowExtended(v => !v)}
            className="h-9 px-3 rounded-lg text-sm font-semibold text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-900/40 hover:bg-violet-200 dark:hover:bg-violet-900/60 transition-colors"
          >
            {showExtended ? t('hideExtended') : t('showExtended')}
          </button>
          <button
            type="button"
            onClick={() => setIsCardMode(v => !v)}
            className={`h-9 px-3 rounded-lg text-sm font-semibold transition-colors ${isCardMode ? 'text-white bg-violet-600 hover:bg-violet-700' : 'text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-900/40 hover:bg-violet-200 dark:hover:bg-violet-900/60'}`}
          >
            {isCardMode ? t('cardModeOn') : t('cardMaker')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 w-full">
        {sortedColors.map((color, i) => (
          <ColorCard
            key={`${color.group}-${i}`}
            color={color}
            rgbToHex={rgbToHex}
            showExtended={showExtended}
            onSelect={handleColorPick}
          />
        ))}
      </div>
      <CardMakerModal color={modalColor} isOpen={modalColor !== null} onClose={() => setModalColor(null)} />
    </div>
  )
}
