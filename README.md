# Checklist Produção de Palco

Página estática para registro dos checklists dos voluntários da Produção de Palco da CCVideira.

## Como testar

Abra `index.html` no navegador. Sem credenciais do Supabase, os envios ficam salvos no `localStorage` do próprio navegador.

## Configurar Supabase

1. Crie um projeto gratuito no Supabase.
2. No SQL Editor, rode:

```sql
create table public.stage_production_checklists (
  id bigint generated always as identity primary key,
  volunteer_name text not null,
  service_day text not null check (service_day in ('quarta', 'domingo')),
  team_id text not null,
  team_name text not null,
  role text not null check (role in ('P1', 'P3')),
  completed_items jsonb not null default '[]'::jsonb,
  total_items integer not null,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.stage_production_checklists enable row level security;

create policy "Permitir insercao publica de checklists"
on public.stage_production_checklists
for insert
to anon
with check (true);
```

3. Em `app.js`, preencha:

```js
const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
const SUPABASE_ANON_KEY = "SUA_CHAVE_ANON";
```

## Ajustar equipes e checklist

Edite os blocos `TEAMS_BY_DAY` e `CHECKLISTS` em `app.js`.

```js
const TEAMS_BY_DAY = {
  quarta: [{ id: "7", label: "7 - Pedro Igor" }],
  domingo: [{ id: "1", label: "1 - Jorge" }],
};

const CHECKLISTS = {
  P1: [{ id: "item-1", title: "Titulo", description: "Descricao" }],
  P3: [{ id: "item-2", title: "Titulo", description: "Descricao" }],
};
```
