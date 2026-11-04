-- AEF Hub: ações, quem participou de cada uma e o relatório final.
-- Daqui sai o histórico de voluntários e organizadores. Depende de 001, 002 e 003.
-- Cole no Supabase: SQL Editor > New query > Run.

-- 1. Quem está usando o app agora, e o que pode fazer.
create or replace function public.membro_atual_id()
returns bigint
language sql stable security definer set search_path = public
as $$
  select id from public.membros where email = lower(auth.jwt() ->> 'email') and ativo;
$$;

create or replace function public.eh_super_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.membros
    where email = lower(auth.jwt() ->> 'email') and ativo and perfil = 'super_admin'
  );
$$;

create or replace function public.pode_operar()
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.tem_modulo('operacoes') or public.eh_admin();
$$;

-- 2. Ações. O relatório final fica na própria ação, preenchido ao finalizar.
create table public.acoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null,
  data date not null,
  local text,
  status text not null default 'planejamento' check (status in ('planejamento', 'em andamento', 'concluída')),
  responsavel_id bigint references public.membros (id) on delete set null,
  pop jsonb,
  publico_atendido integer check (publico_atendido >= 0),
  servido jsonb,
  resumo text,
  ocorrencias text,
  finalizada_em timestamptz,
  finalizada_por bigint references public.membros (id) on delete set null,
  criado_por bigint references public.membros (id) on delete set null default public.membro_atual_id(),
  criado_em timestamptz not null default now()
);

alter table public.acoes enable row level security;

create policy "membros veem as ações" on public.acoes
  for select to authenticated
  using (public.membro_atual_id() is not null);

create policy "Operações cria ações" on public.acoes
  for insert to authenticated
  with check (public.pode_operar() and status <> 'concluída');

-- concluída só pela função finalizar_acao; depois disso, só o Super Admin mexe
create policy "Operações edita ações abertas" on public.acoes
  for update to authenticated
  using (public.pode_operar() and status <> 'concluída')
  with check (public.pode_operar() and status <> 'concluída');

create policy "Super Admin edita e apaga qualquer ação" on public.acoes
  for all to authenticated
  using (public.eh_super_admin())
  with check (public.eh_super_admin());

-- 3. Participações: uma linha por pessoa em cada ação (voluntário ou membro da organização).
create table public.participacoes (
  id bigint generated always as identity primary key,
  acao_id uuid not null references public.acoes (id) on delete cascade,
  voluntario_id uuid references public.voluntarios (id) on delete cascade,
  membro_id bigint references public.membros (id) on delete cascade,
  papel text not null default 'voluntario' check (papel in ('voluntario', 'organizador')),
  presenca text check (presenca in ('presente', 'falta', 'justificada')),
  observacao text,
  criado_em timestamptz not null default now(),
  check ((voluntario_id is null) <> (membro_id is null)),
  unique (acao_id, voluntario_id),
  unique (acao_id, membro_id)
);

create index participacoes_voluntario on public.participacoes (voluntario_id);
create index participacoes_membro on public.participacoes (membro_id);

alter table public.participacoes enable row level security;

create policy "RH e Operações veem participações" on public.participacoes
  for select to authenticated
  using (public.tem_modulo('rh') or public.pode_operar());

create policy "membro vê o próprio histórico" on public.participacoes
  for select to authenticated
  using (membro_id = public.membro_atual_id());

create policy "Operações escala gente em ações abertas" on public.participacoes
  for all to authenticated
  using (public.pode_operar() and exists (select 1 from public.acoes a where a.id = acao_id and a.status <> 'concluída'))
  with check (public.pode_operar() and exists (select 1 from public.acoes a where a.id = acao_id and a.status <> 'concluída'));

create policy "Super Admin corrige participações" on public.participacoes
  for all to authenticated
  using (public.eh_super_admin())
  with check (public.eh_super_admin());

-- 4. Resumo por voluntário (ficha e lista do RH): ações feitas, faltas e a última ação.
-- security_invoker: quem consulta só vê o que as regras acima deixam.
create view public.voluntarios_resumo with (security_invoker = true) as
select
  p.voluntario_id,
  count(*) filter (where p.presenca = 'presente') as acoes_feitas,
  count(*) filter (where p.presenca = 'falta') as faltas,
  count(*) filter (where p.presenca = 'falta' and a.data >= current_date - interval '12 months') as faltas_12m,
  (array_agg(a.nome order by a.data desc) filter (where p.presenca = 'presente'))[1] as ultima_acao,
  max(a.data) filter (where p.presenca = 'presente') as ultima_acao_data
from public.participacoes p
join public.acoes a on a.id = p.acao_id and a.status = 'concluída'
where p.voluntario_id is not null
group by p.voluntario_id;

-- 5. Finalizar: presença de todos + relatório, tudo de uma vez.
-- Quem estava "novo" e foi vira "ativo" sozinho.
create or replace function public.finalizar_acao(
  p_acao uuid,
  p_presencas jsonb,          -- [{ "id": 12, "presenca": "presente", "observacao": "" }, ...]
  p_publico integer,
  p_servido jsonb,
  p_resumo text,
  p_ocorrencias text
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_status text;
begin
  if not public.pode_operar() then
    raise exception 'Seu perfil não pode finalizar ações.' using errcode = '42501';
  end if;

  select status into v_status from public.acoes where id = p_acao for update;
  if v_status is null then
    raise exception 'Ação não encontrada.' using errcode = 'P0002';
  end if;
  if v_status = 'concluída' then
    raise exception 'Esta ação já foi finalizada.' using errcode = 'P0001';
  end if;

  update public.participacoes p
  set presenca = x.presenca, observacao = nullif(x.observacao, '')
  from jsonb_to_recordset(p_presencas) as x(id bigint, presenca text, observacao text)
  where p.id = x.id and p.acao_id = p_acao;

  if exists (select 1 from public.participacoes where acao_id = p_acao and presenca is null) then
    raise exception 'Marque a presença de todo mundo antes de finalizar.' using errcode = 'P0001';
  end if;

  update public.acoes
  set status = 'concluída',
      publico_atendido = p_publico,
      servido = p_servido,
      resumo = nullif(p_resumo, ''),
      ocorrencias = nullif(p_ocorrencias, ''),
      finalizada_em = now(),
      finalizada_por = public.membro_atual_id()
  where id = p_acao;

  update public.voluntarios v
  set status = 'ativo'
  from public.participacoes p
  where p.acao_id = p_acao and p.voluntario_id = v.id and p.presenca = 'presente' and v.status = 'novo';
end;
$$;

-- 6. Reabrir uma ação finalizada (só Super Admin), para corrigir algo.
create or replace function public.reabrir_acao(p_acao uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.eh_super_admin() then
    raise exception 'Só o Super Admin reabre ações finalizadas.' using errcode = '42501';
  end if;
  update public.acoes set status = 'em andamento', finalizada_em = null, finalizada_por = null where id = p_acao;
end;
$$;

revoke execute on function public.finalizar_acao(uuid, jsonb, integer, jsonb, text, text) from public, anon;
revoke execute on function public.reabrir_acao(uuid) from public, anon;
grant execute on function public.finalizar_acao(uuid, jsonb, integer, jsonb, text, text) to authenticated;
grant execute on function public.reabrir_acao(uuid) to authenticated;
