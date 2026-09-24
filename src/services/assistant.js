// Assistente local da V1. Ele NÃO é uma IA clínica ainda.
// A futura camada de IA deverá consultar apenas dados clínicos publicados e fontes confiáveis.

export const assistant = {
  answer(question, medications){
    const q = question.toLowerCase();
    if(!medications.length) return 'Sua rotina ainda está vazia. Cadastre um medicamento e eu consigo ajudar a consultar os horários.';

    const sorted = [...medications].sort((a,b)=>(a.time || '').localeCompare(b.time || ''));
    if(q.includes('hoje') || q.includes('tenho') || q.includes('medicamento')){
      return 'Na sua rotina atual: ' + sorted.map(m=>`${m.time || '--:--'} — ${m.name} (${m.dose || 'dose não informada'})`).join('; ') + '.';
    }
    if(q.includes('próximo') || q.includes('proximo') || q.includes('agora')){
      const now = new Date();
      const current = now.getHours()*60 + now.getMinutes();
      const next = sorted.find(m=>{ const [h,mi]=String(m.time||'00:00').split(':').map(Number); return h*60+mi >= current; }) || sorted[0];
      return `Seu próximo horário cadastrado é ${next.time || '--:--'}, com ${next.name}.`;
    }
    return 'Ainda estou na versão inicial do assistente. A IA clínica será conectada depois que nossa base de medicamentos, interações e fontes estiver pronta. Por enquanto, posso consultar sua rotina e seus horários.';
  }
};
