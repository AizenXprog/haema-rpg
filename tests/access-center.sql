-- HÆMA Central de Acessos · ensaio sem efeitos permanentes.
-- Execução isolada em transação: todos os registros são revertidos.
begin;
insert into auth.users(id,raw_app_meta_data,raw_user_meta_data,aud,role)
values('33333333-3333-4333-8333-333333333333',
 '{"provider":"google","providers":["google"]}','{"full_name":"Teste Central de Acessos"}','authenticated','authenticated');
select set_config('request.jwt.claims',jsonb_build_object('sub',(select user_id from public.haema_platform_admins limit 1),'role','authenticated')::text,true);
set local role authenticated;
do $verify$
declare
 v jsonb; rev integer; ass uuid[]; expected uuid[]; u jsonb;
begin
 v := public.haema_access_control_snapshot();
 assert jsonb_array_length(v->'books')=3,'Livros ausentes na Central';
 assert jsonb_array_length(v->'users')>0,'Pessoas não carregadas';
 assert not (v::text ilike '%O PACTO DAS CHAVES CONCEDEU PODERES%'),'Manuscrito vazou na Central';
 select x into u from jsonb_array_elements(v->'users') x
   where x->>'id'='33333333-3333-4333-8333-333333333333';
 rev := (u->>'revision')::integer;
 assert rev is not null,'Conta temporária não criada';
 v := public.haema_access_control_user_save('33333333-3333-4333-8333-333333333333','approved',
   array['library']::text[],array['regencias-conhecidas']::text[],rev);
 assert v->>'status'='approved','Aprovação não foi salva';
 assert (v->'books') ? 'regencias-conhecidas','Livro não foi atribuído';
 assert (v->'areas') ? 'library','Área Biblioteca não foi atribuída';
 begin
  perform public.haema_access_control_user_save('33333333-3333-4333-8333-333333333333',
   'approved',array['library']::text[],array['regencias-conhecidas']::text[],rev);
  raise exception 'Conflito de revisão não detectado';
 exception when sqlstate '40001' then null;
 end;
 v := public.haema_access_control_snapshot();
 select coalesce(array_agg((x->>'id')::uuid order by x->>'id'),'{}'::uuid[])
  into expected from jsonb_array_elements(v->'users') x
  where (x->'books') ? 'arquivos-silenciados';
 ass := array_append(expected,'33333333-3333-4333-8333-333333333333'::uuid);
 v := public.haema_access_control_book_save('arquivos-silenciados',ass,expected);
 assert (v->>'assigned')::integer=cardinality(ass),'Lista de destinatários não foi salva';
 begin
  perform public.haema_access_control_book_save('arquivos-silenciados',expected,expected);
  raise exception 'Conflito simultâneo por livro não detectado';
 exception when sqlstate '40001' then null;
 end;
 v := public.haema_access_control_snapshot();
 select x into u from jsonb_array_elements(v->'users') x
   where x->>'id'='33333333-3333-4333-8333-333333333333';
 assert (u->'books') ? 'arquivos-silenciados','Atribuição em lote não foi refletida';
 v := public.haema_access_control_user_save('33333333-3333-4333-8333-333333333333','revoked',
   array[]::text[],array[]::text[],(u->>'revision')::integer);
 assert v->>'status'='revoked','Revogação falhou';
 assert jsonb_array_length(v->'areas')=0,'Áreas permaneceram liberadas';
 assert jsonb_array_length(v->'books')=0,'Livros permaneceram atribuídos';
end $verify$;
reset role;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
set local role authenticated;
do $security$
begin
 begin
  perform public.haema_access_control_snapshot();
  raise exception 'Usuário comum conseguiu abrir a Central';
 exception when sqlstate '42501' then null;
 end;
 begin
  perform public.haema_access_control_book_save('peso-da-coroa',array[]::uuid[],array[]::uuid[]);
  raise exception 'Usuário comum conseguiu alterar os destinatários';
 exception when sqlstate '42501' then null;
 end;
end $security$;
reset role;
rollback;
