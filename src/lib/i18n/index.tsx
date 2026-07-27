/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { translations } from './translations'
import type { Language, TranslationKey } from './translations'

export type { Language }

type I18nProviderProps = {
  children: React.ReactNode
  defaultLanguage?: Language
  storageKey?: string
}

type I18nProviderState = {
  language: Language
  setLanguage: (language: Language) => void
  t: TranslationKey
}

const initialState: I18nProviderState = {
  language: 'vi',
  setLanguage: () => null,
  t: translations.vi as TranslationKey,
}

const I18nProviderContext = createContext<I18nProviderState>(initialState)

export function I18nProvider({
  children,
  defaultLanguage = 'vi',
  storageKey = 'vibe-tube-atlas-language',
  ...props
}: I18nProviderProps) {
  const [language, setLanguageState] = useState<Language>(
    () => (localStorage.getItem(storageKey) as Language) || defaultLanguage
  )

  useEffect(() => {
    localStorage.setItem(storageKey, language)
  }, [language, storageKey])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
  }, [])

  const value: I18nProviderState = useMemo(() => ({
    language,
    setLanguage,
    // eslint-disable-next-line security/detect-object-injection
    t: translations[language] as TranslationKey,
  }), [language, setLanguage])

  return (
    <I18nProviderContext.Provider {...props} value={value}>
      {children}
    </I18nProviderContext.Provider>
  )
}

export const useI18n = () => {
  const context = useContext(I18nProviderContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

export const useLanguage = () => {
  const { language, setLanguage } = useI18n()
  return { language, setLanguage, languages: Object.keys(translations) as Language[] }
}
