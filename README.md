# DoseCerta — V1

Aplicativo web/PWA preparado para futura versão APK com Capacitor.

## Objetivos da V1
- Cadastro de medicamentos e tratamentos.
- Horários e duração.
- Notificações através de uma camada única de notificações.
- Histórico de doses.
- Estrutura Firestore preparada para sincronização Web ↔ APK.
- Motor de regras separado da interface.
- Assistente V1 baseado nos dados e fontes cadastrados, sem depender de API paga.
- Interface acessível: texto grande, alto contraste, linguagem simples e ações claras.

## Firebase
1. Crie um projeto no Firebase.
2. Ative Authentication e Firestore.
3. Copie suas credenciais para `src/services/firebase-config.example.js` e renomeie para `firebase-config.js`.
4. Nunca publique chaves privadas ou credenciais de servidor no frontend.
5. Configure regras do Firestore antes de usar dados reais.

## APK
A arquitetura usa Capacitor como camada futura:
- Web/PWA continua sendo a interface.
- APK usa a mesma interface.
- Notificações Android podem usar `@capacitor/local-notifications`.
- Sincronização continua no Firebase.

## Importante
O banco clínico real deve ser preenchido posteriormente com dados revisados e fontes confiáveis. Os arquivos desta V1 não inventam recomendações médicas.


## Catálogo de medicamentos

A busca do cadastro usa a coleção `medications` do Firestore e o campo `normalizedName`.
O arquivo `MEDICATION_CATALOG_STARTER.json` é apenas um ponto de partida para estruturar a importação; os registros estão marcados como `needsReview` e não devem ser tratados como conteúdo clínico final.

Para o conteúdo clínico, a referência de origem deve ser validada com fontes oficiais, especialmente o Bulário Eletrônico e o sistema de consulta de medicamentos da Anvisa.
