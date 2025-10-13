import { createContext, useContext, useState } from "react";

export type Language = "en" | "hi" | "mr" | "te" | "kn" | "ml";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const languages = {
  en: "English",
  hi: "हिंदी",
  mr: "मराठी",
  te: "తెలుగు",
  kn: "ಕನ್ನಡ",
  ml: "മലയാളം"
};

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<Language>("en");

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};
