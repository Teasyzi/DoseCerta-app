export function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function uniqueStrings(values = []) {
  return [...new Set(
    values
      .flatMap(value => Array.isArray(value) ? value : [value])
      .filter(value => value != null)
      .map(value => String(value).trim())
      .filter(Boolean)
  )];
}

function splitActiveIngredients(value) {
  if (Array.isArray(value)) return uniqueStrings(value);
  if (!value) return [];

  return uniqueStrings(
    String(value)
      .split(/\s*[;|]\s*|\s+\+\s+|\s*,\s*/)
  );
}

function normalizePresentations(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(Boolean)
    .map(item => {
      if (typeof item === 'string') return { text: item.trim() };
      return {
        text: item.text ? String(item.text).trim() : null,
        form: item.form ? String(item.form).trim() : null,
        route: item.route ? String(item.route).trim() : null
      };
    })
    .filter(item => item.text || item.form || item.route);
}

export function toMedicationRecord(raw = {}) {
  const name = String(raw.name || raw.genericName || '').trim();
  const genericName = raw.genericName ? String(raw.genericName).trim() : null;
  const activeIngredients = splitActiveIngredients(raw.activeIngredients || raw.activeIngredient || []);
  const aliases = uniqueStrings(raw.aliases || []);
  const brandNames = uniqueStrings(raw.brandNames || []);
  const presentations = normalizePresentations(raw.presentations || []);
  const regulatory = {
    registration: raw.regulatory?.registration ?? raw.registration ?? null,
    company: raw.regulatory?.company ?? raw.company ?? null,
    status: raw.regulatory?.status ?? raw.sourceStatus ?? null
  };

  const searchTerms = uniqueStrings([
    name,
    genericName,
    ...aliases,
    ...brandNames,
    ...activeIngredients,
    ...presentations.flatMap(item => [item.text, item.form, item.route])
  ].map(normalizeText));

  return {
    name,
    normalizedName: normalizeText(name),
    genericName,
    brandNames,
    aliases,
    activeIngredients,
    presentations,
    regulatory,
    indications: Array.isArray(raw.indications) ? raw.indications : [],
    howItWorks: raw.howItWorks || null,
    contraindications: Array.isArray(raw.contraindications) ? raw.contraindications : [],
    warnings: Array.isArray(raw.warnings) ? raw.warnings : [],
    adverseEffects: Array.isArray(raw.adverseEffects) ? raw.adverseEffects : [],
    interactions: Array.isArray(raw.interactions) ? raw.interactions : [],
    foodInteractions: Array.isArray(raw.foodInteractions) ? raw.foodInteractions : [],
    pregnancy: raw.pregnancy || null,
    breastfeeding: raw.breastfeeding || null,
    administration: raw.administration || null,
    description: raw.description || null,
    sources: Array.isArray(raw.sources) ? raw.sources : [],
    searchTerms,
    reviewStatus: raw.reviewStatus || 'pending',
    lastReviewedAt: raw.lastReviewedAt || null,
    sourceUpdatedAt: raw.sourceUpdatedAt || null,
    sourceType: raw.sourceType || 'other'
  };
}

export function mergeMedicationRecords(existing, incoming) {
  const merged = toMedicationRecord({
    ...existing,
    ...incoming,
    brandNames: uniqueStrings([...(existing.brandNames || []), ...(incoming.brandNames || [])]),
    aliases: uniqueStrings([...(existing.aliases || []), ...(incoming.aliases || [])]),
    activeIngredients: uniqueStrings([...(existing.activeIngredients || []), ...(incoming.activeIngredients || [])]),
    presentations: [...(existing.presentations || []), ...(incoming.presentations || [])],
    sources: [...(existing.sources || []), ...(incoming.sources || [])]
  });

  const presentationKeys = new Set();
  merged.presentations = merged.presentations.filter(item => {
    const key = JSON.stringify(item);
    if (presentationKeys.has(key)) return false;
    presentationKeys.add(key);
    return true;
  });

  const sourceKeys = new Set();
  merged.sources = merged.sources.filter(item => {
    const key = JSON.stringify(item);
    if (sourceKeys.has(key)) return false;
    sourceKeys.add(key);
    return true;
  });

  merged.searchTerms = uniqueStrings([
    merged.name,
    merged.genericName,
    ...merged.aliases,
    ...merged.brandNames,
    ...merged.activeIngredients,
    ...merged.presentations.flatMap(item => [item.text, item.form, item.route])
  ].map(normalizeText));

  return merged;
}
