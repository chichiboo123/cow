import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ImageUploader } from './components/ImageUploader'
import { ColorPalette } from './components/ColorPalette'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { useColorExtraction, type ExtractedColor } from './hooks/useColorExtraction'

function App() {
  const { t } = useTranslation()
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('cow-dark')
    if (saved !== null) return saved === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const [numColors, setNumColors] = useState(8)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [focusedPreviewUrl, setFocusedPreviewUrl] = useState<string | null>(null)
  const [selectedColorHex, setSelectedColorHex] = useState<string | null>(null)
  const [currentImg, setCurrentImg] = useState<HTMLImageElement | null>(null)
  const [errorKey, setErrorKey] = useState<string | null>(null)

  const { colors, isLoading, error, extractColors, reset, rgbToHex } = useColorExtraction()

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('cow-dark', String(darkMode))
  }, [darkMode])

  const handleImage = useCallback((img: HTMLImageElement) => {
    setCurrentImg(img)
    setErrorKey(null)
    setFocusedPreviewUrl(null)
    setSelectedColorHex(null)
    extractColors(img, numColors)
  }, [extractColors, numColors])

  const handleError = useCallback((key: string) => {
    setErrorKey(key)
    reset()
  }, [reset])

  const handleNumColorsChange = (value: number) => {
    const clamped = Math.max(1, Math.min(20, value))
    setNumColors(clamped)
    setSelectedColorHex(null)
    setFocusedPreviewUrl(null)
    if (currentImg) {
      extractColors(currentImg, clamped)
    }
  }

  const handleReset = useCallback(() => {
    setPreviewUrl(null)
    setCurrentImg(null)
    setErrorKey(null)
    setFocusedPreviewUrl(null)
    setSelectedColorHex(null)
    setNumColors(8)
    reset()
  }, [reset])

  const handleReload = useCallback(() => {
    window.location.reload()
  }, [])

  const visibleError = errorKey ?? error
  const displayPreviewUrl = focusedPreviewUrl ?? previewUrl

  const handleColorSelect = useCallback((color: ExtractedColor) => {
    if (!currentImg) return

    const hex = rgbToHex(color.r, color.g, color.b)
    if (selectedColorHex === hex) {
      setSelectedColorHex(null)
      setFocusedPreviewUrl(null)
      return
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    canvas.width = currentImg.naturalWidth
    canvas.height = currentImg.naturalHeight
    ctx.drawImage(currentImg, 0, 0, canvas.width, canvas.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    const threshold = 70
    for (let i = 0; i < data.length; i += 4) {
      const dr = data[i] - color.r
      const dg = data[i + 1] - color.g
      const db = data[i + 2] - color.b
      const distance = Math.sqrt(dr * dr + dg * dg + db * db)
      if (distance > threshold) {
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
        data[i] = gray
        data[i + 1] = gray
        data[i + 2] = gray
      }
    }

    ctx.putImageData(imageData, 0, 0)
    setSelectedColorHex(hex)
    setFocusedPreviewUrl(canvas.toDataURL('image/png'))
  }, [currentImg, rgbToHex, selectedColorHex])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <button
            type="button"
            onClick={handleReload}
            className="flex items-center gap-2 cursor-pointer"
            title={t('refreshPage')}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-sm">
              <span className="material-icons text-white" style={{ fontSize: 18 }}>palette</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100">
                {t('appPrimaryName')}
              </span>
              <span className="font-semibold text-xs sm:text-sm bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
                {t('appSecondaryName')}
              </span>
            </div>
          </button>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={handleReset}
              title={t('reset')}
              className="px-3 h-9 rounded-lg flex items-center justify-center gap-1 text-xs sm:text-sm font-semibold text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-900/40 hover:bg-violet-200 dark:hover:bg-violet-900/60 transition-colors"
            >
              <span className="material-icons" style={{ fontSize: 18 }}>restart_alt</span>
              <span>{t('reset')}</span>
            </button>
            <button
              type="button"
              onClick={() => setDarkMode(d => !d)}
              title={darkMode ? t('lightMode') : t('darkMode')}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="material-icons" style={{ fontSize: 20 }}>
                {darkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero title */}
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-6 text-center">
        <div className="inline-flex flex-col items-center gap-1">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent leading-tight">
            {t('appPrimaryName')}
          </h1>
          <p className="text-base sm:text-xl font-medium text-gray-600 dark:text-gray-400 mt-1">
            {t('appHeroSubtitle')}
          </p>
        </div>
      </div>

      {/* Main content */}
      <main className="w-full max-w-5xl mx-auto px-4 pb-16 space-y-6 flex-1">
        {/* Image uploader */}
        <ImageUploader
          onImage={handleImage}
          onError={handleError}
          previewUrl={displayPreviewUrl}
          setPreviewUrl={setPreviewUrl}
        />

        {/* Error message */}
        {visibleError && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
            <span className="material-icons" style={{ fontSize: 18 }}>error_outline</span>
            <span>{t(visibleError)}</span>
          </div>
        )}

        {/* Color count control */}
        {(previewUrl || colors.length > 0) && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-icons text-violet-500" style={{ fontSize: 20 }}>color_lens</span>
                <label className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
                  {t('numColors')}
                </label>
              </div>
              <input
                type="number"
                min={1}
                max={20}
                value={numColors}
                onChange={e => handleNumColorsChange(Number(e.target.value))}
                className="w-16 text-center rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold text-base py-1 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <input
              type="range"
              min={1}
              max={20}
              value={numColors}
              onChange={e => handleNumColorsChange(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-violet-600 bg-gray-200 dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-600">
              <span>1</span>
              <span>10</span>
              <span>20</span>
            </div>
          </div>
        )}

        {/* Color palette */}
        <ColorPalette
          colors={colors}
          isLoading={isLoading}
          rgbToHex={rgbToHex}
          selectedColorHex={selectedColorHex}
          onColorSelect={handleColorSelect}
        />
      </main>

      <footer className="mt-auto border-t border-gray-200 dark:border-gray-800 py-6 bg-white/70 dark:bg-gray-900/70">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <a
            href="https://litt.ly/chichiboo"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
          >
            Created by. 교육뮤지컬 꿈꾸는 치수쌤
          </a>
        </div>
      </footer>

    </div>
  )
}

export default App
