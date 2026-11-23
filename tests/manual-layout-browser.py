# HÆMA Manual Unificado — prevents the exact bugs reported by the creator.
# Real Chromium: overlapping heading/body and pale illegible hover.
import asyncio, os, json, re
from pathlib import Path
from playwright.async_api import async_playwright

BASE=os.environ.get('HAEMA_TEST_URL','http://127.0.0.1:8791').rstrip('/')
ART=Path('artifacts/manual-layout')
ART.mkdir(parents=True,exist_ok=True)
SIZES=[(320,700),(390,844),(768,1024),(1440,900),(1728,960)]

async def verify(page,width,label):
    chapters=page.locator('main.unified-manual details.haema-unified-chapter')
    assert await chapters.count()==22,f'{label} {width}px: expected 22 chapters'
    assert await page.locator('details.chapter').count()==0,'Old global .chapter class must not leak'
    first=chapters.first
    await first.evaluate('(e)=>e.open=true')
    await first.locator('summary').scroll_into_view_if_needed()
    await page.wait_for_timeout(120)
    def metrics_js():
        return """() => {
          const e=document.querySelector('#cap-0');
          const s=e.querySelector('summary');
          const body=e.querySelector('.chapter-body');
          const heading=body.querySelector('h2');
          const firstP=body.querySelector('p');
          const style=getComputedStyle(e),bstyle=getComputedStyle(body),sumStyle=getComputedStyle(s);
          const rectangle = x => {const r=x.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height}};
          return {card:rectangle(e),summary:rectangle(s),body:rectangle(body),
            heading:rectangle(heading),paragraph:rectangle(firstP),
            display:style.display,background:style.backgroundColor,
            summaryBackground:sumStyle.backgroundColor,summaryColor:sumStyle.color,
            paragraphColor:getComputedStyle(firstP).color,
            fontSize:getComputedStyle(firstP).fontSize,
            scrollOverflow:document.documentElement.scrollWidth-window.innerWidth,
            panelScrollWidth:body.scrollWidth, panelClientWidth:body.clientWidth};
        }"""
    rest=await page.evaluate(metrics_js())
    assert rest['display']=='block',f'{width}px wrong card layout: {rest}'
    assert rest['summary']['bottom']<=rest['body']['top']+2,f'{width}px summary overlaps body: {rest}'
    assert rest['body']['top']<=rest['heading']['top']+2, f'{width}px body heading misplaced: {rest}'
    assert rest['heading']['bottom']<=rest['paragraph']['top']+2,f'{width}px heading overlaps first paragraph: {rest}'
    assert rest['scrollOverflow']<=3,f'{width}px page scroll overflow: {rest}'
    assert rest['panelScrollWidth']<=rest['panelClientWidth']+5,f'{width}px body overflows its card'
    assert float(rest['fontSize'].replace('px',''))>=14,f'{width}px chapter reading font too small'
    def lum(c):
        nums=[int(x) for x in re.findall(r'[\d.]+',c)[:3]]
        assert len(nums)==3,(c,nums)
        linear=[(v/255)/12.92 if v/255<=.04045 else ((v/255+.055)/1.055)**2.4 for v in nums]
        return sum(a*b for a,b in zip(linear,[.2126,.7152,.0722]))
    def contrast(a,b):
        x,y=sorted([lum(a),lum(b)],reverse=True)
        return (x+.05)/(y+.05)
    bodyColor=await first.locator('.chapter-body').evaluate('(e)=>getComputedStyle(e).color')
    assert contrast(rest['paragraphColor'],rest['background'])>=4.5,f'{width}px paragraph contrast too low'
    assert contrast(rest['summaryColor'],rest['summaryBackground'])>=4.5,f'{width}px summary contrast too low'
    await first.locator('summary').hover(force=True)
    await page.wait_for_timeout(270)
    hover=await page.evaluate(metrics_js())
    assert contrast(hover['summaryColor'],hover['summaryBackground'])>=4.5,f'{width}px hover makes text illegible: {hover}'
    assert lum(hover['background'])<.2,f'{width}px hover makes card pale: {hover}'
    assert hover['summary']['bottom']<=hover['body']['top']+2,f'{width}px hover causes overlap: {hover}'
    await page.screenshot(path=str(ART/f'{label}-{width}-hover.png'))
    # Search still works and the index mirrors search results.
    await page.locator('#filter').fill('Metus')
    assert await page.locator('#cap-7').is_visible(),f'{width}px Metus chapter vanished from search'
    assert await page.locator('.manual-toc-group:not([hidden])').count()>0
    count=await page.locator('#count').inner_text()
    assert 'capítulos encontrados' in count,count
    await page.locator('#filter').fill('')
    assert await chapters.count()==22
    return {'width':width,'bodyContrast':round(contrast(rest['paragraphColor'],rest['background']),2),
      'hoverContrast':round(contrast(hover['summaryColor'],hover['summaryBackground']),2)}

async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  results=[]
  for width,height in SIZES:
   context=await browser.new_context(viewport={'width':width,'height':height},reduced_motion='reduce')
   page=await context.new_page()
   errors=[]
   page.on('pageerror',lambda err:errors.append(str(err)))
   await page.goto(BASE+'/manual-unificado.html',wait_until='domcontentloaded')
   results.append(await verify(page,width,'direct'))
   assert not errors,f'{width}px JavaScript errors: {errors}'
   # Repeat after seamless navigation: style must survive SPA transitions.
   await page.goto(BASE+'/sistema.html',wait_until='domcontentloaded')
   await page.locator('main a[href="manual-unificado.html"]').first.click()
   await page.wait_for_url('**/manual-unificado.html')
   await page.locator('#filter').wait_for()
   await verify(page,width,'spa')
   await context.close()
  await browser.close()
  print('PASS: manual overlap / hover contrast / search / overflow / direct & SPA, 320, 390, 768, 1440, 1728px; '+json.dumps(results))

asyncio.run(main())
