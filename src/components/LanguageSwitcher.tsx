import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const handleChange = (code: string) => {
    i18n.changeLanguage(code)
    localStorage.setItem('cow-lang', code)
  }

  return (
    <div className="flex items-center gap-1">
      {LANGUAGES.map(lang => (
        <button
          key={lang.code}
          onClick={() => handleChange(lang.code)}
          title={lang.label}
          className={`
            flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium transition-all duration-200
            ${i18n.language === lang.code
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
          `}
        >
          <span className="text-base leading-none">{lang.flag}</span>
          <span className="hidden sm:inline">{lang.label}</span>
        </button>
      ))}
    </div>
  )
}
