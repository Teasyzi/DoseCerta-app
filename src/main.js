import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { firebaseAuth, googleProvider } from './services/firebase.js';
import { medicationStore } from './services/medication-store.js';
import { notificationService } from './services/notification-service.js';
import { assistant } from './services/assistant.js';
import { medicationCatalog } from './services/medication-catalog.js';

const $ = (id) => document.getElementById(id);
const dialog = $('medicationDialog');
const form = $('medicationForm');
let selectedMedication = null;
let searchTimer = null;


function todayISO(){
  const d = new Date();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function escapeHtml(value){
  return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

function setLoggedOut(){
  $('appContent').classList.add('hidden');
  $('loginPanel').classList.remove('hidden');
  $('userBar').classList.add('hidden');
}

function setLoggedIn(user){
  $('loginPanel').classList.add('hidden');
  $('appContent').classList.remove('hidden');
  $('userBar').classList.remove('hidden');
  $('userName').textContent = user.displayName || user.email || 'Usuário';
  $('userPhoto').src = user.photoURL || './icon.svg';
}

async function render(){
  const meds = await medicationStore.getActive();
  $('todaySummary').textContent = meds.length
    ? `${meds.length} medicamento${meds.length === 1 ? '' : 's'} na sua rotina.`
    : 'Nenhum medicamento cadastrado ainda.';

  const list = $('scheduleList');
  list.innerHTML = '';
  if(!meds.length){
    list.innerHTML = '<div class="empty-state"><strong>Vamos começar.</strong><p>Cadastre seu primeiro medicamento para montar sua rotina.</p></div>';
    return;
  }

  meds.sort((a,b)=>(a.time || '').localeCompare(b.time || ''));
  for(const med of meds){
    const item = document.createElement('div');
    item.className = 'schedule-item';
    item.innerHTML = `
      <div>
        <div class="schedule-time">${escapeHtml(med.time || '--:--')}</div>
        <div class="schedule-name">${escapeHtml(med.name)}</div>
        <div class="schedule-dose">${escapeHtml(med.dose)}</div>
      </div>
      <div class="item-actions">
        <button class="secondary taken">Tomei</button>
        <button class="secondary remove">Encerrar</button>
      </div>`;
    item.querySelector('.taken').onclick = async () => {
      try {
        await medicationStore.recordDose(med.id, new Date().toISOString());
        item.querySelector('.taken').textContent = 'Registrado ✓';
        item.querySelector('.taken').disabled = true;
      } catch(e) { alert(e.message); }
    };
    item.querySelector('.remove').onclick = async () => {
      if(!confirm('Encerrar este tratamento?')) return;
      await medicationStore.end(med.id);
      await notificationService.cancelMedication(med.id);
      render();
    };
    list.appendChild(item);
  }
}

function closeMedicationSuggestions() {
  const box = $('medicationSuggestions');
  if (box) box.classList.add('hidden');
}

function renderMedicationSuggestions(items) {
  const box = $('medicationSuggestions');
  if (!box) return;

  box.innerHTML = '';

  if (!items.length) {
    box.innerHTML = '<div class="suggestion-empty">Nenhum medicamento encontrado no catálogo. Você ainda pode digitar o nome manualmente.</div>';
    box.classList.remove('hidden');
    return;
  }

  for (const medication of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'suggestion-item';
    button.setAttribute('role', 'option');

    const name = medication.genericName || medication.name || 'Medicamento';
    const ingredient = Array.isArray(medication.activeIngredients)
      ? medication.activeIngredients.join(', ')
      : (medication.activeIngredient || '');

    button.innerHTML = `
      <span class="suggestion-name">${escapeHtml(name)}</span>
      ${ingredient ? `<span class="suggestion-meta">${escapeHtml(ingredient)}</span>` : ''}
    `;

    button.addEventListener('click', () => {
      selectedMedication = medication;
      $('medicationId').value = medication.id;
      $('medName').value = name;
      const hint = $('medicationHint');
      if (hint) hint.textContent = 'Medicamento selecionado no catálogo.';
      closeMedicationSuggestions();
    });

    box.appendChild(button);
  }

  box.classList.remove('hidden');
}

async function searchMedicationCatalog() {
  const input = $('medName');
  if (!input) return;

  const term = input.value.trim();

  if (term.length < 2) {
    closeMedicationSuggestions();
    return;
  }

  try {
    const results = await medicationCatalog.search(term);
    renderMedicationSuggestions(results);
  } catch (error) {
    console.error('Erro ao pesquisar catálogo de medicamentos:', error);
    closeMedicationSuggestions();
  }
}

$('medName').addEventListener('input', () => {
  selectedMedication = null;
  $('medicationId').value = '';
  const hint = $('medicationHint');
  if (hint) hint.textContent = 'Digite pelo menos 2 letras para procurar no catálogo.';

  clearTimeout(searchTimer);
  searchTimer = setTimeout(searchMedicationCatalog, 220);
});

$('medName').addEventListener('focus', () => {
  if ($('medName').value.trim().length >= 2) searchMedicationCatalog();
});

document.addEventListener('click', (event) => {
  const wrapper = document.querySelector('.medication-autocomplete');
  if (wrapper && !wrapper.contains(event.target)) closeMedicationSuggestions();
});

$('googleLoginButton').onclick = async () => {
  $('loginStatus').textContent = 'Entrando...';
  try {
    const result = await signInWithPopup(firebaseAuth, googleProvider);
    await medicationStore.ensureProfile();
    $('loginStatus').textContent = `Olá, ${result.user.displayName || 'usuário'}!`;
  } catch(error) {
    console.error(error);
    $('loginStatus').textContent = error.code === 'auth/popup-closed-by-user'
      ? 'Login cancelado.'
      : 'Não foi possível entrar com o Google. Verifique se o provedor Google está habilitado no Firebase.';
  }
};

$('logoutButton').onclick = async () => {
  await signOut(firebaseAuth);
};

$('addMedicationButton').onclick = () => {
  $('medStart').value = todayISO();
  $('medicationId').value = '';
  $('medName').value = '';
  selectedMedication = null;
  closeMedicationSuggestions();
  const hint = $('medicationHint');
  if (hint) hint.textContent = 'Digite pelo menos 2 letras para procurar no catálogo.';
  dialog.showModal();
  setTimeout(() => $('medName').focus(), 50);
};
$('closeDialog').onclick = () => dialog.close();
$('cancelDialog').onclick = () => dialog.close();

form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const saveButton = form.querySelector('button[type="submit"]');
  saveButton.disabled = true;
  saveButton.textContent = 'Salvando...';
  try {
    const medication = {
      name: $('medName').value.trim(),
      dose: $('medDose').value.trim(),
      time: $('medTime').value,
      startDate: $('medStart').value,
      endDate: $('medEnd').value || null,
      status: 'active'
    };
    const saved = await medicationStore.add(medication);
    await notificationService.scheduleMedication(saved);
    form.reset();
    dialog.close();
    await render();
  } catch(error) {
    console.error(error);
    alert(error.message || 'Não foi possível salvar o medicamento.');
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = 'Salvar medicamento';
  }
});

$('askButton').onclick = async ()=>{
  const question = $('questionInput').value.trim();
  if(!question){ $('assistantAnswer').textContent='Digite uma pergunta.'; return; }
  $('assistantAnswer').textContent = 'Consultando as informações do app...';
  try {
    const meds = await medicationStore.getActive();
    $('assistantAnswer').textContent = assistant.answer(question, meds);
  } catch(error) {
    $('assistantAnswer').textContent = error.message;
  }
};

$('fontUp').onclick = ()=>document.documentElement.style.fontSize = '20px';
$('fontDown').onclick = ()=>document.documentElement.style.fontSize = '16px';
$('contrastToggle').onclick = ()=>document.body.classList.toggle('high-contrast');

if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(console.error);

onAuthStateChanged(firebaseAuth, async (user) => {
  if(!user) {
    setLoggedOut();
    return;
  }
  setLoggedIn(user);
  try {
    await medicationStore.ensureProfile();
    await render();
  } catch(error) {
    console.error(error);
    $('todaySummary').textContent = 'Não foi possível carregar seus dados. Verifique as regras do Firestore.';
  }
});
