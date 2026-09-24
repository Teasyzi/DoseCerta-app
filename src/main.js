import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { firebaseAuth, googleProvider } from './services/firebase.js';
import { medicationStore } from './services/medication-store.js';
import { notificationService } from './services/notification-service.js';
import { assistant } from './services/assistant.js';

const $ = (id) => document.getElementById(id);
const dialog = $('medicationDialog');
const form = $('medicationForm');
let searchTimer = null;
let searchRequest = 0;

function todayISO(){
  const d = new Date();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function escapeHtml(value){
  return String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

function normalizeSearch(value){
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
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

function openAddMedication(){
  form.reset();
  $('medStart').value = todayISO();
  $('selectedMedication').classList.add('hidden');
  $('medicationId').value = '';
  $('medicationSuggestions').classList.add('hidden');
  $('medicationSuggestions').innerHTML = '';
  $('medName').focus();
  dialog.showModal();
}

function closeAddMedication(){
  dialog.close();
  $('medicationSuggestions').classList.add('hidden');
}

function renderSuggestions(items){
  const box = $('medicationSuggestions');
  box.innerHTML = '';
  if(!items.length){
    box.innerHTML = '<div class="suggestion-empty">Nenhuma correspondência no catálogo. Você pode continuar digitando o nome.</div>';
    box.classList.remove('hidden');
    return;
  }

  for(const med of items){
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'suggestion-item';
    const active = Array.isArray(med.activeIngredients) ? med.activeIngredients.map(x => typeof x === 'string' ? x : (x.name || '')).filter(Boolean).join(' • ') : '';
    button.innerHTML = `<span class="suggestion-main">${escapeHtml(med.name)}</span>${active ? `<span class="suggestion-sub">${escapeHtml(active)}</span>` : '<span class="suggestion-sub">Informação do catálogo</span>'}`;
    button.addEventListener('click', () => selectMedication(med));
    box.appendChild(button);
  }
  box.classList.remove('hidden');
}

function selectMedication(med){
  $('medicationId').value = med.id;
  $('medName').value = med.name || '';
  $('selectedMedicationName').textContent = med.name || 'Medicamento selecionado';
  const active = Array.isArray(med.activeIngredients) ? med.activeIngredients.map(x => typeof x === 'string' ? x : (x.name || '')).filter(Boolean).join(' • ') : '';
  $('selectedMedicationMeta').textContent = active || 'Catálogo DoseCerta';
  $('selectedMedication').classList.remove('hidden');
  $('medicationSuggestions').classList.add('hidden');
  $('medDose').focus();
}

async function searchMedicationCatalog(){
  const value = $('medName').value.trim();
  $('medicationId').value = '';
  $('selectedMedication').classList.add('hidden');
  if(normalizeSearch(value).length < 2){
    $('medicationSuggestions').classList.add('hidden');
    return;
  }
  const requestId = ++searchRequest;
  $('medicationSuggestions').innerHTML = '<div class="suggestion-loading">Procurando no catálogo…</div>';
  $('medicationSuggestions').classList.remove('hidden');
  try{
    const results = await medicationStore.searchCatalog(value);
    if(requestId !== searchRequest) return;
    renderSuggestions(results);
  }catch(error){
    console.error(error);
    if(requestId !== searchRequest) return;
    $('medicationSuggestions').innerHTML = '<div class="suggestion-empty">Não consegui consultar o catálogo agora. Você ainda pode cadastrar pelo nome.</div>';
    $('medicationSuggestions').classList.remove('hidden');
  }
}

async function render(){
  const meds = await medicationStore.getActive();
  $('todayCount').textContent = meds.length;
  $('todaySummary').textContent = meds.length
    ? `${meds.length} medicamento${meds.length === 1 ? '' : 's'} na sua rotina.`
    : 'Sua rotina ainda está vazia.';

  const list = $('scheduleList');
  list.innerHTML = '';
  if(!meds.length){
    $('nextMedication').innerHTML = `<span class="next-empty-icon">💊</span><div><span class="section-label">Seu próximo passo</span><h2>Adicione seu primeiro medicamento</h2><p>Leva menos de um minuto. Depois o DoseCerta cuida da organização dos horários.</p></div>`;
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">✨</div><strong>Vamos montar sua rotina.</strong><p>Comece pelo medicamento que você mais precisa lembrar hoje.</p><button id="emptyAddButton" class="primary large">Adicionar agora</button></div>';
    $('emptyAddButton').onclick = openAddMedication;
    return;
  }

  meds.sort((a,b)=>(a.time || '').localeCompare(b.time || ''));
  const now = new Date();
  const currentMinutes = now.getHours()*60 + now.getMinutes();
  const upcoming = meds.find(m => {
    const [h,min] = String(m.time || '00:00').split(':').map(Number);
    return h*60+min >= currentMinutes;
  }) || meds[0];
  $('nextMedication').innerHTML = `<div class="next-time">${escapeHtml(upcoming.time || '--:--')}</div><div class="next-info"><span class="section-label">Próximo horário</span><h2>${escapeHtml(upcoming.name)}</h2><p>${escapeHtml(upcoming.dose || 'Dose não informada')}</p></div><button id="nextQuickAction" class="primary next-action">Tomei</button>`;
  $('nextQuickAction').onclick = async () => {
    try{
      await medicationStore.recordDose(upcoming.id, new Date().toISOString(), upcoming.time);
      $('nextQuickAction').textContent = 'Registrado ✓';
      $('nextQuickAction').disabled = true;
    }catch(e){ alert(e.message); }
  };

  for(const med of meds){
    const item = document.createElement('div');
    item.className = 'schedule-item';
    item.innerHTML = `
      <div class="schedule-marker">💊</div>
      <div class="schedule-main">
        <div class="schedule-time">${escapeHtml(med.time || '--:--')}</div>
        <div class="schedule-name">${escapeHtml(med.name)}</div>
        <div class="schedule-dose">${escapeHtml(med.dose || 'Dose não informada')}</div>
      </div>
      <div class="item-actions">
        <button class="secondary taken">Tomei</button>
        <button class="ghost remove">Encerrar</button>
      </div>`;
    item.querySelector('.taken').onclick = async () => {
      try{
        await medicationStore.recordDose(med.id, new Date().toISOString(), med.time);
        item.querySelector('.taken').textContent = 'Registrado ✓';
        item.querySelector('.taken').disabled = true;
      } catch(e) { alert(e.message); }
    };
    item.querySelector('.remove').onclick = async () => {
      if(!confirm('Encerrar este tratamento?')) return;
      await medicationStore.end(med.id);
      await notificationService.cancelMedication(med.id);
      await render();
    };
    list.appendChild(item);
  }
}

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

$('logoutButton').onclick = async () => { await signOut(firebaseAuth); };
$('addMedicationButton').onclick = openAddMedication;
$('closeDialog').onclick = closeAddMedication;
$('cancelDialog').onclick = closeAddMedication;

$('medName').addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(searchMedicationCatalog, 220);
});
$('medName').addEventListener('focus', () => {
  if($('medName').value.trim().length >= 2) searchMedicationCatalog();
});

document.addEventListener('click', (event) => {
  if(!event.target.closest('.medication-search')) $('medicationSuggestions').classList.add('hidden');
});

form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const saveButton = form.querySelector('button[type="submit"]');
  saveButton.disabled = true;
  saveButton.textContent = 'Montando sua rotina…';
  try {
    const medication = {
      medicationId: $('medicationId').value || null,
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
    closeAddMedication();
    await render();
  } catch(error) {
    console.error(error);
    alert(error.message || 'Não foi possível salvar o medicamento.');
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = 'Salvar medicamento';
  }
});

function askAssistant(question){
  $('questionInput').value = question;
  $('assistantAnswer').textContent = 'Consultando sua rotina…';
  medicationStore.getActive().then(meds => {
    $('assistantAnswer').textContent = assistant.answer(question, meds);
  }).catch(error => { $('assistantAnswer').textContent = error.message; });
}

$('askButton').onclick = async ()=>{
  const question = $('questionInput').value.trim();
  if(!question){ $('assistantAnswer').textContent='Digite uma pergunta ou escolha uma sugestão abaixo.'; return; }
  askAssistant(question);
};

document.querySelectorAll('[data-question]').forEach(button => button.addEventListener('click', () => askAssistant(button.dataset.question)));
$('fontUp').onclick = ()=>document.documentElement.style.fontSize = '19px';
$('fontDown').onclick = ()=>document.documentElement.style.fontSize = '16px';
$('contrastToggle').onclick = ()=>document.body.classList.toggle('high-contrast');

if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(console.error);

onAuthStateChanged(firebaseAuth, async (user) => {
  if(!user) { setLoggedOut(); return; }
  setLoggedIn(user);
  try {
    await medicationStore.ensureProfile();
    await render();
  } catch(error) {
    console.error(error);
    $('todaySummary').textContent = 'Não foi possível carregar seus dados. Verifique as regras do Firestore.';
  }
});
