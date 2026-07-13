// ============================================
// SIDEBAR MANAGEMENT - GED Faculdade Nova Roma
// ============================================

/**
 * Carrega a sidebar no DOM
 */
async function loadSidebar() {
    try {
        const response = await fetch('sidebar.html');
        const sidebarHTML = await response.text();
        
        // Insere toda a sidebar no início do body, incluindo estilos internos
        if (!document.getElementById('sidebar')) {
            document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
        }
        
        // Reinicializa ícones Lucide
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

            // Se a URL contém ?force_change_password=1, abre o modal de alteração de senha
            try {
                const params = new URLSearchParams(window.location.search);
                if (params.get('force_change_password')) {
                    // aguarda breve para garantir que a UI foi montada
                    setTimeout(() => { try { openChangePasswordModal(); } catch(e) { console.warn('openChangePasswordModal not available yet'); } }, 400);
                }
            } catch (e) { /* ignore */ }
        
        // Atualiza informações do usuário na sidebar — carrega `script.js` se necessário
        if (typeof getSession === 'function') {
            try { updateSidebarUserInfo(); } catch (e) { console.warn('updateSidebarUserInfo failed:', e); }
            try { filterSidebarByModules(); } catch (e) { console.warn('filterSidebarByModules failed:', e); }
            try { restoreSidebarState(); } catch (e) { console.warn('restoreSidebarState failed:', e); }
            try { activateCurrentSidebarSection(); } catch (e) { console.warn('activateCurrentSidebarSection failed:', e); }
        } else {
            const s = document.createElement('script');
            s.src = 'script.js';
            s.onload = function () {
                try { updateSidebarUserInfo(); } catch (e) { console.warn('updateSidebarUserInfo failed after load:', e); }
                try { filterSidebarByModules(); } catch (e) { console.warn('filterSidebarByModules failed after load:', e); }
                try { restoreSidebarState(); } catch (e) { console.warn('restoreSidebarState failed after load:', e); }
                try { activateCurrentSidebarSection(); } catch (e) { console.warn('activateCurrentSidebarSection failed after load:', e); }
            };
            s.onerror = function (err) { console.error('Failed to load script.js for sidebar:', err); };
            document.head.appendChild(s);
        }
    } catch (error) {
        console.error('Erro ao carregar sidebar:', error);
    }
}

/**
 * Toggle de submenu (expande/colapsa)
 */
function toggleSidebarSubmenu(button) {
    const submenu = button.nextElementSibling;
    if (!submenu || !submenu.classList) return;
    const isOpen = submenu.classList.contains('open');
    
    // Fecha outros submenus
    document.querySelectorAll('.submenu').forEach(menu => {
        if (menu !== submenu) {
            menu.classList.remove('open');
        }
    });
    
    // Toggle do submenu atual
    submenu.classList.toggle('open');
    
    // Salva estado no localStorage
    saveSidebarState();
}

/**
 * Atualiza informações do usuário na sidebar
 */
function updateSidebarUserInfo() {
    const session = getSession();
    const userNameElement = document.getElementById('sidebarUserName');
    const userPhoto = document.getElementById('sidebarUserPhoto');
    const userInitial = document.getElementById('sidebarUserInitial');
    const photoWrapper = document.getElementById('sidebarUserPhotoWrapper');

    if (userNameElement) {
        userNameElement.textContent = session.name || 'Usuário';
    }
    if (userPhoto && userInitial && photoWrapper) {
        if (session.photo) {
            userPhoto.src = session.photo;
            userPhoto.classList.remove('hidden');
            userInitial.classList.add('hidden');
            photoWrapper.classList.remove('bg-slate-50');
        } else {
            const initial = (session.name || 'U').trim().charAt(0).toUpperCase();
            userInitial.textContent = initial;
            userPhoto.classList.add('hidden');
            userInitial.classList.remove('hidden');
            photoWrapper.classList.add('bg-slate-50');
        }
    }
}

/**
 * Navegação com tracking de página
 */
function sidebarNavigate(page, tab) {
    const safeTab = tab ? encodeURIComponent(tab) : '';
    localStorage.setItem('sidebarCurrentPage', page);
    localStorage.setItem('sidebarCurrentTab', tab);
    
    if (page === 'ged') {
        window.location.href = `ged.html?tab=${safeTab}`;
        return;
    }
    if (page === 'rh') {
        window.location.href = `rh.html?tab=${safeTab}`;
        return;
    }
    if (page === 'gestao') {
        window.location.href = `gestao.html?tab=${safeTab}`;
        return;
    }
    window.location.href = `${page}.html${safeTab ? `?tab=${safeTab}` : ''}`;
}

/**
 * Toggle da sidebar (mobile)
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
}

/**
 * Fecha sidebar ao clicar fora (mobile)
 */
document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    
    if (sidebar && sidebarToggle && 
        !sidebar.contains(event.target) && 
        !sidebarToggle.contains(event.target)) {
        sidebar.classList.remove('open');
    }
});

/**
 * Salva estado dos submenus no localStorage
 */
function saveSidebarState() {
    const openSubmenus = [];
    document.querySelectorAll('.submenu.open').forEach((menu, index) => {
        openSubmenus.push(index);
    });
    localStorage.setItem('sidebarOpenSubmenus', JSON.stringify(openSubmenus));
}

/**
 * Restaura estado dos submenus do localStorage
 */
function restoreSidebarState() {
    const openSubmenus = JSON.parse(localStorage.getItem('sidebarOpenSubmenus') || '[]');
    const allSubmenus = document.querySelectorAll('.submenu');
    let restored = false;
    
    allSubmenus.forEach((menu, index) => {
        if (openSubmenus.includes(index)) {
            menu.classList.add('open');
            restored = true;
        }
    });

    if (!restored) {
        activateCurrentSidebarSection();
    }
    highlightCurrentSidebarItem();
}

function activateCurrentSidebarSection() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const pageName = currentPage.replace('.html', '');
    const moduleMap = {
        rh: 'rh',
        ged: 'financeiro',
        gestao: 'gestao',
        observador: 'financeiro'
    };
    const moduleName = moduleMap[pageName] || pageName;
    const category = document.querySelector(`#sidebar .sidebar-category[data-module="${moduleName}"]`);
    if (!category) return;

    const savedTab = localStorage.getItem('sidebarCurrentTab') || '';
    // Se há uma tab salva, tenta abrir o submenu baseado nela
    if (savedTab) {
        const link = category.querySelector(`.sidebar-nav a[data-tab="${savedTab}"]`);
        if (link) {
            const submenu = link.closest('.submenu');
            if (submenu) {
                submenu.classList.add('open');
                return;
            }
        }
    }

    const submenu = category.querySelector('.submenu');
    if (!submenu || submenu.classList.contains('open')) return;
    submenu.classList.add('open');
}

function highlightCurrentSidebarItem() {
    document.querySelectorAll('#sidebar .sidebar-nav a').forEach(link => {
        link.classList.remove('active');
    });

    let page = localStorage.getItem('sidebarCurrentPage');
    let tab = localStorage.getItem('sidebarCurrentTab');

    if (!page) {
        page = window.location.pathname.split('/').pop().replace('.html', '');
    }
    if (!tab) {
        const params = new URLSearchParams(window.location.search);
        tab = params.get('tab') || '';
    }
    if (!page) return;

    const selector = `#sidebar .sidebar-nav a[data-page="${page}"][data-tab="${tab || ''}"]`;
    let activeLink = document.querySelector(selector);
    if (!activeLink) {
        activeLink = document.querySelector(`#sidebar .sidebar-nav a[data-page="${page}"]`);
    }
    if (activeLink) {
        activeLink.classList.add('active');
        const category = activeLink.closest('.sidebar-category');
        if (category) {
            const submenu = category.querySelector('.submenu');
            if (submenu) submenu.classList.add('open');
        }
    }
}

/**
 * Abre modal de perfil
 */
function openProfileModal() {
    const session = getSession();
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-slate-900">Meu Perfil</h2>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-slate-600">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
            </div>
            
            <div class="space-y-4">
                <div class="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div class="w-16 h-16 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                        ${session.photo ? `<img src="${session.photo}" alt="Foto de ${session.name || 'usuário'}" class="w-full h-full object-cover">` : `<span class="text-lg font-semibold text-slate-700">${(session.name || 'U').trim().charAt(0).toUpperCase()}</span>`}
                    </div>
                    <div>
                        <p class="text-xs text-slate-500 uppercase">Usuário</p>
                        <p class="text-lg font-semibold text-slate-900">${session.name || 'N/A'}</p>
                        <p class="text-sm text-slate-500">${session.username || ''}</p>
                    </div>
                </div>
                
                <div class="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <p class="text-xs text-slate-500 uppercase">Perfil</p>
                    <p class="text-lg font-semibold text-slate-900">${session.role || 'N/A'}</p>
                </div>
                
                <div class="grid grid-cols-2 gap-3">
                    <div class="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <p class="text-xs text-slate-500 uppercase">Acesso</p>
                        <p class="text-sm font-semibold text-slate-900">
                            ${session.access === 'ambos' ? 'Todos' : 
                              session.access === 'financeiro' ? 'Financeiro' : 
                              session.access === 'rh' ? 'RH' : 'Observador'}
                        </p>
                    </div>
                    
                    <div class="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <p class="text-xs text-slate-500 uppercase">Modo</p>
                        <p class="text-sm font-semibold text-slate-900">
                            ${session.readOnly ? '👁️ Apenas Leitura' : '✏️ Edição'}
                        </p>
                    </div>
                </div>
            </div>
            
            <div class="mt-6 flex gap-2">
                <button onclick="this.closest('.fixed').remove()" 
                        class="flex-1 px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition">
                    Fechar
                </button>
                <button onclick="openChangePasswordModal()" 
                        class="flex-1 px-4 py-2 rounded-xl bg-blue-900 text-white font-semibold hover:bg-blue-800 transition">
                    Alterar Senha
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/**
 * Abre modal para alterar senha
 */
function openChangePasswordModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-slate-900">Alterar Senha</h2>
                <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-slate-600">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
            </div>
            
            <form id="changePasswordForm" class="space-y-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-600 uppercase mb-2">Senha Atual</label>
                    <input type="password" id="currentPassword" class="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-900 outline-none" required>
                </div>
                
                <div>
                    <label class="block text-xs font-semibold text-slate-600 uppercase mb-2">Nova Senha</label>
                    <input type="password" id="newPassword" class="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-900 outline-none" required>
                </div>
                
                <div>
                    <label class="block text-xs font-semibold text-slate-600 uppercase mb-2">Confirmar Senha</label>
                    <input type="password" id="confirmPassword" class="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-900 outline-none" required>
                </div>
                
                <p id="changePasswordError" class="hidden text-xs text-red-600"></p>
                
                <div class="flex gap-2">
                    <button type="button" onclick="this.closest('.fixed').remove()" 
                            class="flex-1 px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition">
                        Cancelar
                    </button>
                    <button type="submit" 
                            class="flex-1 px-4 py-2 rounded-xl bg-blue-900 text-white font-semibold hover:bg-blue-800 transition">
                        Alterar
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Primeiro modal será removido
    const previousModal = document.querySelectorAll('.fixed')[0];
    if (previousModal && previousModal !== modal) {
        previousModal.remove();
    }
    
    // Handler do formulário
    document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorElement = document.getElementById('changePasswordError');
        
        if (newPassword !== confirmPassword) {
            errorElement.textContent = 'As senhas não coincidem';
            errorElement.classList.remove('hidden');
            return;
        }
        
        try {
            // Chama API para alterar senha do usuário autenticado
            await apiFetch('/users/change-password', { method: 'POST', body: JSON.stringify({ newPassword }) });
            showToast('Senha alterada', 'Senha alterada com sucesso. Faça login novamente.', 'bg-green-700');
            clearSession();
            window.location.href = 'index.html';
        } catch (error) {
            errorElement.textContent = error.message || (error && error.toString()) || 'Erro ao alterar senha';
            errorElement.classList.remove('hidden');
        }
    });
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Carrega sidebar quando a página está pronta
document.addEventListener('DOMContentLoaded', loadSidebar);
