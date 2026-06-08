-- ============================================
-- RLS — GED Faculdade Nova Roma
-- Execute no SQL Editor do Supabase
--
-- CONTEXTO IMPORTANTE:
-- Este projeto usa autenticação PRÓPRIA (JWT gerado pelo Express),
-- não o Supabase Auth. Por isso auth.uid() não está disponível
-- nas políticas RLS.
--
-- O backend usa a SERVICE_ROLE KEY, que bypassa RLS por design.
-- Todo o controle de acesso já está garantido no Express via:
--   - requireAuth  → valida JWT
--   - requireRole  → verifica perfil (administrador, rh, financeiro…)
--
-- ESTRATÉGIA ADOTADA:
-- • RLS habilitado em todas as tabelas (boa prática de segurança)
-- • Acesso via service_role (backend) → bypassa RLS automaticamente
-- • Acesso direto via anon/authenticated key → bloqueado por padrão
--   (nenhuma política permissiva para essas roles)
-- • Isso impede que alguém acesse o banco diretamente pelo cliente
--   Supabase JS sem passar pelo backend autenticado.
-- ============================================

-- ─── Garante RLS ativo em todas as tabelas ───────────────────────────────────

alter table if exists usuarios               enable row level security;
alter table if exists colaboradores          enable row level security;
alter table if exists documentos_ged         enable row level security;
alter table if exists transacoes_financeiras enable row level security;
alter table if exists pastas_documentos      enable row level security;
alter table if exists movimentacoes_rh       enable row level security;

-- ─── Remove todas as políticas anteriores (inclusive as com bug) ─────────────

do $$
declare
  pol record;
begin
  for pol in
    select policyname, tablename
    from   pg_policies
    where  schemaname = 'public'
      and  tablename in (
        'usuarios','colaboradores','documentos_ged',
        'transacoes_financeiras','pastas_documentos','movimentacoes_rh'
      )
  loop
    execute format(
      'drop policy if exists %I on %I',
      pol.policyname, pol.tablename
    );
  end loop;
end $$;

-- ─── Bloqueia acesso direto via anon / authenticated ─────────────────────────
-- Com RLS ativo e SEM políticas permissivas, nenhuma das roles
-- anon ou authenticated consegue ler ou escrever diretamente.
-- O backend usa service_role, que não passa por RLS.
-- Nenhuma política é criada — o comportamento padrão (deny) é suficiente.

-- ─── Comentário de verificação ───────────────────────────────────────────────
-- Para confirmar que está correto, rode no SQL Editor:
--
--   select tablename, rowsecurity
--   from   pg_tables
--   where  schemaname = 'public';
--
-- Todas as tabelas acima devem mostrar rowsecurity = true.
--
--   select * from pg_policies where schemaname = 'public';
--
-- Não deve haver nenhuma política permissiva para anon/authenticated.
