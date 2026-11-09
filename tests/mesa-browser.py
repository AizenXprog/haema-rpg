import ast, asyncio, json, re, sys, os
from pathlib import Path
from playwright.async_api import async_playwright
BASE=os.environ.get('HAEMA_TEST_URL','http://127.0.0.1:8791').rstrip('/')
ROOT=Path(__file__).resolve().parents[1]
source=ast.parse((ROOT/'tests/browser.py').read_text(encoding='utf8'))
sdk=next(ast.literal_eval(x.value) for x in source.body if isinstance(x,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='mock_sdk' for t in x.targets))
html=json.loads(re.search(r'^const HTML=(.*);$',(ROOT/'api/mesa.js').read_text(encoding='utf8'),re.M)[1])
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(channel='chrome',headless=True)
  context=await browser.new_context()
  page=await context.new_page(); errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  await page.goto(BASE+'/biblioteca.html')
  await page.get_by_role('button',name='Entrar com Google',exact=True).wait_for()
  assert not errors,errors
  for path in ['/api/library','/api/mesa']:
   response=await context.request.get(BASE+path,headers={'Authorization':'Bearer invalid.token.qa'})
   assert response.status==401,(path,response.status)
   assert 'no-store' in response.headers.get('cache-control','')
  print('PASS live: actual Supabase SDK and config load, guest sign-in, invalid-token 401, no JS errors.')
  await context.close()
  context=await browser.new_context(accept_downloads=True)
  await context.add_init_script("window.qaRole='admin'; localStorage.setItem('haema-character-v2','legacy-qa-preserved')")
  await context.route('**/npm/@supabase/supabase-js@2.119.0/+esm',lambda route:route.fulfill(status=200,content_type='text/javascript',body=sdk))
  await context.route('**/api/mesa',lambda route:route.fulfill(status=200,content_type='text/html',body=html))
  page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  await page.goto(BASE+'/mesa.html')
  await page.locator('#char-name-v01').fill('Personagem de teste')
  await page.locator('#roll-btn-v01').click()
  assert (await page.locator('#roll-total-v01').inner_text()).isdigit()
  async with page.expect_download() as downloaded:
   await page.locator('#save-export-v01').click()
  data=json.loads(Path(await (await downloaded.value).path()).read_text(encoding='utf8'))
  assert data['name']=='Personagem de teste' and data['version']=='0.1'
  await page.evaluate("()=>{let a=document.createElement('a');a.href='manual.html';document.body.append(a);a.click();a.remove()}")
  await page.wait_for_url('**/manual.html')
  await page.locator('#conhecendo-haema').wait_for()
  await page.evaluate("()=>{let a=document.createElement('a');a.href='mesa.html';document.body.append(a);a.click();a.remove()}")
  await page.wait_for_url('**/mesa.html')
  await page.locator('#char-name-v01').wait_for()
  assert await page.locator('#char-name-v01').input_value()=='Personagem de teste'
  assert await page.evaluate("localStorage.getItem('haema-character-v2')")=='legacy-qa-preserved'
  await page.locator('#import-file-v01').set_input_files({'name':'qa.json','mimeType':'application/json','buffer':json.dumps(dict(data,name='Importação de teste')).encode()})
  await page.wait_for_timeout(100)
  assert await page.locator('#char-name-v01').input_value()=='Importação de teste'
  assert not errors,errors
  print('PASS UI with simulated access: protected Mesa mount, roll, export/import, local persistence after navigation, legacy data preserved.')
  await browser.close()
asyncio.run(main())
