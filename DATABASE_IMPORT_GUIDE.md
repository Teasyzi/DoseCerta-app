# DoseCerta — Banco de medicamentos e importação

## Objetivo

O catálogo clínico fica separado dos dados pessoais dos usuários. O cliente pode consultar `medications` e `interactionRules`, mas não pode alterá-los.

## Fonte principal

Para o catálogo regulatório brasileiro, a fonte-base escolhida é a Anvisa. A Agência mantém uma base pública de medicamentos registrados e o Bulário Eletrônico com bulas para pacientes e profissionais.

- Medicamentos registrados: https://dados.anvisa.gov.br/dados/DADOS_ABERTOS_MEDICAMENTOS.csv
- Bulário Eletrônico: https://www.gov.br/anvisa/pt-br/sistemas/bulario-eletronico

O importador marca registros importados como `reviewStatus: pending`. Isso é intencional: registro sanitário/catálogo não significa que todas as informações clínicas já foram revisadas para uso pelo assistente.

## Modelo clínico

Cada medicamento pode ter:

- descrição em linguagem simples;
- princípio(s) ativo(s);
- apresentações e vias;
- indicações;
- como funciona;
- contraindicações;
- advertências;
- efeitos adversos;
- interações medicamento-medicamento;
- interações medicamento-alimento;
- gravidez;
- amamentação;
- administração;
- fontes e datas de revisão.

Nenhum desses campos deve ser preenchido por IA sem uma fonte identificável.

## Importação

O computador do usuário não precisa ter Node/npm. A importação pode ser executada pelo GitHub Actions.

1. No GitHub, abra **Settings → Secrets and variables → Actions**.
2. Crie o secret `FIREBASE_SERVICE_ACCOUNT_JSON` com uma credencial de conta de serviço do projeto Firebase.
3. Abra **Actions → Importar medicamentos para o Firestore → Run workflow**.
4. Primeiro execute com `dry_run = true`.
5. Depois, quando a validação estiver correta, execute com `dry_run = false`.

Nunca coloque a credencial de serviço dentro do repositório, do ZIP ou do frontend.

## IA

A futura API deverá utilizar somente registros clínicos `reviewStatus = published` para respostas médicas de conteúdo factual. Registros `pending` servem para catálogo/busca até serem revisados.

A resposta da IA deve sempre deixar claro que ela é uma ferramenta informativa, não substitui médico, farmacêutico ou outro profissional habilitado, e não deve ser usada para diagnosticar, prescrever, interromper ou alterar tratamento por conta própria.
