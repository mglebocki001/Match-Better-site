import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  pl: {
    translation: {
      nav: {
        home: "Strona główna",
        blog: "Blog",
        admin: "Admin",
        profile: "Profil",
        logout: "Wyloguj",
        howItWorks: "Jak to działa",
        benefits: "Korzyści",
        pricing: "Cennik",
        faq: "FAQ",
        login: "Zaloguj się",
        register: "Utwórz konto"
      },
      profile: {
        title: "Panel Użytkownika",
        tabProfile: "Dane profilu",
        tabHistory: "Historia transakcji",
        tabReports: "Poprzednie raporty",
        email: "Adres E-mail",
        memberSince: "Dołączono",
        amount: "Kwota",
        status: "Status",
        date: "Data",
        actions: "Akcje",
        download: "Pobierz PDF",
        view: "Zobacz",
        completed: "Zakończona",
        pending: "Oczekująca"
      },
      footer: {
        description: "Inteligentna analiza Twojego profilu w aplikacjach randkowych. Przestań zgadywać, zacznij randkować lepiej.",
        copyright: "© 2026 MatchBetter. Wszelkie prawa zastrzeżone.",
        tools: "Narzędzia i zasoby",
        legal: "Prawne",
        home: "Strona Główna",
        terms: "Regulamin",
        privacy: "Polityka prywatności"
      }
    }
  },
  en: {
    translation: {
      nav: {
        home: "Home",
        blog: "Blog",
        admin: "Admin",
        profile: "Profile",
        logout: "Logout",
        howItWorks: "How It Works",
        benefits: "Benefits",
        pricing: "Pricing",
        faq: "FAQ",
        login: "Login",
        register: "Sign Up"
      },
      profile: {
        title: "User Dashboard",
        tabProfile: "Profile Info",
        tabHistory: "Transaction History",
        tabReports: "Previous Reports",
        email: "Email Address",
        memberSince: "Member Since",
        amount: "Amount",
        status: "Status",
        date: "Date",
        actions: "Actions",
        download: "Download PDF",
        view: "View",
        completed: "Completed",
        pending: "Pending"
      },
      footer: {
        description: "Intelligent analysis of your dating app profile. Stop guessing, start dating better.",
        copyright: "© 2026 MatchBetter. All rights reserved.",
        tools: "Tools & Resources",
        legal: "Legal",
        home: "Home",
        terms: "Terms of Service",
        privacy: "Privacy Policy"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pl',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;