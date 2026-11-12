-- HÆMA Estúdio 0.1: add an opt-in area, with zero grants issued.
-- Non-destructive: existing accounts, grants, Manual and Library unchanged.
alter table public.haema_area_grants
 drop constraint haema_area_grants_area_check;
alter table public.haema_area_grants
 add constraint haema_area_grants_area_check
 check (area = any(array['library','bestiary','portal','mesa','materials','studio']::text[]));

-- Preserve founder checks, revision guard, audit and existing Mesa access synchronization.
CREATE OR REPLACE FUNCTION haema_private.review_access(target uuid, next_status text, areas text[], campaign uuid, expected_revision integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare prior public.haema_access_accounts; before_areas text[];
begin
 if auth.uid() is null or not public.haema_is_admin() then raise exception 'Administrador necessário' using errcode='42501'; end if;
 if exists(select 1 from public.haema_platform_admins where user_id=target) then raise exception 'Administrador fundador protegido'; end if;
 if next_status not in ('approved','denied','revoked') or areas is null or
 not areas <@ array['library','bestiary','portal','mesa','materials','studio']::text[] then raise exception 'Permissões inválidas'; end if;
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
end $function$
;
