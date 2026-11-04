-- AEF Hub: base de voluntários (cadastros do formulário do site) e dados de saúde restritos ao RH.
-- Cole no Supabase: SQL Editor > New query > Run. Depende de 001_membros.sql.

-- 1. Quem tem um módulo liberado (usado nas regras de acesso abaixo).
create or replace function public.tem_modulo(modulo text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.membros
    where email = lower(auth.jwt() ->> 'email') and ativo and modulo = any (modulos)
  );
$$;

-- 2. Voluntários.
create table public.voluntarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  idade_cadastro integer check (idade_cadastro between 10 and 100),
  cadastrado_em timestamptz not null default now(),
  contato_emergencia text,
  como_conheceu text,
  origem text not null default 'site',
  area text,
  formacao text,
  status text not null default 'novo' check (status in ('novo', 'ativo', 'inativo', 'penalizado')),
  observacoes text,
  criado_em timestamptz not null default now()
);

alter table public.voluntarios enable row level security;

create policy "RH e Operações veem voluntários" on public.voluntarios
  for select to authenticated
  using (public.tem_modulo('rh') or public.tem_modulo('operacoes'));

create policy "RH cadastra e edita voluntários" on public.voluntarios
  for all to authenticated
  using (public.eh_admin())
  with check (public.eh_admin());

-- 3. Saúde (dado sensível, LGPD art. 11): separada e visível só para RH e Super Admin.
create table public.voluntarios_saude (
  voluntario_id uuid primary key references public.voluntarios (id) on delete cascade,
  informacao text not null,
  atualizado_em timestamptz not null default now()
);

alter table public.voluntarios_saude enable row level security;

create policy "só RH vê e edita saúde" on public.voluntarios_saude
  for all to authenticated
  using (public.eh_admin())
  with check (public.eh_admin());
