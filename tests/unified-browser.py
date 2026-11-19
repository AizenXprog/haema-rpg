# E2E local: HÆMA Manual Unificado experimental, navegador real.
import asyncio, os, json
from pathlib import Path

from playwright.async_api import async_playwright

BASE = os.getenv('HAEMA_TEST_URL','http://127.0.0.1:8791').rstrip('/')
async def main():
 async with async_playwright() as playwright:
  browser=await playwright.chromium.launch(headless=True)
  failures=[]
  screenshots=Path('artifacts/unified-browser');screenshots.mkdir(parents=True,exist_ok=True)
  for width,height in [(320,568),(390,844),(768,1024),(1440,900)]:
   ctx=await browser.new_context(viewport={'width':width,'height':height},reduced_motion='reduce')
   await ctx.add_init_script("""(()=>{
     const NativeAudio=window.Audio;window.__haemaAudioCreated=0;
     window.Audio=class extends NativeAudio {constructor(...args){super(...args);window.__haemaAudioCreated++;}}
   })();""")
   page=await ctx.new_page()
   errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('response',lambda r:errors.append('HTTP '+str(r.status)+' '+r.url) if r.status>=400 and '/api/' not in r.url and not r.url.endswith('/favicon.ico') else None)
   await page.goto(BASE+'/sistema.html',wait_until='domcontentloaded')
   await page.locator('a[href="laboratorio-unificado.html"]').first.click()
   await page.wait_for_url('**/laboratorio-unificado.html')
   await page.locator('#name').fill('QA Teste')
   await page.locator('#rollTest').click()
   assert 'contra DT' in await page.locator('#rollResult').inner_text(),'Rolador não respondeu'
   await page.locator('#applyWound').click()
   assert 'Integridade' in await page.locator('#woundResult').inner_text(),'Ferimento não respondeu'
   await page.locator('#apexType').select_option('protecao')
   await page.locator('#spendInvicta').click()
   assert 'Invicta' in await page.locator('#invictaResult').inner_text(),'Ápice não respondeu'
   await page.locator('#tangerRoll').click()
   assert 'Registro incompleto' in await page.locator('#tangerResult').inner_text(),'Tanger inválido não foi bloqueado'
   local=await page.evaluate("localStorage.getItem('haema-character-unified-playtest-20261119')")
   assert local and json.loads(local)['version']=='unified-playtest-20261119','Ficha não persistiu'
   old=await page.evaluate("localStorage.getItem('haema-character-0.1')")
   assert old is None,'Lab criou versão antiga indevidamente'
   audio=await page.evaluate('window.__haemaAudioCreated')
   assert audio==1,f'Audio recreado ao mudar para lab: {audio}'
   assert await page.locator('header #haema-sound-toggle').count()==1,'Controle de som perdido'
   overflow=await page.evaluate('document.documentElement.scrollWidth-innerWidth')
   assert overflow<=3,f'Lab overflow {width}px: {overflow}'
   await page.screenshot(path=str(screenshots/f'lab-{width}.png'))
   await page.goto(BASE+'/sistema.html')
   await page.locator('a[href="manual-unificado.html"]').first.click()
   await page.wait_for_url('**/manual-unificado.html')
   await page.locator('#filter').fill('Metus')
   assert 'capítulos encontrados' in await page.locator('#count').inner_text(),'Pesquisa do manual não iniciou'
   assert await page.locator('.chapter:visible').count()>0,'Busca do manual sem capítulos'
   assert await page.evaluate('window.__haemaAudioCreated')==1,'Trilha não preservada da página Sistema ao Manual'
   await page.screenshot(path=str(screenshots/f'manual-{width}.png'))
   await page.goto(BASE+'/sistema.html')
   await page.locator('a[href="tecnicas-unificadas.html"]').first.click()
   await page.wait_for_url('**/tecnicas-unificadas.html')
   assert await page.locator('#catalog article').count()==22,'Catálogo incompleto'
   await page.locator('#search').fill('Medicina')
   assert 0<await page.locator('#catalog article').count()<22,'Filtro de técnicas falhou'
   assert await page.evaluate('window.__haemaAudioCreated')==1,'Trilha foi recriada ao entrar em Técnicas'
   overflow=await page.evaluate('document.documentElement.scrollWidth-innerWidth')
   assert overflow<=3,f'Técnicas overflow {width}px: {overflow}'
   await page.screenshot(path=str(screenshots/f'tecnicas-{width}.png'))
   if errors:failures.extend([f'{width}px: {error}' for error in errors])
   await ctx.close()
  assert not failures,'\n'.join(failures)
  print('PASS: 4 viewports, 3 unified routes, continuity of audio, local sheet, rolling, injuries, Apex, Tanger, manual search, catalogue filters and no JS errors.')
  await browser.close()
asyncio.run(main())
