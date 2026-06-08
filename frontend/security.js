// Frontend Security Utilities - Sanitização e Proteção XSS

/**
 * Escapa caracteres HTML perigosos para prevenir XSS
 * @param {string} str - String a ser escapada
 * @returns {string} String escapada
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  return str.replace(/[&<>"'\/]/g, (char) => map[char]);
}

/**
 * Remove HTML/scripts de uma string
 * @param {string} html - HTML a ser sanitizado
 * @returns {string} Apenas texto
 */
function stripHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

/**
 * Valida e sanitiza dados de entrada
 * @param {any} data - Dados a validar
 * @param {string} type - Tipo: 'string', 'email', 'number', 'array'
 * @returns {any} Dados sanitizados ou null se inválido
 */
function validateAndSanitize(data, type = 'string') {
  if (data === null || data === undefined) return null;

  switch (type) {
    case 'string':
      if (typeof data !== 'string') return null;
      return escapeHtml(data.trim());

    case 'email':
      if (typeof data !== 'string') return null;
      const email = data.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email) ? email : null;

    case 'number':
      const num = Number(data);
      return Number.isFinite(num) ? num : null;

    case 'integer':
      const int = Number(data);
      return Number.isInteger(int) && int > 0 ? int : null;

    case 'array':
      if (!Array.isArray(data)) return null;
      return data.map(item => escapeHtml(String(item)));

    case 'boolean':
      return data === true || data === 'true' ? true : false;

    default:
      return null;
  }
}

/**
 * Cria elemento de texto seguro (sem risco de XSS)
 * @param {string} text - Texto a renderizar
 * @returns {string} HTML seguro
 */
function createSafeText(text) {
  return `<span>${escapeHtml(text)}</span>`;
}

/**
 * Renderiza tabela com dados sanitizados
 * @param {Array} data - Array de objetos com dados
 * @param {Array} columns - Colunas a renderizar [{ key, label, type }]
 * @returns {string} HTML da tabela
 */
function renderSafeTable(data, columns) {
  if (!Array.isArray(data)) return '<table></table>';

  let html = '<table><thead><tr>';
  
  columns.forEach(col => {
    html += `<th>${escapeHtml(col.label)}</th>`;
  });
  
  html += '</tr></thead><tbody>';

  data.forEach(row => {
    html += '<tr>';
    columns.forEach(col => {
      const value = row[col.key];
      const sanitized = validateAndSanitize(value, col.type || 'string');
      html += `<td>${sanitized !== null ? escapeHtml(String(sanitized)) : '-'}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  return html;
}

/**
 * Valida token JWT básico (não verifica assinatura)
 * @param {string} token - Token JWT
 * @returns {boolean} True se tem formato válido
 */
function isValidJwtFormat(token) {
  if (typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(atob(parts[1]));
    return payload && typeof payload === 'object';
  } catch (e) {
    return false;
  }
}

/**
 * Limpa localStorage removendo itens antigos
 * @param {string} prefix - Prefixo dos itens (ex: 'ged')
 * @param {Array} allowedKeys - Chaves permitidas
 */
function cleanupLocalStorage(prefix, allowedKeys) {
  const keys = Object.keys(localStorage);
  const prefixRegex = new RegExp(`^${prefix}`);
  
  keys.forEach(key => {
    if (prefixRegex.test(key) && !allowedKeys.includes(key)) {
      localStorage.removeItem(key);
      console.warn(`[Security] Removed unauthorized localStorage key: ${key}`);
    }
  });
}

// Registra globalmentepara uso em HTML/JS
window.SecurityUtils = {
  escapeHtml,
  stripHtml,
  validateAndSanitize,
  createSafeText,
  renderSafeTable,
  isValidJwtFormat,
  cleanupLocalStorage
};
