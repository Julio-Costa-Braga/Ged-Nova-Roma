-- 01 - Seed do usuário admin para o Supabase
-- Login: admin@novaroma.edu.br
-- Senha: Nova@123!

-- Gera o hash SHA-256 compatível com o backend (hex)
create extension if not exists pgcrypto;

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

-- Conferir
select id, nome, username, acesso, created_at from usuarios where username = 'admin@novaroma.edu.br';
