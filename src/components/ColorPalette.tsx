import { useTranslation } from 'react-i18next'
import { ColorCard } from './ColorCard'
import type { RGBColor } from '../hooks/useColorExtraction'

interface ColorPaletteProps {
  colors: RGBColor[]
  isLoading: boolean
  rgbToHex: (r: number, g: number, b: number) => string
}

export function ColorPalette({ colors, isLoading, rgbToHex }: ColorPaletteProps) {
  const { t } = useTranslation()

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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 w-full">
      {colors.map((color, i) => (
        <ColorCard key={i} color={color} rgbToHex={rgbToHex} />
      ))}
    </div>
  )
}
