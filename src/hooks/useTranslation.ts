import { useSpreadsheetStore } from '../store';
import { translations } from '../i18n/translations';

export function useTranslation() {
  const { settings } = useSpreadsheetStore();
  const t = (key: string) => {
    const keys = key.split('.');
    let value = translations[settings.language];
    
    for (const k of keys) {
      if (value?.[k]) {
        value = value[k];
      } else {
        console.warn(`Translation missing for key: ${key}`);
        return key;
      }
    }
    
    return value;
  };

  return { t };
}