import en from './en.js';
import hi from './hi.js';
export const dictionaries = { en, hi };
export function translator(language = 'en') {
  const translate = (key, variables = {}) => {
    const value = dictionaries[language]?.[key] ?? dictionaries.en[key] ?? key;
    return String(value).replace(/\{(\w+)\}/g, (_, name) => variables[name] ?? `{${name}}`);
  };
  translate.language = language;
  return translate;
}
