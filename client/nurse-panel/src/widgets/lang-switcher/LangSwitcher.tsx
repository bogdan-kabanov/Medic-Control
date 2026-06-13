import { useTranslation } from "react-i18next";
import styles from "./LangSwitcher.module.scss";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
  { code: "he", label: "עב" },
] as const;

export function LangSwitcher() {
  const { i18n } = useTranslation();

  const handleChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  };

  return (
    <div className={styles.switcher}>
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          className={`${styles.btn} ${i18n.language === lang.code ? styles.active : ""}`}
          onClick={() => handleChange(lang.code)}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
