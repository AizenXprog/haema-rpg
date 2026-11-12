-- Synthetic transactional permission checks: no real account is changed. Always ROLLBACK.
begin;
insert into auth.users(id,raw_app_meta_data,raw_user_meta_data,aud,role)
values ('22222222-2222-4222-8222-222222222222','{"provider":"google","providers":["google"]}','{"full_name":"Estudio Teste"}','authenticated','authenticated');
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
set local role authenticated;
do $$begin
 if public.haema_has_area('studio') then raise exception 'Pending user unexpectedly allowed';end if;
 if public.haema_has_area('library') then raise exception 'Pending user unexpectedly has Library';end if;
end$$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select user_id from public.haema_platform_admins limit 1),'role','authenticated')::text,true);
set local role authenticated;
select public.haema_review_access('22222222-2222-4222-8222-222222222222','approved',array['studio'],null,0);
reset role;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
set local role authenticated;
do $$begin
 if not public.haema_has_area('studio') then raise exception 'Studio grant failed';end if;
 if public.haema_has_area('library') then raise exception 'Studio grant leaked Library';end if;
 if public.haema_has_area('mesa') then raise exception 'Studio grant leaked old Mesa';end if;
end$$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select user_id from public.haema_platform_admins limit 1),'role','authenticated')::text,true);
set local role authenticated;
select public.haema_review_access('22222222-2222-4222-8222-222222222222','revoked','{}',null,1);
reset role;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
set local role authenticated;
do $$begin
 if public.haema_has_area('studio') then raise exception 'Revoked user still allowed';end if;
end$$;
reset role;
select 'pending denied / individual grant works / other areas isolated / revocation works' as verification;
rollback;