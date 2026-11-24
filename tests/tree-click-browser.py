# Verificação real de clique na Constelação Viva — sem acessar contas ou dados de campanha.
# O Supabase é substituído por um cliente em memória, preservando o fluxo da interface.
import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright

BASE = os.getenv("HAEMA_TEST_URL", "http://127.0.0.1:8791").rstrip("/")
ART = Path("artifacts/tree-click")
ART.mkdir(parents=True, exist_ok=True)

MOCK_DB = r"""
(() => {
 const base = {
  characters: [{id:"character-smoke",title:"Personagem de teste",campaign_id:"campaign-smoke",user_id:"user-smoke"}],
  progress: {character_id:"character-smoke", pe_available:30,pe_spent:0,path:[],awakened:false},
  plan:[],
  rpcCalls:0
 };
 window.__treeSmoke=base;
 function response(name,filter,single=false){
  const rows={
   haema_tree_node_edits:[],
   haema_characters:base.characters,
   haema_campaigns:[{id:"campaign-smoke"}],
   haema_tree_profile_settings:[],
   haema_tree_progress:[{...base.progress,path:base.progress.path.slice()}],
   haema_tree_plans:[{planned_path:base.plan.slice()}]
  }[name]||[];
  const found=rows.filter(row=>Object.entries(filter).every(([k,v])=>row[k]===v));
  return {data:single?(found[0]||null):found,error:null};
 }
 window.__treeMockDb={
  from(name){
   let filter={};
   const q={
    select(){return q},
    order(){return q},
    limit(){return q},
    eq(k,v){filter[k]=v;return q},
    maybeSingle(){return Promise.resolve(response(name,filter,true))},
    then(resolve,reject){return Promise.resolve(response(name,filter,false)).then(resolve,reject)}
   };
   return q;
  },
  async rpc(name,args){
   base.rpcCalls++;
   if(name==="haema_tree_unlock"){
    const tree=window.HaemaSkillTree,node=tree.map.get(args.p_node);
    if(!node||node.status!=="ready"||!tree.canUnlock(base.progress.path,node.id))return {error:{message:"Rota inválida"}};
    if(base.progress.pe_available<node.cost)return {error:{message:"PE insuficientes"}};
    base.progress.pe_available-=node.cost;base.progress.pe_spent+=node.cost;base.progress.path.push(node.id);
    return {data:{ok:true},error:null};
   }
   if(name==="haema_tree_save_plan"){base.plan=args.p_path.slice();return {data:{ok:true},error:null}}
   return {data:{ok:true},error:null};
  }
 };
})();
"""
AUTH_STUB = "export async function access(){return {user:{id:'user-smoke'},admin:true}};export async function client(){return window.__treeMockDb};"

async def run_case(browser,width,height):
 ctx=await browser.new_context(viewport={"width":width,"height":height},reduced_motion="reduce",is_mobile=(width<600),has_touch=(width<600))
 await ctx.add_init_script(MOCK_DB)
 async def auth_route(route): await route.fulfill(status=200,content_type="text/javascript",body=AUTH_STUB)
 async def blank_route(route): await route.fulfill(status=200,content_type="text/javascript",body="// suppressed non-tree scripts for isolated test")
 await ctx.route("**/auth.js*",auth_route)
 await ctx.route("**/script.js*",blank_route)
 await ctx.route("**/navigation.js*",blank_route)
 await ctx.route("**/audio.js*",blank_route)
 page=await ctx.new_page()
 errors=[]
 page.on("pageerror",lambda error:errors.append(str(error)))
 await page.goto(BASE+"/arvore.html",wait_until="domcontentloaded")
 await page.locator("#haema-tree-app:not([hidden])").wait_for(timeout=20000)
 assert await page.locator("#tree-map .tree-node").count()==631,"A árvore não renderizou 631 nós"
 assert await page.locator("#tree-advanced-drawer").get_attribute("open") is None,"Menu avançado não pode abrir sozinho"
 assert not await page.locator("#tree-details").is_visible(),"Painel deveria iniciar oculto"
 # Clique simples sem personagem deve abrir os detalhes, e não iniciar compra.
 await page.locator('#tree-map .tree-node[data-id="s1:x:1"]').click()
 assert await page.locator("#tree-details").is_visible(),"Clique do nó não abriu detalhes"
 assert "Postura Medida" in await page.locator("#tree-detail-name").inner_text(),"Nó incorreto foi selecionado"
 assert not await page.locator("#tree-confirm-modal").is_visible(),"Não deve comprar sem personagem"
 await page.locator("#tree-detail-close").click()
 assert not await page.locator("#tree-details").is_visible(),"Fechar painel não funcionou"
 # Personagem real simulado, 30 PE disponíveis. O clique abre confirmação RPC.
 await page.locator("#tree-character").select_option("character-smoke")
 await page.wait_for_function("document.querySelector('#tree-pe').textContent.trim()==='30'")
 await page.locator('#tree-map .tree-node[data-id="s1:x:1"]').click()
 await page.locator("#tree-confirm-modal:not([hidden])").wait_for(timeout=4000)
 assert "Postura Medida" in await page.locator("#tree-confirm-title").inner_text()
 assert await page.locator("#tree-pe").inner_text()=="30","O clique não deve gastar sem confirmação"
 await page.locator("#tree-confirm-accept").click()
 await page.wait_for_function("document.querySelector('#tree-pe').textContent.trim()==='26'")
 assert await page.locator("#tree-count").inner_text()=="1","Compra não gravou conquista"
 assert await page.evaluate("window.__treeSmoke.rpcCalls")==1,"Compra foi duplicada"
 # Um clique em nó distante só planeja, não gasta pontos.
 far=page.locator('#tree-map .tree-node[data-id="s1:0:3"]')
 await page.locator("#tree-detail-close").click()
 await far.click(force=True)
 await page.wait_for_function("window.__treeSmoke.plan.length===9",timeout=5000)
 assert await page.locator("#tree-pe").inner_text()=="26","Planejamento não pode descontar PE"
 assert "etapas planejadas" in await page.locator("#tree-plan-status").inner_text(),"Planejamento invisível"
 if width<600:
  overflow=await page.evaluate("document.documentElement.scrollWidth-window.innerWidth")
  assert overflow<=3,f"Transbordamento horizontal no celular: {overflow}"
 await page.screenshot(path=str(ART/f"tree-{width}.png"),full_page=True)
 assert not errors,f"Erros no console da página: {errors}"
 await ctx.close()

async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  for width,height in ((390,844),(1440,900)):
   await run_case(browser,width,height)
  await browser.close()
 print("OK — clique, painel, compra RPC, rota sem desconto e mobile/desktop")

if __name__=="__main__":
 asyncio.run(main())
