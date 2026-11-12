-- HÆMA · Central de Atividades (aditiva, sem copiar manuscritos, mensagens ou fichas)
-- 90 dias para eventos novos; legado é exibido somente com metadados e janela de 90 dias.
create table if not exists haema_private.activity_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  category text not null check(category in ('navigation','session','library','puzzle','chat','campaign','security')),
  action text not null check(length(action) between 3 and 72),
  target text not null default '' check(length(target)<=110),
  scope text not null default '' check(length(scope)<=110),
  source text not null default 'servidor' check(source in ('servidor','cliente')),
  occurred_at timestamptz not null default now()
);
create index if not exists activity_events_recent_idx on haema_private.activity_events (occurred_at desc,id desc);
create index if not exists activity_events_user_recent_idx on haema_private.activity_events (actor_id,occurred_at desc);
create table if not exists haema_private.activity_retention_control (
  singleton boolean primary key default true check(singleton),
  last_pruned timestamptz not null default '-infinity'
);
insert into haema_private.activity_retention_control(singleton) values(true) on conflict do nothing;
alter table haema_private.activity_events enable row level security;
alter table haema_private.activity_retention_control enable row level security;
revoke all on haema_private.activity_events,haema_private.activity_retention_control from public,anon,authenticated;

-- Interna. NÃO conceder EXECUTE diretamente a clientes. Não aceita conteúdo livre.
create or replace function haema_private.activity_mark(
  p_category text,p_action text,p_target text default '',p_scope text default '',
  p_source text default 'servidor',p_minutes integer default 0)
returns void language plpgsql volatile security definer set search_path='' as $$
declare v_cleanup boolean;
begin
 if auth.uid() is null or p_category not in ('navigation','session','library','puzzle','chat','campaign','security')
    or length(coalesce(p_action,'')) not between 3 and 72
    or length(coalesce(p_target,''))>110 or length(coalesce(p_scope,''))>110
    or p_source not in ('servidor','cliente') then return; end if;
 if p_minutes>0 and exists(select 1 from haema_private.activity_events e
    where e.actor_id=auth.uid() and e.category=p_category and e.action=p_action
      and e.target=coalesce(p_target,'') and e.scope=coalesce(p_scope,'')
      and e.occurred_at>now()-(least(p_minutes,1440)||' minutes')::interval) then return; end if;
 insert into haema_private.activity_events(actor_id,category,action,target,scope,source)
 values(auth.uid(),p_category,p_action,coalesce(p_target,''),coalesce(p_scope,''),p_source);
 update haema_private.activity_retention_control
 set last_pruned=now() where singleton and last_pruned<now()-interval '1 day'
 returning true into v_cleanup;
 if coalesce(v_cleanup,false) then
   delete from haema_private.activity_events where occurred_at<now()-interval '90 days';
 end if;
end $$;
revoke all on function haema_private.activity_mark(text,text,text,text,text,integer) from public,anon,authenticated;

-- Evento do navegador: o usuário só sinaliza A PRÓPRIA navegação, sem IDs arbitrários ou dados privados.
create or replace function haema_private.activity_signal(p_action text,p_target text) returns void
language plpgsql volatile security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Entre na conta.' using errcode='42501'; end if;
 if (p_action='page.view' and p_target in
    ('index.html','biblioteca.html','sistema.html','manual.html','portal.html',
     'administracao.html','campanha.html','mesa.html','estudio.html','atualizacoes.html'))
    or (p_action='session.connected' and p_target='portal') then
    perform haema_private.activity_mark(
      case when p_action='session.connected' then 'session' else 'navigation' end,
      p_action,p_target,'','cliente',15);
 else raise exception 'Evento não reconhecido.' using errcode='22023'; end if;
end $$;

-- Sem conteúdo de chats: apenas identificador da mensagem e da campanha.
create or replace function haema_private.activity_chat_trigger() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 perform haema_private.activity_mark('chat','chat.sent',new.id::text,new.campaign_id::text,'servidor',0);
 return new;
end $$;
drop trigger if exists haema_chat_activity on public.haema_messages;
create trigger haema_chat_activity after insert on public.haema_messages
for each row execute function haema_private.activity_chat_trigger();

create or replace function haema_private.activity_campaign_trigger() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 perform haema_private.activity_mark('campaign','campaign.created',new.id::text,'','servidor',0);
 return new;
end $$;
drop trigger if exists haema_campaign_activity on public.haema_campaigns;
create trigger haema_campaign_activity after insert on public.haema_campaigns
for each row execute function haema_private.activity_campaign_trigger();

create or replace function haema_private.activity_member_trigger() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if tg_op='DELETE' then
  perform haema_private.activity_mark('campaign','campaign.member_removed',
   old.user_id::text,old.campaign_id::text,'servidor',0);
  return old;
 end if;
 perform haema_private.activity_mark('campaign','campaign.member_added',
   new.user_id::text,new.campaign_id::text,'servidor',0);
 return new;
end $$;
drop trigger if exists haema_members_activity on public.haema_members;
create trigger haema_members_activity after insert or delete on public.haema_members
for each row execute function haema_private.activity_member_trigger();

-- Leitura efetiva: registrada no servidor, uma vez por janela para evitar os refreshes automáticos.
create or replace function haema_private.reserved_read(book_key text) returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare b haema_private.reserved_books; p haema_private.reserved_progress; pu haema_private.reserved_puzzles;
begin
 if not haema_private.can_read_reserved(book_key) then raise exception 'Livro não autorizado' using errcode='42501'; end if;
 select * into b from haema_private.reserved_books where id=book_key;
 select * into p from haema_private.reserved_progress where user_id=auth.uid() and book_id=book_key;
 select * into pu from haema_private.reserved_puzzles where book_id=book_key;
 perform haema_private.activity_mark('library','book.open',book_key,'','servidor',20);
 return jsonb_build_object('id',b.id,'title',b.title,'subtitle',b.subtitle,
 'manuscript',b.manuscript,'revision',b.revision,
 'puzzle',case when pu.book_id is null then null else pu.public_data end,
 'progress',jsonb_build_object('chapter',coalesce(p.chapter_index,0),'page',coalesce(p.page_index,0),'solved',p.solved_at is not null),
 'revelation',case when p.solved_at is not null then pu.revelation else null end);
end $$;

create or replace function haema_private.reserved_save(book_key text,chapter_number integer,page_number integer) returns void
language plpgsql security definer set search_path='' as $$
declare last_chapter integer;
begin
 if not haema_private.can_read_reserved(book_key) then raise exception 'Livro não autorizado' using errcode='42501'; end if;
 if chapter_number not between 0 and 30 or page_number not between 0 and 1000 then
  raise exception 'Posição inválida' using errcode='22023'; end if;
 select chapter_index into last_chapter from haema_private.reserved_progress
 where user_id=auth.uid() and book_id=book_key;
 insert into haema_private.reserved_progress(user_id,book_id,chapter_index,page_index)
 values(auth.uid(),book_key,chapter_number,page_number)
 on conflict(user_id,book_id) do update
  set chapter_index=excluded.chapter_index,page_index=excluded.page_index,updated_at=now();
 if last_chapter is distinct from chapter_number then
  perform haema_private.activity_mark('library','book.chapter',book_key,chapter_number::text,'servidor',15);
 end if;
end $$;

create or replace function haema_private.reserved_solve(book_key text,attempt jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare q haema_private.reserved_puzzles; valid boolean; first_solve boolean;
begin
 if not haema_private.can_read_reserved(book_key) then raise exception 'Livro não autorizado' using errcode='42501'; end if;
 select * into q from haema_private.reserved_puzzles where book_id=book_key;
 if not found or q.expected_answer='{}'::jsonb then raise exception 'Enigma indisponível' using errcode='22023'; end if;
 valid := (attempt=q.expected_answer);
 if valid then
  select not exists(select 1 from haema_private.reserved_progress p
    where p.user_id=auth.uid() and p.book_id=book_key and p.solved_at is not null) into first_solve;
  insert into haema_private.reserved_progress(user_id,book_id,solved_at)
  values(auth.uid(),book_key,now())
  on conflict(user_id,book_id) do update
    set solved_at=coalesce(haema_private.reserved_progress.solved_at,now()),updated_at=now();
  if first_solve then
    insert into public.haema_access_log(actor_id,action,details)
    values(auth.uid(),'reserved.puzzle.solved',jsonb_build_object('book',book_key));
  end if;
 else
  perform haema_private.activity_mark('puzzle','puzzle.attempt',book_key,'','servidor',1);
 end if;
 -- Nenhuma resposta, texto livre ou tentativa é armazenada no histórico.
 return jsonb_build_object('correct',valid,'unlocked',valid);
end $$;

-- Une novos eventos e audit trail legado, SEM before_data/after_data e SEM details privados.
create or replace function haema_private.activity_feed(
 p_from timestamptz default null,p_to timestamptz default null,
 p_actor uuid default null,p_category text default null,
 p_limit integer default 100,p_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare report jsonb; from_at timestamptz;to_at timestamptz;
begin
 if auth.uid() is null or not public.haema_is_admin() then
  raise exception 'Somente administradores podem consultar a auditoria.' using errcode='42501';
 end if;
 if p_limit not between 1 and 1000 or p_offset not between 0 and 20000 then
  raise exception 'Paginação inválida.' using errcode='22023'; end if;
 if p_category is not null and p_category not in
  ('navigation','session','library','puzzle','chat','campaign','character','material','record','access','security') then
  raise exception 'Categoria inválida.' using errcode='22023'; end if;
 from_at:=greatest(coalesce(p_from,now()-interval '7 days'),now()-interval '90 days');
 to_at:=least(coalesce(p_to,now()),now());
 if from_at>to_at then raise exception 'Período inválido.' using errcode='22023'; end if;
 with records as (
   select 'evt:'||e.id as event_key,e.actor_id,null::uuid as subject_id,
    e.category,e.action,e.target,e.scope,e.source,e.occurred_at
   from haema_private.activity_events e where e.occurred_at>=from_at and e.occurred_at<=to_at
   union all
   select 'acc:'||l.id,l.actor_id,l.subject_id,
    case when l.action like 'reserved.puzzle%' then 'puzzle'
         when l.action like 'reserved.%' or l.action like 'volume.%' or l.action like 'library.%' then 'library'
         else 'access' end,l.action,
    coalesce(l.details->>'book',l.details->>'volume',l.details->>'entry',l.subject_id::text,''),
    '','servidor',l.created_at
   from public.haema_access_log l where l.created_at>=from_at and l.created_at<=to_at
   union all
   select 'aud:'||a.id,a.actor_id,null::uuid,
    case a.entity_type when 'haema_characters' then 'character'
     when 'haema_materials' then 'material' else 'record' end,
    case a.entity_type when 'haema_characters' then 'character.'
     when 'haema_materials' then 'material.' else 'record.' end || lower(a.action),
    a.entity_id::text,a.campaign_id::text,'servidor',a.occurred_at
   from public.haema_audit a where a.occurred_at>=from_at and a.occurred_at<=to_at
 ),filtered as (
   select r.*,coalesce(u.display_name,'Conta sem cadastro') as actor_name,
     coalesce(subject.display_name,'') as subject_name
   from records r left join public.haema_access_accounts u on u.user_id=r.actor_id
     left join public.haema_access_accounts subject on subject.user_id=r.subject_id
   where (p_actor is null or r.actor_id=p_actor) and
     (p_category is null or r.category=p_category)
 )
 select jsonb_build_object(
  'total',(select count(*) from filtered),
  'items',(select coalesce(jsonb_agg(to_jsonb(p) order by p.occurred_at desc,p.event_key desc),'[]'::jsonb)
    from (select * from filtered order by occurred_at desc,event_key desc limit p_limit offset p_offset) p),
  'counts',(select coalesce(jsonb_object_agg(c.category,c.n),'{}'::jsonb)
    from (select category,count(*) as n from filtered group by category)c),
  'users',(select coalesce(jsonb_agg(jsonb_build_object('id',user_id,'name',display_name) order by display_name),'[]'::jsonb)
    from public.haema_access_accounts)
 ) into report;
 return report;
end $$;
create or replace function public.haema_activity_feed(
 p_from timestamptz default null,p_to timestamptz default null,
 p_actor uuid default null,p_category text default null,
 p_limit integer default 100,p_offset integer default 0)
returns jsonb language sql stable security invoker set search_path='' as $$
 select haema_private.activity_feed(p_from,p_to,p_actor,p_category,p_limit,p_offset);
$$;
create or replace function public.haema_activity_signal(p_action text,p_target text)
returns void language sql security invoker set search_path='' as $$
 select haema_private.activity_signal(p_action,p_target);
$$;
create or replace function haema_private.activity_prune() returns integer
language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 if auth.uid() is null or not public.haema_is_admin() then
  raise exception 'Apenas administradores podem aplicar a retenção.' using errcode='42501'; end if;
 delete from haema_private.activity_events where occurred_at<now()-interval '90 days';
 get diagnostics n=row_count;
 return n;
end $$;
create or replace function public.haema_activity_prune() returns integer
language sql security invoker set search_path='' as $$
 select haema_private.activity_prune();
$$;
revoke all on function haema_private.activity_signal(text,text),
 haema_private.activity_feed(timestamptz,timestamptz,uuid,text,integer,integer),
 haema_private.activity_prune(),public.haema_activity_signal(text,text),
 public.haema_activity_feed(timestamptz,timestamptz,uuid,text,integer,integer),
 public.haema_activity_prune(),
 haema_private.activity_chat_trigger(),haema_private.activity_campaign_trigger(),
 haema_private.activity_member_trigger()
 from public,anon,authenticated;
grant execute on function haema_private.activity_signal(text,text),
 haema_private.activity_feed(timestamptz,timestamptz,uuid,text,integer,integer),
 haema_private.activity_prune(),public.haema_activity_signal(text,text),
 public.haema_activity_feed(timestamptz,timestamptz,uuid,text,integer,integer),
 public.haema_activity_prune()
 to authenticated;
