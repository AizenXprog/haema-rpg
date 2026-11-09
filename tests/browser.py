import asyncio,json,sys,os
from pathlib import Path
from playwright.async_api import async_playwright

BASE=os.environ.get('HAEMA_TEST_URL','http://127.0.0.1:8791').rstrip('/')
ART=Path(os.environ.get('HAEMA_TEST_ARTIFACTS','artifacts/browser')); ART.mkdir(parents=True,exist_ok=True)
records=[dict(id=f'registro-{i:02}',ordinal=i,title=f'Registro de teste {i}',subtitle='Conteúdo sintético de interface',editorial_state='proposal',paragraphs=[f'Parágrafo sintético {j}. Usado apenas para verificar a leitura e a navegação.' for j in range(5)],source_version='QA') for i in range(1,26)]
mock_sdk="""
export function createClient(){
 window.qaClients=(window.qaClients||0)+1;
 const user={id:'11111111-1111-4111-8111-111111111111',user_metadata:{full_name:'Conta de teste'},app_metadata:{providers:['google']}};
 return {
 auth:{
  onAuthStateChange(fn){window.qaAuth=fn},
  async getSession(){return{data:{session:window.qaRole==='guest'?null:{access_token:'qa-token'}}}},
  async getUser(){return{data:{user:window.qaRole==='guest'?null:user}}},
  async signOut(){window.qaRole='guest';window.qaAuth('SIGNED_OUT');return{}},
  async signInWithOAuth(){window.qaLogin=true;return{}}
 },
 async rpc(name,args){
  if(name==='haema_is_admin')return{data:window.qaRole==='admin'};
  if(name==='haema_review_access'){window.qaReview=args;return{data:null}};
  if(name==='haema_release_entry'){window.qaRelease=args;return{data:null}};
  return{data:true};
 },
 from(table){
  let single=false;
  const q={select(){return q},order(){return q},eq(){return q},in(){return q},limit(){return q},
  upsert(){return q},single(){single=true;return q},
  then(resolve,reject){
   const data={
    haema_access_accounts:[{user_id:user.id,display_name:'Conta de teste',status:'approved',revision:0},{user_id:'22222222-2222-4222-8222-222222222222',display_name:'Solicitante de teste',status:'pending',revision:0}],
    haema_area_grants:['library','bestiary','portal','mesa','materials'].map(area=>({user_id:user.id,area})),
    haema_campaigns:[{id:'33333333-3333-4333-8333-333333333333',name:'Campanha de teste',gm_id:user.id}],
    haema_members:[{campaign_id:'33333333-3333-4333-8333-333333333333',user_id:user.id,role:'gm'}],
    haema_profiles:[{id:user.id,display_name:'Conta de teste'}],
    haema_characters:[],haema_materials:[],haema_messages:[],haema_gm_records:[],haema_audit:[],haema_access_log:[],haema_mesa_grants:[]
   }[table]||[];
   return Promise.resolve({data:single?data[0]:data}).then(resolve,reject)
  }};return q;
 },
 channel(){const c={topic:'realtime:haema-chat-33333333-3333-4333-8333-333333333333',on(){return c},subscribe(){return c}};return c},
 async removeChannel(){}
 };
}
"""

async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(channel='chrome',headless=True)
  guest=await browser.new_context(viewport={'width':390,'height':844})
  await guest.add_init_script("window.qaAudio=[];window.Audio=class extends Audio{constructor(...a){super(...a);qaAudio.push(this)}};window.qaRole='guest'")
  await guest.route('**/npm/@supabase/supabase-js@2.119.0/+esm',lambda route:route.fulfill(status=200,content_type='text/javascript',body=mock_sdk))
  page=await guest.new_page();errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  await page.goto(BASE+'/index.html')
  for path in ['portal.html','manual.html','biblioteca.html','sistema.html','mesa.html','index.html']:
   await page.evaluate("(href)=>{let a=document.createElement('a');a.href=href;document.body.append(a);a.click();a.remove()}",path)
   await page.wait_for_url('**/'+path)
   await page.wait_for_timeout(180)
   assert await page.evaluate("document.querySelector('link[href=\"archive.css?v=1\"]').sheet!==null"),path
  assert await page.evaluate('qaAudio.length')==1,'audio recreated'
  await page.goto(BASE+'/biblioteca.html')
  await page.get_by_role('button',name='Entrar com Google',exact=True).wait_for()
  for w,h in [(320,568),(390,844),(768,1024),(844,390),(1440,900)]:
   await page.set_viewport_size({'width':w,'height':h})
   assert await page.evaluate("document.querySelector('.library-entry').getBoundingClientRect().right<=innerWidth+1")
   if w in [390,1440]:
    await page.screenshot(path=str(ART/f'library-{w}.png'),full_page=True,animations='disabled')
  for route in ['/api/library','/api/mesa']:
   response=await guest.request.get(BASE+route)
   assert response.status==401,(route,response.status)
   assert 'private' in response.headers.get('cache-control','')
  assert not errors,errors
  print('PASS guest: 6 routes, persistent audio, responsive shell, anonymous 401, console.')
  master=await browser.new_context(viewport={'width':1440,'height':1000},reduced_motion='reduce')
  await master.add_init_script("window.qaRole='admin'")
  await master.route('**/npm/@supabase/supabase-js@2.119.0/+esm',lambda route:route.fulfill(status=200,content_type='text/javascript',body=mock_sdk))
  requested=[]
  async def library(route):
   from urllib.parse import urlparse,parse_qs
   query=parse_qs(urlparse(route.request.url).query)
   requested.append(query)
   if 'entry' in query:
    entry=next(x for x in records if x['id']==query['entry'][0])
    data=dict(entry,state=entry['editorial_state'],master=True,revision=0,released_indexes=[])
   else:data=[{k:x[k] for k in ['id','title','subtitle','ordinal']}|{'state':x['editorial_state'],'revision':0,'released':False} for x in records]
   await route.fulfill(status=200,content_type='application/json',body=json.dumps(data))
  await master.route('**/api/library*',library)
  page=await master.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  await page.goto(BASE+'/biblioteca.html')
  await page.get_by_role('button',name='Abrir o Bestiário',exact=True).last.click()
  await page.locator('.book-index-entry').first.wait_for()
  assert len(requested)==1 and not requested[0],'bulk content request'
  await page.locator('.book-index-entry').first.click()
  await page.locator('.creature-title').wait_for()
  assert len(requested)==2
  await page.screenshot(path=str(ART/'reader-desktop.png'),animations='disabled')
  await page.keyboard.press('ArrowRight')
  assert '3 de' in await page.locator('.reader-status').inner_text()
  await page.keyboard.press('ArrowLeft')
  await page.set_viewport_size({'width':390,'height':844})
  assert await page.locator('.book-page').count()==1
  await page.locator('[data-next]').click()
  assert '2 de' in await page.locator('.reader-status').inner_text()
  await page.screenshot(path=str(ART/'reader-mobile.png'),animations='disabled')
  assert await page.locator('.book-page').evaluate("e=>getComputedStyle(e).animationName==='none'")
  await page.keyboard.press('Escape')
  assert not await page.locator('dialog').is_visible()
  assert await page.locator('.book-page').count()==0,'private DOM retained on close'
  await page.goto(BASE+'/administracao.html')
  await page.get_by_text('Solicitante de teste',exact=False).first.click()
  await page.get_by_label('Biblioteca de Lore',exact=True).check()
  await page.get_by_role('button',name='Aprovar / salvar acessos',exact=True).click()
  assert (await page.evaluate('qaReview'))['areas']==['library']
  await page.get_by_role('button',name='Liberações',exact=True).click()
  await page.get_by_label('Registro do Bestiário').select_option('registro-01')
  await page.locator('.release-paragraphs input').first.check()
  await page.get_by_role('button',name='Salvar liberação de trechos').click()
  assert (await page.evaluate('qaRelease'))['indexes']==[0]
  await page.goto(BASE+'/portal.html')
  await page.get_by_role('heading',name='Campanha de teste').wait_for()
  await page.goto(BASE+'/biblioteca.html')
  await page.get_by_role('button',name='Abrir o Bestiário',exact=True).last.click()
  await page.locator('.book-index-entry').first.click()
  await page.locator('.creature-title').wait_for()
  await page.evaluate("window.qaRole='guest';window.qaAuth('SIGNED_OUT')")
  await page.get_by_role('button',name='Entrar com Google',exact=True).wait_for()
  assert not await page.locator('dialog').is_visible()
  assert await page.locator('.book-page').count()==0
  assert await page.locator('.tome').get_attribute('tabindex') is None
  assert not errors,errors
  print('PASS UI with simulated auth: single-entry loading, book/index/arrows/mobile/Escape/reduced motion, admin grants/release, campaign data rendering.')
  await browser.close()
asyncio.run(main())
