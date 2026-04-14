export const LANGUAGE_LABELS = {
  en: 'English',
  hi: 'Hindi',
  mr: 'Marathi',
  te: 'Telugu',
  ta: 'Tamil',
  kn: 'Kannada',
  bn: 'Bengali',
  gu: 'Gujarati',
  pa: 'Punjabi',
  ml: 'Malayalam',
};

export const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));
export const clamp01 = (value) => Math.min(1, Math.max(0, value));

export const extractJsonFromText = (text) => {
  if (!text) {
    throw new Error('AI_RESPONSE_INVALID');
  }
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('AI_RESPONSE_INVALID');
  }
  try {
    return JSON.parse(match[0]);
  } catch (error) {
    throw new Error('AI_RESPONSE_INVALID');
  }
};

export const requireNumber = (value, field) => {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new Error(`AI_RESPONSE_INVALID:${field}`);
  }
  return num;
};

export const normalizeStringArray = (value, fallback = []) => {
  if (!Array.isArray(value)) return fallback;
  const items = value
    .map((item) => String(item).trim())
    .filter(Boolean);
  return items.length > 0 ? items : fallback;
};

export const normalizeEnum = (value, allowed, fallback) => {
  const normalized = String(value || '').toLowerCase();
  return allowed.includes(normalized) ? normalized : fallback;
};

export const normalizeLanguage = (value) => {
  const code = String(value || '').toLowerCase();
  return LANGUAGE_LABELS[code] ? code : 'en';
};
