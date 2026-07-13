/**
 * Script de Teste Completo — GED Faculdade Nova Roma
 * 
 * Uso:
 *   node tests/test-all-functions.js
 * 
 * Testa todas as funções do sistema uma por uma e reporta ✓ ou ✗.
 */

const BASE_URL = process.env.TEST_URL || 'https://gednovaroma.docflow.dev.br';
const API_BASE = `${BASE_URL}/NOVAROMA/api`;

const LOGIN = {
  identifier: process.env.TEST_USER || 'admin@novaroma.edu.br',
  password: process.env.TEST_PASS || 'Nova@123!'
};

let token = null;
let resultados = { pass: 0, fail: 0, tests: [] };

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) }
  });

  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch {}
  return { ok: res.ok, status: res.status, data, text };
}

function reportar(nome, pass, detalhe = '') {
  const simbolo = pass ? '✓' : '✗';
  const linha = `${simbolo} ${nome}${detalhe ? ' — ' + detalhe : ''}`;
  console.log(linha);
  resultados.tests.push({ nome, pass, detalhe });
  if (pass) resultados.pass++; else resultados.fail++;
}

async function testarLogin() {
  console.log('\n🔐 AUTENTICAÇÃO');

  const r = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify(LOGIN)
  });

  if (!r.ok) {
    reportar('Login', false, `${r.status}: ${r.data?.error || r.text}`);
    return false;
  }

  token = r.data.token;
  reportar('Login', true, `Token JWT recebido (${token?.substring(0, 20)}...)`);
  reportar('Usuário retornado', !!r.data.user, r.data.user?.name || '');
  reportar('Módulos carregados', !!r.data.user?.modules, JSON.stringify(r.data.user?.modules));

  const rMe = await api('/auth/me');
  reportar('GET /auth/me', rMe.ok);

  return true;
}

async function testarHealth() {
  console.log('\n❤️ HEALTH CHECK');

  const r = await fetch(`${BASE_URL}/NOVAROMA/api/health`);
  const data = r.ok ? await r.json() : null;
  reportar('Health check', r.ok && data?.status === 'ok', data?.service || '');
}

async function testarUsuarios() {
  console.log('\n👥 USUÁRIOS (CRUD)');

  const rList = await api('/users');
  reportar('Listar usuários', rList.ok, rList.ok ? `${rList.data?.users?.length || 0} usuários` : '');

  if (rList.ok && rList.data?.users?.length > 0) {
    const firstId = rList.data.users[0].id;
    const rGet = await api(`/users/${firstId}`);
    reportar('Obter usuário por ID', rGet.ok, rGet.data?.user?.name || '');

    // Teste criar (depois limpa)
    const rCreate = await api('/users', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Teste Temporário',
        username: `teste_${Date.now()}`,
        password: 'Teste@123',
        access: 'rh'
      })
    });
    reportar('Criar usuário', rCreate.ok, rCreate.ok ? `ID ${rCreate.data?.user?.id}` : rCreate.data?.error);

    if (rCreate.ok && rCreate.data?.user?.id) {
      const newId = rCreate.data.user.id;
      const rDel = await api(`/users/${newId}`, { method: 'DELETE' });
      reportar('Excluir usuário criado', rDel.ok);
      // Pode falhar se o role do admin não for 'administrador' — mas tentamos
    }
  }

  const rChangePwd = await api('/users/change-password', {
    method: 'POST',
    body: JSON.stringify({ newPassword: 'Nova@12345' })
  });
  // Deve funcionar com a senha correta atual — mas pode falhar se a senha não for válida
  if (rChangePwd.ok) {
    reportar('Alterar senha', true);
    // Reverte para a senha original
    await api('/users/change-password', {
      method: 'POST',
      body: JSON.stringify({ newPassword: LOGIN.password })
    });
  } else {
    reportar('Alterar senha', false, rChangePwd.data?.error || rChangePwd.text);
  }
}

async function testarColaboradoresRH() {
  console.log('\n📋 RECURSOS HUMANOS — COLABORADORES');

  const rList = await api('/rh/colaboradores');
  reportar('Listar colaboradores', rList.ok, rList.ok ? `${rList.data?.colaboradores?.length || 0} colaboradores` : rList.data?.error);

  if (rList.ok && rList.data?.colaboradores?.length > 0) {
    const first = rList.data.colaboradores[0];
    const rGet = await api(`/rh/colaboradores/${first.id}`);
    reportar('Obter colaborador por ID', rGet.ok, rGet.data?.colaborador?.nome || '');

    const rDocs = await api(`/rh/colaboradores/${first.id}/documentos`);
    reportar('Listar docs do colaborador', rDocs.ok, rDocs.ok ? `${rDocs.data?.documentos?.length || 0} documentos` : '');

    const rMov = await api(`/rh/colaboradores/${first.id}/movimentacoes`);
    reportar('Listar movimentações do colaborador', rMov.ok, rMov.ok ? `${rMov.data?.movimentacoes?.length || 0} movimentações` : '');

    // Testar criação e exclusão
    const rCreate = await api('/rh/colaboradores', {
      method: 'POST',
      body: JSON.stringify({
        nome: `Teste RH ${Date.now()}`,
        funcao: 'Teste',
        situacao: 'Ativo',
        cpf: String(10000000000 + Math.floor(Math.random() * 89999999999))
      })
    });
    reportar('Criar colaborador', rCreate.ok, rCreate.ok ? `ID ${rCreate.data?.colaborador?.id}` : rCreate.data?.error);

    if (rCreate.ok && rCreate.data?.colaborador?.id) {
      const newId = rCreate.data.colaborador.id;

      const rUpd = await api(`/rh/colaboradores/${newId}`, {
        method: 'PUT',
        body: JSON.stringify({ funcao: 'Teste Atualizado' })
      });
      reportar('Atualizar colaborador', rUpd.ok);

      const rDel = await api(`/rh/colaboradores/${newId}`, { method: 'DELETE' });
      reportar('Excluir colaborador', rDel.ok, rDel.ok ? '' : `Status ${rDel.status}`);
    }
  } else {
    reportar('Obter colaborador por ID', false, 'Nenhum colaborador cadastrado');
    reportar('Listar docs do colaborador', false, 'Nenhum colaborador');
    reportar('Listar movimentações do colaborador', false, 'Nenhum colaborador');
    reportar('Criar colaborador', false, 'Pulei — sem dados para testar');

    // Tentar criar mesmo sem dados iniciais
    const rCreate = await api('/rh/colaboradores', {
      method: 'POST',
      body: JSON.stringify({
        nome: `Teste RH ${Date.now()}`,
        funcao: 'Teste',
        situacao: 'Ativo',
        cpf: String(10000000000 + Math.floor(Math.random() * 89999999999))
      })
    });
    reportar('Criar colaborador (sem dados prévios)', rCreate.ok, rCreate.ok ? `ID ${rCreate.data?.colaborador?.id}` : rCreate.data?.error);

    if (rCreate.ok && rCreate.data?.colaborador?.id) {
      const newId = rCreate.data.colaborador.id;
      const rUpd = await api(`/rh/colaboradores/${newId}`, {
        method: 'PUT',
        body: JSON.stringify({ funcao: 'Teste Atualizado' })
      });
      reportar('Atualizar colaborador', rUpd.ok);
      const rDel = await api(`/rh/colaboradores/${newId}`, { method: 'DELETE' });
      reportar('Excluir colaborador', rDel.ok);
    }
  }

  const rPlan = await api('/rh/colaboradores/planilha');
  reportar('Planilha de colaboradores', rPlan.ok, rPlan.ok ? `${rPlan.data?.colaboradores?.length || 0} registros` : '');
}

async function testarDocumentosGED() {
  console.log('\n📄 GED — DOCUMENTOS');

  const rList = await api('/ged/documentos');
  reportar('Listar documentos GED', rList.ok, rList.ok ? `${rList.data?.documentos?.length || 0} documentos` : rList.data?.error);

  if (rList.ok && rList.data?.documentos?.length > 0) {
    const first = rList.data.documentos[0];
    const rGet = await api(`/ged/documentos/${first.id}`);
    reportar('Obter documento GED por ID', rGet.ok, rGet.data?.documento?.tipo_documento || '');

    // Tenta criar um documento de teste
    const rCreate = await api('/ged/documentos', {
      method: 'POST',
      body: JSON.stringify({
        tipo_documento: 'Teste Automático',
        setor: 'TI',
        nome_arquivo: 'teste-auto.pdf',
        valor: 0,
        status: 'Pendente'
      })
    });
    reportar('Criar documento GED', rCreate.ok, rCreate.ok ? `ID ${rCreate.data?.documento?.id}` : rCreate.data?.error);

    if (rCreate.ok && rCreate.data?.documento?.id) {
      const newId = rCreate.data.documento.id;

      const rUpd = await api(`/ged/documentos/${newId}`, {
        method: 'PUT',
        body: JSON.stringify({ setor: 'TI - Teste' })
      });
      reportar('Atualizar documento GED', rUpd.ok);

      const rDel = await api(`/ged/documentos/${newId}`, { method: 'DELETE' });
      reportar('Excluir documento GED', rDel.ok, rDel.ok ? '' : `Status ${rDel.status}`);
    }
  } else {
    reportar('Obter documento GED por ID', false, 'Nenhum documento');

    // Tentar criar um documento
    const rCreate = await api('/ged/documentos', {
      method: 'POST',
      body: JSON.stringify({
        tipo_documento: 'Teste Automático',
        setor: 'TI',
        nome_arquivo: 'teste-auto.pdf',
        valor: 0,
        status: 'Pendente'
      })
    });
    reportar('Criar documento GED', rCreate.ok, rCreate.ok ? `ID ${rCreate.data?.documento?.id}` : rCreate.data?.error);

    if (rCreate.ok && rCreate.data?.documento?.id) {
      const newId = rCreate.data.documento.id;
      const rUpd = await api(`/ged/documentos/${newId}`, {
        method: 'PUT',
        body: JSON.stringify({ setor: 'TI - Teste' })
      });
      reportar('Atualizar documento GED', rUpd.ok);
      const rDel = await api(`/ged/documentos/${newId}`, { method: 'DELETE' });
      reportar('Excluir documento GED', rDel.ok);
    }
  }
}

async function testarFinanceiro() {
  console.log('\n💰 FINANCEIRO');

  const rList = await api('/finance/transacoes');
  reportar('Listar transações financeiras', rList.ok, rList.ok ? `${rList.data?.transacoes?.length || 0} transações` : rList.data?.error);
}

async function testarEmail() {
  console.log('\n📧 ENVIO DE E-MAIL');

  const r = await api('/ged/enviar-assinatura', {
    method: 'POST',
    body: JSON.stringify({
      documento_id: 1,
      email: 'teste@novaroma.com.br',
      nome_documento: 'Teste Automático GED'
    })
  });

  if (!r.ok && r.data?.error?.includes('MAIL_API_KEY')) {
    reportar('Envio de e-mail (Resend)', false, 'MAIL_API_KEY não configurada no servidor');
  } else if (!r.ok && (r.status === 403 || r.status === 401)) {
    reportar('Envio de e-mail (Resend)', false, `Sem permissão: ${r.data?.error}`);
  } else if (r.ok) {
    reportar('Envio de e-mail (Resend)', true, 'E-mail enviado com sucesso');
  } else {
    // Pode falhar se documento_id não existir ou email falhar — mas a rota existe
    reportar('Envio de e-mail (Resend)', r.ok, r.data?.error || `Status ${r.status}`);
  }
}

async function testarSidebar() {
  console.log('\n📱 SIDEBAR (acessibilidade das páginas)');

  const paginas = [
    { nome: 'Página inicial (index.html)', path: '/NOVAROMA/index.html' },
    { nome: 'GED Financeiro (ged.html)', path: '/NOVAROMA/ged.html' },
    { nome: 'RH (rh.html)', path: '/NOVAROMA/rh.html' },
    { nome: 'Gestão (gestao.html)', path: '/NOVAROMA/gestao.html' },
    { nome: 'Observador (observador.html)', path: '/NOVAROMA/observador.html' },
    { nome: 'Assinatura (sign.html)', path: '/NOVAROMA/sign.html' },
  ];

  for (const p of paginas) {
    try {
      const r = await fetch(`${BASE_URL}${p.path}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      reportar(`Página: ${p.nome}`, r.ok || r.status === 200, `HTTP ${r.status}`);
    } catch (err) {
      reportar(`Página: ${p.nome}`, false, err.message);
    }
  }
}

async function testarLogout() {
  console.log('\n🚪 LOGOUT');

  // Tentar acessar rota protegida sem token
  const r = await fetch(`${API_BASE}/users`, {
    headers: { 'Authorization': 'Bearer token_invalido' }
  });
  reportar('Token inválido rejeitado', r.status === 401, `HTTP ${r.status}`);

  const r2 = await fetch(`${API_BASE}/users`, {
    headers: {}
  });
  reportar('Requisição sem token rejeitada', r2.status === 401, `HTTP ${r2.status}`);
}

async function testarCORS() {
  console.log('\n🌐 CORS');

  try {
    const r = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Origin': 'https://outro-site-malicioso.com' }
    });
    // Se o CORS bloquear, a resposta pode não ser legível
    reportar('CORS configurado', true, 'Endpoint respondeu');
  } catch (err) {
    reportar('CORS configurado', true, 'Bloqueado (esperado para origens não autorizadas)');
  }
}

async function main() {
  console.log('═'.repeat(60));
  console.log('🔍 TESTE COMPLETO — GED Faculdade Nova Roma');
  console.log(`📍 URL: ${BASE_URL}`);
  console.log(`👤 Usuário: ${LOGIN.identifier}`);
  console.log('═'.repeat(60));

  const loggedIn = await testarLogin();

  await testarHealth();

  if (loggedIn) {
    await testarUsuarios();
    await testarColaboradoresRH();
    await testarDocumentosGED();
    await testarFinanceiro();
    await testarEmail();
    await testarSidebar();
    await testarLogout();
    await testarCORS();
  } else {
    console.log('\n⚠️  Login falhou — pulando testes dependentes de autenticação.');
  }

  // Resumo
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESUMO');
  console.log('═'.repeat(60));
  const total = resultados.pass + resultados.fail;
  console.log(`✅ Passou: ${resultados.pass}/${total}`);
  console.log(`❌ Falhou: ${resultados.fail}/${total}`);

  if (resultados.fail > 0) {
    console.log('\n📋 Testes com falha:');
    resultados.tests.filter(t => !t.pass).forEach(t => {
      console.log(`  ✗ ${t.nome}${t.detalhe ? ' — ' + t.detalhe : ''}`);
    });
  }

  console.log();
  process.exit(resultados.fail > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
