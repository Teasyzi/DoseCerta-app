# Estrutura Firestore

A V1 deve separar dados clínicos de dados pessoais.

## `medications`
Catálogo clínico revisado.
- `name`
- `normalizedName`
- `genericName`
- `aliases[]`
- `searchTerms[]`
- `brandNames[]`
- `activeIngredients[]`
- `form`
- `strengths[]`
- `indications[]`
- `precautions[]`
- `pregnancy`: dados por trimestre quando houver fonte
- `breastfeeding`
- `interactions[]`
- `foodInteractions[]`
- `sources[]`
- `description`
- `howItWorks`
- `contraindications[]`
- `warnings[]`
- `adverseEffects[]`
- `reviewStatus`: pending | reviewed | published | outdated
- `lastReviewedAt`

## `interactionRules`
Regras estruturadas.
- `substanceA`
- `substanceB`
- `type`
- `severity`
- `rule`
- `message`
- `source`
- `description`
- `howItWorks`
- `contraindications[]`
- `warnings[]`
- `adverseEffects[]`
- `reviewStatus`: pending | reviewed | published | outdated
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
