# 🚀 Deploy na Vercel — Guia Rápido

## Problema Identificado
Erros de `JWT_SECRET` e `ALLOWED_ORIGINS` não definidos na Vercel ocorrem porque as **variáveis de ambiente não foram configuradas** no dashboard Vercel.

## ✅ Solução em 3 Passos

### 1️⃣ Adicione Variáveis na Vercel (Dashboard)
```
https://vercel.com/[seu-projeto]/settings/environment-variables
```

Adicione estas variáveis:

```
SUPABASE_URL                  = https://xaitvyfplvbchygsejjv.supabase.co
SUPABASE_SERVICE_ROLE_KEY     = [seu-token-do-supabase]
JWT_SECRET                    = AD2d43HCcfjI1oFJ12Mlp95Fm1wa+PnqmkCstpLZ2YVlsBOlAwkDW/LvR+n7c2JLCWlLlwlWyTf7wlNR02ORdg==
ALLOWED_ORIGINS               = https://gednovaroma.docflow.dev.br
NODE_ENV                      = production
BASE_PATH                     = NOVAROMA
PORT                          = 3000
```

### 2️⃣ Redeploy na Vercel
- Vá para **Deployments**
- Clique no último deployment
- Clique em **Redeploy**

### 3️⃣ Verifique os Logs
- Vá para **Deployments** → logs do seu projeto
- Procure por: `"CORS permitido para: https://gednovaroma.docflow.dev.br"`
- Sem erro `ERRO: variável de ambiente`

## 📖 Documentação Completa
Veja [SETUP_VERCEL.md](./SETUP_VERCEL.md) para instruções detalhadas e troubleshooting.

## 🔐 Segurança

⚠️ **Nunca** coloque secrets no `.env.production` que vai para Git:
- JWT_SECRET
- SUPABASE_SERVICE_ROLE_KEY

Use `.env.local` localmente (não commitado).

