-- HÆMA Portal 0.1 · executar no SQL Editor de um projeto Supabase dedicado.
-- Nenhuma tabela de fichas legadas é alterada. A autenticação Google é habilitada no painel Supabase.
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.haema_platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create table if not exists public.haema_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Viajante' check (char_length(display_name) between 1 and 80),
  avatar_url text,
  updated_at timestamptz not null default now()
);
create table if not exists public.haema_campaigns (
  id uuid primary key default gen_random_uuid(),
  gm_id uuid not null references auth.users(id),
  name text not null check (char_length(name) between 3 and 100),
  description text not null default '' check (char_length(description)<=1200),
  created_at timestamptz not null default now()
);
create table if not exists public.haema_members (
  campaign_id uuid not null references public.haema_campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('gm','player')),
  joined_at timestamptz not null default now(),
  primary key(campaign_id,user_id)
);
create table if not exists public.haema_invites (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.haema_campaigns(id) on delete cascade,
  token_hash text not null unique check(token_hash~'^[a-f0-9]{64}$'),
  uses integer not null default 0 check(uses>=0),
  max_uses integer not null default 5 check(max_uses between 1 and 50),
  expires_at timestamptz not null default (now()+ interval '14 days'),
  created_at timestamptz not null default now()
);
create table if not exists public.haema_characters (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.haema_campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  rules_version text not null default '0.1' check (rules_version='0.1'),
  payload jsonb not null check (
    payload->>'format'='haema-character' and payload->>'version'='0.1'
    and jsonb_typeof(payload->'attributes')='array' and jsonb_array_length(payload->'attributes')=6
    and jsonb_typeof(payload->'skills')='array' and jsonb_array_length(payload->'skills')=24
  ),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(id,campaign_id)
);
create table if not exists public.haema_materials (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.haema_campaigns(id) on delete cascade,
  title text not null check(char_length(title) between 1 and 120),
  kind text not null default 'documento' check(kind in ('documento','pista','referencia','mapa')),
  content text not null default '' check (char_length(content)<=20000),
  visibility text not null default 'players' check (visibility in ('players','gm')),
  author_id uuid not null references auth.users(id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create table if not exists public.haema_messages (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.haema_campaigns(id) on delete cascade,
  author_id uuid not null references public.haema_profiles(id),
  content text not null check(char_length(btrim(content)) between 1 and 1500),
  created_at timestamptz not null default now()
);
create table if not exists public.haema_gm_records (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.haema_campaigns(id) on delete cascade,
  category text not null check(category in ('lore','sistema','sessao','planejamento')),
  title text not null check(char_length(title) between 1 and 160),
  content text not null default '' check(char_length(content)<=30000),
  status text not null default 'rascunho' check(status in ('rascunho','proposta','aprovado','arquivado')),
  visibility text not null default 'gm' check (visibility in ('gm','players')),
  author_id uuid not null references auth.users(id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create table if not exists public.haema_audit (
  id bigint generated always as identity primary key,
  campaign_id uuid not null references public.haema_campaigns(id) on delete cascade,
  actor_id uuid,
  entity_type text not null,
  entity_id uuid not null,
  action text not null check(action in ('INSERT','UPDATE','DELETE')),
  before_data jsonb,
  after_data jsonb,
  occurred_at timestamptz not null default now()
);
-- A Mesa é um recurso opt-in: autenticação Google não dá acesso por si só.
create table if not exists public.haema_mesa_grants (
 user_id uuid primary key references auth.users(id) on delete cascade,
 granted_by uuid not null references auth.users(id),
 granted_at timestamptz not null default now()
);
create index if not exists haema_messages_campaign_time_idx on public.haema_messages(campaign_id,created_at desc);
create index if not exists haema_audit_campaign_time_idx on public.haema_audit(campaign_id,occurred_at desc);
create index if not exists haema_characters_campaign_idx on public.haema_characters(campaign_id);
create index if not exists haema_materials_campaign_idx on public.haema_materials(campaign_id);

-- SECURITY DEFINER avoids recursive RLS lookups; schema-qualified references and fixed search_path.
create or replace function public.haema_is_admin() returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.haema_platform_admins where user_id=auth.uid());
$$;
create or replace function public.haema_is_member(cid uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.haema_members where campaign_id=cid and user_id=auth.uid());
$$;
create or replace function public.haema_is_gm(cid uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.haema_campaigns where id=cid and gm_id=auth.uid());
$$;
create or replace function public.haema_profile_visible(pid uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select auth.uid()=pid or exists(
  select 1 from public.haema_members a
  join public.haema_members b using(campaign_id)
  where a.user_id=auth.uid() and b.user_id=pid
 );
$$;

-- A campanha cria automaticamente a associação mestre; não dar escrita direta nos cargos.
create or replace function public.haema_after_campaign_create() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.haema_members(campaign_id,user_id,role) values(new.id,new.gm_id,'gm');
 return new;
end; $$;
drop trigger if exists haema_campaign_bootstrap on public.haema_campaigns;
create trigger haema_campaign_bootstrap after insert on public.haema_campaigns
for each row execute function public.haema_after_campaign_create();

-- Convite de alta entropia fornecido uma vez pelo mestre; servidor armazena só SHA256.
create or replace function public.haema_join_campaign(code text) returns uuid language plpgsql security definer set search_path = '' as $$
declare cid uuid; inv_id uuid;
begin
 if auth.uid() is null then raise exception 'É necessário entrar na conta'; end if;
 if char_length(code)<32 or char_length(code)>128 then raise exception 'Convite inválido'; end if;
 select id,campaign_id into inv_id,cid from public.haema_invites
 where token_hash=encode(extensions.digest(code,'sha256'),'hex')
   and expires_at>now() and uses<max_uses
 for update;
 if cid is null then raise exception 'Convite inválido ou expirado'; end if;
 insert into public.haema_members(campaign_id,user_id,role)
 values(cid,auth.uid(),'player') on conflict(campaign_id,user_id) do nothing;
 update public.haema_invites set uses=uses+1 where id=inv_id;
 return cid;
end; $$;

-- Log imutável de mudanças em fichas, registros de lore/sistema e materiais.
create or replace function public.haema_audit_change() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.haema_audit(campaign_id,actor_id,entity_type,entity_id,action,before_data,after_data)
 values(coalesce(new.campaign_id,old.campaign_id),auth.uid(),tg_table_name,
 coalesce(new.id,old.id),tg_op,
 case when tg_op='INSERT' then null else to_jsonb(old) end,
 case when tg_op='DELETE' then null else to_jsonb(new) end);
 return coalesce(new,old);
end; $$;
drop trigger if exists haema_audit_characters on public.haema_characters;
create trigger haema_audit_characters after insert or update or delete on public.haema_characters for each row execute function public.haema_audit_change();
drop trigger if exists haema_audit_records on public.haema_gm_records;
create trigger haema_audit_records after insert or update or delete on public.haema_gm_records for each row execute function public.haema_audit_change();
drop trigger if exists haema_audit_materials on public.haema_materials;
create trigger haema_audit_materials after insert or update or delete on public.haema_materials for each row execute function public.haema_audit_change();

-- Explicit table privileges; RLS then limits every authenticated row.
grant usage on schema public to authenticated;
grant select,insert,update,delete on public.haema_profiles, public.haema_campaigns,
 public.haema_members, public.haema_invites, public.haema_characters,
 public.haema_materials, public.haema_messages, public.haema_gm_records to authenticated;
grant select on public.haema_audit to authenticated;
grant select,insert,delete on public.haema_mesa_grants to authenticated;
revoke all on public.haema_profiles,public.haema_campaigns,public.haema_members,
 public.haema_invites,public.haema_characters,public.haema_materials,
 public.haema_messages,public.haema_gm_records,public.haema_audit from anon;

-- Permissões: por padrão tudo fechado, somente usuários autenticados com acesso à campanha.
revoke all on public.haema_mesa_grants from anon;
revoke all on public.haema_platform_admins from anon,authenticated;
revoke all on public.haema_audit from anon;
revoke execute on function public.haema_after_campaign_create() from public,anon,authenticated;
revoke execute on function public.haema_audit_change() from public,anon,authenticated;
revoke execute on function public.haema_join_campaign(text) from public,anon;
grant execute on function public.haema_join_campaign(text) to authenticated;
grant select on public.haema_audit to authenticated;
-- Security definer predicates are needed by policy evaluation, not by anonymous users.
revoke execute on function public.haema_is_admin() from public,anon;
revoke execute on function public.haema_is_member(uuid) from public,anon;
revoke execute on function public.haema_is_gm(uuid) from public,anon;
revoke execute on function public.haema_profile_visible(uuid) from public,anon;
grant execute on function public.haema_is_admin() to authenticated;
grant execute on function public.haema_is_member(uuid) to authenticated;
grant execute on function public.haema_is_gm(uuid) to authenticated;
grant execute on function public.haema_profile_visible(uuid) to authenticated;

alter table public.haema_platform_admins enable row level security;
alter table public.haema_profiles enable row level security;
alter table public.haema_campaigns enable row level security;
alter table public.haema_members enable row level security;
alter table public.haema_invites enable row level security;
alter table public.haema_characters enable row level security;
alter table public.haema_materials enable row level security;
alter table public.haema_messages enable row level security;
alter table public.haema_gm_records enable row level security;
alter table public.haema_audit enable row level security;
alter table public.haema_mesa_grants enable row level security;

create policy profiles_read on public.haema_profiles for select to authenticated using(public.haema_profile_visible(id));
create policy profiles_insert on public.haema_profiles for insert to authenticated with check(id=auth.uid());
create policy profiles_update on public.haema_profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy campaign_read on public.haema_campaigns for select to authenticated using(public.haema_is_member(id));
create policy campaign_create on public.haema_campaigns for insert to authenticated with check(gm_id=auth.uid() and public.haema_is_admin());
create policy campaign_update on public.haema_campaigns for update to authenticated using(public.haema_is_gm(id)) with check(gm_id=auth.uid());
create policy members_read on public.haema_members for select to authenticated using(public.haema_is_member(campaign_id));
create policy invites_read on public.haema_invites for select to authenticated using(public.haema_is_gm(campaign_id));
create policy invites_insert on public.haema_invites for insert to authenticated with check(public.haema_is_gm(campaign_id));
create policy invites_delete on public.haema_invites for delete to authenticated using(public.haema_is_gm(campaign_id));
create policy characters_read on public.haema_characters for select to authenticated using(user_id=auth.uid() or public.haema_is_gm(campaign_id));
create policy characters_insert on public.haema_characters for insert to authenticated with check(user_id=auth.uid() and public.haema_is_member(campaign_id));
create policy characters_update on public.haema_characters for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid() and public.haema_is_member(campaign_id));
create policy characters_delete on public.haema_characters for delete to authenticated using(user_id=auth.uid());
create policy materials_read on public.haema_materials for select to authenticated using(public.haema_is_gm(campaign_id) or (visibility='players' and public.haema_is_member(campaign_id)));
create policy materials_insert on public.haema_materials for insert to authenticated with check(public.haema_is_gm(campaign_id) and author_id=auth.uid());
create policy materials_update on public.haema_materials for update to authenticated using(public.haema_is_gm(campaign_id)) with check(public.haema_is_gm(campaign_id));
create policy materials_delete on public.haema_materials for delete to authenticated using(public.haema_is_gm(campaign_id));
create policy messages_read on public.haema_messages for select to authenticated using(public.haema_is_member(campaign_id));
create policy messages_insert on public.haema_messages for insert to authenticated with check(author_id=auth.uid() and public.haema_is_member(campaign_id));
create policy messages_delete on public.haema_messages for delete to authenticated using(author_id=auth.uid() or public.haema_is_gm(campaign_id));
create policy gm_records_read on public.haema_gm_records for select to authenticated using(public.haema_is_gm(campaign_id) or (visibility='players' and public.haema_is_member(campaign_id)));
create policy gm_records_insert on public.haema_gm_records for insert to authenticated with check(public.haema_is_gm(campaign_id) and author_id=auth.uid());
create policy gm_records_update on public.haema_gm_records for update to authenticated using(public.haema_is_gm(campaign_id)) with check(public.haema_is_gm(campaign_id));
create policy gm_records_delete on public.haema_gm_records for delete to authenticated using(public.haema_is_gm(campaign_id));
create policy audit_read on public.haema_audit for select to authenticated using(public.haema_is_gm(campaign_id));
-- Apenas o usuário ou o administrador pode ver sua permissão; só administrador concede/revoga.
create policy mesa_read on public.haema_mesa_grants for select to authenticated using(user_id=(select auth.uid()) or (select public.haema_is_admin()));
create policy mesa_insert on public.haema_mesa_grants for insert to authenticated with check((select public.haema_is_admin()) and granted_by=(select auth.uid()));
create policy mesa_delete on public.haema_mesa_grants for delete to authenticated using((select public.haema_is_admin()));

-- Realtime do chat (idempotente sem reabrir todas as tabelas privadas).
do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='haema_messages') then
  alter publication supabase_realtime add table public.haema_messages;
 end if;
end $$;

-- APÓS o seu primeiro login Google, promova manualmente somente o seu auth.users.id:
-- insert into public.haema_platform_admins(user_id) values ('SEU-UUID-AQUI');
-- NÃO insira emails nem credenciais Google neste repositório.
