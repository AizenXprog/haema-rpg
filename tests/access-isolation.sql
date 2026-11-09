-- Synthetic accounts/data only. Entire test rolls back, including audit records.
begin;
create temporary table qa_results(label text,passed boolean) on commit drop;
grant insert,select on qa_results to authenticated;
insert into auth.users(id,raw_app_meta_data,raw_user_meta_data,aud,role)
values ('11111111-1111-4111-8111-111111111111','{"provider":"google","providers":["google"]}','{"full_name":"QA A"}','authenticated','authenticated'),
('22222222-2222-4222-8222-222222222222','{"provider":"google","providers":["google"]}','{"full_name":"QA B"}','authenticated','authenticated');
insert into public.haema_campaigns(id,gm_id,name)
select '33333333-3333-4333-8333-333333333333',user_id,'QA campaign' from public.haema_platform_admins limit 1;
insert into public.haema_members(campaign_id,user_id,role) values
('33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111','player'),
('33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222','player');
update public.haema_access_accounts set status='approved' where user_id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222');
insert into public.haema_area_grants(user_id,area) values
('11111111-1111-4111-8111-111111111111','portal'),('11111111-1111-4111-8111-111111111111','materials'),
('22222222-2222-4222-8222-222222222222','portal');
insert into public.haema_characters(campaign_id,user_id,title,payload)
select '33333333-3333-4333-8333-333333333333',id,'QA sheet',jsonb_build_object('format','haema-character','version','0.1','attributes',to_jsonb(array_fill(4,array[6])),'skills',to_jsonb(array_fill(4,array[24])))
from auth.users where id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222');
insert into public.haema_materials(campaign_id,author_id,title,visibility,content)
select '33333333-3333-4333-8333-333333333333',user_id,'QA material',v,'Synthetic' from public.haema_platform_admins cross join unnest(array['players','gm']) v;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
set local role authenticated;
do $$ declare affected integer; begin
 assert (select count(*)=1 from public.haema_characters where campaign_id='33333333-3333-4333-8333-333333333333');
 update public.haema_characters set title='tamper' where user_id='22222222-2222-4222-8222-222222222222';
 get diagnostics affected=row_count; assert affected=0;
 begin update public.haema_characters set user_id='22222222-2222-4222-8222-222222222222' where user_id=auth.uid(); raise exception 'ownership transfer allowed'; exception when insufficient_privilege then null; end;
 assert (select count(*)=1 from public.haema_materials where campaign_id='33333333-3333-4333-8333-333333333333');
 assert (select bool_and(visibility='players') from public.haema_materials where campaign_id='33333333-3333-4333-8333-333333333333');
 insert into qa_results values('own sheet only, no cross-owner update or reassignment, master-only material hidden',true);
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
set local role authenticated;
do $$ begin
 assert (select count(*)=0 from public.haema_materials where campaign_id='33333333-3333-4333-8333-333333333333');
 insert into qa_results values('materials permission independent of portal membership',true);
end $$;
reset role;
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
do $$ begin
 begin perform 1 from public.haema_characters; raise exception 'anon sheet leaked'; exception when insufficient_privilege then null; end;
 begin perform public.haema_book_index(); raise exception 'anon book leaked'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select * from qa_results;
rollback;
