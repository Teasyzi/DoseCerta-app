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
  return [...new Set(values.filter(Boolean).map(v => String(v).trim()).filter(Boolean))];
}

export function toMedicationRecord(raw) {
  const name = String(raw.name || raw.genericName || '').trim();
  const genericName = raw.genericName ? String(raw.genericName).trim() : null;
  const activeIngredients = uniqueStrings(raw.activeIngredients || []);
  const aliases = uniqueStrings(raw.aliases || []);
  const brandNames = uniqueStrings(raw.brandNames || []);
  const searchTerms = uniqueStrings([name, genericName, ...aliases, ...brandNames, ...activeIngredients].map(normalizeText));

  return {
    name,
    normalizedName: normalizeText(name),
    genericName,
    brandNames,
    aliases,
    activeIngredients,
    presentations: Array.isArray(raw.presentations) ? raw.presentations : [],
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
    sourceType: raw.sourceType || 'other'
  };
}
