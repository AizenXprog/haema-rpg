-- Executar APENAS em ambiente de teste, com a migração BIBLIOTECA_RESERVADA.sql instalada.
-- Todas as alterações deste ensaio são desfeitas por ROLLBACK.
begin;
insert into auth.users(id,raw_app_meta_data,raw_user_meta_data,aud,role)
values('22222222-2222-4222-8222-222222222222','{"provider":"google","providers":["google"]}','{"full_name":"Ensaio Reserva"}','authenticated','authenticated');
update haema_private.reserved_books set manuscript=repeat('texto de ensaio ',500),published=false where id='arquivos-silenciados';
insert into haema_private.reserved_puzzles(book_id,public_data,expected_answer,revelation)
values('arquivos-silenciados','{"type":"fixture","title":"Ensaio"}','{"fixture":"unico"}','Revelação de teste')
on conflict(book_id) do update set public_data=excluded.public_data,expected_answer=excluded.expected_answer,revelation=excluded.revelation;
set local role anon;
do $$ begin
 begin perform public.haema_reserved_catalog();raise exception 'anon acessou o catálogo';exception when insufficient_privilege then null;end;
 begin perform public.haema_reserved_read('arquivos-silenciados');raise exception 'anon acessou o manuscrito';exception when insufficient_privilege then null;end;
 begin perform 1 from haema_private.reserved_puzzles;raise exception 'anon acessou gabarito';exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
set local role authenticated;
do $$ begin
 begin perform public.haema_reserved_read('arquivos-silenciados');raise exception 'pendente acessou manuscrito';exception when insufficient_privilege then null;end;
 begin perform public.haema_reserved_admin_catalog();raise exception 'pendente acessou painel';exception when insufficient_privilege then null;end;
 begin perform 1 from haema_private.reserved_puzzles;raise exception 'pendente acessou gabarito';exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select user_id from public.haema_platform_admins limit 1),'role','authenticated')::text,true);
set local role authenticated;
select public.haema_review_access('22222222-2222-4222-8222-222222222222','approved',array['library'],null,0);
select public.haema_reserved_admin_grant('22222222-2222-4222-8222-222222222222','arquivos-silenciados',true);
reset role;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
set local role authenticated;
do $$ begin
 begin perform public.haema_reserved_read('arquivos-silenciados');raise exception 'acesso antes da publicação';exception when insufficient_privilege then null;end;
end $$;
reset role;
update haema_private.reserved_books set published=true where id='arquivos-silenciados';
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
set local role authenticated;
do $$ declare result jsonb;begin
 result=public.haema_reserved_read('arquivos-silenciados');
 assert length(result->>'manuscript')>5000,'manuscrito incompleto';
 assert not result ? 'expected_answer','gabarito exposto';
 assert result->>'revelation' is null,'revelação prematura';
 assert not (public.haema_reserved_solve('arquivos-silenciados','{"fixture":"errado"}'::jsonb)->>'correct')::boolean,'tentativa incorreta aceita';
 assert (public.haema_reserved_solve('arquivos-silenciados','{"fixture":"unico"}'::jsonb)->>'correct')::boolean,'tentativa correta rejeitada';
 assert (public.haema_reserved_read('arquivos-silenciados')->>'revelation')='Revelação de teste','revelação correta não disponibilizada';
 begin perform public.haema_reserved_read('peso-da-coroa');raise exception 'outro livro foi exposto';exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select user_id from public.haema_platform_admins limit 1),'role','authenticated')::text,true);
set local role authenticated;
select public.haema_reserved_admin_grant('22222222-2222-4222-8222-222222222222','arquivos-silenciados',false);
reset role;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
set local role authenticated;
do $$ begin
 begin perform public.haema_reserved_read('arquivos-silenciados');raise exception 'revogação falhou';exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;
