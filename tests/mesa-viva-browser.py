# HÆMA Mesa ao Vivo — navegação real, autenticação isolada e persistência simulada.
import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright
BASE=os.getenv('HAEMA_TEST_URL','http://127.0.0.1:8791').rstrip('/')
ART=Path('artifacts/mesa-viva')
ART.mkdir(parents=True,exist_ok=True)
DB_MOCK=r"""
(()=>{
 const users=Array.from({length:5},(_,i)=>({id:'person'+i,title:'Personagem '+(i+1),user_id:'gm',campaign_id:'campaign1',rules_version:'0.1',updated_at:'2026-11-24'}));
 const v={
  haema_campaigns:[{id:'campaign1',name:'Campanha de teste',gm_id:'gm'}],
  haema_members:[{user_id:'gm',role:'gm',campaign_id:'campaign1'}],
  haema_characters:users,haema_gm_archive:[],
  haema_profiles:[{id:'gm',display_name:'Mestre'}],
  haema_tree_progress:users.map((u,i)=>({character_id:u.id,path:i===0?['s1:1:4']:[],pe_available:12,pe_spent:0,awakened:false})),
  haema_tree_profile_settings:[]
 };
 let saved=JSON.parse(sessionStorage.getItem('mesa-live-smoke')||'null');
 window.__mesaSmoke={get saved(){return saved},players:users};
 window.__mesaDb={
  from(name){
   let filters=[];
   const q={
    select(){return q},eq(k,val){filters.push(r=>r[k]===val);return q},
    in(k,ids){filters.push(r=>ids.includes(r[k]));return q},
    order(){return q},limit(){return q},
    maybeSingle(){const rows=name==='haema_gm_live_state'?(saved?[saved]:[]):(v[name]||[]);return Promise.resolve({data:rows.filter(r=>filters.every(f=>f(r)))[0]||null,error:null})},
    upsert(row){if(name!=='haema_gm_live_state')return Promise.resolve({data:null,error:{message:'Tabela inesperada'}});saved={...row};sessionStorage.setItem('mesa-live-smoke',JSON.stringify(saved));return Promise.resolve({data:null,error:null})},
    then(resolve,reject){return Promise.resolve({data:(v[name]||[]).filter(r=>filters.every(f=>f(r))),error:null}).then(resolve,reject)}
   };
   return q;
  }
 };
})();
"""
AUTH="""export async function access(){return {user:{id:'gm'},admin:true,areas:['portal']}}
export async function client(){return window.__mesaDb}
export async function login(){}
"""
async def run(browser,width,height):
 context=await browser.new_context(viewport={'width':width,'height':height},is_mobile=width<600,has_touch=width<600)
 await context.add_init_script(DB_MOCK)
 await context.route('**/auth.js*',lambda r:r.fulfill(status=200,content_type='text/javascript',body=AUTH))
 for file in ('script.js','audio.js','navigation.js'):
  await context.route('**/'+file+'*',lambda r:r.fulfill(status=200,content_type='text/javascript',body='// isolated test'))
 page=await context.new_page();errors=[]
 page.on('pageerror',lambda error:errors.append(str(error)))
 await page.goto(BASE+'/painel-mestre.html',wait_until='domcontentloaded')
 await page.locator('#command-workspace:not([hidden])').wait_for(timeout=12000)
 assert await page.locator('[data-panel="live"]').is_visible(),'Mesa não é a página inicial'
 assert await page.locator('.live-fighter').count()==5,'É necessário mostrar cinco personagens reais da campanha'
 assert await page.locator('.live-turn').count()==5,'Todos os jogadores devem aparecer na ordem'
 assert 'Parry aprendido' in await page.locator('.live-fighter').first.inner_text()
 await page.locator('#live-start').click()
 assert await page.locator('#live-round').inner_text()=='1'
 await page.locator('#live-next').click()
 assert 'Personagem 2' in await page.locator('#live-current').inner_text()
 first=page.locator('.live-fighter').first
 await first.get_by_role('button',name='Aumentar Integridade de Personagem 1').click()
 assert await first.locator('.live-counter').first.locator('input').input_value()=='1'
 await first.locator('.live-more summary').click()
 await first.get_by_role('checkbox',name='Reação disponível nesta rodada').uncheck()
 await page.locator('#live-enemy-name').fill('Sentinela')
 await page.locator('#live-add-enemy button').click()
 assert await page.locator('.live-fighter').count()==6
 await page.wait_for_function('window.__mesaSmoke.saved?.snapshot?.enemies?.length===1',timeout=5000)
 assert await page.locator('#live-save-status').inner_text()=='Sessão salva'
 await page.reload(wait_until='domcontentloaded')
 await page.locator('.live-fighter').first.wait_for(timeout=12000)
 assert await page.locator('#live-round').inner_text()=='1','Turno não persistiu'
 assert await page.locator('.live-fighter').count()==6,'Inimigo não persistiu'
 assert await page.locator('.live-fighter').first.locator('.live-counter').first.locator('input').input_value()=='1'
 assert not errors,errors
 if width<600:
  overflow=await page.evaluate('document.documentElement.scrollWidth-innerWidth')
  assert overflow<=3,f'Overflow horizontal no celular: {overflow}'
 await page.screenshot(path=str(ART/f'mesa-{width}.png'),full_page=True)
 await context.close()
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  for width,height in ((390,844),(1440,900)):
   await run(browser,width,height)
  await browser.close()
 print('OK Mesa Vivo: 5 personagens, turnos, recursos, NPC, persistência e mobile')
if __name__=='__main__': asyncio.run(main())
