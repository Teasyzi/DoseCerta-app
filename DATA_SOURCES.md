# Fontes do banco clínico DoseCerta

## Fonte regulatória principal

**ANVISA — Medicamentos Registrados no Brasil**

Usada para o catálogo regulatório, identificação de produtos, princípios ativos e informações de registro.

Fonte oficial: https://dados.anvisa.gov.br/dados/

## Fonte clínica principal

**ANVISA — Bulário Eletrônico**

As bulas são a fonte clínica primária para informações como indicação, advertências, precauções, interações e reações adversas. A Anvisa mantém bulas para paciente e para profissional de saúde.

Fonte oficial: https://www.gov.br/anvisa/pt-br/sistemas/bulario-eletronico

## Regra de publicação

- `pending`: importado, mas ainda não revisado para uso clínico pelo DoseCerta.
- `reviewed`: conteúdo clínico revisado e com fontes identificadas.
- `published`: liberado para uso pela API/IA.
- `outdated`: precisa de nova revisão.

O catálogo regulatório pode ser atualizado automaticamente. O conteúdo clínico não deve ser preenchido automaticamente por um modelo de IA sem fonte identificável.
