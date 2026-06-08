# 🎯 SETUP FINAL - GED FACULDADE NOVA ROMA

## 📋 Resumo das Mudanças Realizadas

### ✅ Criados
- ✨ Sidebar lateral com menu aninhado
- 📝 JavaScript para gerenciar sidebar
- 📊 Queries SQL completas com usuários, colaboradores e documentos
- 📖 Documentação completa
- 💾 Exemplo de integração

### 📁 Arquivos Novos

```
frontend/
├── sidebar.html              ← Estrutura da sidebar
├── sidebar.js               ← Lógica JavaScript
├── SIDEBAR_EXAMPLE.html     ← Exemplo de integração
├── GUIA_SIDEBAR.md          ← Guia de integração
└── CODIGO_PRONTO.txt        ← Código pronto para copiar/colar

Supabase/
├── 02_setup_completo.sql    ← Queries com usuários e colaboradores
└── 03_queries_completas.sql ← Todas as queries do sistema
```

---

## 🚀 PASSO A PASSO PARA COMEÇAR

### 1️⃣ **Preparar o Banco de Dados (Supabase)**

Acesse seu projeto no Supabase e execute as queries:

```
SQL Editor → Pesquisador → Cole o código SQL
```

**Arquivos para executar (nessa ordem):**
1. `Supabase/02_setup_completo.sql`
2. `Supabase/03_queries_completas.sql`

**O que será criado:**
- 5 usuários de teste
- 5 colaboradores de exemplo
- Pastas de documentos RH
- 3 documentos financeiros
- Índices para performance

---

### 2️⃣ **Integrar Sidebar nas Páginas HTML**

#### **Para GED.HTML (Financeiro):**

```html
<!-- Adicione no HEAD, antes de </head> -->
<script src="sidebar.js"></script>

<!-- Substitua <main class="max-w-7xl mx-auto px-4 py-8 ..."> por: -->
<main class="max-w-7xl mx-auto px-4 py-8 ml-64 transition-all duration-300 ...">

<!-- Remova ou oculte a navbar superior -->
```

#### **Para RH.HTML:**

```html
<!-- Adicione no HEAD, antes de </head> -->
<script src="sidebar.js"></script>

<!-- Substitua <main class="max-w-7xl mx-auto px-4 py-10 ..."> por: -->
<main class="max-w-7xl mx-auto px-4 py-10 ml-64 transition-all duration-300 ...">

<!-- Remova ou oculte a navbar superior -->
```

#### **Para GESTAO.HTML:**

```html
<!-- Adicione no HEAD, antes de </head> -->
<script src="sidebar.js"></script>

<!-- Substitua <main class="max-w-7xl mx-auto px-4 py-10 space-y-8"> por: -->
<main class="max-w-7xl mx-auto px-4 py-10 ml-64 transition-all duration-300 space-y-8">

<!-- Remova ou oculte a navbar superior -->
```

**Veja o arquivo: `CODIGO_PRONTO.txt` para código completo pronto para copiar**

---

### 3️⃣ **Testar o Sistema**

```bash
# Terminal 1 - Iniciar servidor
npm start

# Navegador
http://localhost:3000
```

---

## 🔐 Usuários para Teste

| Email | Senha | Acesso | Descrição |
|-------|-------|--------|-----------|
| admin@novaroma.edu.br | Nova@123! | Ambos (Financeiro + RH) | Administrador |
| joao.financeiro@novaroma.edu.br | Senha@123! | Financeiro | Gestor Financeiro |
| maria.rh@novaroma.edu.br | Senha@123! | RH | Gestor RH |
| pedro.observador@novaroma.edu.br | Senha@123! | Apenas Observação | Observador (Leitura) |
| ana.admin@novaroma.edu.br | Senha@123! | Ambos | Assistente Administrativo |

---

## 📊 Estrutura do Menu Lateral

```
┌─────────────────────────────┐
│  NOVA ROMA - Sistema GED    │
│                             │
│  Bem-vindo                  │
│  [Admin Name]               │
└─────────────────────────────┘
│
├─ 👥 RECURSOS HUMANOS
│  ├── 📋 Colaboradores
│  └── 📊 Tabela de Funcionários
│
├─ 💰 FINANCEIRO
│  ├── 📄 Documentos GED
│  ├── 📸 Captura & Classificação
│  ├── 🗄️ Armazenamento e Fluxo
│  ├── 📈 Relatórios Financeiros
│  └── 💸 Fluxo de Caixa
│
├─ ⚙️ GESTÃO
│  ├── 👤 Cadastro de Usuários
│  └── 🔐 Controle de Acesso
│
├─────────────────
├─ 👤 Meu Perfil
└─ 🚪 Sair
```

---

## 🎨 Personalizações Possíveis

### Trocar Ícones
**Atualmente:** `<img src="images.png" alt="..." class="w-5 h-5">`

**Opção 1 - Usar imagens diferentes:**
```html
<img src="seu-icone.png" alt="RH" class="w-5 h-5">
```

**Opção 2 - Usar Lucide Icons:**
```html
<i data-lucide="users" class="w-5 h-5"></i>
```

### Trocar Cor da Sidebar
No `sidebar.html`, procure por `bg-blue-900` e mude:

```html
<!-- Trocar de: bg-blue-900 -->
<!-- Para: bg-indigo-900, bg-slate-900, bg-cyan-900, etc -->
<aside class="... bg-indigo-900 ...">
```

### Adicionar Novo Item ao Menu
```html
<div class="space-y-1">
    <button 
        onclick="toggleSidebarSubmenu(this)" 
        class="w-full flex items-center justify-between p-3 rounded-lg hover:bg-blue-800 transition group">
        <div class="flex items-center space-x-3 flex-1">
            <img src="images.png" alt="Novo" class="w-5 h-5">
            <span class="font-semibold text-sm">Novo Item</span>
        </div>
        <i data-lucide="chevron-right" class="w-4 h-4"></i>
    </button>
    <div class="submenu hidden pl-4 space-y-1">
        <a href="nova-pagina.html" class="block p-2 rounded-lg text-sm hover:bg-blue-800 transition">
            📌 Subitem
        </a>
    </div>
</div>
```

---

## 🧪 Checklist de Testes

- [ ] Servidor rodando (`npm start`)
- [ ] Login realizado com sucesso
- [ ] Sidebar aparece na página
- [ ] Clicar em menu expande submenu
- [ ] Clicar em subitem navega para página
- [ ] Nome do usuário aparece no header da sidebar
- [ ] Botão "Sair" funciona (faz logout)
- [ ] Abrir modal de perfil funciona
- [ ] Testar em mobile (F12 > Toggle device toolbar)
  - [ ] Menu hamburger aparece
  - [ ] Sidebar abre ao clicar
  - [ ] Sidebar fecha ao clicar fora
- [ ] Testar com diferentes usuários (admin, financeiro, rh, observador)

---

## 📚 Documentação Completa

### Principais Arquivos de Referência:

1. **`GUIA_SIDEBAR.md`** - Guia completo de integração e customização
2. **`CODIGO_PRONTO.txt`** - Código pronto para copiar/colar
3. **`SIDEBAR_EXAMPLE.html`** - Exemplo visual de integração
4. **`sidebar.html`** - Estrutura da sidebar
5. **`sidebar.js`** - Lógica e funções disponíveis
6. **`02_setup_completo.sql`** - Queries básicas
7. **`03_queries_completas.sql`** - Todas as queries do sistema

---

## 🆘 Problemas Comuns

### Problema: Sidebar não aparece
```
✓ Verificar se script src="sidebar.js" está no HEAD
✓ Abrir DevTools (F12) > Console para ver erros
✓ Verificar se arquivo sidebar.html existe no frontend/
```

### Problema: Menu não expande
```
✓ Verificar se Lucide icons está carregando
✓ Verificar F12 > Elements > .submenu
✓ Verificar console para erros de JavaScript
```

### Problema: Margin errada (conteúdo sobre a sidebar)
```
✓ Confirmar que ml-64 foi adicionado ao <main>
✓ Verificar se não há outro CSS conflitante
✓ Adicionar !important se necessário: ml-64 !important
```

### Problema: Usuário não aparece na sidebar
```
✓ Fazer logout e login novamente
✓ Abrir DevTools > Application > LocalStorage
✓ Procurar por "gedUser" - deve ter um valor
✓ Executar 02_setup_completo.sql novamente
```

---

## 💡 Próximos Passos Recomendados

1. ✅ Integrar sidebar em todas as páginas
2. ✅ Executar queries SQL no Supabase
3. ✅ Testar login com diferentes usuários
4. ✅ Implementar Controle de Acesso (mostrar/ocultar menus por permissão)
5. ✅ Adicionar funcionalidade de alterar senha
6. ✅ Criar página de cadatro de novos usuários
7. ✅ Implementar filtros por permissão na Gestão

---

## 📞 Suporte

Para dúvidas sobre:
- **Sidebar:** Ver `GUIA_SIDEBAR.md`
- **Código:** Ver `CODIGO_PRONTO.txt`
- **SQL:** Ver `03_queries_completas.sql`
- **Integração:** Ver `SIDEBAR_EXAMPLE.html`

---

## 📅 Informações do Projeto

- **Data:** 24/05/2026
- **Sistema:** GED Faculdade Nova Roma
- **Versão:** 2.5
- **Ambiente:** Node.js + Express + Supabase + Tailwind

---

**Tudo pronto! Comece a integrar a sidebar nas suas páginas! 🚀**
