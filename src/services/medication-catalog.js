import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAt,
  endAt
} from 'firebase/firestore';
import { firebaseDb, firebaseAuth } from './firebase.js';

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function requireUser() {
  if (!firebaseAuth.currentUser) {
    throw new Error('Você precisa estar conectado para pesquisar medicamentos.');
  }
}

export const medicationCatalog = {
  normalizeText,

  async search(term, maxResults = 8) {
    requireUser();

    const normalized = normalizeText(term);
    if (normalized.length < 2) return [];

    const medicationsRef = collection(firebaseDb, 'medications');

    const q = query(
      medicationsRef,
      orderBy('normalizedName'),
      startAt(normalized),
      endAt(normalized + '\uf8ff'),
      limit(maxResults)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
  }
};
