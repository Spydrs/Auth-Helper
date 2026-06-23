const checkbox = document.querySelector("#show-secret");
const input = document.querySelector("#demo-secret");
const inputWrap = input.closest(".input-wrap");

input.addEventListener("focus", () => inputWrap.classList.add("is-focused"));
input.addEventListener("blur", () => inputWrap.classList.remove("is-focused"));

checkbox.addEventListener("change", () => {
  input.type = checkbox.checked ? "text" : "password";
});

const translations = {
  es: {
    title: "Te damos la bienvenida",
    emberPrompt: "Introduce tu contraseña",
    revealEmber: "Mostrar contrasena",
    recoveryAction: "¿Has olvidado tu contraseña?",
    continue: "Siguiente",
    help: "Ayuda",
    privacy: "Privacidad",
    conditions: "Condiciones",
  },
  en: {
    title: "Welcome",
    emberPrompt: "Enter your password",
    revealEmber: "Show password",
    recoveryAction: "Forgot password?",
    continue: "Continue",
    help: "Help",
    privacy: "Privacy",
    conditions: "Terms",
  },
};

const languageToggle = document.querySelector("#language-toggle");
const languageMenu = document.querySelector("#language-menu");
const languages = [
  ["af", "Afrikaans"], ["az", "azərbaycan"], ["bs", "bosanski"], ["ca", "català"],
  ["cs", "Čeština"], ["cy", "Cymraeg"], ["da", "Dansk"], ["de", "Deutsch"],
  ["et", "eesti"], ["en-GB", "English (United Kingdom)"], ["en-US", "English (United States)"],
  ["es-ES", "Español (España)"], ["es-419", "Español (Latinoamérica)"], ["eu", "euskara"],
  ["fil", "Filipino"], ["fr-CA", "Français (Canada)"], ["fr-FR", "Français (France)"],
  ["ga", "Gaeilge"], ["gl", "galego"], ["hr", "Hrvatski"], ["id", "Indonesia"],
  ["zu", "isiZulu"], ["is", "íslenska"], ["it", "Italiano"], ["sw", "Kiswahili"],
  ["lv", "latviešu"], ["lt", "lietuvių"], ["hu", "magyar"], ["ms", "Melayu"],
  ["nl", "Nederlands"], ["no", "norsk"], ["uz", "o'zbek"], ["pl", "polski"],
  ["pt-BR", "Português (Brasil)"], ["pt-PT", "Português (Portugal)"], ["ro", "română"],
  ["sq", "shqip"], ["sk", "Slovenčina"], ["sl", "slovenščina"], ["sr-Latn", "srpski (latinica)"],
  ["fi", "Suomi"], ["sv", "Svenska"], ["vi", "Tiếng Việt"], ["tr", "Türkçe"],
  ["el", "Ελληνικά"], ["be", "беларуская"], ["bg", "български"], ["ky", "кыргызча"],
  ["kk", "қазақ тілі"], ["mk", "македонски"], ["mn", "монгол"], ["ru", "Русский"],
  ["sr-Cyrl", "српски (ћирилица)"], ["uk", "Українська"], ["ka", "ქართული"],
  ["hy", "հայերեն"], ["iw", "עברית"], ["ur", "اردو"], ["ar", "العربية"], ["fa", "فارسی"],
  ["am", "አማርኛ"], ["ne", "नेपाली"], ["mr", "मराठी"], ["hi", "हिन्दी"], ["as", "অসমীয়া"],
  ["bn", "বাংলা"], ["pa", "ਪੰਜਾਬੀ"], ["gu", "ગુજરાતી"], ["or", "ଓଡ଼ିଆ"], ["ta", "தமிழ்"],
  ["te", "తెలుగు"], ["kn", "ಕನ್ನಡ"], ["ml", "മലയാളം"], ["si", "සිංහල"], ["th", "ไทย"],
  ["lo", "ລາວ"], ["my", "မြန်မာ"], ["km", "ខ្មែរ"], ["ko", "한국어"],
  ["zh-HK", "中文（香港）"], ["ja", "日本語"], ["zh-CN", "简体中文"], ["zh-TW", "繁體中文"],
];
let selectedLocale = "es-419";

languageMenu.innerHTML = languages.map(([locale, label]) => `
  <button class="language-option" type="button" role="option" data-locale="${locale}" aria-selected="${locale === selectedLocale}">${label}</button>
`).join("");

const setMenuOpen = (isOpen) => {
  languageMenu.classList.toggle("is-open", isOpen);
  languageMenu.setAttribute("aria-hidden", String(!isOpen));
  languageToggle.setAttribute("aria-expanded", String(isOpen));
  if (isOpen) {
    const selectedOption = languageMenu.querySelector('[aria-selected="true"]');
    selectedOption.focus();
    selectedOption.scrollIntoView({ block: "center" });
  }
};

languageToggle.addEventListener("click", () => {
  setMenuOpen(languageToggle.getAttribute("aria-expanded") !== "true");
});

languageMenu.addEventListener("click", (event) => {
  const option = event.target.closest(".language-option");
  if (!option) return;

  selectedLocale = option.dataset.locale;
  const language = selectedLocale.startsWith("es") ? "es" : selectedLocale.startsWith("en") ? "en" : null;
  document.documentElement.lang = selectedLocale;
  document.documentElement.dir = ["ar", "fa", "iw", "ur"].includes(selectedLocale) ? "rtl" : "ltr";
  languageToggle.textContent = option.textContent;
  languageMenu.querySelectorAll(".language-option").forEach((item) => {
    item.setAttribute("aria-selected", String(item === option));
  });
  if (language) {
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = translations[language][element.dataset.i18n];
    });
  }
  setMenuOpen(false);
});

languageMenu.addEventListener("keydown", (event) => {
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const options = [...languageMenu.querySelectorAll(".language-option")];
  const currentIndex = options.indexOf(document.activeElement);
  const nextIndex = event.key === "Home"
    ? 0
    : event.key === "End"
      ? options.length - 1
      : event.key === "ArrowDown"
        ? Math.min(currentIndex + 1, options.length - 1)
        : Math.max(currentIndex - 1, 0);
  options[nextIndex].focus();
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".language-picker")) setMenuOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMenuOpen(false);
    languageToggle.focus();
  }
});
