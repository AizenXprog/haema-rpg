-- HÆMA Biblioteca Reservada: migração ADITIVA. Não executar em produção antes da autorização.
-- Os manuscritos e respostas dos enigmas NÃO fazem parte deste repositório público.
create table if not exists haema_private.reserved_books (
  id text primary key check (id in ('arquivos-silenciados','peso-da-coroa','regencias-conhecidas')),
  title text not null,
  subtitle text not null default '',
  manuscript text not null default '',
  published boolean not null default false,
  revision integer not null default 0,
  updated_at timestamptz not null default now()
);
create table if not exists haema_private.reserved_grants (
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id text not null references haema_private.reserved_books(id) on delete cascade,
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now(),
  primary key(user_id,book_id)
);
create table if not exists haema_private.reserved_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id text not null references haema_private.reserved_books(id) on delete cascade,
  chapter_index integer not null default 0 check (chapter_index between 0 and 30),
  page_index integer not null default 0 check (page_index between 0 and 1000),
  solved_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key(user_id,book_id)
);
create table if not exists haema_private.reserved_puzzles (
  book_id text primary key references haema_private.reserved_books(id) on delete cascade,
  public_data jsonb not null default '{}'::jsonb,
  expected_answer jsonb not null default '{}'::jsonb,
  revelation text not null default ''
);
do $$ begin
  execute 'alter table haema_private.reserved_books enable row level security';
  execute 'alter table haema_private.reserved_grants enable row level security';
  execute 'alter table haema_private.reserved_progress enable row level security';
  execute 'alter table haema_private.reserved_puzzles enable row level security';
end $$;
revoke all on haema_private.reserved_books,haema_private.reserved_grants,haema_private.reserved_progress,haema_private.reserved_puzzles from public,anon,authenticated;

create or replace function haema_private.can_read_reserved(book_key text) returns boolean
language sql stable security definer set search_path='' as $$
select (select auth.uid()) is not null
 and exists(select 1 from haema_private.reserved_books b where b.id=book_key)
 and ((select public.haema_is_admin()) or (
   (select haema_private.has_area('library'))
   and exists (select 1 from haema_private.reserved_books b where b.id=book_key and b.published)
   and exists (select 1 from haema_private.reserved_grants g where g.user_id=(select auth.uid()) and g.book_id=book_key)
 ));
$$;

create or replace function haema_private.reserved_catalog() returns jsonb
language sql stable security definer set search_path='' as $$
select coalesce(jsonb_agg(jsonb_build_object(
 'id',b.id,'title',b.title,'subtitle',b.subtitle,
 'allowed',haema_private.can_read_reserved(b.id),
 'published',case when public.haema_is_admin() then b.published else null end
) order by case b.id when 'arquivos-silenciados' then 1 when 'peso-da-coroa' then 2 else 3 end),'[]'::jsonb)
from haema_private.reserved_books b
where (select auth.uid()) is not null;
$$;

create or replace function haema_private.reserved_read(book_key text) returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare b haema_private.reserved_books; p haema_private.reserved_progress; pu haema_private.reserved_puzzles;
begin
 if not haema_private.can_read_reserved(book_key) then raise exception 'Livro não autorizado' using errcode='42501'; end if;
 select * into b from haema_private.reserved_books where id=book_key;
 select * into p from haema_private.reserved_progress where user_id=auth.uid() and book_id=book_key;
 select * into pu from haema_private.reserved_puzzles where book_id=book_key;
 return jsonb_build_object('id',b.id,'title',b.title,'subtitle',b.subtitle,
 'manuscript',b.manuscript,'revision',b.revision,
 'puzzle',case when pu.book_id is null then null else pu.public_data end,
 'progress',jsonb_build_object('chapter',coalesce(p.chapter_index,0),'page',coalesce(p.page_index,0),'solved',p.solved_at is not null),
 'revelation',case when p.solved_at is not null then pu.revelation else null end);
end $$;

create or replace function haema_private.reserved_save(book_key text, chapter_number integer, page_number integer) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not haema_private.can_read_reserved(book_key) then raise exception 'Livro não autorizado' using errcode='42501'; end if;
 if chapter_number not between 0 and 30 or page_number not between 0 and 1000 then raise exception 'Posição inválida' using errcode='22023'; end if;
 insert into haema_private.reserved_progress(user_id,book_id,chapter_index,page_index)
 values(auth.uid(),book_key,chapter_number,page_number)
 on conflict(user_id,book_id) do update set chapter_index=excluded.chapter_index,page_index=excluded.page_index,updated_at=now();
end $$;

create or replace function haema_private.reserved_solve(book_key text, attempt jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare q haema_private.reserved_puzzles; valid boolean;
begin
 if not haema_private.can_read_reserved(book_key) then raise exception 'Livro não autorizado' using errcode='42501'; end if;
 select * into q from haema_private.reserved_puzzles where book_id=book_key;
 if not found or q.expected_answer='{}'::jsonb then raise exception 'Enigma indisponível' using errcode='22023'; end if;
 -- Comparação apenas no banco PRIVADO. Nunca enviar expected_answer ou revelation para clientes não concluídos.
 valid := attempt=q.expected_answer;
 if valid then
  insert into haema_private.reserved_progress(user_id,book_id,solved_at)
  values(auth.uid(),book_key,now())
  on conflict(user_id,book_id) do update set solved_at=coalesce(haema_private.reserved_progress.solved_at,now()),updated_at=now();
  insert into public.haema_access_log(actor_id,action,details)
  values(auth.uid(),'reserved.puzzle.solved',jsonb_build_object('book',book_key));
 end if;
 return jsonb_build_object('correct',valid,'unlocked',valid);
end $$;

create or replace function haema_private.reserved_admin_catalog() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.haema_is_admin() then raise exception 'Administrador necessário' using errcode='42501'; end if;
 return jsonb_build_object(
 'books',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'title',title,'published',published,'revision',revision,
  'loaded',length(manuscript)>0,'puzzle_ready',exists(select 1 from haema_private.reserved_puzzles p where p.book_id=id and p.expected_answer<>'{}'::jsonb)) order by id),'[]'::jsonb) from haema_private.reserved_books),
 'users',(select coalesce(jsonb_agg(jsonb_build_object('id',user_id,'name',display_name,'status',status) order by display_name),'[]'::jsonb) from public.haema_access_accounts),
 'grants',(select coalesce(jsonb_agg(jsonb_build_object('user',user_id,'book',book_id),'[]'::jsonb),'[]'::jsonb) from haema_private.reserved_grants),
 'progress',(select coalesce(jsonb_agg(jsonb_build_object('user',user_id,'book',book_id,'chapter',chapter_index,'page',page_index,'solved',solved_at is not null)),'[]'::jsonb) from haema_private.reserved_progress)
 );
end $$;

create or replace function haema_private.reserved_admin_grant(target uuid, book_key text, enable_access boolean) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.haema_is_admin() then raise exception 'Administrador necessário' using errcode='42501'; end if;
 if not exists(select 1 from public.haema_access_accounts where user_id=target) then raise exception 'Conta inexistente' using errcode='22023'; end if;
 if enable_access then
  insert into haema_private.reserved_grants(user_id,book_id,granted_by) values(target,book_key,auth.uid()) on conflict do nothing;
 else
  delete from haema_private.reserved_grants where user_id=target and book_id=book_key;
 end if;
 insert into public.haema_access_log(actor_id,subject_id,action,details)
 values(auth.uid(),target,'reserved.grant',jsonb_build_object('book',book_key,'allowed',enable_access));
end $$;

create or replace function haema_private.reserved_admin_reset(target uuid, book_key text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.haema_is_admin() then raise exception 'Administrador necessário' using errcode='42501'; end if;
 delete from haema_private.reserved_progress where user_id=target and book_id=book_key;
 insert into public.haema_access_log(actor_id,subject_id,action,details)
 values(auth.uid(),target,'reserved.reset',jsonb_build_object('book',book_key));
end $$;

create or replace function haema_private.reserved_admin_import(book_key text, book_title text, book_subtitle text, raw_manuscript text, puzzle_data jsonb, puzzle_answer jsonb, unlocked_text text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.haema_is_admin() then raise exception 'Administrador necessário' using errcode='42501'; end if;
 if book_key not in ('arquivos-silenciados','peso-da-coroa','regencias-conhecidas') or raw_manuscript is null or length(raw_manuscript) < 5000 or length(raw_manuscript)>150000 then
  raise exception 'Manuscrito inválido' using errcode='22023';
 end if;
 if length(coalesce(book_title,''))<3 or length(book_title)>140 or length(coalesce(book_subtitle,''))>250 then raise exception 'Título inválido' using errcode='22023'; end if;
 insert into haema_private.reserved_books(id,title,subtitle,manuscript,published)
 values(book_key,book_title,book_subtitle,raw_manuscript,false)
 on conflict(id) do update set title=excluded.title,subtitle=excluded.subtitle,manuscript=excluded.manuscript,published=false,revision=haema_private.reserved_books.revision+1,updated_at=now();
 -- Enigmas podem ser preparados em separado sem expor as soluções no repositório.
 if puzzle_data is not null and puzzle_answer is not null and unlocked_text is not null then
  insert into haema_private.reserved_puzzles(book_id,public_data,expected_answer,revelation)
  values(book_key,puzzle_data,puzzle_answer,unlocked_text)
  on conflict(book_id) do update set public_data=excluded.public_data,expected_answer=excluded.expected_answer,revelation=excluded.revelation;
 end if;
 insert into public.haema_access_log(actor_id,action,details)
 values(auth.uid(),'reserved.import',jsonb_build_object('book',book_key,'length',length(raw_manuscript)));
end $$;

create or replace function haema_private.reserved_admin_publish(book_key text, next_published boolean) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.haema_is_admin() then raise exception 'Administrador necessário' using errcode='42501'; end if;
 if next_published and not exists(select 1 from haema_private.reserved_books b
  join haema_private.reserved_puzzles p on p.book_id=b.id
  where b.id=book_key and length(b.manuscript)>5000 and p.expected_answer<>'{}'::jsonb) then
   raise exception 'Livro ou enigma incompletos' using errcode='22023';
 end if;
 update haema_private.reserved_books set published=next_published,updated_at=now() where id=book_key;
 if not found then raise exception 'Livro não encontrado' using errcode='22023'; end if;
 insert into public.haema_access_log(actor_id,action,details)
 values(auth.uid(),'reserved.publish',jsonb_build_object('book',book_key,'published',next_published));
end $$;

-- Fachada em public: sem acesso direto às tabelas privadas.
create or replace function public.haema_reserved_catalog() returns jsonb language sql stable security invoker set search_path='' as $$ select haema_private.reserved_catalog(); $$;
create or replace function public.haema_reserved_read(book_key text) returns jsonb language sql volatile security invoker set search_path='' as $$ select haema_private.reserved_read(book_key); $$;
create or replace function public.haema_reserved_save(book_key text,chapter_number integer,page_number integer) returns void language sql security invoker set search_path='' as $$ select haema_private.reserved_save(book_key,chapter_number,page_number); $$;
create or replace function public.haema_reserved_solve(book_key text,attempt jsonb) returns jsonb language sql security invoker set search_path='' as $$ select haema_private.reserved_solve(book_key,attempt); $$;
create or replace function public.haema_reserved_admin_catalog() returns jsonb language sql stable security invoker set search_path='' as $$ select haema_private.reserved_admin_catalog(); $$;
create or replace function public.haema_reserved_admin_grant(target uuid,book_key text,enable_access boolean) returns void language sql security invoker set search_path='' as $$ select haema_private.reserved_admin_grant(target,book_key,enable_access); $$;
create or replace function public.haema_reserved_admin_reset(target uuid,book_key text) returns void language sql security invoker set search_path='' as $$ select haema_private.reserved_admin_reset(target,book_key); $$;
create or replace function public.haema_reserved_admin_import(book_key text,book_title text,book_subtitle text,raw_manuscript text,puzzle_data jsonb,puzzle_answer jsonb,unlocked_text text) returns void language sql security invoker set search_path='' as $$ select haema_private.reserved_admin_import(book_key,book_title,book_subtitle,raw_manuscript,puzzle_data,puzzle_answer,unlocked_text); $$;
create or replace function public.haema_reserved_admin_publish(book_key text,next_published boolean) returns void language sql security invoker set search_path='' as $$ select haema_private.reserved_admin_publish(book_key,next_published); $$;

revoke all on function
 haema_private.can_read_reserved(text),haema_private.reserved_catalog(),haema_private.reserved_read(text),haema_private.reserved_save(text,integer,integer),
 haema_private.reserved_solve(text,jsonb),haema_private.reserved_admin_catalog(),haema_private.reserved_admin_grant(uuid,text,boolean),
 haema_private.reserved_admin_reset(uuid,text),haema_private.reserved_admin_import(text,text,text,text,jsonb,jsonb,text),haema_private.reserved_admin_publish(text,boolean),
 public.haema_reserved_catalog(),public.haema_reserved_read(text),public.haema_reserved_save(text,integer,integer),public.haema_reserved_solve(text,jsonb),
 public.haema_reserved_admin_catalog(),public.haema_reserved_admin_grant(uuid,text,boolean),public.haema_reserved_admin_reset(uuid,text),
 public.haema_reserved_admin_import(text,text,text,text,jsonb,jsonb,text),public.haema_reserved_admin_publish(text,boolean)
 from public,anon,authenticated;
grant execute on function
 haema_private.can_read_reserved(text),haema_private.reserved_catalog(),haema_private.reserved_read(text),haema_private.reserved_save(text,integer,integer),
 haema_private.reserved_solve(text,jsonb),haema_private.reserved_admin_catalog(),haema_private.reserved_admin_grant(uuid,text,boolean),
 haema_private.reserved_admin_reset(uuid,text),haema_private.reserved_admin_import(text,text,text,text,jsonb,jsonb,text),haema_private.reserved_admin_publish(text,boolean),
 public.haema_reserved_catalog(),public.haema_reserved_read(text),public.haema_reserved_save(text,integer,integer),public.haema_reserved_solve(text,jsonb),
 public.haema_reserved_admin_catalog(),public.haema_reserved_admin_grant(uuid,text,boolean),public.haema_reserved_admin_reset(uuid,text),
 public.haema_reserved_admin_import(text,text,text,text,jsonb,jsonb,text),public.haema_reserved_admin_publish(text,boolean)
 to authenticated;

-- Catálogo vazio até a importação ADMINISTRATIVA privada; não há manuscritos neste SQL.
insert into haema_private.reserved_books(id,title,subtitle)
values('arquivos-silenciados','Os Arquivos Silenciados','Historiadores'),
 ('peso-da-coroa','O Peso da Coroa','Político'),
 ('regencias-conhecidas','Tratado das Regências Conhecidas','Regentes')
on conflict(id) do nothing;
