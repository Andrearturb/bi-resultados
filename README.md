# BI Resultados

Aplicação web em React + TypeScript para análise de planilhas de operação e resultados. O app roda totalmente no navegador, sem backend, e transforma a planilha em filtros, KPIs e visualizações executivas.

## Principais recursos

- Importação local de planilha `.xlsx`.
- Normalização de status da coluna E da planilha.
- Filtros por região, status, categoria, subcategoria, fornecedor, analista e período.
- Cards executivos com volume, concluídos e taxa de conclusão.
- Gráficos de praça, evolução mensal e ranking de performance.
- Treemap hierárquico de categoria e subcategoria.
- Resumo executivo dinâmico com concentração e insights.

## Como executar localmente

```bash
npm install
npm run dev
```

Depois, abra o endereço exibido pelo Vite no terminal.

## Build e execução com Docker

```bash
docker compose up --build
```

Abra `http://localhost:8080`.

## Dados esperados na planilha

- O status fica na coluna E.
- A aplicação usa os campos de data, região, categoria, subcategoria, fornecedor e analista para montar os gráficos e filtros.
- O arquivo é processado no navegador; nada é enviado para um servidor.

## Personalização

- `src/config/branding.ts` centraliza nome da empresa, período e cores.
- Ajuste esse arquivo para adaptar o app à identidade da sua operação.