import React, { createContext, useContext, useEffect, useState } from 'react';
import { Locale, translations } from '../i18n/translations';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  isRtl: boolean;
  t: (key: keyof typeof translations['en']) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem('rh_locale') as Locale;
    return saved || 'en';
  });

  const isRtl = locale === 'ar';

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('lang', locale);
    root.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    localStorage.setItem('rh_locale', locale);
  }, [locale, isRtl]);

  const toggleLocale = () => {
    setLocaleState((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
  };

  const t = (key: keyof typeof translations['en']): string => {
    return (translations[locale] as any)[key] || translations['en'][key] || String(key);
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, toggleLocale, isRtl, t }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used within LocaleProvider');
  return context;
};
