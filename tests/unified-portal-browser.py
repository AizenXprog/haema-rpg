# Browser E2E with mock auth/storage. NEVER writes to actual Supabase.
import asyncio, json, os, ast
from pathlib import Path
from playwright.async_api import async_playwright
BASE=os.environ.get('HAEMA_TEST_URL','http://127.0.0.1:8791').rstrip('/')
root=ast.parse(Path('tests/browser.py').read_text(encoding='utf8'))
mock_sdk=next(ast.literal_eval(node.value) for node in root.body if isinstance(node,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='mock_sdk' for t in node.targets))
mock_sdk=mock_sdk.replace("upsert(){return q},single(){single=true;return q}","upsert(){return q},insert(payload){(window.qaWrites??=[]).push({table,kind:'insert',payload});return q},update(payload){(window.qaWrites??=[]).push({table,kind:'update',payload});return q},single(){single=true;return q}")
assert "qaWrites" in mock_sdk
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  context=await browser.new_context(viewport={'width':1280,'height':860})
  await context.add_init_script("window.qaRole='admin';window.qaWrites=[];")
  await context.route('**/npm/@supabase/supabase-js@2.119.0/+esm',lambda r:r.fulfill(status=200,content_type='text/javascript',body=mock_sdk))
  await context.route('**/api/portal-config',lambda r:r.fulfill(status=200,content_type='application/json',body=json.dumps({'configured':True,'url':'https://qa.supabase.co','publishableKey':'sb_publishable_test'})))
  page=await context.new_page()
  errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
  await page.goto(BASE+'/sistema.html',wait_until='domcontentloaded')
  await page.locator('a[href="campanha.html?secao=characters"]').first.click()
  await page.wait_for_url('**/campanha.html?secao=characters')
  await page.get_by_role('button',name='Nova ficha Unificada · experimental').wait_for(timeout=12000)
  assert await page.evaluate("typeof window.HAEMAUnified")=='object','SPA did not load unified kernel'
  assert await page.evaluate("typeof window.HAEMATechniquesRules")=='object','SPA did not load optional techniques'
  await page.get_by_role('button',name='Nova ficha Unificada · experimental').click()
  await page.locator('form.portal-form input[type="text"]').first.fill('Personagem E2E')
  await page.locator('.portal-sheet-grid select').first.select_option('6')
  await page.locator('.portal-sheet-grid select').nth(6).select_option('6')
  pe_input=page.locator('form.portal-form input[type="number"]').nth(4)
  assert await pe_input.get_attribute('readonly') is not None,'PE should not be editable directly'
  assert await pe_input.input_value()=='0'
  await page.locator('form.portal-form button[type="submit"]').click()
  await page.wait_for_function("()=>window.qaWrites?.some(x=>x.table==='haema_characters'&&x.kind==='insert')")
  writes=await page.evaluate("window.qaWrites.filter(x=>x.table==='haema_characters')")
  assert len(writes)==1,writes
  sheet=writes[0]['payload']
  assert sheet['rules_version']=='unified-playtest-20261119',sheet
  assert sheet['payload']['version']=='unified-playtest-20261119'
  assert sheet['payload']['attributes'][0]==6 and sheet['payload']['skills'][0]==6
  assert sheet['payload']['pe']==0
  assert not errors,errors
  print('PASS mocked Portal: SPA loads both kernels, creates valid versioned sheet, and PE is immutable in input. No production writes.')
  await browser.close()
asyncio.run(main())
