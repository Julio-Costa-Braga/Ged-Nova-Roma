# Configuração de Variáveis de Ambiente na Vercel

## ⚠️ Problema

Na Vercel, o arquivo `.env.production` **não existe** — as variáveis precisam ser configuradas no dashboard ou via CLI da Vercel.

O erro `ERRO: variável de ambiente "JWT_SECRET" não definida` ocorre quando as variáveis não estão configuradas no projeto Vercel.

## ✅ Solução

### Opção 1: Dashboard Vercel (GUI)

1. Abra seu projeto em: https://vercel.com/dashboard
2. Selecione o projeto `ged-faculdade-nova-roma`
3. Vá para **Settings** → **Environment Variables**
4. Adicione cada variável com seu valor:

| Nome | Valor |
|------|-------|
| `SUPABASE_URL` | `https://xaitvyfplvbchygsejjv.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | (seu token do Supabase) |
| `JWT_SECRET` | (seu secret — nunca exponha) |
| `ALLOWED_ORIGINS` | `https://gednovaroma.docflow.dev.br` |
| `PORT` | `3000` |
| `BASE_PATH` | `NOVAROMA` |
| `NODE_ENV` | `production` |

5. Clique **Save** para cada uma
6. Faça redeploy: **Deployments** → clique no último deployment → **Redeploy**

### Opção 2: CLI Vercel (recomendado)

```bash
# 1. Instale a CLI (se não tiver)
npm install -g vercel

# 2. Faça login
vercel login

# 3. Acesse o diretório do projeto
cd C:\Users\egarb\OneDrive\Desktop\GED\Ged\GED_1\GED_1

# 4. Configure cada variável
vercel env add SUPABASE_URL
# Cole: https://xaitvyfplvbchygsejjv.supabase.co

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Cole seu token (será mascarado)

vercel env add JWT_SECRET
# Cole seu secret (será mascarado)

vercel env add ALLOWED_ORIGINS
# Cole: https://gednovaroma.docflow.dev.br

vercel env add PORT
# Cole: 3000

vercel env add BASE_PATH
# Cole: NOVAROMA

vercel env add NODE_ENV
# Cole: production

# 5. Redeploy para aplicar as variáveis
vercel --prod
```

### Opção 3: vercel.json (melhor prática)

O arquivo `vercel.json` já está configurado, mas você precisa criar um arquivo `.env.local` para **secrets**:

```bash
# Crie .env.local (nunca commit no git)
echo "JWT_SECRET=seu-secret-aqui" > .env.local
echo "SUPABASE_SERVICE_ROLE_KEY=seu-token-aqui" >> .env.local
```

Depois, use `vercel env` para referenciá-los:

```bash
vercel env add JWT_SECRET @jwt_secret
```

## 🔑 Valores Necessários

### SUPABASE_URL
Encontre em: **Supabase Dashboard** → **Project Settings** → **API**
- Copie a URL do campo `Project URL`

### SUPABASE_SERVICE_ROLE_KEY
Encontre em: **Supabase Dashboard** → **Project Settings** → **API** → **Service Role Key**
- ⚠️ Nunca compartilhe este token

### JWT_SECRET
Já está configurado em `.env.production`:
```
AD2d43HCcfjI1oFJ12Mlp95Fm1wa+PnqmkCstpLZ2YVlsBOlAwkDW/LvR+n7c2JLCWlLlwlWyTf7wlNR02ORdg==
```

### ALLOWED_ORIGINS
Seu domínio Vercel/customizado:
```
https://gednovaroma.docflow.dev.br
```

## 🧪 Testar Localmente

Antes de fazer deploy, confirme que tudo funciona:

```bash
# 1. Certifique-se que .env.production ou .env.local existe
cd C:\Users\egarb\OneDrive\Desktop\GED\Ged\GED_1\GED_1

# 2. Rode o servidor
npm start

# 3. Verifique a mensagem de sucesso
# "Servidor GED iniciado em http://localhost:3000"
# "CORS permitido para: https://gednovaroma.docflow.dev.br"
```

## 🚀 Após Configurar

1. Faça commit das mudanças (exceto `.env.local`)
2. Push para GitHub
3. Vercel fará redeploy automaticamente
4. Verifique os logs em **Deployments** → **Logs**

## ❌ Troubleshooting

### Erro: "ERRO: variável de ambiente "JWT_SECRET" não definida"

**Causa**: Variável não foi configurada na Vercel  
**Solução**: Adicione via dashboard ou CLI (opções 1 ou 2 acima)

### Erro: "Origin bloqueada pelo CORS"

**Causa**: `ALLOWED_ORIGINS` não inclui seu domínio  
**Solução**: Verifique que `ALLOWED_ORIGINS` contém exatamente `https://gednovaroma.docflow.dev.br` (sem barra final)

### Erro: "SUPABASE_SERVICE_ROLE_KEY não encontrado"

**Causa**: Token do Supabase não configurado  
**Solução**: Copie de https://app.supabase.com → Project Settings → API → Service Role Key

## 📚 Referências

- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Supabase API Keys](https://supabase.com/docs/guides/api#api-url)

