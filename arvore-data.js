/* HÆMA — Árvore Experimental | Catálogo de topologia, sem mecânicas automáticas.
 * Site e Sistema criado por Vitor Monte.
 * Um personagem constrói apenas uma trilha contínua, sem desbloqueio em leque.
 */
(function(root, factory){
  const lib=factory();
  if (typeof module==='object' && module.exports) module.exports=lib;
  if (root) root.HaemaSkillTree=lib;
})(typeof window!=='undefined'?window:null, function(){
  'use strict';
  const STAGES=6, GENERATIONS=4, VERSION='arvore-exp-20261124';
  const sectors=[
    {id:'combate',name:'Combate',symbol:'⚔',color:'#d86760',angle:-90,subtitle:'Finalizações e pressão',themes:['Lâmina','Execução','Pressão','Ritmo','Duelo','Ruptura','Cerco','Caçada'],
     verbs:['Ataque Preparado','Ritmo Ofensivo','Abertura Desarmada','Força Direcionada','Pressão Contínua','Corte Decisivo'],
     effects:['Uma vez por cena, ao preparar um ataque contra um alvo visível, obtenha +1 no teste seguinte; respeite o teto de bônus do sistema.',
      'Quando abrir espaço com uma manobra bem-sucedida, escolha proteger sua posição ou indicar uma brecha real a um aliado.',
      'Ao vencer uma disputa de arma contra arma, pode deslocar o ponto de contato em um passo plausível; não causa dano extra.',
      'Uma vez por cena, depois de atingir um alvo, pode trocar o dano por uma pequena vantagem de posição fisicamente possível.',
      'Ao pressionar um inimigo que recua, mantenha uma rota de perseguição curta se ela já estiver livre; não recebe movimento gratuito universal.',
      'Após uma sequência preparada e bem-sucedida, pode converter um efeito tático em uma abertura para o próximo aliado; não soma dano e controle.'],
     apex:'Ceifa Encadeada',apexEffect:'Uma vez por cena, ao incapacitar um inimigo hostil real com seu ataque, realize imediatamente um ataque comum contra outro inimigo já ao alcance. Esse ataque extra não cria novos ataques extras e não gera Invicta.'},
    {id:'defesa',name:'Defesa',symbol:'⛨',color:'#c9aa70',angle:-38.57142857,subtitle:'Parry e salvaguarda',themes:['Guarda','Aparo','Interposição','Bastião','Postura','Resistência','Escudo','Sentinela'],
     verbs:['Ângulo Seguro','Leitura de Golpe','Linha de Guarda','Proteção Adjunta','Retomada de Base','Postura Invicta'],
     effects:['Uma vez por cena, ao assumir posição defensiva real, obtenha +1 numa defesa pertinente, sem exceder o teto de modificadores.',
      'Após um Aparo válido, identifique uma brecha de alcance que o ataque revelou; não ganha uma reação adicional.',
      'Quando proteger uma passagem estreita, sua posição impede uma aproximação óbvia até ser deslocado por manobra.',
      'Ao interpor seu equipamento para um aliado adjacente, o mestre valida se a proteção é fisicamente alcançável.',
      'Se sobreviver a um golpe sem cair, uma vez por cena preserve um apoio físico que permitiria sua retirada.',
      'Ao proteger um aliado, pode optar por preservar uma posição segura em vez de provocar dano; não anula automaticamente o golpe.'],
     apex:'Sentinela do Último Limiar',apexEffect:'Uma vez por cena, ao usar sua Reação para proteger um aliado adjacente de um golpe interceptável, você pode absorver o impacto com sua própria proteção, sujeito a dano e Ferimentos normais. Não se soma a outra Reação no mesmo golpe.'},
    {id:'precisao',name:'Precisão',symbol:'⌖',color:'#9cbbcf',angle:12.85714286,subtitle:'Golpes estudados',themes:['Mira','Trajetória','Distância','Ponto Fraco','Tempo','Foco','Caçador','Vigília'],
     verbs:['Olhar Metódico','Trajeto Limpo','Correção Mínima','Alvo Conhecido','Janela Curta','Leitura Precisa'],
     effects:['Uma vez por cena, quando dedicar sua Ação Principal a observar uma linha de ataque, obtenha +1 no próximo ataque daquela linha.',
      'Ao estudar cobertura parcial, informe qual detalhe real pretende explorar; o mestre revela um obstáculo visível.',
      'Depois de observar um alvo por uma rodada, descreva uma vulnerabilidade já aparente; ela não ignora toda armadura.',
      'Uma vez por cena, use uma manobra para abrir uma linha de tiro a um aliado, sem atacar junto.',
      'Quando seu tiro não for possível, identifique uma posição de onde ele se tornaria plausível; exige chegar até ela.',
      'Ao explorar uma brecha já conhecida, escolha dano ou vantagem tática no ataque, não ambos.'],
     apex:'Última Linha de Mira',apexEffect:'Uma vez por cena, depois de estudar um único alvo por uma rodada inteira, seu próximo ataque bem-sucedido pode ignorar 1 ponto de absorção da proteção física visivelmente vulnerável; não ignora defesa total nem cria crítico.'},
    {id:'mobilidade',name:'Mobilidade',symbol:'➶',color:'#8daa91',angle:64.28571429,subtitle:'Posição e Latebra',themes:['Sombra','Passagem','Esquiva','Trajeto','Emboscada','Rota','Escalada','Desvio'],
     verbs:['Passo Escolhido','Pé Silencioso','Impulso Curto','Travessia Segura','Mudança de Vetor','Fuga Calculada'],
     effects:['Uma vez por cena, ao estudar uma passagem real, evite uma pequena exposição de posição sem movimento extra.',
      'Ao atravessar terreno irregular conhecido, preserve uma oportunidade de interação simples se fisicamente plausível.',
      'Quando uma tentativa de Furtividade revelar indício, proponha uma rota de retirada compatível com o cenário.',
      'Após manobra de deslocamento bem-sucedida, escolha ocupar uma cobertura próxima em vez de causar dano.',
      'Ao escapar de um cerco parcialmente aberto, uma vez por cena não perca uma pequena interação necessária no trajeto.',
      'Ao conduzir aliados por um corredor preparado, uma vez por cena preserve um espaço para a passagem de uma pessoa.'],
     apex:'Rastro que Desaparece',apexEffect:'Uma vez por cena, ao se deslocar de uma cobertura real para outra sem exposição direta, o personagem pode tentar preservar uma Marca de Latebra que normalmente perderia pelo movimento; requer teste apropriado e não gera invisibilidade.'},
    {id:'sobrevivencia',name:'Sobrevivência',symbol:'✚',color:'#c98584',angle:115.71428571,subtitle:'Ferimentos e socorro',themes:['Resistência','Resgate','Recuperação','Campo','Persistência','Refúgio','Fôlego Humano','Vigilância'],
     verbs:['Pulso Firme','Mão de Socorro','Caminho de Retirada','Resiliência Aprendida','Cuidado Imediato','Último Recurso'],
     effects:['Uma vez por cena, ao alcançar um aliado ferido, identifique uma condição de socorro imediatamente observável.',
      'Ao preparar materiais antes do perigo, consiga realizar atendimento com a ferramenta certa sem improvisação arbitrária.',
      'Ao retirar alguém de perigo, priorize o caminho mais seguro que já existe; não recebe transporte impossível.',
      'Depois de um Ferimento, uma vez por cena identifique qual movimento piora a lesão, sem apagar penalidades ou dano.',
      'Com material e ajuda, uma vez por cena organize um atendimento coordenado com uma ação de suporte real.',
      'Quando estabilizar alguém com sucesso, identifique uma necessidade imediata de proteção sem anular risco posterior.'],
     apex:'Resgate Impossível',apexEffect:'Uma vez por cena, após estabilizar um aliado adjacente com sucesso, pode também movê-lo até 3m por uma rota segura se o peso e o espaço permitirem; não recupera Integridade nem apaga Ferimento.'},
    {id:'conhecimento',name:'Conhecimento',symbol:'✧',color:'#b9a2cd',angle:167.14285714,subtitle:'Investigação e estratégia',themes:['Arquivo','Estratégia','Ofício','Pista','Preparação','Estudo','Método','Laboratório'],
     verbs:['Hipótese Rápida','Observação Cruzada','Ferramenta Certa','Leitura de Risco','Causa e Consequência','Método Próprio'],
     effects:['Uma vez por cena, ao observar um objeto de estudo real, obtenha do mestre um detalhe acessível que sustente uma hipótese.',
      'Depois de uma preparação útil, indique um risco plausível já presente na cena; não prevê segredos.',
      'Ao reparar ou testar um equipamento, identifique qual ferramenta comum é necessária antes do teste.',
      'Ao encontrar uma pista, obtenha uma hipótese verificável, sem afirmar como fato o que ainda é desconhecido.',
      'Em desafio coletivo, prepare uma alternativa concreta para o fracasso de um aliado; consome ação quando sob risco.',
      'Ao concluir estudo significativo, registre uma Vivência que justifique uma técnica futura, sem bônus automático.'],
     apex:'Plano de Contingência',apexEffect:'Uma vez por cena, após preparar um cenário e declarar um plano real, quando uma ação falhar, permita a um aliado escolher uma rota alternativa já prevista. Não transforma falha em sucesso nem concede ação extra.'},
    {id:'regencias',name:'Regências',symbol:'Æ',color:'#d8bd80',angle:218.57142857,subtitle:'Tanger e Ressonância',themes:['Eco','Sintonia','Âncora','Ensaio','Manifestação','Condução','Ressonância','Descoberta'],
     verbs:['Escuta da Regência','Condição Identificada','Traço de Sintonia','Primeira Manifestação','Âncora Estável','Leitura do Eco'],
     effects:['Uma vez por cena, ao observar um fenômeno pertinente à sua Regência Desperta, descreva uma pista que possa ser investigada.',
      'Ao preparar uma âncora para Tanger, identifique uma condição material de interrupção já observável.',
      'Depois de falhar num Eco, uma vez por cena registre uma hipótese de estudo, mas não receba um acerto automático.',
      'Ao estudar uma Descoberta Estável, identifique uma possibilidade de preparo real para um próximo uso.',
      'Em manifestação contínua, uma vez por cena reconheça uma ameaça observável à âncora antes de decidir sustentar.',
      'Após uma manifestação estudada, registre uma nova questão de pesquisa compatível com a Regência, sem ganhar nova habilidade.'],
     apex:'Ressonância Dupla',apexEffect:'Uma vez por cena, após usar sua Ação Principal para uma manifestação Estável bem-sucedida, pode tentar um segundo Eco ou Ajuste de efeito diferente e coerente no mesmo turno com +2 DT. Sem dano adicional, sem escala Maior, sem nova Invicta, sem cadeia; exige âncoras válidas.'}
  ];
  const nodes=[], map=new Map();
  const rootNode={id:'origem',parent:null,sector:'origem',label:'Origem',name:'O Primeiro Passo',type:'origin',cost:0,rank:0,x:0,y:0,effect:'Cada personagem inicia aqui. Escolha uma direção para sua primeira habilidade.'};
  nodes.push(rootNode);map.set(rootNode.id,rootNode);
  function key(sector,bits,step){return `s${sector}:${bits||'x'}:${step}`;}
  function allBits(size){let a=[''];for(let i=0;i<size;i++)a=a.flatMap(s=>[s+'0',s+'1']);return a;}
  for(let s=0;s<sectors.length;s++){
    const sector=sectors[s];
    for(let gen=0;gen<GENERATIONS;gen++)for(const bits of allBits(gen))for(let step=1;step<=STAGES;step++){
      const rank=gen*STAGES+step;
      const id=key(s,bits,step);
      const parent=step>1?key(s,bits,step-1):gen===0?'origem':key(s,bits.slice(0,-1),STAGES);
      const baseRad=sector.angle*Math.PI/180;
      const off=[12.5,6.1,2.65];let angular=0;
      for(let j=0;j<bits.length;j++)angular+=(bits[j]==='0'?-1:1)*off[j];
      const r=160+rank*79,rad=baseRad+angular*Math.PI/180;
      const phase=bits.length?bits.split('').map((d,i)=>d==='0'?['Método','Vigia','Profundidade'][i]:['Instinto','Risco','Ascensão'][i]).join(' / '):'Fundamentos';
      const chapter=sector.themes[(gen+parseInt(bits||'0',2))%sector.themes.length];
      const title=sector.verbs[step-1]+(gen?' · '+chapter:'');
      const isApex=gen===3&&step===6;
      const customApex=isApex&&bits==='000';
      const type=isApex?'apex':step===6?'keystone':step===3?'notable':'minor';
      const costs=[4,6,8,12];
      const effect=customApex?sector.apexEffect: sector.effects[step-1];
      const node={id,parent,sector:sector.id,sectorIndex:s,phase,chapter,
        name:customApex?sector.apex:title,label:sector.name,
        rank,type,cost:costs[gen],effect,angle:sector.angle+angular,
        x:Math.round(r*Math.cos(rad)),y:Math.round(r*Math.sin(rad)),
        lockedByAwakening:sector.id==='regencias',status:'experimental'};
      nodes.push(node);map.set(id,node);
    }
  }
  const edges=nodes.filter(n=>n.parent).map(n=>({from:n.parent,to:n.id}));
  function nextNodes(path=[]){const tip=path.length?path[path.length-1]:'origem';return nodes.filter(n=>n.parent===tip);}
  function canUnlock(path,id){return nextNodes(path).some(n=>n.id===id);}
  function formatCost(path=[]){return path.reduce((sum,id)=>sum+(map.get(id)?.cost||0),0);}
  return Object.freeze({VERSION,STAGES,GENERATIONS,sectors,nodes,map,edges,key,nextNodes,canUnlock,formatCost});
});