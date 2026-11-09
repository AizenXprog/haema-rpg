-- Additive HÆMA access/library schema. Run only in the dedicated HÆMA project.
-- No private lore belongs in this file. Existing character payloads are untouched.
create schema if not exists haema_private;
revoke all on schema haema_private from public, anon;
grant usage on schema haema_private to authenticated;

create table public.haema_access_accounts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null,
 status text not null default 'pending' check(status in ('pending','approved','denied','revoked')),
 revision integer not null default 0,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table public.haema_area_grants (
 user_id uuid not null references public.haema_access_accounts(user_id) on delete cascade,
 area text not null check(area in ('library','bestiary','portal','mesa','materials')),
 primary key(user_id,area)
);
create table public.haema_access_log (
 id bigint generated always as identity primary key,
 actor_id uuid references auth.users(id),
 subject_id uuid,
 action text not null,
 details jsonb not null default '{}',
 created_at timestamptz not null default now()
);
create table haema_private.bestiary (
 id text primary key check(id ~ '^[a-z0-9-]+$'),
 ordinal integer not null unique,
 title text not null,
 subtitle text not null default '',
 editorial_state text not null check(editorial_state in ('canon','concept','proposal','historical')),
 paragraphs jsonb not null check(jsonb_typeof(paragraphs)='array'),
 released_indexes integer[] not null default '{}',
 revision integer not null default 0,
 source_version text not null,
 source_hash text not null,
 updated_at timestamptz not null default now()
);
alter table public.haema_access_accounts enable row level security;
alter table public.haema_area_grants enable row level security;
alter table public.haema_access_log enable row level security;
alter table haema_private.bestiary enable row level security;
revoke all on public.haema_access_accounts,public.haema_area_grants,public.haema_access_log from public,anon,authenticated;
revoke all on haema_private.bestiary from public,anon,authenticated;
grant select on public.haema_access_accounts,public.haema_area_grants,public.haema_access_log to authenticated;
create policy accounts_read on public.haema_access_accounts for select to authenticated using(user_id=(select auth.uid()) or (select public.haema_is_admin()));
create policy grants_read on public.haema_area_grants for select to authenticated using(user_id=(select auth.uid()) or (select public.haema_is_admin()));
create policy access_log_read on public.haema_access_log for select to authenticated using((select public.haema_is_admin()));

create function haema_private.register_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.haema_access_accounts(user_id,display_name)
 values(new.id,left(coalesce(nullif(new.raw_user_meta_data->>'full_name',''),'Jogador'),80))
 on conflict(user_id) do nothing;
 return new;
end $$;
create trigger haema_access_registration after insert on auth.users for each row execute function haema_private.register_user();
-- Existing campaign members keep their current campaign access.
insert into public.haema_access_accounts(user_id,display_name,status)
select u.id,left(coalesce(nullif(u.raw_user_meta_data->>'full_name',''),'Jogador'),80),
 case when exists(select 1 from public.haema_members m where m.user_id=u.id)
 or exists(select 1 from public.haema_platform_admins a where a.user_id=u.id) then 'approved' else 'pending' end from auth.users u;
insert into public.haema_area_grants(user_id,area)
select distinct m.user_id,area from public.haema_members m cross join unnest(array['portal','materials']) as area on conflict do nothing;
insert into public.haema_area_grants(user_id,area) select user_id,'mesa' from public.haema_mesa_grants on conflict do nothing;

create function haema_private.has_area(requested text) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (public.haema_is_admin() or exists(
 select 1 from public.haema_access_accounts a join public.haema_area_grants g using(user_id)
 join auth.users u on u.id=a.user_id
 where a.user_id=auth.uid() and a.status='approved' and g.area=requested
 and (u.raw_app_meta_data->'providers' ? 'google' or u.raw_app_meta_data->>'provider'='google')));
$$;
create function public.haema_has_area(requested text) returns boolean language sql stable security invoker set search_path='' as $$
 select haema_private.has_area(requested);
$$;
-- Access changes and campaign assignment are one transaction with optimistic locking.
create function haema_private.review_access(target uuid, next_status text, areas text[], campaign uuid, expected_revision integer)
returns void language plpgsql security definer set search_path='' as $$
declare prior public.haema_access_accounts; before_areas text[];
begin
 if auth.uid() is null or not public.haema_is_admin() then raise exception 'Administrador necessário' using errcode='42501'; end if;
 if exists(select 1 from public.haema_platform_admins where user_id=target) then raise exception 'Administrador fundador protegido'; end if;
 if next_status not in ('approved','denied','revoked') or areas is null or
 not areas <@ array['library','bestiary','portal','mesa','materials']::text[] then raise exception 'Permissões inválidas'; end if;
 select * into prior from public.haema_access_accounts where user_id=target for update;
 if not found or prior.revision<>expected_revision then raise exception 'Cadastro atualizado por outra sessão. Recarregue.' using errcode='40001'; end if;
 if campaign is not null and not exists(select 1 from public.haema_campaigns where id=campaign and gm_id=auth.uid()) then raise exception 'Campanha inválida'; end if;
 select coalesce(array_agg(area),'{}') into before_areas from public.haema_area_grants where user_id=target;
 update public.haema_access_accounts set status=next_status,revision=revision+1,updated_at=clock_timestamp() where user_id=target;
 delete from public.haema_area_grants where user_id=target;
 if next_status='approved' then
  insert into public.haema_area_grants(user_id,area) select target,unnest(areas) on conflict do nothing;
  if campaign is not null then
   insert into public.haema_members(campaign_id,user_id,role) values(campaign,target,'player') on conflict do nothing;
  end if;
 end if;
 -- Keep the existing production Mesa gate consistent with a deliberate admin decision.
 delete from public.haema_mesa_grants where user_id=target;
 if next_status='approved' and 'mesa'=any(areas) then
  insert into public.haema_mesa_grants(user_id,granted_by) values(target,auth.uid());
 end if;
 insert into public.haema_access_log(actor_id,subject_id,action,details)
 values(auth.uid(),target,'access.review',jsonb_build_object('before',prior.status,'after',next_status,'previous_areas',before_areas,'areas',case when next_status='approved' then areas else '{}' end,'campaign',campaign));
end $$;
create function public.haema_review_access(target uuid,next_status text,areas text[],campaign uuid,expected_revision integer)
returns void language sql security invoker set search_path='' as $$
 select haema_private.review_access(target,next_status,areas,campaign,expected_revision);
$$;

create function haema_private.book_index() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare admin boolean;
begin
 if auth.uid() is null then raise exception 'Entre com Google' using errcode='42501'; end if;
 admin:=public.haema_is_admin();
 if not admin and not (haema_private.has_area('library') and haema_private.has_area('bestiary')) then raise exception 'Acesso ao Bestiário pendente' using errcode='42501'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',id,'title',title,'subtitle',subtitle,'state',editorial_state,'ordinal',ordinal,'revision',revision,'released',cardinality(released_indexes)>0) order by ordinal)
 from haema_private.bestiary where admin or cardinality(released_indexes)>0),'[]');
end $$;
create function public.haema_book_index() returns jsonb language sql stable security invoker set search_path='' as $$ select haema_private.book_index(); $$;
create function haema_private.book_entry(entry_id text) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare item haema_private.bestiary; admin boolean; body jsonb;
begin
 if auth.uid() is null then raise exception 'Entre com Google' using errcode='42501'; end if;
 admin:=public.haema_is_admin();
 if not admin and not (haema_private.has_area('library') and haema_private.has_area('bestiary')) then raise exception 'Acesso revogado ou pendente' using errcode='42501'; end if;
 select * into item from haema_private.bestiary where id=entry_id;
 if not found or (not admin and cardinality(item.released_indexes)=0) then raise exception 'Registro indisponível' using errcode='42501'; end if;
 select coalesce(jsonb_agg(p.value order by p.ordinality),'[]') into body
 from jsonb_array_elements(item.paragraphs) with ordinality p where admin or (p.ordinality-1)=any(item.released_indexes);
 return jsonb_build_object('id',item.id,'title',item.title,'subtitle',item.subtitle,'state',item.editorial_state,
 'paragraphs',body,'revision',item.revision,'source_version',item.source_version,
 'released_indexes',case when admin then to_jsonb(item.released_indexes) else null end,'master',admin);
end $$;
create function public.haema_book_entry(entry_id text) returns jsonb language sql stable security invoker set search_path='' as $$ select haema_private.book_entry(entry_id); $$;
create function haema_private.release_entry(entry_id text,indexes integer[],expected_revision integer) returns void language plpgsql security definer set search_path='' as $$
declare item haema_private.bestiary;
begin
 if auth.uid() is null or not public.haema_is_admin() then raise exception 'Administrador necessário' using errcode='42501'; end if;
 select * into item from haema_private.bestiary where id=entry_id for update;
 if not found or item.revision<>expected_revision then raise exception 'Registro atualizado. Recarregue.' using errcode='40001'; end if;
 if indexes is null or exists(select 1 from unnest(indexes) i where i<0 or i>=jsonb_array_length(item.paragraphs)) then raise exception 'Trechos inválidos'; end if;
 update haema_private.bestiary set released_indexes=indexes,revision=revision+1,updated_at=clock_timestamp() where id=entry_id;
 insert into public.haema_access_log(actor_id,action,details) values(auth.uid(),'bestiary.release',jsonb_build_object('entry',entry_id,'before',item.released_indexes,'after',indexes));
end $$;
create function public.haema_release_entry(entry_id text,indexes integer[],expected_revision integer) returns void language sql security invoker set search_path='' as $$ select haema_private.release_entry(entry_id,indexes,expected_revision); $$;
revoke all on all functions in schema haema_private from public,anon,authenticated;
grant execute on function haema_private.has_area(text),haema_private.review_access(uuid,text,text[],uuid,integer),
 haema_private.book_index(),haema_private.book_entry(text),haema_private.release_entry(text,integer[],integer) to authenticated;
revoke all on function public.haema_has_area(text),public.haema_review_access(uuid,text,text[],uuid,integer),public.haema_book_index(),public.haema_book_entry(text),public.haema_release_entry(text,integer[],integer) from public,anon;
grant execute on function public.haema_has_area(text),public.haema_review_access(uuid,text,text[],uuid,integer),public.haema_book_index(),public.haema_book_entry(text),public.haema_release_entry(text,integer[],integer) to authenticated;
-- Restrictive policies retain all existing ownership/campaign policies.
create policy access_portal_characters on public.haema_characters as restrictive for all to authenticated using((select public.haema_has_area('portal'))) with check((select public.haema_has_area('portal')));
create policy access_portal_messages on public.haema_messages as restrictive for all to authenticated using((select public.haema_has_area('portal'))) with check((select public.haema_has_area('portal')));
create policy access_materials on public.haema_materials as restrictive for all to authenticated using((select public.haema_has_area('materials'))) with check((select public.haema_has_area('materials')));
create policy access_records on public.haema_gm_records as restrictive for all to authenticated using((select public.haema_has_area('materials'))) with check((select public.haema_has_area('materials')));
create policy access_campaigns on public.haema_campaigns as restrictive for all to authenticated using((select public.haema_has_area('portal'))) with check((select public.haema_has_area('portal')));
create policy access_members on public.haema_members as restrictive for all to authenticated using((select public.haema_has_area('portal'))) with check((select public.haema_has_area('portal')));
-- New approvals are the only enrollment mechanism. Existing invitation records remain archived.
revoke execute on function public.haema_join_campaign(text) from authenticated;
create policy invites_archived on public.haema_invites as restrictive for all to authenticated using(false) with check(false);

