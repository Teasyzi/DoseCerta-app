import {
  collection, addDoc, doc, updateDoc, query, getDocs,
  serverTimestamp, orderBy, setDoc
} from 'firebase/firestore';
import { firebaseDb, firebaseAuth } from './firebase.js';

function requireUser(){
  const user = firebaseAuth.currentUser;
  if(!user) throw new Error('Você precisa estar conectado para usar seus medicamentos.');
  return user;
}

const treatmentsRef = () => collection(firebaseDb, 'users', requireUser().uid, 'treatments');
const historyRef = () => collection(firebaseDb, 'users', requireUser().uid, 'doseHistory');

export const medicationStore = {
  async ensureProfile(){
    const user = requireUser();
    const profile = {
      displayName: user.displayName || 'Usuário',
      photoURL: user.photoURL || null,
      email: user.email || null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo',
      createdAt: serverTimestamp()
    };
    await setDoc(doc(firebaseDb, 'users', user.uid), profile, { merge: true });
  },

  async getActive(){
    const snapshot = await getDocs(query(treatmentsRef(), orderBy('timeOrder', 'asc')));
    return snapshot.docs
      .map(d => ({ id:d.id, ...d.data() }))
      .filter(m => m.status === 'active');
  },

  async add(data){
    requireUser();
    const payload = {
      medicationId: data.medicationId || null,
      name: data.name,
      dose: data.dose,
      time: data.time,
      timeOrder: data.time.replace(':',''),
      times: [data.time],
      startDate: data.startDate,
      endDate: data.endDate || null,
      status: 'active',
      notes: data.notes || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const ref = await addDoc(treatmentsRef(), payload);
    return { id: ref.id, ...data, status:'active' };
  },

  async end(id){
    await updateDoc(doc(firebaseDb, 'users', requireUser().uid, 'treatments', id), {
      status:'ended',
      endedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },

  async recordDose(id, takenAt, scheduledAt = null){
    const ref = await addDoc(historyRef(), {
      treatmentId: id,
      scheduledAt: scheduledAt || takenAt,
      takenAt,
      status: 'taken'
    });
    return ref.id;
  }
};
