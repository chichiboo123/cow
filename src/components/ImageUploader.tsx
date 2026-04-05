import { useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useClipboardPaste } from '../hooks/useClipboardPaste'

interface ImageUploaderProps {
  onImage: (img: HTMLImageElement) => void
  onError: (key: string) => void
  previewUrl: string | null
  setPreviewUrl: (url: string | null) => void
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

export function ImageUploader({ onImage, onError, previewUrl, setPreviewUrl }: ImageUploaderProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const loadFile = useCallback((file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      onError('invalidFile')
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => onImage(img)
    img.onerror = () => onError('invalidFile')
    img.src = url
  }, [onImage, onError, setPreviewUrl])

  useClipboardPaste(loadFile)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) loadFile(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) loadFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  return (
    <div className="w-full">
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative w-full rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200
          flex flex-col items-center justify-center gap-3 overflow-hidden
          ${isDragging
            ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 scale-[1.01]'
            : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 hover:border-violet-400 dark:hover:border-violet-600 hover:bg-violet-50/50 dark:hover:bg-violet-950/20'
          }
          ${previewUrl ? 'min-h-[200px] sm:min-h-[280px]' : 'min-h-[180px] sm:min-h-[240px] py-10'}
        `}
      >
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full max-h-[320px] object-contain rounded-xl"
            />
            <div className={`
              absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl
              bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200
            `}>
              <span className="material-icons text-white" style={{ fontSize: 40 }}>upload</span>
              <span className="text-white font-medium text-sm">{t('uploadPrompt')}</span>
            </div>
          </>
        ) : (
          <>
            {isDragging ? (
              <>
                <span className="material-icons text-violet-500" style={{ fontSize: 48 }}>
                  file_download
                </span>
                <span className="text-violet-600 dark:text-violet-400 font-semibold text-lg">
                  {t('dropHere')}
                </span>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <span className="material-icons text-white" style={{ fontSize: 32 }}>add_photo_alternate</span>
                </div>
                <div className="text-center px-4">
                  <p className="font-semibold text-gray-700 dark:text-gray-300 text-base sm:text-lg">
                    {t('uploadPrompt')}
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    {t('uploadHint')}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
                    {t('supportedFormats')}
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
