# Próximos passos do Firebase — DoseCerta V1

## Concluído no código
- Google Authentication integrado com `signInWithPopup`.
- Sessão observada com `onAuthStateChanged`.
- Perfil criado/atualizado em `users/{uid}`.
- Tratamentos migrados para `users/{uid}/treatments`.
- Histórico de tomadas em `users/{uid}/doseHistory`.
- Estrutura de notificações reservada em `users/{uid}/notificationSchedules`.
- Coleção temporária `demoTreatments` removida do código.
- `medications` e `interactionRules` permanecem separados dos dados pessoais.
- Regras de Firestore incluídas em `firestore.rules`.

## No Firebase Console
1. Authentication > Sign-in method > Google: deve estar habilitado.
2. Firestore Database > Rules: cole o conteúdo de `firestore.rules` e publique.
3. Authentication > Settings > Authorized domains: confirme o domínio onde o app será publicado.
4. Teste primeiro com sua própria conta Google.

## Importante
O catálogo clínico e as regras de interação ainda não devem ser preenchidos com conteúdo clínico inventado. Cada registro deve ter fonte identificável e data de revisão, conforme `MEDICAL_DATA_POLICY.md`.

Apple Login, Cloud Functions, Storage e Analytics podem ficar para depois.
