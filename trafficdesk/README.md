# TrafficDesk 🚀

Painel de gestão de tráfego e performance — Meta Ads + Google Ads + WhatsApp.

## Stack

- **React 18** + Vite
- **Supabase** — Auth (JWT + OAuth Google)
- **Netlify** — Deploy + CDN

---

## 1. Configurar o Supabase

### 1.1 Criar projeto

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Anote a **URL** e a **Anon Key** em *Settings → API*

### 1.2 Configurar Auth

No painel do Supabase → **Authentication → Providers**:

- **Email**: habilite "Confirm email" para segurança em produção
- **Google** (opcional):
  1. Crie um projeto no [Google Cloud Console](https://console.cloud.google.com)
  2. Habilite "Google+ API" e crie credenciais OAuth 2.0
  3. Em URIs de redirecionamento autorizados, adicione:
     ```
     https://xxxxxxxxxxxxxxxxxxxx.supabase.co/auth/v1/callback
     ```
  4. Cole o Client ID e Secret no Supabase → Auth → Providers → Google

### 1.3 Configurar URL do site

Em *Authentication → URL Configuration*:
```
Site URL: https://seu-site.netlify.app
Redirect URLs: https://seu-site.netlify.app/**
```

### 1.4 Row Level Security (RLS) — recomendado

Se for salvar dados de clientes no Supabase, habilite RLS nas tabelas:

```sql
-- Exemplo: tabela de clientes isolada por usuário
create table clients (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users not null,
  name       text not null,
  platform   text[],
  budget     numeric,
  created_at timestamptz default now()
);

alter table clients enable row level security;

create policy "Usuário vê apenas seus clientes"
  on clients for all
  using (auth.uid() = user_id);
```

---

## 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env`:
```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ⚠️ **Nunca** faça commit do `.env`. Ele já está no `.gitignore`.

---

## 3. Instalar dependências e rodar localmente

```bash
npm install
npm run dev
# → http://localhost:5173
```

---

## 4. Integrar o Dashboard

1. Abra `src/pages/Dashboard.jsx`
2. Cole o conteúdo completo do `TrafficDashboard.jsx` que você tem
3. Renomeie `function App()` → `function Dashboard()`
4. Adicione no topo do arquivo:
   ```jsx
   import { useAuth } from '../hooks/useAuth'
   ```
5. Dentro do componente, adicione:
   ```jsx
   const { user, signOut } = useAuth()
   ```
6. Adicione o botão de logout na sidebar (veja as instruções completas no arquivo)

---

## 5. Deploy no Netlify

### Opção A — Via GitHub (recomendado)

1. Faça push do projeto para um repositório GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/seu-usuario/trafficdesk.git
   git push -u origin main
   ```

2. No [Netlify](https://netlify.com):
   - New site → Import from GitHub
   - Selecione o repositório
   - Build command: `npm run build`
   - Publish directory: `dist`

3. Em **Site settings → Environment variables**, adicione:
   ```
   VITE_SUPABASE_URL       = https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY  = eyJhbG...
   ```

4. Clique em **Deploy site** 🎉

### Opção B — Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify env:set VITE_SUPABASE_URL "https://xxxx.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "eyJhbG..."
npm run build
netlify deploy --prod
```

---

## 6. Checklist de segurança

- [x] `.env` no `.gitignore`
- [x] Anon Key (pública) usada no frontend — nunca a Service Role Key
- [x] JWT gerenciado pelo Supabase com auto-refresh
- [x] `persistSession: true` — sessão sobrevive a recarregamentos
- [x] Headers de segurança configurados no `netlify.toml`
- [x] RLS habilitado nas tabelas do Supabase
- [x] Redirect URLs restrito ao domínio de produção

---

## Estrutura do projeto

```
trafficdesk/
├── index.html
├── vite.config.js
├── netlify.toml
├── .env.example
├── .gitignore
└── src/
    ├── main.jsx
    ├── App.jsx              ← Roteamento + AuthProvider
    ├── lib/
    │   └── supabase.js      ← Cliente Supabase singleton
    ├── hooks/
    │   └── useAuth.jsx      ← Context de autenticação
    ├── components/
    │   ├── AuthPage.jsx     ← Login / Signup / Reset de senha
    │   └── ProtectedRoute.jsx
    └── pages/
        └── Dashboard.jsx    ← Painel principal (cole o TrafficDashboard aqui)
```
