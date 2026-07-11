// ============================================
// Shared utilities - GED Faculdade Nova Roma
// ============================================

function getBasePath() {
    const pathSegments = window.location.pathname.split('/');
    if (pathSegments.length > 1 && pathSegments[1].toUpperCase() === 'NOVAROMA') {
        return '/NOVAROMA';
    }
    return '';
}

const BASE_PATH = getBasePath();
const API_BASE = (window.location.protocol === 'file:' || window.location.port === '5500' || window.location.port === '5501')
    ? 'http://localhost:3000/api'
    : `${BASE_PATH}/api`;
const SESSION_KEY = 'gedAuth';
const SESSION_USER_KEY = 'gedUser';
const SESSION_USER_PHOTO_KEY = 'gedUserPhoto';
const SESSION_ROLE_KEY = 'gedUserRole';
const SESSION_ACCESS_KEY = 'gedUserAccess';
const SESSION_MODULES_KEY = 'gedUserModules';
const SESSION_READONLY_KEY = 'gedUserReadOnly';
const SESSION_TOKEN_KEY = 'gedUserToken';

// Fallback when external lucide icons script is blocked by browser tracking prevention.
if (typeof window.lucide === 'undefined') {
    window.lucide = {
        createIcons: function () {
            return;
        }
    };
}

async function apiFetch(path, options = {}) {
    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    const response = await fetch(`${API_BASE}${path}`, {
        headers: {
            ...headers,
            ...(options.headers || {})
        },
        credentials: 'same-origin',
        ...options
    });

    const body = await response.text();
    let data = null;
    try {
        data = JSON.parse(body);
    } catch (error) {
        // ignore parse errors
    }

    if (!response.ok) {
        throw new Error((data && data.error) || `Erro na API: ${response.status}`);
    }

    return data;
}

function getSession() {
    const modulesJson = localStorage.getItem(SESSION_MODULES_KEY);
    let modules = {};
    try {
        modules = modulesJson ? JSON.parse(modulesJson) : {};
    } catch (error) {
        modules = {};
    }

    return {
        username: localStorage.getItem(SESSION_KEY),
        name: localStorage.getItem(SESSION_USER_KEY),
        photo: localStorage.getItem(SESSION_USER_PHOTO_KEY),
        role: localStorage.getItem(SESSION_ROLE_KEY),
        access: localStorage.getItem(SESSION_ACCESS_KEY),
        modules,
        readOnly: localStorage.getItem(SESSION_READONLY_KEY) === 'true'
    };
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_USER_KEY);
    localStorage.removeItem(SESSION_USER_PHOTO_KEY);
    localStorage.removeItem(SESSION_ROLE_KEY);
    localStorage.removeItem(SESSION_ACCESS_KEY);
    localStorage.removeItem(SESSION_MODULES_KEY);
    localStorage.removeItem(SESSION_READONLY_KEY);
    localStorage.removeItem(SESSION_TOKEN_KEY);
}

function setSessionFromUser(user, token) {
    if (!user) return;
    normalizeUserModules(user);
    localStorage.setItem(SESSION_KEY, user.username.toLowerCase());
    localStorage.setItem(SESSION_USER_KEY, user.name);
    if (user.photo) {
        localStorage.setItem(SESSION_USER_PHOTO_KEY, user.photo);
    }
    localStorage.setItem(SESSION_ROLE_KEY, user.role || 'usuario');
    localStorage.setItem(SESSION_ACCESS_KEY, user.access || 'ambos');
    localStorage.setItem(SESSION_MODULES_KEY, JSON.stringify(user.modules));
    localStorage.setItem(SESSION_READONLY_KEY, user.readOnly ? 'true' : 'false');
    if (token) {
        localStorage.setItem(SESSION_TOKEN_KEY, token);
    }
}

async function apiLogin(identifier, password) {
    return apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password })
    });
}

async function apiListUsers() {
    return apiFetch('/users');
}

async function apiCreateUser(payload) {
    return apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

async function apiUpdateUser(id, payload) {
    return apiFetch(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
    });
}

async function apiDeleteUser(id) {
    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    
    const response = await fetch(`${API_BASE}/users/${id}`, {
        method: 'DELETE',
        headers,
        credentials: 'same-origin'
    });
    if (!response.ok) {
        const body = await response.text();
        let data = null;
        try { data = JSON.parse(body); } catch (error) {}
        throw new Error((data && data.error) || 'Erro ao excluir usuário');
    }
}

const MODULES = ['ged', 'rh', 'financeiro', 'gestao'];
const MODULE_LABELS = {
    ged: 'Documentos (GED)',
    rh: 'Recursos Humanos',
    financeiro: 'Financeiro',
    gestao: 'Gestão de Usuários'
};

function getDefaultModules(access) {
    const all = {
        ged: true,
        rh: true,
        financeiro: true,
        gestao: true,
        'financeiro-captura': true,
        'financeiro-armazenamento': true,
        'financeiro-relatorios': true,
        'rh-colaboradores': true,
        'rh-tabela': true,
        'rh-envio': true,
        'rh-ferias': true
    };
    if (!access || access === 'ambos') return all;
    if (access === 'financeiro') return {
        ged: true,
        rh: false,
        financeiro: true,
        gestao: false,
        'financeiro-captura': true,
        'financeiro-armazenamento': true,
        'financeiro-relatorios': true,
        'rh-colaboradores': false,
        'rh-tabela': false,
        'rh-envio': false,
        'rh-ferias': false
    };
    if (access === 'rh') return {
        ged: true,
        rh: true,
        financeiro: false,
        gestao: false,
        'financeiro-captura': false,
        'financeiro-armazenamento': false,
        'financeiro-relatorios': false,
        'rh-colaboradores': true,
        'rh-tabela': true,
        'rh-envio': true,
        'rh-ferias': true
    };
    if (access === 'apenas-observador') return all;
    return all;
}

function normalizeUserModules(user) {
    const defaults = getDefaultModules(user.access);
    if (!user.modules || typeof user.modules !== 'object') {
        user.modules = defaults;
    } else {
        user.modules = { ...defaults, ...user.modules };
    }

    user.modules.financeiro = user.modules.financeiro || user.modules['financeiro-captura'] || user.modules['financeiro-armazenamento'] || user.modules['financeiro-relatorios'];
    user.modules.rh = user.modules.rh || user.modules['rh-colaboradores'] || user.modules['rh-tabela'] || user.modules['rh-envio'] || user.modules['rh-ferias'];
    user.modules.ged = user.modules.ged || user.modules.financeiro || user.modules.rh || user.modules.gestao;
    user.modules.gestao = user.modules.gestao || user.role === 'administrador';

    if (user.access === 'apenas-observador' || user.access === 'observador') {
        user.readOnly = true;
    } else {
        user.readOnly = user.readOnly || false;
    }
    return user;
}

function buildUserModulesFromPermissions(prefix, access) {
    const modules = {
        'financeiro-captura': !!document.getElementById(`${prefix}PermissionFinanceiroCaptura`)?.checked,
        'financeiro-armazenamento': !!document.getElementById(`${prefix}PermissionFinanceiroArmazenamento`)?.checked,
        'financeiro-relatorios': !!document.getElementById(`${prefix}PermissionFinanceiroRelatorios`)?.checked,
        'rh-colaboradores': !!document.getElementById(`${prefix}PermissionRHColaboradores`)?.checked,
        'rh-tabela': !!document.getElementById(`${prefix}PermissionRHTabela`)?.checked,
        'rh-envio': !!document.getElementById(`${prefix}PermissionRHEnvio`)?.checked,
        'rh-ferias': !!document.getElementById(`${prefix}PermissionRHFerias`)?.checked,
        gestao: !!document.getElementById(`${prefix}PermissionGestao`)?.checked
    };

    const anySelected = Object.values(modules).some(value => value === true);
    if (!anySelected) {
        return getDefaultModules(access);
    }

    modules.financeiro = modules['financeiro-captura'] || modules['financeiro-armazenamento'] || modules['financeiro-relatorios'];
    modules.rh = modules['rh-colaboradores'] || modules['rh-tabela'] || modules['rh-envio'] || modules['rh-ferias'];
    modules.ged = modules.ged || modules.financeiro || modules.rh || modules.gestao;
    return modules;
}

function userCanAccess(user, moduleName) {
    normalizeUserModules(user);
    return user.modules && user.modules[moduleName] === true;
}

function getSessionModule(moduleName) {
    const modulesJson = localStorage.getItem('gedUserModules');
    if (!modulesJson) return true;
    try {
        const mods = JSON.parse(modulesJson);
        return mods[moduleName] === true;
    } catch { return true; }
}

function isSessionReadOnly() {
    return localStorage.getItem('gedUserReadOnly') === 'true';
}

function isObserver() {
    return isSessionReadOnly();
}

function isSidebarElement(el) {
    return el.closest('#sidebar') || el.closest('.sidebar-nav');
}

function applyObserverMode() {
    if (!isObserver()) return;
    if (document.getElementById('observerBanner')) return;
    document.querySelectorAll('button, input, select, textarea, a').forEach(el => {
        if (el.classList.contains('btn-logout')) return;
        if (el.classList.contains('btn-refresh')) return;
        if (isSidebarElement(el)) return;

        if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
            el.disabled = true;
            el.classList.add('opacity-60', 'cursor-not-allowed');
        }
        if (el.tagName === 'BUTTON') {
            if (el.classList.contains('observer-allow')) return;
            el.disabled = true;
            el.classList.add('opacity-60', 'cursor-not-allowed');
        }
        if (el.tagName === 'A') {
            el.classList.add('pointer-events-none', 'opacity-60');
            el.style.pointerEvents = 'none';
        }
    });
    document.querySelectorAll('.btn-logout, .btn-refresh').forEach(el => {
        el.disabled = false;
        el.classList.remove('opacity-60', 'cursor-not-allowed');
    });
    const observerBanner = document.createElement('div');
    observerBanner.id = 'observerBanner';
    observerBanner.className = 'fixed top-0 left-0 right-0 bg-yellow-500 text-yellow-900 text-center text-xs font-bold py-1 z-50';
    observerBanner.textContent = '🔍 MODO OBSERVADOR — Você está visualizando sem permissão para editar.';
    document.body.prepend(observerBanner);
}

function filterSidebarByModules() {
    const modulesJson = localStorage.getItem('gedUserModules');
    if (!modulesJson) return;
    let mods;
    try { mods = JSON.parse(modulesJson); } catch { return; }

    document.querySelectorAll('#sidebar .sidebar-category').forEach(cat => {
        const moduleName = cat.dataset.module;
        if (moduleName && !mods[moduleName]) {
            cat.style.display = 'none';
        }
    });
}

const SYNC_KEY = 'gedSyncTimestamp';

function notifyDataChange(source) {
    localStorage.setItem(SYNC_KEY, JSON.stringify({ ts: Date.now(), source: source || 'unknown' }));
}

function setupSyncListener(callback) {
    window.addEventListener('storage', function (e) {
        if (e.key === SYNC_KEY && e.newValue) {
            try {
                const data = JSON.parse(e.newValue);
                if (data.source !== 'current') {
                    if (typeof callback === 'function') callback(data);
                }
            } catch { /* ignore */ }
        }
    });
    let lastSync = localStorage.getItem(SYNC_KEY);
    setInterval(function () {
        const current = localStorage.getItem(SYNC_KEY);
        if (current !== lastSync) {
            lastSync = current;
            try {
                const data = JSON.parse(current);
                if (data.source !== 'current' && typeof callback === 'function') callback(data);
            } catch { /* ignore */ }
        }
    }, 3000);
}

// --- Login helpers moved from inline index.html to avoid duplicate declarations ---
function validateUsername(value) {
    return /^[a-zA-Z0-9@._-]{3,70}$/.test(value);
}

function validatePassword(value) {
    return /(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d])/.test(value) && value.length >= 8;
}

function formatRedirect(access, modules) {
    if (!modules) {
        if (access === 'financeiro') return 'ged.html';
        if (access === 'rh') return 'rh.html';
        if (access === 'apenas-observador') return 'observador.html';
        return 'gestao.html';
    }
    if (modules.gestao) return 'gestao.html';
    if (modules.rh) return 'rh.html';
    if (modules.financeiro || modules.ged) return 'ged.html';
    return 'observador.html';
}

async function authenticateUser(event) {
    if (event && event.preventDefault) event.preventDefault();

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('loginError');

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!validateUsername(username) || !validatePassword(password)) {
        if (loginError) {
            loginError.textContent = 'Dados inválidos. Use usuário válido e senha com ao menos 8 caracteres, letras, números e símbolos.';
            loginError.classList.remove('hidden');
        }
        return;
    }

    try {
        const result = await apiLogin(username, password);
        const user = result.user;
        const token = result.token;
        if (!user || !token) throw new Error('Erro ao autenticar usuário');
        setSessionFromUser(user, token);
        if (loginError) loginError.classList.add('hidden');
        // Se o usuário precisa trocar senha, redireciona e abre modal para forçar troca
        if (user.mustChangePassword) {
            window.location.href = formatRedirect(user.access, user.modules) + '?force_change_password=1';
            return;
        }
        window.location.href = formatRedirect(user.access, user.modules);
    } catch (error) {
        if (loginError) {
            loginError.textContent = 'Usuário ou senha incorretos.';
            loginError.classList.remove('hidden');
        }
        if (passwordInput) passwordInput.value = '';
    }
}

/**
 * Allow public (guest) access: create a read-only guest session so pages can load and fetch data
 */
function allowPublicAccess(moduleRequested) {
    const activeUsername = localStorage.getItem(SESSION_KEY);
    if (activeUsername) return;
    const guest = {
        username: 'guest',
        name: 'Visitante',
        role: 'visitante',
        access: 'ambos',
        modules: { ged: true, rh: true, financeiro: true, gestao: true },
        readOnly: true
    };
    setSessionFromUser(guest);
    localStorage.setItem(SESSION_READONLY_KEY, 'true');
    try { if (typeof applyObserverMode === 'function') setTimeout(applyObserverMode, 100); } catch {}
    console.info('allowPublicAccess: guest session enabled for', moduleRequested || 'general');
}

/**
 * Logout global - used by sidebar and pages
 */
function logout() {
    clearSession();
    window.location.href = 'index.html';
}

/**
 * Open profile modal - fallback for sidebar
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
                <div class="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <p class="text-xs text-slate-500 uppercase">Nome</p>
                    <p class="text-lg font-semibold text-slate-900">${session.name || 'N/A'}</p>
                </div>
                <div class="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <p class="text-xs text-slate-500 uppercase">Usuário</p>
                    <p class="text-lg font-semibold text-slate-900">${session.username || 'N/A'}</p>
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
                <button onclick="logout()" 
                        class="flex-1 px-4 py-2 rounded-xl bg-blue-900 text-white font-semibold hover:bg-blue-800 transition">
                    Sair
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('loginForm');
    if (form) form.addEventListener('submit', authenticateUser);
});
