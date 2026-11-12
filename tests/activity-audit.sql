-- Execução em transação: nenhuma conta ou progresso de teste persiste.
begin;
select set_config('request.jwt.claims',
 jsonb_build_object('sub',(select user_id from public.haema_platform_admins limit 1),
 'role','authenticated')::text,true);
set local role authenticated;
select public.haema_activity_signal('session.connected','portal');
select public.haema_activity_signal('page.view','biblioteca.html');
select public.haema_reserved_read('arquivos-silenciados')->>'id' as book_read;
select public.haema_reserved_save('arquivos-silenciados',6,0);
select public.haema_reserved_solve('arquivos-silenciados','{}'::jsonb)->>'correct' as failed_puzzle;
do $verification$
declare d jsonb;
begin
 d:=public.haema_activity_feed(null,null,null,null,100,0);
 assert (d->>'total')::integer>=4,'Eventos não incluídos';
 assert jsonb_array_length(d->'items')>0,'Feed vazio';
 assert not d::text ilike '%before_data%','Antes de fichas não pode aparecer no feed';
 assert not d::text ilike '%after_data%','Depois de fichas não pode aparecer no feed';
 assert not d::text ilike '%O Pacto das Chaves concedeu%','Texto dos livros não pode aparecer no feed';
 assert exists(select 1 from haema_private.activity_events e where e.action='book.open'),'Leitura não registrada';
 assert exists(select 1 from haema_private.activity_events e where e.action='puzzle.attempt'),'Tentativa não registrada';
 assert not exists(select 1 from haema_private.activity_events e where e.target like '%positions%'),'Tentativa completa não pode ficar armazenada';
end $verification$;
reset role;
-- Ensaio de bloqueio de leitura dos registros para pessoas não administradoras.
select set_config('request.jwt.claims',
 jsonb_build_object('sub',(select user_id from public.haema_access_accounts
  where user_id not in (select user_id from public.haema_platform_admins) limit 1),'role','authenticated')::text,true);
set local role authenticated;
do $permissions$
begin
 begin
  perform public.haema_activity_feed();
  raise exception 'Usuário comum conseguiu consultar auditoria';
 exception when sqlstate '42501' then null;
 end;
 begin
  perform public.haema_activity_prune();
  raise exception 'Usuário comum conseguiu eliminar eventos';
 exception when sqlstate '42501' then null;
 end;
 begin
  perform public.haema_activity_signal('page.view','/api/private');
  raise exception 'Sinal inválido foi aceito';
 exception when sqlstate '22023' then null;
 end;
end $permissions$;
reset role;
rollback;
