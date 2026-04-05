import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ImageUploader } from './components/ImageUploader'
import { ColorPalette } from './components/ColorPalette'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { useColorExtraction } from './hooks/useColorExtraction'

function App() {
  const { t } = useTranslation()
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('cow-dark')
    if (saved !== null) return saved === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const [numColors, setNumColors] = useState(8)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
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
    extractColors(img, numColors)
  }, [extractColors, numColors])

  const handleError = useCallback((key: string) => {
    setErrorKey(key)
    reset()
  }, [reset])

  const handleNumColorsChange = (value: number) => {
    const clamped = Math.max(1, Math.min(20, value))
    setNumColors(clamped)
    if (currentImg) {
      extractColors(currentImg, clamped)
    }
  }

  useEffect(() => {
    if (error) setErrorKey(error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-sm">
              <span className="material-icons text-white" style={{ fontSize: 18 }}>palette</span>
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
              COW
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
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
            {t('appTitle')}
          </h1>
          <p className="text-base sm:text-xl font-medium text-gray-600 dark:text-gray-400 mt-1">
            {t('appSubtitle')}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-600 font-light">
            {t('appKoreanName')}
          </p>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 pb-16 space-y-6">
        {/* Image uploader */}
        <ImageUploader
          onImage={handleImage}
          onError={handleError}
          previewUrl={previewUrl}
          setPreviewUrl={setPreviewUrl}
        />

        {/* Error message */}
        {errorKey && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
            <span className="material-icons" style={{ fontSize: 18 }}>error_outline</span>
            <span>{t(errorKey)}</span>
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
        <ColorPalette colors={colors} isLoading={isLoading} rgbToHex={rgbToHex} />
      </main>

    </div>
  )
}

export default App
