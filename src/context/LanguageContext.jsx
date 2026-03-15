import { createContext, useContext, useEffect, useMemo, useState } from "react";

const LanguageContext = createContext(null);

const ALLOWED_LANGUAGES = ["en", "ar"];

function getCookieLanguage() {
  const cookieLang = document.cookie
    .split("; ")
    .find((row) => row.startsWith("lang="));

  if (!cookieLang) {
    return "en";
  }

  const cookieValue = cookieLang.split("=")[1];
  return ALLOWED_LANGUAGES.includes(cookieValue) ? cookieValue : "en";
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    const initialLanguage = getCookieLanguage();
    setLanguage(initialLanguage);
    document.documentElement.lang = initialLanguage;
    document.documentElement.dir = initialLanguage === "ar" ? "rtl" : "ltr";
  }, []);

  const changeLanguage = (lang) => {
    const safeLang = ALLOWED_LANGUAGES.includes(lang) ? lang : "en";
    setLanguage(safeLang);
    document.cookie = `lang=${safeLang}; path=/; max-age=31536000`;
    document.documentElement.lang = safeLang;
    document.documentElement.dir = safeLang === "ar" ? "rtl" : "ltr";
  };

  const value = useMemo(() => ({ language, changeLanguage }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
}
