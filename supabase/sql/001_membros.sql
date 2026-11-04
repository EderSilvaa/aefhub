-- AEF Hub: lista de membros liberados e login só para quem está nela.
-- Cole no Supabase: SQL Editor > New query > Run.
-- O primeiro Super Admin está na última parte; troque o e-mail se for outra conta Google.

-- 1. Membros liberados: só quem está aqui (e ativo) consegue entrar.
create table public.membros (
  id bigint generated always as identity primary key,
  email text not null unique check (email = lower(email)),
  nome text not null,
  perfil text not null check (perfil in ('super_admin', 'diretoria', 'financeiro', 'rh', 'operacoes', 'marketing', 'juridico')),
  modulos text[] not null default '{}',
  cargo text,
  area text,
  telefone text,
  cidade text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

alter table public.membros enable row level security;

-- 2. Quem pode administrar a lista (mesma regra do app: Super Admin e RH).
create or replace function public.eh_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.membros
    where email = lower(auth.jwt() ->> 'email') and ativo and perfil in ('super_admin', 'rh')
  );
$$;

-- 3. Regras de acesso à tabela.
create policy "membro vê o próprio cadastro" on public.membros
  for select to authenticated
  using (email = lower(auth.jwt() ->> 'email'));

create policy "admins veem todos" on public.membros
  for select to authenticated
  using (public.eh_admin());

create policy "admins cadastram e editam" on public.membros
  for all to authenticated
  using (public.eh_admin())
  with check (public.eh_admin());

-- 4. Barra a criação de conta de quem não está na lista (mesmo com conta Google válida).
create or replace function public.bloquear_nao_membros()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.membros where email = lower(new.email) and ativo) then
    raise exception 'E-mail não liberado no AEF Hub: %', new.email;
  end if;
  return new;
end;
$$;

create trigger antes_de_criar_usuario
  before insert on auth.users
  for each row execute function public.bloquear_nao_membros();

-- 5. Primeiro Super Admin.
insert into public.membros (email, nome, perfil, modulos, cargo, area)
values ('seder0802@gmail.com', 'Eder Silva', 'super_admin',
        array['dashboard', 'rh', 'operacoes', 'financeiro', 'marketing', 'juridico'],
        'Administrador da Plataforma', 'Governança');
