import { useState, useCallback } from 'react'
import { getPaletteSync, getColorSync } from 'colorthief'

export interface RGBColor {
  r: number
  g: number
  b: number
}

export interface ExtractedColor extends RGBColor {
  percentage: number
  group: string
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0').toUpperCase()).join('')
}

export function rgbToCmyk(r: number, g: number, b: number) {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const k = 1 - Math.max(rn, gn, bn)

  if (k >= 1) return { c: 0, m: 0, y: 0, k: 100 }

  const c = ((1 - rn - k) / (1 - k)) * 100
  const m = ((1 - gn - k) / (1 - k)) * 100
  const y = ((1 - bn - k) / (1 - k)) * 100

  return {
    c: Math.round(c),
    m: Math.round(m),
    y: Math.round(y),
    k: Math.round(k * 100),
  }
}


function getColorGroup(r: number, g: number, b: number): string {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  const lightness = (max + min) / 2

  if (delta < 12) {
    if (lightness < 45) return 'neutral-dark'
    if (lightness > 210) return 'neutral-light'
    return 'neutral'
  }

  let hue = 0
  if (max === r) hue = ((g - b) / delta) % 6
  else if (max === g) hue = (b - r) / delta + 2
  else hue = (r - g) / delta + 4
  hue = Math.round(hue * 60)
  if (hue < 0) hue += 360

  if (hue < 30 || hue >= 330) return 'red'
  if (hue < 60) return 'orange'
  if (hue < 90) return 'yellow'
  if (hue < 150) return 'green'
  if (hue < 210) return 'cyan'
  if (hue < 270) return 'blue'
  if (hue < 330) return 'purple'
  return 'red'
}

export function useColorExtraction() {
  const [colors, setColors] = useState<ExtractedColor[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const extractColors = useCallback((img: HTMLImageElement, count: number) => {
    setIsLoading(true)
    setError(null)

    const doExtract = () => {
      try {
        let palette: RGBColor[]
        if (count === 1) {
          const color = getColorSync(img)
          if (!color) throw new Error('No color extracted')
          const { r, g, b } = color.rgb()
          palette = [{ r, g, b }]
        } else {
          const sampled = getPaletteSync(img, { colorCount: count })
          if (!sampled || sampled.length === 0) throw new Error('No palette extracted')
          palette = sampled.map(c => {
            const { r, g, b } = c.rgb()
            return { r, g, b }
          })
        }

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) throw new Error('Canvas context unavailable')

        const maxSize = 180
        const ratio = Math.min(maxSize / img.naturalWidth, maxSize / img.naturalHeight, 1)
        canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio))
        canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio))
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data

        const hits = new Array(palette.length).fill(0)
        let validPixels = 0

        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3]
          if (alpha < 16) continue
          const pr = data[i]
          const pg = data[i + 1]
          const pb = data[i + 2]
          validPixels += 1

          let nearestIndex = 0
          let nearestDistance = Number.POSITIVE_INFINITY
          for (let j = 0; j < palette.length; j += 1) {
            const dr = pr - palette[j].r
            const dg = pg - palette[j].g
            const db = pb - palette[j].b
            const distance = dr * dr + dg * dg + db * db
            if (distance < nearestDistance) {
              nearestDistance = distance
              nearestIndex = j
            }
          }
          hits[nearestIndex] += 1
        }

        const totalPixels = Math.max(1, validPixels)
        const withStats: ExtractedColor[] = palette.map((color, idx) => ({
          ...color,
          percentage: Number(((hits[idx] / totalPixels) * 100).toFixed(2)),
          group: getColorGroup(color.r, color.g, color.b),
        }))

        setColors(withStats)
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
