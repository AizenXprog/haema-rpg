# HÆMA: expanded Bestiary reader browser test — synthetic data, no production writes.
import asyncio,ast,json,os
from pathlib import Path
from urllib.parse import urlsplit,parse_qs
from playwright.async_api import async_playwright

BASE=os.getenv('HAEMA_TEST_URL','http://127.0.0.1:8791').rstrip('/')
ART=Path('artifacts/bestiary-expansion')
ART.mkdir(parents=True,exist_ok=True)
tree=ast.parse(Path('tests/browser.py').read_text(encoding='utf8'))
sdk=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='mock_sdk' for t in n.targets))
dataset=[]
for i in range(1,26):
 dataset.append({'id':f'registro-{i:02}', 'title':['Brutão','Drax','Alcatrante','Orvek','Velkin','Drissen'][i-1] if i<=6 else f'Antigo {i}', 'subtitle':'Registro antigo preservado','state':'canon','released':True,'threat':'non_hostile','region':'Grendkti','ordinal':i,'revision':2})
for group,n,start,threat,region in [
 ('h01',28,26,'hostile','Eshvar'),('h02',35,54,'hostile','Coguns'),('bio',32,89,'non_hostile','Gonghorran')]:
 for i in range(1,n+1):
  name='Raskel' if group=='h01' and i==1 else 'Gunpiva' if group=='bio' and i==1 else group.upper()+' criatura '+str(i)
  dataset.append({'id':f'{group}-{i:03}' if group=='bio' else f'{group}-{i:02}', 'title':name,'subtitle':'Descrição em cinco folhas','state':'canon','released':True,'threat':threat,'region':region,'source_code':group.upper()+'-'+str(i).zfill(3 if group=='bio' else 2),'ordinal':start+i-1,'revision':1})
for i in range(1,15):
 dataset.append({'id':f'u{i:02}', 'title':f'Relato lendário {i}', 'subtitle':'Existência não comprovada', 'state':'legend','released':False,'threat':'undetermined','existence':'unconfirmed_legend','ordinal':120+i,'revision':1})
assert len(dataset)==134 and sum(v['released'] for v in dataset)==120
async def main():
 async with async_playwright() as pw:
  browser=await pw.chromium.launch(headless=True)
  for w,h in [(320,700),(390,844),(768,1024),(1440,900)]:
   ctx=await browser.new_context(viewport={'width':w,'height':h},reduced_motion='reduce')
   await ctx.add_init_script("window.qaRole='admin'")
   await ctx.route('**/npm/@supabase/supabase-js@2.119.0/+esm',lambda r:r.fulfill(status=200,content_type='text/javascript',body=sdk))
   await ctx.route('**/api/portal-config',lambda r:r.fulfill(status=200,content_type='application/json',body=json.dumps({'configured':True,'url':'https://qa.supabase.co','publishableKey':'sb_publishable_qa'})))
   async def library_route(route):
    path=urlsplit(route.request.url)
    entry=parse_qs(path.query).get('entry',[None])[0]
    if entry:
     record=next((x for x in dataset if x['id']==entry),None)
     if not record or not record['released']:
      return await route.fulfill(status=403,content_type='application/json',body=json.dumps({'error':'Registro reservado ao mestre'}))
     return await route.fulfill(status=200,content_type='application/json',body=json.dumps({**record,'paragraphs':[f'Texto de campo {i}, completo, com sinais e limites verificados.' for i in range(1,6)]},ensure_ascii=False))
    return await route.fulfill(status=200,content_type='application/json',body=json.dumps(dataset,ensure_ascii=False))
   await ctx.route('**/api/library**',library_route)
   page=await ctx.new_page()
   errors=[]
   page.on('pageerror',lambda error:errors.append(str(error)))
   await page.goto(BASE+'/biblioteca.html',wait_until='domcontentloaded')
   await page.locator('.open-volume').wait_for(timeout=15000)
   await page.locator('.open-volume').click()
   await page.locator('.book-index-entry').first.wait_for(timeout=12000)
   assert await page.locator('[data-fauna-search]').count()==1,'Search must be on the same book reader'
   await page.locator('[data-fauna-search]').fill('Gunpiva')
   await page.get_by_role('button',name='Gunpiva').wait_for()
   assert await page.locator('.book-index-entry').count()==1,'Search should find exactly one species'
   await page.locator('[data-fauna-search]').fill('Raskel')
   await page.get_by_role('button',name='Raskel').wait_for()
   assert await page.locator('.book-index-entry').count()==1
   await page.locator('[data-fauna-search]').fill('')
   await page.locator('[data-fauna-filter]').select_option('hostile')
   assert await page.locator('.book-index-entry').count()==6,'First page must list only 6 entries'
   await page.locator('[data-fauna-search]').fill('Raskel')
   await page.get_by_role('button',name='Raskel').click()
   await page.get_by_role('heading',name='Raskel').wait_for()
   assert await page.locator('.book-creature-metadata').count()==1,'Risk contextual warning required'
   assert await page.locator('.book-copy p').count()>=1
   await page.screenshot(path=str(ART/f'reader-{w}.png'))
   await page.locator('[data-index]').click()
   await page.locator('[data-fauna-search]').fill('')
   await page.locator('[data-fauna-filter]').select_option('non_hostile')
   await page.locator('[data-fauna-search]').fill('Gunpiva')
   await page.get_by_role('button',name='Gunpiva').wait_for()
   await page.locator('[data-fauna-search]').fill('Relato lendário')
   assert await page.locator('.book-index-entry').count()==0,'Unverified legends are not in player reading catalogue'
   assert not errors,(w,errors)
   overflow=await page.evaluate('document.documentElement.scrollWidth-window.innerWidth')
   assert overflow<=3,(w,overflow)
   await ctx.close()
  await browser.close()
 print('PASS: 134 total / 120 released, 14 unverified hidden, in-book filters, single-entry reading, four viewport layouts.')
asyncio.run(main())
