# DoseCerta — Banco de medicamentos e importação

## Objetivo

O catálogo clínico fica separado dos dados pessoais dos usuários. O cliente pode consultar `medications` e `interactionRules`, mas não pode alterá-los.

O banco tem duas camadas:

1. **Catálogo regulatório**: identificação de produtos, princípios ativos, apresentações, registro, empresa e situação do registro.
2. **Conhecimento clínico revisado**: descrição, indicações, advertências, contraindicações, efeitos adversos, interações, gravidez/amamentação e administração.

Um medicamento pode existir no catálogo sem ter conhecimento clínico publicado. Por isso o campo `reviewStatus` começa como `pending`.

## Fonte principal

Para o catálogo regulatório brasileiro, a fonte-base escolhida é a Anvisa. A Agência mantém uma base pública de medicamentos registrados e o Bulário Eletrônico com bulas para pacientes e profissionais.

- Medicamentos registrados: https://dados.anvisa.gov.br/dados/DADOS_ABERTOS_MEDICAMENTOS.csv
- Bulário Eletrônico: https://www.gov.br/anvisa/pt-br/sistemas/bulario-eletronico

## Modelo de um medicamento

Cada documento em `medications/{medicationId}` possui, entre outros:

- `name`, `normalizedName`, `brandNames`, `aliases` e `searchTerms` para busca/autocomplete;
- `activeIngredients` para princípios ativos;
- `presentations` para apresentação, forma e via;
- `regulatory.registration`, `regulatory.company` e `regulatory.status` para dados regulatórios;
- campos clínicos reservados para conteúdo com fonte;
- `sources` para rastreabilidade;
- `reviewStatus` para controlar o que pode ser usado pela IA.

## Importação

O computador do usuário não precisa ter Node/npm. A importação é executada pelo GitHub Actions.

1. Em **Settings → Secrets and variables → Actions**, criar `FIREBASE_SERVICE_ACCOUNT_JSON` com uma credencial de conta de serviço do projeto Firebase.
2. Abrir **Actions → Importar medicamentos para o Firestore → Run workflow**.
3. Primeiro executar `dry-run`.
4. Conferir as estatísticas e a amostra dos registros.
5. Somente depois executar `import`.

O importador consolida linhas que pertencem ao mesmo produto/registro e preserva as apresentações e fontes encontradas.

Nunca coloque a credencial de serviço dentro do repositório, do ZIP ou do frontend.

## IA

A futura API deverá utilizar somente registros clínicos com `reviewStatus = published` para respostas médicas factuais. Registros `pending` servem para catálogo/busca até serem revisados.

A resposta da IA deve sempre deixar claro que ela é uma ferramenta informativa, não substitui médico, farmacêutico ou outro profissional habilitado, e não deve ser usada para diagnosticar, prescrever, interromper ou alterar tratamento por conta própria.
