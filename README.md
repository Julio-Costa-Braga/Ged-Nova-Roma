# GED Faculdade Nova Roma

Projeto organizado em duas camadas:

- `frontend/` — arquivos HTML, CSS e JavaScript do cliente
- `backend/` — servidor Node.js + Express que expõe a API `/api/*` e acessa o Supabase com a chave `SUPABASE_SERVICE_ROLE_KEY`
- `.env` — variáveis de ambiente não versionadas com as chaves do Supabase
- `server.js` — entrypoint do backend que também serve arquivos estáticos de `frontend/`

## Como rodar

1. Instale as dependências:

```bash
npm install
```

2. Configure o `.env` (já existe um `.env.example` de exemplo):

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
BASE_PATH=NOVAROMA
```

3. Inicie o servidor:

```bash
npm start
```

4. Acesse no navegador:

```text
http://localhost:3000
```

> Não use mais o `live-server` em `5500` para desenvolvimento. O backend já serve o frontend e o `/api` no mesmo domínio.

## Banco de dados

Use o arquivo `Supabase/01_admin_seed.sql` para criar o admin:

- login: `admin@novaroma.edu.br`
- senha: `Nova@123!`

## Estrutura de pastas

- `frontend/`
  - `index.html`
  - `ged.html`
  - `gestao.html`
  - `rh.html`
  - `observador.html`
  - `script.js`
  - `style.css`
  - `supabase.js`
  - `favicon_io/`
  - `images.png`
- `backend/`
  - `db/`
  - `routes/`
  - `services/`
  - `utils/`

## Observações

- O backend precisa ser iniciado para o login funcionar.
- O frontend chama o endpoint `/api/auth/login`, então os arquivos devem ser servidos a partir de `localhost:3000`.
