begin;
create temporary table volume_test_results(label text,passed boolean) on commit drop;
grant insert,select on volume_test_results to authenticated,anon;
insert into auth.users(id,raw_app_meta_data,raw_user_meta_data,aud,role)
values ('11111111-1111-4111-8111-111111111111','{"provider":"google","providers":["google"]}','{"full_name":"Synthetic QA"}','authenticated','authenticated');
set local role anon;
do $$ begin
 begin perform public.haema_volume_read('frikten');raise exception 'anon leaked';exception when insufficient_privilege then null;end;
 begin perform 1 from haema_private.volumes;raise exception 'raw leaked';exception when insufficient_privilege then null;end;
 insert into volume_test_results values('anonymous RPC and raw table denied',true);
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
set local role authenticated;
do $$ begin
 begin perform public.haema_volume_read('frikten');raise exception 'pending leaked';exception when insufficient_privilege then null;end;
 begin perform public.haema_volume_catalog();raise exception 'catalog leaked';exception when insufficient_privilege then null;end;
 begin perform public.haema_volume_release('frikten',true,0);raise exception 'self release';exception when insufficient_privilege then null;end;
 insert into volume_test_results values('pending reader, catalog and release denied',true);
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select user_id from public.haema_platform_admins limit 1),'role','authenticated')::text,true);
set local role authenticated;
select public.haema_review_access('11111111-1111-4111-8111-111111111111','approved',array['library'],null,0);
do $$ begin
 assert jsonb_array_length(public.haema_volume_catalog())=2;
 assert jsonb_array_length(public.haema_volume_read('frikten')->'chapters')=4;
 assert jsonb_array_length(public.haema_volume_read('jankinss')->'chapters')=4;
 begin perform 1 from haema_private.volumes;raise exception 'admin raw exposed';exception when insufficient_privilege then null;end;
 insert into volume_test_results values('admin review, both complete, raw table denied',true);
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
set local role authenticated;
do $$ begin
 begin perform public.haema_volume_read('frikten');raise exception 'unreleased leaked';exception when insufficient_privilege then null;end;
 insert into volume_test_results values('library permission does not release private volume',true);
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select user_id from public.haema_platform_admins limit 1),'role','authenticated')::text,true);
set local role authenticated;
select public.haema_volume_release('frikten',true,0);
do $$ begin
 begin perform public.haema_volume_release('frikten',false,0);raise exception 'stale accepted';exception when serialization_failure then null;end;
 insert into volume_test_results values('stale publication rejected',true);
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
set local role authenticated;
do $$ begin
 assert jsonb_array_length(public.haema_volume_read('frikten')->'chapters')=4;
 begin perform public.haema_volume_read('jankinss');raise exception 'other volume leaked';exception when insufficient_privilege then null;end;
 begin perform public.haema_book_index();raise exception 'bestiary isolation';exception when insufficient_privilege then null;end;
 insert into volume_test_results values('released volume readable; other volume and bestiary isolated',true);
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select user_id from public.haema_platform_admins limit 1),'role','authenticated')::text,true);
set local role authenticated;
select public.haema_review_access('11111111-1111-4111-8111-111111111111','revoked','{}',null,1);
reset role;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
set local role authenticated;
do $$ begin
 begin perform public.haema_volume_read('frikten');raise exception 'revocation leaked';exception when insufficient_privilege then null;end;
 insert into volume_test_results values('account revocation effective with same claims',true);
end $$;
reset role;
select * from volume_test_results;
rollback;
