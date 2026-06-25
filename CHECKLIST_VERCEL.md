# ✅ Checklist Pré-Deploy Vercel

Antes de fazer deploy, verifique cada item:

## 🔧 Configuração Local (Teste)

- [ ] Arquivo `.env.local` ou `.env.production` existe com todas as variáveis
- [ ] Executou `npm install` sem erros
- [ ] Executou `npm test` — todos os testes passaram
- [ ] Executou `npm start` — servidor iniciou em `http://localhost:3000`
- [ ] Sem erros `ERRO: variável de ambiente`

## 🌐 Configuração Vercel

- [ ] Abriu https://vercel.com/dashboard
- [ ] Selecionou o projeto `ged-faculdade-nova-roma`
- [ ] Foi até **Settings** → **Environment Variables**
- [ ] Adicionou **todas** estas variáveis:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `JWT_SECRET`
  - [ ] `ALLOWED_ORIGINS`
  - [ ] `BASE_PATH`
  - [ ] `NODE_ENV` = `production`

## 🔒 Segurança

- [ ] Arquivo `.env.local` está no `.gitignore`
- [ ] `.env.production` **não** contém secrets (JWT_SECRET é apenas exemplo)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` foi configurado **apenas** na Vercel, não em .env

## 🚀 Deploy

- [ ] Fez `git push` para o repositório
- [ ] Vercel fez redeploy automaticamente OU clicou em **Redeploy**
- [ ] Esperou 2-3 minutos pelo build
- [ ] Verificou os logs em **Deployments**

## ✨ Teste Final

- [ ] Visitou https://gednovaroma.docflow.dev.br
- [ ] Página carregou sem erros 500
- [ ] Conseguiu fazer login com um usuário
- [ ] Enviou um arquivo ou realizou uma ação sem erros de CORS

---

**Se algo falhou**, veja [SETUP_VERCEL.md](./SETUP_VERCEL.md) para troubleshooting.

