const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

type TranslationCache = Record<string, string>;

const memoryCache = new Map<string, TranslationCache>();
let saveTimer: number | null = null;

const getCacheKey = (language: string) => `agrigrade.translations.${language}`;

const loadCache = (language: string) => {
  if (memoryCache.has(language)) {
    return memoryCache.get(language)!;
  }
  try {
    const raw = localStorage.getItem(getCacheKey(language));
    const parsed = raw ? JSON.parse(raw) : {};
    memoryCache.set(language, parsed);
    return parsed;
  } catch {
    const empty: TranslationCache = {};
    memoryCache.set(language, empty);
    return empty;
  }
};

const persistCache = (language: string) => {
  if (saveTimer) {
    window.clearTimeout(saveTimer);
  }
  saveTimer = window.setTimeout(() => {
    const cache = memoryCache.get(language);
    if (!cache) return;
    localStorage.setItem(getCacheKey(language), JSON.stringify(cache));
  }, 400);
};

export const translateBatch = async (texts: string[], target: string) => {
  if (target === 'en') {
    return texts;
  }

  const cache = loadCache(target);
  const unique = Array.from(new Set(texts));
  const missing = unique.filter((text) => !cache[text]);

  if (missing.length > 0) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: missing, target, source: 'en' }),
      });
      if (response.ok) {
        const json = await response.json();
        const translations: string[] = json?.data?.translations || [];
        translations.forEach((translated, index) => {
          const original = missing[index];
          if (original && translated) {
            cache[original] = translated;
          }
        });
        persistCache(target);
      }
    } catch (error) {
      console.error('Translation batch error:', error);
    }
  }

  return texts.map((text) => cache[text] || text);
};
