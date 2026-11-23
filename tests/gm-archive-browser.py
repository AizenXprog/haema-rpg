# Browser E2E of the GM archive. Uses synthetic auth + in-memory Supabase.
# NO production data or writes. HTML and JavaScript are served locally.
import asyncio,json,os,ast,shutil
from pathlib import Path
from playwright.async_api import async_playwright
BASE=os.getenv('HAEMA_TEST_URL','http://127.0.0.1:8791').rstrip('/')
ART=Path('artifacts/gm-archive');ART.mkdir(parents=True,exist_ok=True)
root=ast.parse(Path('tests/browser.py').read_text(encoding='utf8'))
sdk=next(ast.literal_eval(node.value) for node in root.body
 if isinstance(node,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='mock_sdk' for t in node.targets))
sdk=sdk.replace("if(name==='haema_is_admin')", """if(name==='haema_gm_bestiary_entry')return{data:{id:args.entry_id,title:args.entry_id==='u01'?'Relato de teste':'Animal de teste',subtitle:'Documento sintético',state:args.entry_id==='u01'?'legend':'canon',threat:args.entry_id==='u01'?'undetermined':'hostile',existence:args.entry_id==='u01'?'unconfirmed_legend':'established',paragraphs:Array.from({length:5},(_,i)=>'Parágrafo completo de teste '+(i+1)+' sem HTML malicioso.')}};
  if(name==='haema_gm_bestiary_index')return{data:Array.from({length:134},(_,i)=>({id:i<25?'registro-'+String(i+1).padStart(2,'0'):i<53?'h01-'+String(i-24).padStart(2,'0'):i<88?'h02-'+String(i-52).padStart(2,'0'):i<120?'bio-'+String(i-87).padStart(3,'0'):'u'+String(i-119).padStart(2,'0'),title:i>=120?'Relato lendário '+(i-119):'Animal de teste '+(i+1),subtitle:'Documento sintético',state:i>=120?'legend':'canon',threat:i>=120?'undetermined':i>=88?'non_hostile':'hostile',region:i<60?'Eshvar':'Gonghorran',released:i<120}))};
  if(name==='haema_is_admin')""")
sdk=sdk.replace("upsert(){return q},single(){single=true;return q}", """
  upsert(){return q},
  insert(payload){(window.qaWrites??=[]).push({table,kind:'insert',payload});
   if(table==='haema_gm_archive')window.qaArchive.push({id:'77777777-7777-4777-8777-'+String(window.qaArchive.length+1).padStart(12,'0'),...payload,archived:false,created_at:new Date().toISOString()});
   return q;},
  update(payload){(window.qaWrites??=[]).push({table,kind:'update',payload});
   if(table==='haema_gm_archive'&&window.qaArchive.length)Object.assign(window.qaArchive[0],payload);
   return q;},
  single(){single=true;return q}""")
sdk=sdk.replace("haema_campaigns:[{id:'33333333-3333-4333-8333-333333333333',name:'Campanha de teste',gm_id:user.id}]",
 """haema_campaigns:[{id:'33333333-3333-4333-8333-333333333333',name:'Campanha de teste',gm_id:window.qaRole==='player'?'22222222-2222-4222-8222-222222222222':user.id}]""")
sdk=sdk.replace("haema_characters:[],haema_materials:[],haema_messages:[],haema_gm_records:[]",
 "haema_characters:[],haema_materials:[],haema_messages:[],haema_gm_records:[],haema_gm_archive:window.qaArchive||[]")
assert 'qaArchive:window.qaArchive' not in sdk
assert 'haema_gm_archive:window.qaArchive' in sdk
async def setup(browser,role,width,height):
 context=await browser.new_context(viewport={'width':width,'height':height},reduced_motion='reduce')
 await context.add_init_script(f"window.qaRole={json.dumps(role)};window.qaArchive=[];window.qaWrites=[];")
 await context.route('**/npm/@supabase/supabase-js@2.119.0/+esm',lambda r:r.fulfill(status=200,content_type='text/javascript',body=sdk))
 await context.route('**/api/portal-config',lambda r:r.fulfill(status=200,content_type='application/json',body=json.dumps({'configured':True,'url':'https://qa.supabase.co','publishableKey':'sb_publishable_test'})))
 return context
async def main():
 async with async_playwright() as pw:
  browser=await pw.chromium.launch(headless=True,channel='chrome' if shutil.which('google-chrome') else None)
  for width,height in [(320,700),(390,844),(768,1024),(1440,900)]:
   ctx=await setup(browser,'admin',width,height)
   page=await ctx.new_page()
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   # Enter from the *original Portal tile*, not by a hidden/direct URL.
   await page.goto(BASE+'/portal.html',wait_until='domcontentloaded')
   entry=page.locator('#haema-account-hub a[href="campanha.html"]')
   await entry.wait_for(timeout=15000)
   assert 'Campanhas e registros' in await entry.inner_text()
   await entry.click()
   await page.wait_for_url('**/campanha.html')
   assert await page.evaluate("document.body.dataset.page")=='mestre', 'Portal kept old campaign page instead of GM archive'
   await page.get_by_role('heading',name='Seu mundo, documentado.').wait_for(timeout=15000)
   assert await page.locator('.master-tab').count()==4,'Only four archive sections expected'
   assert await page.locator('.master-workspace').count()==1
   assert await page.locator('.master-stat').count()==4
   await page.get_by_role('button',name='Mundo e Bestiário').first.click()
   await page.locator('.master-animal').first.wait_for()
   assert await page.locator('.master-animal').count()==18,'Catalogue is paginated for readability'
   assert await page.get_by_text('Bestiário · 134 registros').count()==1
   await page.get_by_label('Fauna').select_option('legend')
   assert await page.locator('.master-animal').count()==14,'Only 14 legendary reports'
   assert await page.locator('.master-animal-uncertain').count()==14,'Every legend must be visibly unverified'
   await page.get_by_role('button',name='Ler ficha completa').first.click()
   await page.locator('.master-dossier-paragraph').first.wait_for()
   assert await page.locator('.master-dossier-paragraph').count()==5,'Five-paragraph dossier required'
   assert await page.get_by_text('Este registro fica reservado ao mestre.').count()>0
   await page.get_by_role('button',name='Fechar').first.click()
   await page.locator('.master-dialog').wait_for(state='detached',timeout=5000)
   await page.get_by_label('Fauna').select_option('all')
   assert await page.locator('.master-animal').count()==18
   await page.screenshot(path=str(ART/f'master-bestiary-{width}.png'))
   await page.get_by_role('button',name='Anotar na campanha').first.click()
   assert await page.locator('.master-form').count()==1
   assert await page.get_by_label('Tipo de registro').input_value()=='criatura'
   assert await page.get_by_label('Referência do Bestiário').input_value()=='registro-01'
   await page.get_by_label('Título').fill('Primeiro encontro com Brutão')
   await page.get_by_label('Notas, acontecimentos, preparação e consequências').fill('Registro sintético privado de teste')
   await page.get_by_role('button',name='Salvar registro').click()
   await page.wait_for_function("()=>window.qaWrites.some(x=>x.table==='haema_gm_archive'&&x.kind==='insert')")
   writes=await page.evaluate('window.qaWrites')
   assert writes[0]['payload']['campaign_id']=='33333333-3333-4333-8333-333333333333'
   assert writes[0]['payload']['bestiary_id']=='registro-01'
   assert writes[0]['payload']['kind']=='criatura'
   assert await page.get_by_text('Registro salvo com segurança.').is_visible()
   assert await page.get_by_text('Primeiro encontro com Brutão').count()>0
   overflow=await page.evaluate('document.documentElement.scrollWidth-window.innerWidth')
   assert overflow<=3,f'{width}px horizontal overflow: {overflow}'
   assert not errors,f'{width}px JS errors: {errors}'
   await ctx.close()
  # A campaign GM who is NOT a global administrator also gets this Portal entry.
  ctx=await setup(browser,'gm',390,844)
  page=await ctx.new_page()
  await page.goto(BASE+'/portal.html',wait_until='domcontentloaded')
  gm_link=page.locator('#haema-account-hub a[href="campanha.html"]')
  await gm_link.wait_for(timeout=15000)
  await gm_link.click()
  await page.wait_for_url('**/campanha.html')
  await page.get_by_role('heading',name='Seu mundo, documentado.').wait_for(timeout=15000)
  assert await page.locator('.master-workspace').count()==1, 'Non-admin campaign master must have full GM archive'
  await ctx.close()
  # Player cannot get into the GM view, even if the static route exists.
  ctx=await setup(browser,'player',390,844)
  page=await ctx.new_page()
  await page.goto(BASE+'/campanha.html',wait_until='domcontentloaded')
  await page.get_by_role('heading',name='Arquivo reservado ao mestre').wait_for(timeout=15000)
  assert await page.locator('.master-workspace').count()==0,'Player must never see master workspace'
  assert await page.evaluate('window.qaWrites.length')==0,'Unauthorized write'
  # Player sheets were moved, not destroyed.
  await page.goto(BASE+'/fichas.html?secao=characters',wait_until='domcontentloaded')
  await page.get_by_role('button',name='Nova ficha Unificada · experimental').wait_for(timeout=15000)
  assert await page.locator('.master-workspace').count()==0
  await ctx.close()
  # Guest has Google sign-in only.
  ctx=await setup(browser,'guest',390,844)
  page=await ctx.new_page()
  await page.goto(BASE+'/mestre.html',wait_until='domcontentloaded')
  await page.get_by_role('button',name='Entrar com Google').wait_for(timeout=15000)
  assert await page.locator('.master-workspace').count()==0
  await ctx.close()
  await browser.close()
  print('PASS: GM archive CRUD, 134 catalog entries (14 unverified), 18-item pagination, 4 viewports, player/guest denial.')
asyncio.run(main())
