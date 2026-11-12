-- Additive private book storage. No narrative text and no user grants.
create table haema_private.volumes (
 id text primary key check (id in ('frikten','jankinss')),
 title text not null, subtitle text not null, chapters jsonb not null check (jsonb_typeof(chapters)='array' and jsonb_array_length(chapters)=4),
 released boolean not null default false, revision integer not null default 0,
 source_hash text not null, updated_at timestamptz not null default now()
);
alter table haema_private.volumes enable row level security;
revoke all on haema_private.volumes from public,anon,authenticated;
create function haema_private.volume_catalog() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.haema_is_admin() then raise exception 'Administração necessária' using errcode='42501'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',id,'title',title,'released',released,'revision',revision) order by id) from haema_private.volumes),'[]');
end $$;
create function haema_private.volume_read(volume_id text) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare item haema_private.volumes;
begin
 if auth.uid() is null or not haema_private.has_area('library') then raise exception 'Acesso à Biblioteca necessário' using errcode='42501'; end if;
 select * into item from haema_private.volumes where id=volume_id;
 if not found or (not item.released and not public.haema_is_admin()) then raise exception 'Volume não liberado' using errcode='42501'; end if;
 return jsonb_build_object('id',item.id,'title',item.title,'subtitle',item.subtitle,'chapters',item.chapters,'revision',item.revision,'released',item.released);
end $$;
create function haema_private.volume_release(volume_id text,release boolean,expected_revision integer) returns void language plpgsql security definer set search_path='' as $$
declare item haema_private.volumes;
begin
 if auth.uid() is null or not public.haema_is_admin() then raise exception 'Administração necessária' using errcode='42501'; end if;
 if release is null or expected_revision is null then raise exception 'Revisão inválida' using errcode='22023'; end if;
 select * into item from haema_private.volumes where id=volume_id for update;
 if not found then raise exception 'Volume indisponível' using errcode='22023'; end if;
 if item.revision<>expected_revision then raise exception 'O volume foi alterado; atualize a página' using errcode='40001'; end if;
 update haema_private.volumes set released=release,revision=revision+1,updated_at=clock_timestamp() where id=volume_id;
 insert into public.haema_access_log(actor_id,action,details) values(auth.uid(),'volume.release',jsonb_build_object('volume',volume_id,'before',item.released,'after',release));
end $$;
create function public.haema_volume_catalog() returns jsonb language sql stable security invoker set search_path='' as $$ select haema_private.volume_catalog(); $$;
create function public.haema_volume_read(volume_id text) returns jsonb language sql stable security invoker set search_path='' as $$ select haema_private.volume_read(volume_id); $$;
create function public.haema_volume_release(volume_id text,release boolean,expected_revision integer) returns void language sql security invoker set search_path='' as $$ select haema_private.volume_release(volume_id,release,expected_revision); $$;
revoke all on function haema_private.volume_catalog(),haema_private.volume_read(text),haema_private.volume_release(text,boolean,integer),public.haema_volume_catalog(),public.haema_volume_read(text),public.haema_volume_release(text,boolean,integer) from public,anon,authenticated;
grant execute on function haema_private.volume_catalog(),haema_private.volume_read(text),haema_private.volume_release(text,boolean,integer),public.haema_volume_catalog(),public.haema_volume_read(text),public.haema_volume_release(text,boolean,integer) to authenticated;
