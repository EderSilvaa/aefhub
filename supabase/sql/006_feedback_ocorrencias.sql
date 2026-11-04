-- AEF Hub: coordenação da ação, feedback dos organizadores e ocorrências de voluntários.
-- Depende de 004_operacoes.sql e 005_equipe.sql. Cole no Supabase: SQL Editor > New query > Run.

-- 1. Quem coordena a ação (os 2 a 4 que puxam). O resto da organização é apoio.
alter table public.participacoes add column coordena boolean not null default false;

-- Pode finalizar: o Super Admin, quem coordena a ação, ou (sem coordenação marcada) quem tem Operações.
create or replace function public.coordena_acao(p_acao uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.eh_super_admin()
    or exists (select 1 from public.participacoes where acao_id = p_acao and coordena and membro_id = public.membro_atual_id())
    or (public.pode_operar() and not exists (select 1 from public.participacoes where acao_id = p_acao and coordena));
$$;

-- O membro logado estava na ação como organizador.
create or replace function public.participa_acao(p_acao uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.participacoes where acao_id = p_acao and membro_id = public.membro_atual_id());
$$;

-- Feedback e registros ficam abertos por 7 dias depois de a ação ser finalizada.
create or replace function public.janela_feedback(p_acao uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.participa_acao(p_acao) and exists (
    select 1 from public.acoes
    where id = p_acao and status = 'concluída' and finalizada_em > now() - interval '7 days'
  );
$$;

-- Nomes dos voluntários de uma ação, para quem organizou poder registrar algo sobre eles
-- (o apoio pode não ter acesso à base inteira).
create or replace function public.voluntarios_da_acao(p_acao uuid)
returns table (id uuid, nome text)
language sql stable security definer set search_path = public
as $$
  select v.id, v.nome
  from public.participacoes p
  join public.voluntarios v on v.id = p.voluntario_id
  where p.acao_id = p_acao and (public.participa_acao(p_acao) or public.pode_operar() or public.tem_modulo('rh'))
  order by v.nome;
$$;

-- 2. Finalizar passa a exigir a coordenação.
create or replace function public.finalizar_acao(
  p_acao uuid,
  p_presencas jsonb,
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
  if not public.coordena_acao(p_acao) then
    raise exception 'Só quem coordena a ação pode finalizar.' using errcode = '42501';
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

-- 3. Feedback dos organizadores sobre a ação (um por pessoa, editável nos 7 dias).
create table public.feedbacks_acao (
  id bigint generated always as identity primary key,
  acao_id uuid not null references public.acoes (id) on delete cascade,
  membro_id bigint not null references public.membros (id) on delete cascade default public.membro_atual_id(),
  texto text not null check (length(trim(texto)) > 0),
  criado_em timestamptz not null default now(),
  unique (acao_id, membro_id)
);

alter table public.feedbacks_acao enable row level security;

create policy "equipe da ação, Operações e RH leem feedbacks" on public.feedbacks_acao
  for select to authenticated
  using (public.pode_operar() or public.tem_modulo('rh') or public.participa_acao(acao_id));

create policy "organizador dá o próprio feedback" on public.feedbacks_acao
  for insert to authenticated
  with check (membro_id = public.membro_atual_id() and public.janela_feedback(acao_id));

create policy "organizador corrige o próprio feedback" on public.feedbacks_acao
  for update to authenticated
  using (membro_id = public.membro_atual_id() and public.janela_feedback(acao_id))
  with check (membro_id = public.membro_atual_id() and public.janela_feedback(acao_id));

-- 4. Ocorrências e destaques sobre voluntários. Confidencial: só RH e Super Admin veem tudo;
-- quem registrou vê o que registrou.
create table public.ocorrencias (
  id bigint generated always as identity primary key,
  voluntario_id uuid not null references public.voluntarios (id) on delete cascade,
  acao_id uuid references public.acoes (id) on delete set null,
  tipo text not null check (tipo in ('atraso', 'comportamento', 'saiu_antes', 'outro', 'destaque')),
  descricao text,
  status text not null default 'aberta' check (status in ('aberta', 'acompanhamento', 'encerrada')),
  providencia text,
  autor_id bigint references public.membros (id) on delete set null default public.membro_atual_id(),
  criado_em timestamptz not null default now()
);

create index ocorrencias_voluntario on public.ocorrencias (voluntario_id);

alter table public.ocorrencias enable row level security;

create policy "RH vê ocorrências" on public.ocorrencias
  for select to authenticated
  using (public.eh_admin() or autor_id = public.membro_atual_id());

-- RH registra a qualquer momento; organizadores, sobre voluntários da própria ação, nos 7 dias
create policy "RH e organizadores registram" on public.ocorrencias
  for insert to authenticated
  with check (
    autor_id = public.membro_atual_id() and (
      public.eh_admin()
      or (acao_id is not null and public.janela_feedback(acao_id)
          and exists (select 1 from public.voluntarios_da_acao(acao_id) v where v.id = voluntario_id))
    )
  );

create policy "RH acompanha e encerra" on public.ocorrencias
  for update to authenticated
  using (public.eh_admin())
  with check (public.eh_admin());

create policy "RH apaga ocorrências" on public.ocorrencias
  for delete to authenticated
  using (public.eh_admin());
