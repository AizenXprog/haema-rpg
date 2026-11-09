begin;
create temporary table haema_test_results(label text,passed boolean) on commit drop;
grant insert,select on haema_test_results to authenticated;
insert into auth.users(id,raw_app_meta_data,raw_user_meta_data,aud,role)
values ('11111111-1111-4111-8111-111111111111','{"provider":"google","providers":["google"]}','{"full_name":"QA A"}','authenticated','authenticated'),
('22222222-2222-4222-8222-222222222222','{"provider":"google","providers":["google"]}','{"full_name":"QA B"}','authenticated','authenticated');
insert into haema_private.bestiary(id,ordinal,title,editorial_state,paragraphs,source_version,source_hash)
values ('qa-entry-one',100001,'Synthetic QA entry','proposal','["Synthetic paragraph A","Synthetic paragraph B"]','QA','synthetic'),
('qa-entry-two',100002,'Synthetic hidden entry','proposal','["Synthetic hidden text"]','QA','synthetic');
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
set local role authenticated;
do $$ begin
 assert not public.haema_has_area('library');
 begin perform public.haema_book_index(); raise exception 'pending leaked'; exception when insufficient_privilege then null; end;
 begin update public.haema_access_accounts set status='approved' where user_id=auth.uid(); raise exception 'self approval allowed'; exception when insufficient_privilege then null; end;
 begin perform 1 from haema_private.bestiary; raise exception 'raw content leaked'; exception when insufficient_privilege then null; end;
 begin perform public.haema_join_campaign(repeat('a',40)); raise exception 'invite allowed'; exception when insufficient_privilege then null; end;
 insert into haema_test_results values('pending/self-escalation/private-table/invitations',true);
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select user_id from public.haema_platform_admins limit 1),'role','authenticated')::text,true);
set local role authenticated;
select public.haema_review_access('11111111-1111-4111-8111-111111111111','approved',array['library'],null,0);
reset role;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
set local role authenticated;
do $$ begin
 assert public.haema_has_area('library') and not public.haema_has_area('bestiary');
 begin perform public.haema_book_index(); raise exception 'area isolation failed'; exception when insufficient_privilege then null; end;
 insert into haema_test_results values('independent-area-permissions',true);
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select user_id from public.haema_platform_admins limit 1),'role','authenticated')::text,true);
set local role authenticated;
select public.haema_review_access('11111111-1111-4111-8111-111111111111','approved',array['library','bestiary'],null,1);
select public.haema_release_entry('qa-entry-one',array[0],0);
reset role;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
set local role authenticated;
do $$ declare entry jsonb; begin
 assert exists(select 1 from jsonb_array_elements(public.haema_book_index()) x where x->>'id'='qa-entry-one');
 assert not exists(select 1 from jsonb_array_elements(public.haema_book_index()) x where x->>'id'='qa-entry-two');
 entry:=public.haema_book_entry('qa-entry-one');
 assert jsonb_array_length(entry->'paragraphs')=1 and entry->>'master'='false';
 begin perform public.haema_book_entry('qa-entry-two'); raise exception 'unreleased leaked'; exception when insufficient_privilege then null; end;
 begin perform public.haema_review_access(auth.uid(),'approved',array['mesa'],null,2); raise exception 'review escalated'; exception when insufficient_privilege then null; end;
 insert into haema_test_results values('per-record-and-paragraph-release',true);
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select user_id from public.haema_platform_admins limit 1),'role','authenticated')::text,true);
set local role authenticated;
select public.haema_review_access('11111111-1111-4111-8111-111111111111','revoked','{}',null,2);
do $$ begin
 begin perform public.haema_review_access('11111111-1111-4111-8111-111111111111','approved',array['mesa'],null,2); raise exception 'stale edit accepted'; exception when serialization_failure then null; end;
 insert into haema_test_results values('optimistic-concurrency',true);
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
set local role authenticated;
do $$ begin
 assert not public.haema_has_area('library') and not public.haema_has_area('bestiary');
 begin perform public.haema_book_entry('qa-entry-one'); raise exception 'revoked leaked'; exception when insufficient_privilege then null; end;
 insert into haema_test_results values('immediate-revocation-with-same-claims',true);
end $$;
reset role;
select * from haema_test_results;
rollback;
