import { useState, useCallback } from 'react'
import { getPaletteSync, getColorSync } from 'colorthief'

export interface RGBColor {
  r: number
  g: number
  b: number
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0').toUpperCase()).join('')
}

export function useColorExtraction() {
  const [colors, setColors] = useState<RGBColor[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const extractColors = useCallback((img: HTMLImageElement, count: number) => {
    setIsLoading(true)
    setError(null)

    const doExtract = () => {
      try {
        let result: RGBColor[]
        if (count === 1) {
          const color = getColorSync(img)
          if (!color) throw new Error('No color extracted')
          const { r, g, b } = color.rgb()
          result = [{ r, g, b }]
        } else {
          const palette = getPaletteSync(img, { colorCount: count })
          if (!palette || palette.length === 0) throw new Error('No palette extracted')
          result = palette.map(c => {
            const { r, g, b } = c.rgb()
            return { r, g, b }
          })
        }
        setColors(result)
      } catch {
        setError('invalidFile')
        setColors([])
      } finally {
        setIsLoading(false)
      }
    }

    if (img.complete) {
      doExtract()
    } else {
      img.onload = doExtract
      img.onerror = () => {
        setError('invalidFile')
        setColors([])
        setIsLoading(false)
      }
    }
  }, [])

  const reset = useCallback(() => {
    setColors([])
    setError(null)
    setIsLoading(false)
  }, [])

  return { colors, isLoading, error, extractColors, reset, rgbToHex }
}
