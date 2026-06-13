import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./locales/en";
import { ru } from "./locales/ru";
import { he } from "./locales/he";

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ru: { translation: ru }, he: { translation: he } },
  lng: localStorage.getItem("lang") || "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
