"""HÆMA — smoke do Sistema Mestre oficial, em servidor local, sem login nem Supabase."""
import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright

BASE=os.getenv('HAEMA_TEST_URL','http://127.0.0.1:8791').rstrip('/')
SHOTS=Path('artifacts/sistema-oficial')
SHOTS.mkdir(parents=True,exist_ok=True)

async def check(browser,width,height):
    context=await browser.new_context(viewport={'width':width,'height':height}, is_mobile=width<600, has_touch=width<600)
    page=await context.new_page()
    errors=[]
    page.on('pageerror',lambda err: errors.append(str(err)))
    await page.goto(BASE+'/sistema-oficial.html',wait_until='domcontentloaded',timeout=20000)
    await page.locator('#sr-title').wait_for(timeout=10000)
    assert await page.locator('.sr-section').count()==12,'Referência não tem os 12 capítulos'
    for name in ('Kórven','Sælir','Vraek','Ithren','Ossyra','Nælth','Eyris'):
        assert await page.locator('.sr-regencies').get_by_text(name,exact=False).count()>=1,name+' ausente'
    assert await page.locator('a[href="manual-unificado.html"]').count()>=1,'Manual não está conectado'
    assert await page.evaluate('window.HaemaSystemReference?.VERSION')=='2026.11.25-reference','Manifesto de regras não carregou'
    assert await page.locator('#ressonancia').count()==1
    assert await page.locator('#descobertas').count()==1
    assert await page.locator('#pendencias').count()==1
    await page.locator('.sr-toc a[href="#ressonancia"]').click()
    assert await page.evaluate('location.hash')=='#ressonancia'
    overflow=await page.evaluate('document.documentElement.scrollWidth - window.innerWidth')
    assert overflow<=3,f'Overflow horizontal {width}px: {overflow}'
    assert not errors,errors
    await page.screenshot(path=str(SHOTS/f'sistema-{width}.png'),full_page=True)
    await context.close()

async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(headless=True)
        for dim in ((360,800),(390,844),(1440,900)):
            await check(b,*dim)
        await b.close()
    print('OK Sistema: 12 capítulos, 7 Regências, manifesto, links e 3 tamanhos')

if __name__=='__main__':
    asyncio.run(main())
