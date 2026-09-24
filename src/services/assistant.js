// Assistente V1 sem API paga.
// Ele responde somente a perguntas simples com base nos dados disponíveis.
// A camada pode ser substituída futuramente por uma API de IA sem alterar a UI.

export const assistant = {
  answer(question, medications){
    const q = question.toLowerCase();
    if(q.includes('hoje') || q.includes('medicamento')){
      if(!medications.length) return 'Você ainda não cadastrou medicamentos ativos.';
      return 'Na sua rotina atual: ' + medications
        .sort((a,b)=>a.time.localeCompare(b.time))
        .map(m=>`${m.time} — ${m.name} (${m.dose})`)
        .join('; ') + '.';
    }
    return 'Na V1 gratuita, eu consigo consultar a rotina cadastrada. Para dúvidas sobre efeitos, interações, gravidez ou alteração de tratamento, o aplicativo deverá consultar uma informação clínica cadastrada e sua fonte antes de responder.';
  }
};
