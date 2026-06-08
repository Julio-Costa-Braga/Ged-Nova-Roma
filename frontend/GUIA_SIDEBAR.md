# 🎯 Guia de Integração - Sidebar Lateral

## Visão Geral

A sidebar lateral foi desenvolvida para reorganizar o menu superior em um menu lateral moderno com submenu aninhado. Este guia mostra como integrar em todas as páginas do projeto.

---

## 📋 Mudanças Necessárias

### 1️⃣ **Scripts adicionais no HEAD**

Adicione antes de fechar a tag `</head>`:

```html
<script src="sidebar.js"></script>
```

### 2️⃣ **Remover/Ocultar a navbar antiga**

A navbar antiga pode ser removida ou ocultada com CSS:

```css
nav {
    display: none; /* Oculta a navbar horizontal */
}
```

### 3️⃣ **Adicionar margin ao MAIN**

Adicione a classe `ml-64` aos elementos `<main>`:

```html
<main class="ml-64 transition-all duration-300">
    <!-- Conteúdo aqui -->
</main>
```

Ou use CSS:

```css
main {
    margin-left: 16rem; /* 64 unidades Tailwind = 16rem */
}
```

---

## 📄 Arquivos Criados

### 1. `sidebar.html`
- Contém a estrutura HTML da sidebar
- Inclui menu aninhado com chevron
- Header com logo e informações do usuário
- Responsivo para mobile

### 2. `sidebar.js`
- Gerencia toggle de submenus
- Atualiza informações do usuário
- Salva estado em localStorage
- Modal de perfil do usuário

### 3. `SIDEBAR_EXAMPLE.html`
- Exemplo completo de integração
- Mostra o layout correto com sidebar
- Use como referência para atualizar outras páginas

### 4. `02_setup_completo.sql`
- Queries SQL para popular o banco
- Usuários de exemplo (admin, financeiro, rh, observador)
- Colaboradores exemplo
- Índices para performance

---

## 🚀 Como Integrar em Cada Página

### **ged.html (Financeiro)**

1. Adicione no `<head>`:
```html
<script src="sidebar.js"></script>
```

2. Altere o `<main>` para:
```html
<main class="max-w-7xl mx-auto px-4 py-8 ml-64 transition-all duration-300 grid grid-cols-1 lg:grid-cols-3 gap-8">
```

3. Remova ou oculte a navbar superior

4. Teste a navegação: clique nos itens do menu "Financeiro"

---

### **rh.html (Recursos Humanos)**

1. Adicione no `<head>`:
```html
<script src="sidebar.js"></script>
```

2. Altere o `<main>` para:
```html
<main class="max-w-7xl mx-auto px-4 py-10 ml-64 transition-all duration-300">
```

3. Remova ou oculte a navbar superior

4. Teste a navegação: clique nos itens do menu "Recursos Humanos"

---

### **gestao.html (Gestão)**

1. Adicione no `<head>`:
```html
<script src="sidebar.js"></script>
```

2. Altere o `<main>` para:
```html
<main class="max-w-7xl mx-auto px-4 py-10 ml-64 transition-all duration-300 space-y-8">
```

3. Remova ou oculte a navbar superior

4. Teste a navegação: clique nos itens do menu "Gestão"

---

## 🔧 Personalização

### Alterar cores da sidebar

Edite `sidebar.html` e procure por `bg-blue-900`:

```html
<!-- Mude de bg-blue-900 para qualquer cor Tailwind -->
<aside id="sidebar" class="fixed left-0 top-0 w-64 h-screen bg-blue-900 ...">
```

### Alterar ícones

Atualmente usa `images.png`. Para mudar:

```html
<img src="images.png" alt="RH" class="w-5 h-5">
```

Substitua `images.png` pela sua imagem ou use ícones Lucide:

```html
<i data-lucide="users" class="w-5 h-5"></i>
```

### Adicionar novo item ao menu

Adicione na seção de menu do `sidebar.html`:

```html
<div class="space-y-1">
    <button 
        onclick="toggleSidebarSubmenu(this)" 
        class="w-full flex items-center justify-between p-3 rounded-lg hover:bg-blue-800 transition group">
        <div class="flex items-center space-x-3 flex-1">
            <img src="images.png" alt="Novo" class="w-5 h-5">
            <span class="font-semibold text-sm">Novo Item</span>
        </div>
        <i data-lucide="chevron-right" class="w-4 h-4 transition-transform group-hover:translate-x-1"></i>
    </button>
    <div class="submenu hidden pl-4 space-y-1">
        <a href="nova-pagina.html" 
           class="block p-2 rounded-lg text-sm hover:bg-blue-800 transition text-blue-200 hover:text-white">
            📌 Subitem 1
        </a>
    </div>
</div>
```

---

## 📱 Responsividade

A sidebar é responsiva para mobile:

- Em telas < 768px: sidebar fica oculta por padrão
- Um botão de menu (≡) aparece no topo
- Clique no botão para abrir/fechar
- Clicar fora fecha automaticamente

### CSS Mobile:
```css
@media (max-width: 768px) {
    #sidebar {
        transform: translateX(-100%);
    }
    
    #sidebar.open {
        transform: translateX(0);
    }
    
    #mainContent {
        margin-left: 0;
    }
    
    #sidebarToggle {
        display: block;
    }
}
```

---

## 🔑 Funções JavaScript Disponíveis

| Função | Descrição |
|--------|-----------|
| `loadSidebar()` | Carrega a sidebar no DOM |
| `toggleSidebarSubmenu(button)` | Abre/fecha submenu |
| `updateSidebarUserInfo()` | Atualiza nome do usuário |
| `sidebarNavigate(page, tab)` | Navega para página com tab |
| `toggleSidebar()` | Toggle da sidebar (mobile) |
| `openProfileModal()` | Abre modal de perfil |
| `openChangePasswordModal()` | Abre modal para alterar senha |
| `saveSidebarState()` | Salva estado dos submenus |
| `restoreSidebarState()` | Restaura estado do localStorage |

---

## 🗄️ Dados de Teste (SQL)

Execute o arquivo `02_setup_completo.sql` no Supabase:

### Usuários criados:
- **Admin**: `admin@novaroma.edu.br` / `Nova@123!` (acesso: ambos)
- **Financeiro**: `joao.financeiro@novaroma.edu.br` / `Senha@123!` (acesso: financeiro)
- **RH**: `maria.rh@novaroma.edu.br` / `Senha@123!` (acesso: rh)
- **Observador**: `pedro.observador@novaroma.edu.br` / `Senha@123!` (acesso: apenas-observador)

### Estrutura de Colaboradores:
- Carlos Silva (Analista de Sistemas)
- Ana Santos (Gerente Financeiro)
- Roberto Costa (Assistente RH)

---

## ⚙️ Configuração de Acesso

A sidebar respeita os níveis de acesso definidos no banco:

- **ambos**: Acesso a Financeiro, RH e Gestão
- **financeiro**: Acesso apenas a Financeiro
- **rh**: Acesso apenas a RH
- **apenas-observador**: Acesso apenas leitura (sem edição)

---

## 🧪 Teste Completo

1. ✅ Rode `npm install` (já feito)
2. ✅ Execute `02_setup_completo.sql` no Supabase
3. ✅ Inicie o servidor: `npm start`
4. ✅ Acesse `http://localhost:3000`
5. ✅ Faça login com admin@novaroma.edu.br / Nova@123!
6. ✅ Verifique se a sidebar aparece
7. ✅ Clique nos itens do menu para expandir/colapsar
8. ✅ Teste navegação para cada página
9. ✅ Teste em mobile (F12 → Toggle device toolbar)

---

## 📌 Estrutura Final do Menu

```
📦 NOVA ROMA - Sistema GED

├── 👥 Recursos Humanos
│   ├── 📋 Colaboradores
│   └── 📊 Tabela de Funcionários
│
├── 💰 Financeiro
│   ├── 📄 Documentos GED
│   ├── 📸 Captura & Classificação
│   ├── 🗄️ Armazenamento e Fluxo
│   ├── 📈 Relatórios Financeiros
│   └── 💸 Fluxo de Caixa
│
├── ⚙️ Gestão
│   ├── 👤 Cadastro de Usuários
│   └── 🔐 Controle de Acesso
│
├── ─────────────────
├── 👤 Meu Perfil
└── 🚪 Sair
```

---

## 🆘 Troubleshooting

### Sidebar não aparece
- [ ] Verificar se `sidebar.js` está no HEAD
- [ ] Verificar console (F12) por erros
- [ ] Verificar se `sidebar.html` está no mesmo diretório

### Menu não expande
- [ ] Verificar se Lucide icons está carregado
- [ ] Verificar CSS de `.submenu`
- [ ] Verificar função `toggleSidebarSubmenu()`

### Usuário não aparece
- [ ] Verificar se `script.js` está carregando antes de `sidebar.js`
- [ ] Verificar `localStorage` (F12 → Application → LocalStorage)
- [ ] Verificar se `getSession()` está retornando dados

### Margin errada em mobile
- [ ] Adicionar breakpoints Tailwind
- [ ] Ajustar CSS media queries
- [ ] Testar com `md:ml-64` ao invés de `ml-64`

---

## 💡 Próximos Passos

1. Integrar sidebar em todas as páginas HTML
2. Criar funcionalidade de Controle de Acesso
3. Adicionar ícones customizados de modo de apenas-observador
4. Implementar funcionalidade de alterar senha
5. Adicionar breadcrumbs de navegação

---

**Desenvolvido para Faculdade Nova Roma**
Data: 24/05/2026
