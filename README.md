# BI Resultados

Front-end corporativo em React + TypeScript para importar uma planilha local e transformar os dados em filtros, KPIs e gráficos de performance.

## O que o app faz

- Importa uma planilha `.xlsx` no navegador, sem backend e sem banco.
- Processa os dados localmente e gera filtros dinâmicos.
- Exibe volume, taxa de conclusão por região, evolução mensal, ranking de fornecedores e categorias mais recorrentes.
- Inclui cards com métricas, barras de progresso, tabela de performance e áreas de insight.

## Como executar

```bash
npm install
npm run dev
```

## Build para Docker

```bash
docker compose up --build
```

Abra `http://localhost:8080`.

## Observação

O aplicativo depende da importação manual da planilha pelo usuário.

## Campos para ajustar depois

- `src/config/branding.ts` centraliza nome da empresa, período e cores.
- Os valores vêm com placeholder para facilitar a modificação futura.