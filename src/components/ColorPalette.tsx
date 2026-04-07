import { useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ColorCard } from './ColorCard'
import { CardMakerModal } from './CardMakerModal'
import type { ExtractedColor } from '../hooks/useColorExtraction'

interface ColorPaletteProps {
  colors: ExtractedColor[]
  isLoading: boolean
  rgbToHex: (r: number, g: number, b: number) => string
}

function isSameColor(a: ExtractedColor, b: ExtractedColor) {
  return a.r === b.r && a.g === b.g && a.b === b.b
}

export function ColorPalette({ colors, isLoading, rgbToHex }: ColorPaletteProps) {
  const { t } = useTranslation()
  const [sortMode, setSortMode] = useState<'percentage' | 'similar'>('percentage')
  const [showExtended, setShowExtended] = useState(false)
  const [isCardMode, setIsCardMode] = useState(false)
  const [selectedColors, setSelectedColors] = useState<ExtractedColor[]>([])
  const [modalOpen, setModalOpen] = useState(false)

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

  const handleColorPick = useCallback((color: ExtractedColor) => {
    if (!isCardMode) return
    setSelectedColors(prev => {
      const idx = prev.findIndex(c => isSameColor(c, color))
      if (idx >= 0) return prev.filter((_, i) => i !== idx)
      return [...prev, color]
    })
  }, [isCardMode])

  const toggleCardMode = useCallback(() => {
    setIsCardMode(v => {
      if (v) setSelectedColors([])
      return !v
    })
  }, [])

  const getSelectionIndex = useCallback((color: ExtractedColor) => {
    return selectedColors.findIndex(c => isSameColor(c, color))
  }, [selectedColors])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-500 dark:text-gray-400 font-medium">{t('processing')}</span>
      </div>
    )
  }

  if (colors.length === 0) return null

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
            onClick={toggleCardMode}
            className={`h-9 px-3 rounded-lg text-sm font-semibold transition-colors ${isCardMode ? 'text-white bg-violet-600 hover:bg-violet-700' : 'text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-900/40 hover:bg-violet-200 dark:hover:bg-violet-900/60'}`}
          >
            {isCardMode ? t('cardModeOn') : t('cardMaker')}
          </button>
        </div>
      </div>

      {/* Card mode hint + open button */}
      {isCardMode && (
        <div className="flex items-center justify-between gap-3 bg-violet-50 dark:bg-violet-950/40 rounded-xl border border-violet-200 dark:border-violet-800 p-3">
          <div className="flex items-center gap-2">
            <span className="material-icons text-violet-500" style={{ fontSize: 18 }}>touch_app</span>
            <span className="text-sm text-violet-700 dark:text-violet-300">
              {selectedColors.length === 0 ? t('cardSelectHint') : t('cardSelectedCount', { count: selectedColors.length })}
            </span>
          </div>
          {selectedColors.length > 0 && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="h-9 px-4 rounded-lg text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-colors flex items-center gap-1"
            >
              <span className="material-icons" style={{ fontSize: 16 }}>edit</span>
              {t('openCardMaker')}
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 w-full">
        {sortedColors.map((color, i) => (
          <ColorCard
            key={`${color.group}-${i}`}
            color={color}
            rgbToHex={rgbToHex}
            showExtended={showExtended}
            onSelect={handleColorPick}
            selectionIndex={isCardMode ? getSelectionIndex(color) : undefined}
          />
        ))}
      </div>

      <CardMakerModal
        colors={selectedColors}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}
