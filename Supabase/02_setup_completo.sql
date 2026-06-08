-- ============================================
-- SETUP COMPLETO - GED Faculdade Nova Roma
-- Execute no SQL Editor do Supabase
-- ============================================

-- Gera extensão para hashing de senhas
create extension if not exists pgcrypto;

-- Garante que a coluna de troca de senha exista
alter table usuarios add column if not exists must_change_password boolean default false;

-- ============================================
-- 1. SEED DO USUÁRIO ADMIN
-- ============================================
-- Login: admin@novaroma.edu.br
-- Senha: Nova@123!

insert into usuarios (nome, username, senha, acesso)
values (
  'Administrador GED',
  'admin@novaroma.edu.br',
  encode(digest('Nova@123!','sha256'), 'hex'),
  'ambos'
)
on conflict (username) do update
  set senha = excluded.senha,
      nome = excluded.nome,
      acesso = excluded.acesso;

-- ============================================
-- 2. USUÁRIOS DE EXEMPLO
-- ============================================
-- Usuários de exemplo removidos para evitar contas de teste no banco.
-- Crie novas contas diretamente pelo sistema de Gestão de Usuários.

-- ============================================
-- 3. COLABORADORES (RH) - EXEMPLOS
-- ============================================

-- Colaboradores de exemplo removidos para manter o banco limpo.
-- Crie colaboradores diretamente pelo sistema de RH.

-- ============================================
-- 4. VERIFICAÇÕES
-- ============================================

-- Verificar usuários criados
select id, nome, username, acesso, created_at from usuarios order by created_at desc;

-- Verificar colaboradores
select id, nome, funcao, situacao, admissao, matricula from colaboradores order by nome;

-- ============================================
-- 5. ÍNDICES PARA MELHOR PERFORMANCE
-- ============================================

create index if not exists idx_usuarios_username on usuarios(username);
create index if not exists idx_usuarios_acesso on usuarios(acesso);
create index if not exists idx_colaboradores_situacao on colaboradores(situacao);
create index if not exists idx_colaboradores_matricula on colaboradores(matricula);
create index if not exists idx_documentos_setor on documentos_ged(setor);
create index if not exists idx_documentos_status on documentos_ged(status);
