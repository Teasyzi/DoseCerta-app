# Estrutura Firestore

A V1 deve separar dados clínicos de dados pessoais.

## `medications`
Catálogo clínico revisado.
- `genericName`
- `name` (opcional, para compatibilidade com registros antigos)
- `normalizedName` (nome normalizado, sem acentos e em minúsculas, usado na busca)
- `brandNames[]`
- `searchTerms[]` (opcional, para futuras buscas por marca/princípio ativo)
- `activeIngredients[]`
- `aliases[]` (nomes alternativos usados na busca)
- `form`
- `strengths[]`
- `indications[]`
- `precautions[]`
- `pregnancy`: dados por trimestre quando houver fonte
- `breastfeeding`
- `interactions[]`
- `foodInteractions[]`
- `sources[]`
- `lastReviewedAt`

### Busca do catálogo

A aplicação usa `normalizedName` para autocomplete por prefixo. O usuário precisa estar autenticado para consultar o catálogo. O cliente nunca recebe permissão de escrita em `medications`.

## `interactionRules`
Regras estruturadas.
- `substanceA`
- `substanceB`
- `type`
- `severity`
- `rule`
- `message`
- `source`
- `lastReviewedAt`

## `users/{uid}`
Preferências não clínicas.
- `displayName`
- `accessibility.fontScale`
- `accessibility.highContrast`
- `timezone`
- `createdAt`

## `users/{uid}/treatments`
Uma rotina/tratamento, não um lembrete por tomada.
- `medicationId`
- `dose`
- `times[]`
- `startDate`
- `endDate`
- `status`: active | paused | ended
- `notes`
- `createdAt`
- `updatedAt`

## `users/{uid}/doseHistory`
Histórico de tomadas.
- `treatmentId`
- `scheduledAt`
- `takenAt`
- `status`: taken | skipped | snoozed

## `users/{uid}/notificationSchedules`
Somente registros necessários para sincronizar/cancelar notificações.
- `treatmentId`
- `platform`
- `notificationIds[]`
- `active`
- `updatedAt`

### Regra de arquitetura
O tratamento é a fonte de verdade. Notificações são uma representação temporária dele. Ao editar, pausar ou encerrar um tratamento, as notificações antigas devem ser canceladas antes de criar as novas.
