# HÆMA UX / accessible teaching path — no real accounts or Supabase writes.
import asyncio, os
from pathlib import Path
from playwright.async_api import async_playwright
BASE=os.getenv('HAEMA_TEST_URL','http://127.0.0.1:8791').rstrip('/')
ART=Path('artifacts/system-ux')
ART.mkdir(parents=True,exist_ok=True)

async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  for width,height in [(320,568),(390,844),(768,1024),(1440,900)]:
   ctx=await browser.new_context(viewport={'width':width,'height':height},reduced_motion='reduce')
   await ctx.add_init_script("""(()=>{
    const Original=window.Audio;window.__mediaCount=0;
    window.Audio=class extends Original{constructor(...a){super(...a);window.__mediaCount++;}};
   })()""")
   page=await ctx.new_page()
   errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   await page.goto(BASE+'/sistema.html',wait_until='domcontentloaded')
   assert await page.locator('main.haema-learning').count()==1
   assert await page.locator('main .learning-route a').count()==3,'More than three primary destinations'
   assert await page.locator('main .learning-topic').count()==6
   assert await page.locator('main .section-nav').count()==0,'Legacy duplicate menu remains'
   await page.locator('#haema-system-roll').click()
   assert 'DT' in await page.locator('#haema-system-result').inner_text(),'Dice example failed'
   await page.locator('#haema-system-example').select_option('trained')
   await page.locator('#haema-system-roll').click()
   assert 'd6' in await page.locator('#haema-system-result').inner_text(),'Trained case failed'
   await page.locator('.learning-topic').first.locator('summary').click()
   assert await page.locator('.learning-topic').first.get_attribute('open') is not None
   await page.locator('.learning-archive summary').click()
   assert await page.locator('a[href="manual.html"]').count()>0
   body=await page.locator('main').inner_text()
   assert '**' not in body,'Raw Markdown asterisks in system page'
   overflow=await page.evaluate('document.documentElement.scrollWidth-innerWidth')
   assert overflow<=3,f'Horizontal overflow on System {width}px: {overflow}'
   await page.screenshot(path=str(ART/f'sistema-{width}.png'),full_page=True)
   firstAudio=await page.evaluate('window.__mediaCount')
   assert firstAudio==1,'Audio not initialized once on System'
   await page.locator('main a[href="manual-unificado.html"]').first.click()
   await page.wait_for_url('**/manual-unificado.html')
   assert await page.locator('.manual-toc-group').count()==5
   assert await page.locator('.manual-toc-links a').count()==22
   await page.locator('#filter').fill('Metus')
   assert await page.locator('#cap-7').is_visible(),'Metus chapter not found'
   assert await page.locator('.manual-toc-group:not([hidden])').count()>0
   await page.screenshot(path=str(ART/f'manual-{width}.png'))
   assert await page.evaluate('window.__mediaCount')==firstAudio,'Music restarted navigating to Manual'
   formatted=await page.evaluate("""async()=>{
    const {appendInlineFormatted}=await import('/inline-format.js');
    const p=document.createElement('p');
    appendInlineFormatted(p,'Diz **algo em negrito** no meio, uma *ênfase* e mais **força**.');
    return {text:p.textContent,strong:p.querySelectorAll('strong').length,em:p.querySelectorAll('em').length,html:p.innerHTML};
   }""")
   assert formatted['strong']==2 and formatted['em']==1,formatted
   assert '**' not in formatted['text'],formatted
   system_link=page.locator('header .nav a[href="sistema.html"]').first
   if not await system_link.is_visible():
    await page.locator('#menu-toggle').click()
    assert await system_link.is_visible(),'Mobile menu did not reveal Sistema'
   await system_link.click()
   await page.wait_for_url('**/sistema.html')
   await page.locator('#haema-system-roll').click()
   assert 'DT' in await page.locator('#haema-system-result').inner_text(),'System was not reinitialized on SPA return'
   await page.locator('main a[href="laboratorio-unificado.html"]').first.click()
   await page.wait_for_url('**/laboratorio-unificado.html')
   await page.locator('#rollTest').click()
   assert 'contra DT' in await page.locator('#rollResult').inner_text()
   assert await page.evaluate('window.__mediaCount')==firstAudio,'Music was recreated after Lab'
   if errors:raise AssertionError(f'JavaScript errors at {width}px: {errors}')
   await ctx.close()
  print('PASS: four viewports, three-destination learning path, math example, manual group search, real inline bold, SPA controllers and continuous sound.')
  await browser.close()

asyncio.run(main())
