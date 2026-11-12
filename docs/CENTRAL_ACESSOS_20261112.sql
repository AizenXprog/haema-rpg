-- HÆMA · Central de Acessos (12/11/2026)
-- Migração ADITIVA. Conserva status, permissões, contas, campanhas, progresso e manuscritos.
-- Somente administradores podem consultar ou alterar os dados retornados.

create or replace function haema_private.access_control_snapshot() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
  if auth.uid() is null or not public.haema_is_admin() then
    raise exception 'Somente administradores podem visualizar a Central de Acessos.' using errcode='42501';
  end if;
  return jsonb_build_object(
    'users',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',a.user_id,
        'name',coalesce(nullif(a.display_name,''),'Conta sem nome'),
        'email',coalesce(u.email,''),
        'status',a.status,'revision',a.revision,
        'admin',exists(select 1 from public.haema_platform_admins f where f.user_id=a.user_id),
        'areas',coalesce((select jsonb_agg(g.area order by g.area) from public.haema_area_grants g where g.user_id=a.user_id),'[]'::jsonb),
        'books',coalesce((select jsonb_agg(g.book_id order by g.book_id) from haema_private.reserved_grants g where g.user_id=a.user_id),'[]'::jsonb)
      ) order by a.display_name)
      from public.haema_access_accounts a left join auth.users u on u.id=a.user_id
    ),'[]'::jsonb),
    'books',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',b.id,'title',b.title,'subtitle',b.subtitle,
        'published',b.published,
        'ready',length(b.manuscript)>5000 and exists(select 1 from haema_private.reserved_puzzles p where p.book_id=b.id and p.expected_answer <> '{}'::jsonb),
        'assigned',(select count(*) from haema_private.reserved_grants g where g.book_id=b.id),
        'eligible',(select count(*) from haema_private.reserved_grants g
          join public.haema_access_accounts a on a.user_id=g.user_id
          join public.haema_area_grants ag on ag.user_id=a.user_id and ag.area='library'
          where g.book_id=b.id and a.status='approved')
      ) order by case b.id
        when 'arquivos-silenciados' then 1 when 'peso-da-coroa' then 2 else 3 end)
      from haema_private.reserved_books b
    ),'[]'::jsonb),
    'recent',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',l.id,'at',l.created_at,'actor',l.actor_id,'subject',l.subject_id,
        'action',l.action,'details',l.details) order by l.id desc)
      from (select id,created_at,actor_id,subject_id,action,details
        from public.haema_access_log
        where action in ('access.review','access.bundle','reserved.grant','reserved.access.book','reserved.publish')
        order by id desc limit 40) l
    ),'[]'::jsonb)
  );
end $$;

create or replace function haema_private.access_control_user_save(
  target uuid, next_status text, requested_areas text[],
  requested_books text[], expected_revision integer)
returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  a public.haema_access_accounts;
  before_areas text[] := '{}'::text[];
  before_books text[] := '{}'::text[];
  after_areas text[] := '{}'::text[];
  after_books text[] := '{}'::text[];
  desired_areas text[] := '{}'::text[];
  desired_books text[] := '{}'::text[];
begin
  if auth.uid() is null or not public.haema_is_admin() then
    raise exception 'Apenas administradores podem alterar permissões.' using errcode='42501';
  end if;
  if exists(select 1 from public.haema_platform_admins where user_id=target) then
    raise exception 'Acesso do administrador fundador protegido.' using errcode='42501';
  end if;
  if requested_areas is null or requested_books is null or next_status is null then
    raise exception 'Envie o status e as permissões completas.' using errcode='22023';
  end if;
  if next_status not in ('pending','approved','denied','revoked') then
    raise exception 'Situação da conta inválida.' using errcode='22023';
  end if;
  if exists(select 1 from unnest(requested_areas) x where x is null or x not in ('library','bestiary','portal','mesa','materials','studio')) then
    raise exception 'Existe uma área não reconhecida.' using errcode='22023';
  end if;
  if exists(select 1 from unnest(requested_books) x
    where x is null or not exists(select 1 from haema_private.reserved_books b where b.id=x)) then
    raise exception 'Existe um livro não reconhecido.' using errcode='22023';
  end if;
  if next_status<>'approved' and cardinality(requested_areas)>0 then
    raise exception 'Contas não aprovadas não podem receber acesso às áreas.' using errcode='22023';
  end if;
  select coalesce(array_agg(distinct x order by x),'{}'::text[]) into desired_areas from unnest(requested_areas) x;
  select coalesce(array_agg(distinct x order by x),'{}'::text[]) into desired_books from unnest(requested_books) x;
  select * into a from public.haema_access_accounts where user_id=target for update;
  if not found then raise exception 'A conta não foi encontrada.' using errcode='22023'; end if;
  if expected_revision is null or a.revision<>expected_revision then
    raise exception 'Outra sessão alterou esta conta. Atualize a Central antes de salvar.' using errcode='40001';
  end if;
  if next_status='pending' and a.status<>'pending' then
    raise exception 'Use Revogado para suspender uma conta já analisada.' using errcode='22023';
  end if;
  select coalesce(array_agg(g.area order by g.area),'{}'::text[])
    into before_areas from public.haema_area_grants g where g.user_id=target;
  select coalesce(array_agg(g.book_id order by g.book_id),'{}'::text[])
    into before_books from haema_private.reserved_grants g where g.user_id=target;
  if a.status is distinct from next_status or before_areas is distinct from desired_areas then
    perform haema_private.review_access(target,next_status,desired_areas,null,a.revision);
  else
    update public.haema_access_accounts
      set revision=revision+1,updated_at=clock_timestamp()
      where user_id=target;
  end if;
  delete from haema_private.reserved_grants g
    where g.user_id=target and not(g.book_id=any(desired_books));
  insert into haema_private.reserved_grants(user_id,book_id,granted_by)
    select target,x,auth.uid() from unnest(desired_books) x on conflict do nothing;
  select coalesce(array_agg(g.area order by g.area),'{}'::text[])
    into after_areas from public.haema_area_grants g where g.user_id=target;
  select coalesce(array_agg(g.book_id order by g.book_id),'{}'::text[])
    into after_books from haema_private.reserved_grants g where g.user_id=target;
  insert into public.haema_access_log(actor_id,subject_id,action,details)
  values(auth.uid(),target,'access.bundle',
    jsonb_build_object('before_status',a.status,'after_status',next_status,
      'before_areas',before_areas,'after_areas',after_areas,
      'before_books',before_books,'after_books',after_books));
  return jsonb_build_object(
    'id',target,'status',next_status,
    'revision',(select revision from public.haema_access_accounts where user_id=target),
    'areas',after_areas,'books',after_books);
end $$;

create or replace function haema_private.access_control_book_save(
  book_key text, requested_users uuid[], expected_users uuid[])
returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  b haema_private.reserved_books;
  before_users uuid[] := '{}'::uuid[];
  desired_users uuid[] := '{}'::uuid[];
  expected_set uuid[] := '{}'::uuid[];
begin
  if auth.uid() is null or not public.haema_is_admin() then
    raise exception 'Apenas administradores podem alterar permissões.' using errcode='42501';
  end if;
  if requested_users is null or expected_users is null then
    raise exception 'Informe a lista de pessoas e a versão atual.' using errcode='22023';
  end if;
  select * into b from haema_private.reserved_books where id=book_key for update;
  if not found then raise exception 'Livro inexistente.' using errcode='22023'; end if;
  if exists(select 1 from unnest(requested_users) x
    where x is null or not exists(select 1 from public.haema_access_accounts a where a.user_id=x)
      or exists(select 1 from public.haema_platform_admins f where f.user_id=x)) then
    raise exception 'A lista contém conta inexistente ou protegida.' using errcode='22023';
  end if;
  select coalesce(array_agg(distinct x order by x),'{}'::uuid[]) into desired_users from unnest(requested_users) x;
  select coalesce(array_agg(distinct x order by x),'{}'::uuid[]) into expected_set from unnest(expected_users) x;
  select coalesce(array_agg(g.user_id order by g.user_id),'{}'::uuid[])
    into before_users from haema_private.reserved_grants g where g.book_id=book_key;
  if before_users<>expected_set then
    raise exception 'As autorizações deste livro mudaram em outra sessão. Atualize antes de salvar.' using errcode='40001';
  end if;
  delete from haema_private.reserved_grants g where g.book_id=book_key and not(g.user_id=any(desired_users));
  insert into haema_private.reserved_grants(user_id,book_id,granted_by)
    select x,book_key,auth.uid() from unnest(desired_users) x on conflict do nothing;
  update public.haema_access_accounts a set revision=a.revision+1,updated_at=clock_timestamp()
    where a.user_id=any(before_users) or a.user_id=any(desired_users);
  insert into public.haema_access_log(actor_id,action,details)
    values(auth.uid(),'reserved.access.book',
      jsonb_build_object('book',book_key,'before',before_users,'after',desired_users));
  return jsonb_build_object('book',book_key,'assigned',cardinality(desired_users));
end $$;

create or replace function public.haema_access_control_snapshot()
returns jsonb language sql stable security invoker set search_path='' as $$
 select haema_private.access_control_snapshot();
$$;
create or replace function public.haema_access_control_user_save(
  target uuid,next_status text,requested_areas text[],requested_books text[],expected_revision integer)
returns jsonb language sql security invoker set search_path='' as $$
 select haema_private.access_control_user_save(target,next_status,requested_areas,requested_books,expected_revision);
$$;
create or replace function public.haema_access_control_book_save(
  book_key text,requested_users uuid[],expected_users uuid[])
returns jsonb language sql security invoker set search_path='' as $$
 select haema_private.access_control_book_save(book_key,requested_users,expected_users);
$$;
revoke all on function
  haema_private.access_control_snapshot(),
  haema_private.access_control_user_save(uuid,text,text[],text[],integer),
  haema_private.access_control_book_save(text,uuid[],uuid[]),
  public.haema_access_control_snapshot(),
  public.haema_access_control_user_save(uuid,text,text[],text[],integer),
  public.haema_access_control_book_save(text,uuid[],uuid[])
from public,anon,authenticated;
grant execute on function
  haema_private.access_control_snapshot(),
  haema_private.access_control_user_save(uuid,text,text[],text[],integer),
  haema_private.access_control_book_save(text,uuid[],uuid[]),
  public.haema_access_control_snapshot(),
  public.haema_access_control_user_save(uuid,text,text[],text[],integer),
  public.haema_access_control_book_save(text,uuid[],uuid[])
to authenticated;
