# Auditoria de Segurança - GED Backend/Frontend
**Data:** 01/06/2026  
**Nível:** Sênior  
**Status:** 13 vulnerabilidades encontradas

---

## CRÍTICAS (Corrigir imediatamente)

### 1. XSS - Cross-Site Scripting via innerHTML
**Arquivo:** `frontend/ged.html`  
**Severity:** CRÍTICA  
**Descrição:** Múltiplas linhas usam `innerHTML +=` para renderizar dados dinâmicos sem sanitização.  
**Linhas afetadas:** 927, 931, 943, 1291, 1296, 1308, 1441, 1528, 1530, 1568, 1655, 1656, 1659, 1660, 1667  
**Risco:** Injeção maliciosa de scripts, roubo de token JWT, deface  
```javascript
// ❌ VULNERÁVEL
tbody.innerHTML += `<tr><td>${doc.name}</td>...`; // doc.name não validado
```

### 2. HTML Injection via insertAdjacentHTML
**Arquivo:** `frontend/sidebar.js`  
**Severity:** CRÍTICA  
**Descrição:** `insertAdjacentHTML` permite injeção de HTML/scripts.  
```javascript
// ❌ VULNERÁVEL
document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
```

### 3. Armazenamento Inseguro de Credenciais
**Arquivo:** `frontend/script.js`, `frontend/ged.html`  
**Severity:** CRÍTICA  
**Descrição:** Token JWT armazenado em `localStorage` sem proteção.  
```javascript
// ❌ VULNERÁVEL - Token acessível via DevTools/XSS
localStorage.setItem('gedUserToken', token);
```
**Risco:** Se XSS for explorado, atacante obtém token JWT e acessa API como usuário.

### 4. Supabase Anon Key Exposta
**Arquivo:** `frontend/supabase.js`  
**Severity:** CRÍTICA  
**Descrição:** Chave pública do Supabase hardcoded e visível.  
```javascript
const SUPABASE_ANON_KEY = 'sb_publishable_IVL1sN_u0e5uF1Pmhz9HIQ_vRgK6gP8';
```
**Risco:** Atacante pode usar chave para acessar Supabase diretamente, contornar backend.

### 5. Falta de Rate Limiting
**Arquivo:** `server.js`, `backend/routes/auth.js`  
**Severity:** CRÍTICA  
**Descrição:** Sem limitação de requisições - vulnerável a brute force no login.  
**Risco:** Ataque de força bruta em contas de usuário.

### 6. Falta de CSRF Protection
**Arquivo:** Todos os formulários  
**Severity:** CRÍTICA  
**Descrição:** Sem tokens CSRF nas requisições POST/PUT/DELETE.  
**Risco:** Ataque Cross-Site Request Forgery.

---

## ALTAS (Corrigir em 1-2 dias)

### 7. Validação Insuficiente de IDs
**Arquivo:** `backend/routes/ged.js`, `backend/routes/users.js`  
**Severity:** ALTA  
**Descrição:** `Number(req.params.id)` sem validação se é inteiro positivo.  
```javascript
// ❌ FRACO
const documento = await getDocumentoById(Number(req.params.id));
```

### 8. Falta de HTTP Security Headers
**Arquivo:** `server.js`  
**Severity:** ALTA  
**Descrição:** Sem CSP, HSTS, X-Frame-Options, X-Content-Type-Options.  
**Risco:** Clickjacking, MIME type sniffing, man-in-the-middle.

### 9. Sem Audit Logging
**Arquivo:** Todas as rotas  
**Severity:** ALTA  
**Descrição:** Nenhuma operação é registrada (create/update/delete).  
**Risco:** Não há trilha de auditoria para compliance.

### 10. Exposição de Stack Traces
**Arquivo:** `backend/routes/*.js`  
**Severity:** ALTA  
**Descrição:** Erros não tratados expõem detalhes internos.  
```javascript
// ❌ FRACO
console.error('Error:', error); // Mostra stack trace completo
res.status(500).json({ error: 'Erro ao criar documento GED.' }); // Genérico, mas console expõe
```

---

## MÉDIAS (Corrigir em 3-5 dias)

### 11. Sem Validação de Email
**Arquivo:** `backend/routes/users.js`  
**Severity:** MÉDIA  
**Descrição:** Campo email_assinante não valida formato de email.

### 12. Sem Compressão de Resposta
**Arquivo:** `server.js`  
**Severity:** MÉDIA  
**Descrição:** Sem gzip - respostas grandes não comprimidas.

### 13. Sem Monitoramento de Dependências
**Arquivo:** `package.json`  
**Severity:** MÉDIA  
**Descrição:** Dependências fixas - sem auditorias periódicas de vulnerabilidades.

---

## CORREÇÕES IMPLEMENTADAS

- ✅ Sanitização de innerHTML
- ✅ Rate limiting na API
- ✅ HTTP Security Headers
- ✅ CSRF protection
- ✅ Validação robusta de IDs
- ✅ Logging de auditoria
- ✅ Tratamento seguro de erros

---

## TESTES RECOMENDADOS

1. **Teste de XSS:** Injetar `<img src=x onerror="alert('XSS')">` em campos
2. **Teste de CSRF:** Criar formulário externo
3. **Teste de Brute Force:** 100 tentativas de login
4. **Teste de Injection:** Injetar caracteres especiais em IDs
5. **Teste de Exposição:** Verificar headers HTTP

