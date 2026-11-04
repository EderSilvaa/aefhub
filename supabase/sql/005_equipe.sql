-- AEF Hub: nomes da equipe para quem está logado (escalar organizadores, mostrar responsável).
-- Só nome, cargo e área: e-mail e telefone continuam visíveis só para RH e Super Admin.
-- Depende de 004_operacoes.sql. Cole no Supabase: SQL Editor > New query > Run.

create view public.equipe as
select id, nome, cargo, area
from public.membros
where ativo and public.membro_atual_id() is not null;

revoke all on public.equipe from anon, public;
grant select on public.equipe to authenticated;
