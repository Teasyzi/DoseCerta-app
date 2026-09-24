import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { mergeMedicationRecords, normalizeText, toMedicationRecord } from './normalize-medication.mjs';

const projectRoot = path.resolve(new URL('.', import.meta.url).pathname, '..');
const input = process.env.MEDICATION_IMPORT_FILE || path.join(projectRoot, 'data', 'medications.seed.json');
const dryRun = process.env.DRY_RUN === 'true';

function credentials() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON não configurada.');
  return JSON.parse(raw);
}

function parseCsv(text) {
  const sample = text.split(/\r?\n/, 1)[0] || '';
  const candidates = [',', ';', '\t'];
  const separator = candidates.sort((a, b) => (sample.split(b).length - 1) - (sample.split(a).length - 1))[0];
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const n = text[i + 1];
    if (c === '"' && quoted && n === '"') { cell += '"'; i++; continue; }
    if (c === '"') { quoted = !quoted; continue; }
    if (c === separator && !quoted) { row.push(cell); cell = ''; continue; }
    if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && n === '\n') i++;
      row.push(cell); cell = '';
      if (row.some(v => v.trim())) rows.push(row);
      row = [];
      continue;
    }
    cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const headers = (rows.shift() || []).map(h => h.trim());
  return rows.map(values => Object.fromEntries(headers.map((h, i) => [h, (values[i] || '').trim()])));
}

function first(row, aliases) {
  for (const key of aliases) if (row[key] != null && row[key] !== '') return row[key];
  return '';
}

async function loadRows(file) {
  const buffer = await fs.readFile(file);
  const text = buffer.toString('latin1');
  if (file.toLowerCase().endsWith('.json')) return JSON.parse(text);
  return parseCsv(text);
}

function safeIdPart(value) {
  return normalizeText(value)
    .replace(/\s+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function mapAnvisaRow(row) {
  const name = first(row, ['NO_PRODUTO', 'NOME_PRODUTO', 'NOME DO PRODUTO', 'Nome do Produto']);
  const active = first(row, ['DS_PRINCIPIO_ATIVO', 'PRINCIPIO_ATIVO', 'PRINCÍPIO ATIVO', 'Princípio Ativo']);
  const company = first(row, ['NO_EMPRESA', 'EMPRESA', 'NOME_EMPRESA', 'Empresa']);
  const registration = first(row, ['NU_REGISTRO', 'REGISTRO', 'NÚMERO DE REGISTRO', 'Número de registro']);
  const status = first(row, ['DS_SITUACAO_REGISTRO', 'SITUACAO_REGISTRO', 'SITUAÇÃO DO REGISTRO', 'Situação do Registro']);
  const presentation = first(row, ['DS_APRESENTACAO', 'APRESENTACAO', 'APRESENTAÇÃO', 'Apresentação']);
  const form = first(row, ['DS_FORMA_FARMACEUTICA', 'FORMA_FARMACEUTICA', 'FORMA FARMACÊUTICA', 'Forma Farmacêutica']);
  const route = first(row, ['DS_VIA_ADMINISTRACAO', 'VIA_ADMINISTRACAO', 'VIA DE ADMINISTRAÇÃO', 'Via de administração']);

  if (!name && !active) return null;

  const safeId = `${safeIdPart(name || active)}-${safeIdPart(registration || 'sem-registro') || 'sem-registro'}`;

  return toMedicationRecord({
    id: safeId,
    name: name || active,
    genericName: active || null,
    activeIngredients: active ? [active] : [],
    brandNames: name ? [name] : [],
    presentations: presentation ? [{ text: presentation, form: form || null, route: route || null }] : [],
    regulatory: {
      registration: registration || null,
      company: company || null,
      status: status || null
    },
    sources: [{
      organization: 'ANVISA',
      type: 'medicamentos_registrados',
      registration: registration || null,
      company: company || null
    }],
    reviewStatus: 'pending',
    sourceType: 'anvisa'
  });
}

const rows = await loadRows(input);
const mapped = input.toLowerCase().endsWith('.csv')
  ? rows.map(mapAnvisaRow)
  : rows.map(toMedicationRecord);

const skipped = mapped.filter(record => !record).length;
const records = mapped.filter(Boolean);

const dedup = new Map();
let mergedCount = 0;
for (const record of records) {
  const registration = record.regulatory?.registration || 'sem-registro';
  const key = `${record.normalizedName}|${record.activeIngredients.join('|')}|${registration}`;
  if (!dedup.has(key)) {
    dedup.set(key, record);
  } else {
    dedup.set(key, mergeMedicationRecords(dedup.get(key), record));
    mergedCount++;
  }
}

const unique = [...dedup.values()];
const emptyActive = unique.filter(record => record.activeIngredients.length === 0).length;
const withoutRegistration = unique.filter(record => !record.regulatory?.registration).length;

console.log('--- DoseCerta | Importação Anvisa ---');
console.log(`Modo: ${dryRun ? 'DRY RUN (nenhuma gravação)' : 'IMPORTAÇÃO'}`);
console.log(`Linhas lidas: ${rows.length}`);
console.log(`Registros mapeados: ${records.length}`);
console.log(`Registros ignorados: ${skipped}`);
console.log(`Registros consolidados: ${unique.length}`);
console.log(`Linhas consolidadas em outro registro: ${mergedCount}`);
console.log(`Sem princípio ativo: ${emptyActive}`);
console.log(`Sem número de registro: ${withoutRegistration}`);
console.log(`Registros preparados: ${unique.length}`);

if (dryRun) {
  console.log('\nAmostra dos registros preparados:');
  console.log(JSON.stringify(unique.slice(0, 3), null, 2));
  console.log('\nDRY RUN concluído. Nenhum documento foi gravado no Firestore.');
  process.exit(0);
}

const app = initializeApp({ credential: cert(credentials()) });
const db = getFirestore(app);
let batch = db.batch();
let count = 0;

for (const record of unique) {
  const id = `${safeIdPart(record.name) || 'medicamento'}-${safeIdPart(record.regulatory?.registration || 'sem-registro') || 'sem-registro'}`.slice(0, 100);
  const ref = db.collection('medications').doc(id);
  batch.set(ref, {
    ...record,
    importedAt: FieldValue.serverTimestamp()
  }, { merge: true });
  count++;

  if (count % 400 === 0) {
    await batch.commit();
    console.log(`Lote gravado: ${count}`);
    batch = db.batch();
  }
}

if (count % 400) await batch.commit();
console.log(`Importação concluída: ${count} documentos em medications.`);
