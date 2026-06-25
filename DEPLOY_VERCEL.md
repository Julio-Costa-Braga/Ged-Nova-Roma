# 🚀 Guia de Deploy - Vercel + Domínio docflow.dev.br

## Passo 1: Instalar Vercel CLI
```powershell
npm install -g vercel
```

## Passo 2: Navegar para o diretório do projeto
```powershell
cd "C:\Users\egarb\OneDrive\Desktop\GED\Ged\GED_1\GED_1"
```

## Passo 3: Fazer login no Vercel
```powershell
vercel login
```
Isso vai abrir uma janela no navegador para você autenticar. Siga os passos.

## Passo 4: Deploy inicial
```powershell
vercel
```
Isso vai:
- Detectar a pasta do projeto
- Perguntar se é um novo projeto (responda `y`)
- Perguntar o nome do projeto (recomendado: `ged-docflow`)
- Fazer o deploy automático

Você receberá URLs:
- **Production**: https://seu-projeto.vercel.app
- **Preview**: para pull requests

## Passo 5: Configurar variáveis de ambiente no Vercel
```powershell
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add JWT_SECRET
vercel env add ALLOWED_ORIGINS
vercel env add MAIL_PROVIDER
vercel env add MAIL_API_KEY
vercel env add MAIL_FROM
```

Ou fazer via dashboard Vercel:
1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione cada variável com seus valores do `.env.production`

## Passo 6: Configurar domínio docflow.dev.br

### Via Vercel Dashboard:
1. Vá em **Settings** → **Domains**
2. Clique em **Add Domain**
3. Digite: `docflow.dev.br`
4. Vercel mostrará as opções:
   - **Nameservers** (mais fácil) - mudar NS do seu registrador
   - **CNAME** (mais específico) - apontar para vercel.com

### Opção A: Usar Nameservers (Recomendado)
1. Vá em seu registrador (GoDaddy, NameCheap, Registro.br, etc)
2. Mude os Nameservers para:
   - ns1.vercel-dns.com
   - ns2.vercel-dns.com
   - ns3.vercel-dns.com
   - ns4.vercel-dns.com

### Opção B: Usar CNAME
1. No painel DNS do seu registrador, crie:
   - Host: `@` (ou deixe em branco)
   - Type: `A`
   - Value: Verifique no painel Vercel qual IP usar
   
   Ou:
   - Host: `www`
   - Type: `CNAME`
   - Value: `cname.vercel-dns.com.`

## Passo 7: Redeploy com domínio
```powershell
vercel --prod
```

## Passo 8: Verificar
Acesse no navegador:
- https://docflow.dev.br
- http://docflow.dev.br

## Troubleshooting

### Build falhou?
```powershell
vercel logs [seu-projeto]
```

### Domínio não funciona?
- Aguarde propagação DNS (até 48h, geralmente 5-15 min)
- Verifique: `nslookup docflow.dev.br`
- Limpe cache: Ctrl+Shift+R no navegador

### Variáveis de ambiente não carregando?
1. Verifique no dashboard Vercel
2. Redeploy:
```powershell
vercel --prod
```

## URLs Importantes
- Dashboard: https://vercel.com/dashboard
- Seu projeto: https://vercel.com/dashboard/[seu-projeto]
- Logs: https://vercel.com/docs/concepts/analytics/web-analytics

## Próximos passos
- Ativar SSL (automático no Vercel)
- Configurar email se usar Resend
- Monitorar logs e performance
