import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
]

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()

  const handleChange = (code: string) => {
    i18n.changeLanguage(code)
    localStorage.setItem('cow-lang', code)
  }

  return (
    <div className="flex items-center">
      <label htmlFor="lang-select" className="sr-only">{t('language')}</label>
      <select
        id="lang-select"
        value={i18n.language}
        onChange={e => handleChange(e.target.value)}
        className="h-9 w-[96px] sm:w-auto sm:min-w-[110px] max-w-[40vw] rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 px-2 shrink-0"
      >
        {LANGUAGES.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.label}
          </option>
        ))}
      </select>
    </div>
  )
}
