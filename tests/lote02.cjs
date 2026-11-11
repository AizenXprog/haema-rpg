const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let checks=0;const ok=(v,label)=>{assert.ok(v,label);checks++};
const hashes={"index.html":"298b3255299afe18fe512ea5b5263d1f99baa079c0bb7857b78dbdbb5e864c97","sistema.html":"81736ebab3b5ba3c1646005aa9e6a73fc5f45de505be2048b0021bae9cda7c07","manual.html":"717f7467793b8aee42bb849229c7f15cc84e1cf94fbf22b48af7affe09379b02","biblioteca.html":"f534a4334fdec302916d32d91660bcaba0c56401dfc0267c1b0fa3d16e147a6f","portal.html":"f035a2d4815a41fb641ee3fd7f7288bc689c7150955424534402ab8bad2809f8","campanha.html":"f15ebafdac7ff316c6119d7bae64026885ac17c3fbe6f4c59d893293d002788b","administracao.html":"12832ee4dc3774cba3547536c62813625a76daeed292f4513f23abb29f1cccf1","mesa.html":"f18843cf97b85f543e488b36f5e9d4c7004dbd7e4b6021f06602c31038564e56","atualizacoes.html":"e0191f681c288c7f7b7e2dad13fab4daa75617f958c8ebcc21a761f6428ca4af"};
for(const [file,expected] of Object.entries(hashes)){
 const main=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n').match(/<main\b[^>]*>[\s\S]*?<\/main>/)[0];
 ok(crypto.createHash('sha256').update(main).digest('hex')===expected,file+' content preserved');
}
function navigationHarness({reduced=false,transition=true}={}){
 const handlers={},pending={},transitions=[],events=[],historyCalls=[];let page='index.html',headingFocus=0;
 const persistentHeader={},persistentAudio={};const main={replaceWith(n){page=n.page}};
 const location={href:'https://test.local/index.html',pathname:'/index.html',origin:'https://test.local',search:'',assign(v){events.push('fallback:'+v)}};
 const history={state:{},pushState(s,_,href){this.state=s;historyCalls.push(href);const u=new URL(href);Object.assign(location,{href,pathname:u.pathname,search:u.search})},replaceState(){}};
 const doc={hidden:false,body:{dataset:{}},title:'',querySelector(s){if(s==='main#conteudo')return main;if(s==='main h1')return {focus(){headingFocus++}};return null},querySelectorAll(){return []},getElementById(){return null},addEventListener(k,f){handlers[k]=f},dispatchEvent(e){events.push(e.type)},importNode(n){return n},head:{append(){}}};
 if(transition)doc.startViewTransition=cb=>{let done;const promise=new Promise(r=>done=r);const t={commit(){cb();done()},skipTransition(){this.skipped=true},updateCallbackDone:promise};transitions.push(t);return t};
 class Parser{parseFromString(markup){return {body:{dataset:{page:markup}},title:markup,querySelector(s){return s==='main#conteudo'?{page:markup}:null},querySelectorAll(){return []}}}}
 class El{constructor(href){this.href=href}closest(){return this}hasAttribute(){return false}}
 const window={fetch:true,history,scrollY:0,scrollTo(){},addEventListener(k,f){handlers[k]=f}};
 vm.runInNewContext(fs.readFileSync('navigation.js','utf8'),{document:doc,window,history,location,URL,Map,Set,AbortController,Event,CustomEvent:class{constructor(type){this.type=type}},Element:El,DOMParser:Parser,matchMedia:()=>({matches:reduced}),fetch:url=>new Promise(r=>pending[url]=()=>r({ok:true,text:async()=>url.slice(1)})),setTimeout,clearTimeout});
 const click=file=>handlers.click({button:0,target:new El('https://test.local/'+file),preventDefault(){}});
 return {click,resolve:file=>pending['/'+file](),transitions,events,historyCalls,page:()=>page,focus:()=>headingFocus,persistentHeader,persistentAudio};
}
const flush=()=>new Promise(r=>setImmediate(r));
(async()=>{
 let h=navigationHarness();h.click('manual.html');h.resolve('manual.html');await flush();
 ok(h.page()==='index.html','native transition defers DOM swap');
 h.click('sistema.html');h.resolve('sistema.html');await flush();
 h.transitions[0].commit();ok(h.page()==='index.html','stale transition cannot overwrite page');
 ok(h.historyCalls.length===0,'stale transition cannot push phantom history');
 h.transitions[1].commit();await flush();ok(h.page()==='sistema.html','latest transition commits');
 ok(h.historyCalls.length===1,'single committed history entry');ok(h.focus()===1,'heading focused once');
 ok(h.events.join(',')==='haema:leaving,haema:navigated','cleanup precedes activation');
 ok(h.transitions[0].skipped,'older animation skipped');
 h=navigationHarness({reduced:true});h.click('manual.html');h.resolve('manual.html');await flush();
 ok(h.transitions.length===0&&h.page()==='manual.html','reduced motion swaps without transition');
 h=navigationHarness({transition:false});h.click('manual.html');h.resolve('manual.html');await flush();
 ok(h.page()==='manual.html','unsupported browser uses direct swap');
 h=navigationHarness();h.click('manual.html');h.click('portal.html');h.resolve('portal.html');await flush();h.transitions[0].commit();h.resolve('manual.html');await flush();
 ok(h.page()==='portal.html'&&h.historyCalls.length===1,'late network response cannot overwrite latest navigation');
 console.log(checks+' Lote 02 preservation and navigation checks passed');
})().catch(e=>{console.error(e);process.exitCode=1});

