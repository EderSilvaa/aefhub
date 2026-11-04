-- AEF Hub: foto do voluntário em pasta privada do Storage.
-- Ver: RH e Operações. Enviar, trocar e apagar: só RH e Super Admin. Depende de 002_voluntarios.sql.

alter table public.voluntarios add column foto_path text;

insert into storage.buckets (id, name, public)
values ('voluntarios-fotos', 'voluntarios-fotos', false);

create policy "RH e Operações veem fotos" on storage.objects
  for select to authenticated
  using (bucket_id = 'voluntarios-fotos' and (public.tem_modulo('rh') or public.tem_modulo('operacoes')));

create policy "RH envia fotos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'voluntarios-fotos' and public.eh_admin());

create policy "RH troca fotos" on storage.objects
  for update to authenticated
  using (bucket_id = 'voluntarios-fotos' and public.eh_admin());

create policy "RH apaga fotos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'voluntarios-fotos' and public.eh_admin());
