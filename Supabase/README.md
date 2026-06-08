# Supabase Integration for GED

Este diretório contém um esquema inicial e helpers para as queries utilizadas pela aplicação.

## Arquivos

- `schema.sql` - definição das tabelas e chaves do Supabase
- `queries.js` - funções de exemplo para consultar e salvar dados nas tabelas do Supabase

## Como usar

1. Copie `.env.example` para `.env` e preencha com `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`.
2. Mantenha `.env` fora do controle de versão usando `.gitignore`.
3. No frontend, use apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Para operações seguras do Supabase, execute `npm run backend` e chame uma rota do servidor em vez de usar a `SUPABASE_SERVICE_ROLE_KEY` no browser.
5. Se quiser usar `Supabase/queries.js`, adapte-o para o seu ambiente de bundler ou use os helpers diretamente em `supabase.js`.

## Principais tabelas

- `usuarios`
- `colaboradores`
- `pastas_documentos`
- `movimentacoes_rh`
- `contratos`
- `documentos_ged`
- `transacoes_financeiras`
- `anexos_documentos`

## Nota

Mantenha a `anon key` pública apenas no frontend e use a `service_role` apenas em ambiente de backend seguro.
