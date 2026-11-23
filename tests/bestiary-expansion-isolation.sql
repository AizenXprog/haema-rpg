-- RLS end-to-end: all fixtures vanish under ROLLBACK.
-- Historical records with visibility='gm' must never be readable by a player,
-- even when that player has both portal AND materials grants.
BEGIN;
INSERT INTO auth.users(id,raw_app_meta_data,raw_user_meta_data,aud,role)
VALUES ('88888888-8888-4888-8888-888888888888',
 '{"provider":"google","providers":["google"]}','{"full_name":"QA Arquivo jogador"}',
 'authenticated','authenticated');
UPDATE public.haema_access_accounts SET status='approved'
WHERE user_id='88888888-8888-4888-8888-888888888888';
INSERT INTO public.haema_area_grants(user_id,area)
VALUES('88888888-8888-4888-8888-888888888888','portal'),
      ('88888888-8888-4888-8888-888888888888','materials'),
      ('88888888-8888-4888-8888-888888888888','library'),
      ('88888888-8888-4888-8888-888888888888','bestiary')
ON CONFLICT DO NOTHING;
INSERT INTO public.haema_campaigns(id,gm_id,name,description)
SELECT '77777777-7777-4777-8777-777777777777',user_id,
 'Campanha de ensaio GM','Fixture temporária' FROM public.haema_platform_admins LIMIT 1;
INSERT INTO public.haema_members(campaign_id,user_id,role)
VALUES('77777777-7777-4777-8777-777777777777',
 '88888888-8888-4888-8888-888888888888','player');
INSERT INTO public.haema_gm_archive(campaign_id,owner_id,kind,title,content)
SELECT '77777777-7777-4777-8777-777777777777',user_id,
 'pista','Segredo do Mestre - QA','Esta anotação não pode ser lida pelo jogador'
 FROM public.haema_platform_admins LIMIT 1;
INSERT INTO public.haema_gm_records(campaign_id,author_id,category,title,content,status,visibility)
SELECT '77777777-7777-4777-8777-777777777777',user_id,
 'planejamento','Segredo anterior - QA','Privado, mesmo com materials',
 'rascunho','gm' FROM public.haema_platform_admins LIMIT 1;
SELECT set_config('request.jwt.claims',
 '{"sub":"88888888-8888-4888-8888-888888888888","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 ASSERT (SELECT count(*)=0 FROM public.haema_gm_archive WHERE campaign_id='77777777-7777-4777-8777-777777777777'), 'Vazamento de Arquivo privado para jogador';
 ASSERT (SELECT count(*)=0 FROM public.haema_gm_records WHERE campaign_id='77777777-7777-4777-8777-777777777777'), 'Vazamento de notas legadas';
 ASSERT (SELECT count(*)>=1 FROM public.haema_campaigns WHERE id='77777777-7777-4777-8777-777777777777'), 'Jogador perdeu acesso à própria campanha';
 ASSERT jsonb_array_length(public.haema_book_index())=25,'Fichas novas vazaram antes da publicação';
 ASSERT jsonb_array_length(public.haema_book_entry('registro-01')->'paragraphs')=5,'Leitura aprovada anterior foi perdida';
 BEGIN
  PERFORM public.haema_book_entry('h01-01');
  RAISE EXCEPTION 'Novo animal foi exposto antes de sua liberação';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  PERFORM public.haema_book_entry('u01');
  RAISE EXCEPTION 'Relato lendário foi exposto ao jogador';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  INSERT INTO public.haema_gm_archive(campaign_id,owner_id,kind,title)
  VALUES('77777777-7777-4777-8777-777777777777',
   '88888888-8888-4888-8888-888888888888','nota','Tentativa indevida');
  RAISE EXCEPTION 'Jogador conseguiu criar segredo no arquivo do mestre';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  PERFORM public.haema_gm_bestiary_index('77777777-7777-4777-8777-777777777777');
  RAISE EXCEPTION 'Jogador recebeu índice reservado integral';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  PERFORM public.haema_gm_bestiary_entry('77777777-7777-4777-8777-777777777777','registro-01');
  RAISE EXCEPTION 'Jogador leu ficha integral do mestre';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claims',
 jsonb_build_object('sub',(SELECT user_id FROM public.haema_platform_admins LIMIT 1),'role','authenticated')::text,true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 ASSERT (SELECT count(*)=1 FROM public.haema_gm_archive WHERE campaign_id='77777777-7777-4777-8777-777777777777'), 'Mestre perdeu acesso ao Arquivo';
 ASSERT (SELECT count(*)=1 FROM public.haema_gm_records WHERE campaign_id='77777777-7777-4777-8777-777777777777'), 'Mestre perdeu registros legados';
 ASSERT jsonb_array_length(public.haema_gm_bestiary_index('77777777-7777-4777-8777-777777777777'))=134,'Índice integral indisponível ao mestre';
 ASSERT jsonb_array_length(public.haema_gm_bestiary_entry('77777777-7777-4777-8777-777777777777','registro-01')->'paragraphs')=5,'Ficha integral anterior indisponível ao mestre';
 ASSERT jsonb_array_length(public.haema_gm_bestiary_entry('77777777-7777-4777-8777-777777777777','h01-01')->'paragraphs')=5,'Novo animal indisponível ao mestre';
 ASSERT jsonb_array_length(public.haema_gm_bestiary_entry('77777777-7777-4777-8777-777777777777','u14')->'paragraphs')=5,'Relato reservado indisponível ao mestre';
END $$;
RESET ROLE;
ROLLBACK;