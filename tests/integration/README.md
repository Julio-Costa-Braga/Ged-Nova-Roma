# Testes de integração

Os testes de integração requerem uma instância do Supabase configurada no `.env`.
Execute apenas em ambiente de staging/homologação — nunca em produção.

## Como executar

```bash
# 1. Configure .env com credenciais de um projeto Supabase de teste
# 2. Execute:
node --test tests/integration/*.test.js
```

## Cobertura planejada

- [ ] POST /api/auth/login — credenciais válidas retornam token
- [ ] POST /api/auth/login — credenciais inválidas retornam 401
- [ ] GET  /api/ged/documentos — sem token retorna 401
- [ ] GET  /api/ged/documentos — com token válido retorna lista paginada
- [ ] POST /api/ged/documentos — observador retorna 403
- [ ] POST /api/users — campos inválidos retornam 400 com detalhes Zod
