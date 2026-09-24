// Camada única de notificações.
// Web: Notification API + Service Worker quando suportado.
// APK: substituir/adicionar implementação Capacitor Local Notifications.
// Isso evita espalhar lógica de lembretes pelo projeto.

export const notificationService = {
  async requestPermission(){
    if(!('Notification' in window)) return 'unsupported';
    return await Notification.requestPermission();
  },

  async scheduleMedication(med){
    const permission = await this.requestPermission();
    if(permission !== 'granted') return {ok:false, reason:permission};

    // V1 Web: demonstrativo. Agendamento persistente no navegador varia por plataforma.
    // No APK, usar Capacitor Local Notifications com um ID estável baseado em med.id.
    return {ok:true, medicationId:med.id};
  },

  async cancelMedication(medicationId){
    // V1: no Web não criamos dezenas de timers persistentes.
    // APK: cancelar pelo ID do tratamento.
    return {ok:true, medicationId};
  }
};
