import {access,authorizedFetch,node,button} from './auth.js';
const SOURCE_HASHES={
 'arquivos-silenciados':'8d8d52dc1589b373b5bcc3c823e928529d0ecc6a65ca3b2ef1ddb860d6ff74d5',
 'peso-da-coroa':'4d0d6d3620779b196096094a4f43351d1e33356cec7e146be860d276d0d687fe',
 'regencias-conhecidas':'b5ba7331378355a51d098bf9878ece5c57977d1c3049e08a336552e4d0318156'
};
const TITLES={
 'arquivos-silenciados':'Os Arquivos Silenciados',
 'peso-da-coroa':'O Peso da Coroa',
 'regencias-conhecidas':'Tratado das Regências Conhecidas'
};
const req=async(action,payload=null)=>{
 const r=await authorizedFetch(payload===null?'/api/reserved?action='+action:'/api/reserved',{
  ...(payload===null?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...payload})})
 });
 return r.json();
};
const n=(tag,cls='',text)=>node(tag,cls,text);
const feedback=(target,text,bad=false)=>{let label=target.querySelector('.reserved-admin-feedback');if(!label){label=n('p','reserved-admin-feedback');label.setAttribute('role','status');target.prepend(label);}label.textContent=text;label.dataset.error=bad?'true':'false';};
export async function renderReservedAdmin(panel){
 panel.replaceChildren(n('h2','','Arquivo editorial dos livros'),n('p','','Importação privada e integridade dos manuscritos. As permissões e a liberação dos volumes estão concentradas na Central de Acessos.'));
 try{
  const rights=await access();if(!rights.admin)throw Error('Área exclusiva de administração.');
  const state=await req('admin');
  if(!Array.isArray(state.books)||!Array.isArray(state.users))throw Error('O esquema reservado ainda não foi instalado no banco.');
  const books=n('section','reserved-admin-section');books.append(n('h3','','Publicação e importação protegida'));
  for(const book of state.books){
   const box=n('details','admin-user'),head=n('summary','',book.title);
   const flags=n('p','',[
    book.loaded?'Manuscrito armazenado':'Aguardando manuscrito',
    book.puzzle_ready?'Enigma configurado':'Enigma não configurado',
    book.published?'Liberado para autorizados':'Ainda privado'].join(' · '));
   box.append(head,flags);
   const manuscript=n('input');manuscript.type='file';manuscript.accept='.md,text/markdown,text/plain';
   const puzzle=n('input');puzzle.type='file';puzzle.accept='.json,application/json';
   const ms=n('label','','Manuscrito integral (.md)');ms.append(manuscript);
   const ps=n('label','','Configuração secreta do enigma (.json)');ps.append(puzzle);
   const title=n('input');title.value=book.title;title.maxLength=140;
   const subtitle=n('input');subtitle.value=book.id==='arquivos-silenciados'?'Historiadores':book.id==='peso-da-coroa'?'Político':'Regentes';
   const form=n('div','reserved-admin-upload');form.append(n('p','','A importação recolhe a publicação, exigindo nova revisão. O JSON secreto não pode ser enviado ao repositório.'),ms,ps,title,subtitle);
   const importButton=button('Importar arquivo privado',async()=>{
    if(!manuscript.files?.length||!puzzle.files?.length){feedback(form,'Selecione os dois arquivos antes de importar.',true);return;}
    try{
     const raw=await manuscript.files[0].text(),setup=JSON.parse(await puzzle.files[0].text());
     const first=(raw.match(/^#\s+(.+)$/m)||[])[1]||'';
     if(first.trim().toLocaleLowerCase('pt-BR')!==book.title.toLocaleLowerCase('pt-BR'))throw Error('O título do manuscrito não corresponde ao volume selecionado.');
     const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw));
     const sourceHash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
     if(sourceHash!==SOURCE_HASHES[book.id])throw Error('O arquivo difere do manuscrito integral aprovado. Confirme a versão antes de importar.');
     if(!setup?.public_data||!setup?.expected_answer||!setup?.revelation)throw Error('O arquivo do enigma está incompleto.');
     if(!confirm('Importar este manuscrito integral e configuração do enigma no armazenamento privado?'))return;
     await req('import',{book_key:book.id,book_title:title.value,book_subtitle:subtitle.value,raw_manuscript:raw,
      puzzle_data:setup.public_data,puzzle_answer:setup.expected_answer,unlocked_text:setup.revelation});
     await renderReservedAdmin(panel);
    }catch(error){feedback(form,error.message,true);}
   });
   form.append(importButton);box.append(form);
   box.append(n('p','','Para liberar, pausar ou selecionar leitores deste livro, use Central de Acessos → Por livro.'));
   books.append(box);
  }
  panel.append(books);
  panel.append(n('p','access-help','Permissões de pessoas, áreas e livros agora são gerenciadas exclusivamente na Central de Acessos. A importação de um manuscrito interrompe sua liberação até nova revisão administrativa.'));

 }catch(error){feedback(panel,error.message,true);}
}
