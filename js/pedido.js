(function(){
const C=window.CONFIG,$=id=>document.getElementById(id);
const brl=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
let qty=1,ship='pac',cepOk=false,method='pix',busy=false,cardValid=false;
let cfg=null,elements=null,card=null,pollTimer=null,lastRef='';
try{qty=Math.min(10,Math.max(1,parseInt(localStorage.getItem('re_qty'))||1))}catch(e){}
$('pnome').textContent=C.produto;

/* ---------- foto do produto ---------- */
const pi=$('pimg'),chain=['images/produto.jpg','https://obrellis.com/cdn/shop/files/presepio-bolso-latinha-obrellis-01.jpg?v=1791860837&width=300','images/placeholder.svg'];let k=0;
pi.referrerPolicy='no-referrer';pi.onerror=()=>{if(++k<chain.length)pi.src=chain[k]};pi.src=chain[0];
$('sedexPreco').textContent=brl(C.sedexPreco);
if(C.prazoPac)$('pacTxt').textContent='Entrega em '+C.prazoPac;
if(C.prazoSedex)$('sedexTxt').textContent='Entrega em '+C.prazoSedex;

/* ---------- totais ---------- */
const total=()=>C.preco*qty+(ship==='sedex'?C.sedexPreco:0);
function maxInst(){return cfg&&cfg.maxInstallments>1?cfg.maxInstallments:1}
function fillParc(){
  const sel=$('parcSel'),n=maxInst(),t=total(),cur=sel.value||'1';
  $('parcWrap').hidden=n<2;sel.innerHTML='';
  for(let i=1;i<=n;i++){const o=document.createElement('option');o.value=i;o.textContent=i+'x de '+brl(t/i)+(i>1?' sem juros':'');sel.append(o)}
  sel.value=Math.min(Number(cur),n);
}
function btnTxt(){$('finTxt').textContent=method==='pix'?'Gerar Pix · '+brl(total()):'Pagar '+brl(total())+' no cartão'}
function show(){
  const f=ship==='sedex'?C.sedexPreco:0,sub=C.preco*qty;
  $('qtd').textContent=qty;$('rc').textContent=qty;$('pprice').textContent=brl(sub);$('resumo').textContent='Produtos';$('sub').textContent=brl(sub);
  $('fnome').textContent='Frete '+ship.toUpperCase();
  const fv=$('fval');fv.textContent=f?brl(f):'Grátis';fv.className=f?'':'ok';
  $('tot').textContent=brl(sub+f);
  $('parc').textContent=C.parcelasSemJuros>1?'ou em até '+C.parcelasSemJuros+'x de '+brl((sub+f)/C.parcelasSemJuros)+' sem juros no cartão':'';
  try{localStorage.setItem('re_qty',qty)}catch(e){}
  btnTxt();fillParc();
}
show();
$('menos').onclick=()=>{qty=Math.max(1,qty-1);show()};
$('mais').onclick=()=>{qty=Math.min(10,qty+1);show()};
document.querySelectorAll('input[name=frete]').forEach(r=>r.onchange=()=>{ship=r.value;show()});
if(C.whatsapp){const w=$('wa');w.hidden=false;w.href='https://wa.me/'+C.whatsapp+'?text='+encodeURIComponent('Olá! Preciso de ajuda com meu pedido.')}

/* ---------- máscaras e validação ---------- */
const dg=s=>String(s||'').replace(/\D/g,'');
function cpfOk(s){s=dg(s);if(s.length!==11||/^(\d)\1+$/.test(s))return false;for(let t=9;t<11;t++){let d=0;for(let c=0;c<t;c++)d+=s[c]*(t+1-c);d=((10*d)%11)%10;if(+s[t]!==d)return false}return true}
const maskCpf=v=>{v=dg(v).slice(0,11);return v.replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2')};
const maskTel=v=>{v=dg(v).slice(0,11);return v.length>10?v.replace(/(\d{2})(\d{5})(\d{0,4})/,'($1) $2-$3'):v.length>6?v.replace(/(\d{2})(\d{4})(\d{0,4})/,'($1) $2-$3'):v.length>2?v.replace(/(\d{2})(\d*)/,'($1) $2'):v};
$('cpf').addEventListener('input',e=>e.target.value=maskCpf(e.target.value));
$('tel').addEventListener('input',e=>e.target.value=maskTel(e.target.value));
$('uf').addEventListener('input',e=>e.target.value=e.target.value.replace(/[^a-zA-Z]/g,'').toUpperCase());

const RULES={
  nome:v=>v.trim().split(/\s+/).length>=2&&v.trim().length>=5,
  email:v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
  tel:v=>[10,11].includes(dg(v).length),
  cpf:cpfOk,
  rua:v=>v.trim().length>=2,
  num:v=>v.trim().length>=1,
  bairro:v=>v.trim().length>=2,
  cidade:v=>v.trim().length>=2,
  uf:v=>/^[A-Za-z]{2}$/.test(v.trim())
};
function validate(showErr){
  let first=null;
  for(const id in RULES){const el=$(id),ok=RULES[id](el.value);if(showErr)el.classList.toggle('bad',!ok);if(!ok&&!first)first=el}
  if(showErr&&first)first.focus();
  return !first;
}
Object.keys(RULES).forEach(id=>$(id).addEventListener('input',()=>{$(id).classList.remove('bad');steps()}));
function steps(){$('s2').classList.toggle('on',cepOk);$('s3').classList.toggle('on',cepOk&&validate(false))}

/* ---------- CEP -> frete + preenche endereço ---------- */
$('cep').addEventListener('input',async e=>{
  const v=dg(e.target.value).slice(0,8);e.target.value=v.length>5?v.slice(0,5)+'-'+v.slice(5):v;
  const m=$('cepMsg');cepOk=false;$('opts').hidden=true;$('dados').hidden=true;$('pagto').hidden=true;$('fin').hidden=true;steps();
  if(v.length!==8){m.textContent='';return}
  m.textContent='Consultando...';
  try{
    const d=await (await fetch('https://viacep.com.br/ws/'+v+'/json/')).json();
    if(dg($('cep').value)!==v)return;
    if(d.erro){m.textContent='CEP não encontrado. Confira os números.';return}
    m.innerHTML='Entrega para <b>'+d.localidade+'/'+d.uf+'</b>. Escolha o frete:';
    if(d.logradouro&&!$('rua').value)$('rua').value=d.logradouro;
    if(d.bairro&&!$('bairro').value)$('bairro').value=d.bairro;
    $('cidade').value=d.localidade||'';$('uf').value=d.uf||'';
  }catch(err){m.textContent='Escolha o frete e preencha o endereço:'}
  cepOk=true;$('opts').hidden=false;$('dados').hidden=false;$('pagto').hidden=false;$('fin').hidden=false;$('erro').textContent='';steps();
});

/* ---------- configuração + Payment Element (cartão) ---------- */
const cfgReady=fetch('/api/checkout?config=1').then(r=>r.json()).then(j=>{cfg=j;fillParc()}).catch(()=>{cfg=null});
function ensureCard(){
  const err=$('cardErr');
  if(card)return true;
  if(!cfg||!cfg.publicKey||!window.Pagou){err.textContent='Cartão indisponível no momento. Use o Pix.';return false}
  try{
    window.Pagou.setEnvironment(cfg.env==='sandbox'?'sandbox':'production');
    elements=window.Pagou.elements({publicKey:cfg.publicKey,locale:'pt-BR'});
    card=elements.create('card',{theme:'default'});
    card.mount('#card-element');
    card.on('change',ev=>{cardValid=!!ev.valid;err.textContent=Object.values(ev.errors||{})[0]||''});
    card.on('error',ev=>{err.textContent=(ev&&ev.message)||'Erro ao carregar o campo do cartão.'});
    return true;
  }catch(e){err.textContent='Não foi possível carregar o campo do cartão. Use o Pix.';card=null;return false}
}
document.querySelectorAll('input[name=metodo]').forEach(r=>r.onchange=async()=>{
  method=r.value;$('pnPix').hidden=method!=='pix';$('pnCard').hidden=method==='pix';$('erro').textContent='';btnTxt();
  if(method==='credit_card'){await cfgReady;fillParc();ensureCard()}
});

/* ---------- chamadas ao servidor ---------- */
function payload(extra){
  return Object.assign({qty,ship,
    buyer:{name:$('nome').value,email:$('email').value,cpf:dg($('cpf').value),phone:dg($('tel').value)},
    address:{cep:dg($('cep').value),street:$('rua').value,number:$('num').value,complement:$('comp').value,neighborhood:$('bairro').value,city:$('cidade').value,state:$('uf').value}
  },extra);
}
async function post(extra){
  const r=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload(extra))});
  const j=await r.json().catch(()=>({}));
  if(!r.ok){const e=new Error(j.error||'erro');e.info=j;throw e}
  return j;
}
function friendly(e){
  const i=(e&&e.info)||{};
  if(i.error==='invalid_buyer'||i.error==='invalid_address'){const el=$(i.field);if(el){el.classList.add('bad');el.focus()}return 'Confira os dados destacados.'}
  if(i.error==='validation')return 'Alguns dados não foram aceitos'+(i.message?': '+i.message:'')+'. Confira e tente de novo.';
  if(i.error==='duplicate')return 'Tente novamente em instantes.';
  return 'Não foi possível processar o pagamento agora. Tente novamente em instantes.';
}
const getStatus=async id=>{const r=await fetch('/api/checkout?status='+encodeURIComponent(id));const j=await r.json().catch(()=>({}));return j.status||''};
const PAID=['paid','captured'],DEAD=['expired','canceled','refused','chargedback'];

/* ---------- telas ---------- */
function setBusy(on,txt){busy=on;$('fin').disabled=on;if(on&&txt)$('finTxt').textContent=txt;else btnTxt()}
function done(title,msg,ref){
  stopPoll();
  $('flow').hidden=true;$('pixBox').hidden=true;$('done').hidden=false;
  $('doneT').textContent=title;$('doneP').textContent=msg;$('doneRef').textContent=ref?'Pedido '+ref:'';$('doneRef').hidden=!ref;
  try{localStorage.removeItem('re_qty')}catch(e){}
  window.scrollTo({top:0,behavior:'smooth'});
}
function stopPoll(){if(pollTimer){clearInterval(pollTimer);pollTimer=null}}

/* ---------- Pix ---------- */
async function payPix(){
  const j=await post({method:'pix'});lastRef=j.ref;
  $('flow').hidden=true;$('pixBox').hidden=false;
  $('pixCode').textContent=j.qr_code;
  const q=$('qr');q.innerHTML='';
  try{const qr=window.qrcode(0,'M');qr.addData(j.qr_code);qr.make();q.innerHTML=qr.createSvgTag(5,0)}catch(e){q.hidden=true}
  $('pixExp').textContent=j.expiration_date?'Este código vale até '+new Date(j.expiration_date).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})+'.':'';
  $('pixSt').textContent='Aguardando pagamento…';
  window.scrollTo({top:0,behavior:'smooth'});
  stopPoll();let tries=0;
  pollTimer=setInterval(async()=>{
    tries++;if(tries>450){stopPoll();return}   // ~30 min
    try{
      const s=await getStatus(j.id);
      if(PAID.includes(s))done('Pagamento confirmado!','Recebemos seu Pix. Seu presépio já está sendo preparado para envio.',j.ref);
      else if(DEAD.includes(s)){stopPoll();$('pixSt').textContent='Este Pix expirou. Volte e gere um novo.'}
    }catch(e){}
  },4000);
}
$('copiar').onclick=async()=>{
  const t=$('pixCode').textContent;
  try{await navigator.clipboard.writeText(t)}catch(e){const a=document.createElement('textarea');a.value=t;document.body.append(a);a.select();try{document.execCommand('copy')}catch(_){}a.remove()}
  $('copiar').textContent='Código copiado!';setTimeout(()=>$('copiar').textContent='Copiar código Pix',2500);
};
$('voltar').onclick=()=>{stopPoll();$('pixBox').hidden=true;$('flow').hidden=false;window.scrollTo({top:0,behavior:'smooth'})};

/* ---------- Cartão ---------- */
async function payCard(){
  await cfgReady;
  if(!ensureCard())throw new Error('card_unavailable');
  if(!cardValid){$('cardErr').textContent='Confira os dados do cartão.';throw new Error('card_invalid')}
  let lastErr=null;
  const result=await elements.submit({
    createTransaction:async td=>{
      try{const j=await post({method:'credit_card',token:td.token,installments:Number($('parcSel').value||1)});lastRef=j.ref;return j.data}
      catch(e){lastErr=e;throw e}
    }
  });
  if(lastErr)throw lastErr;
  const st=result&&result.status,id=result&&result.transaction&&result.transaction.id;
  if(['succeeded','paid','captured','completed'].includes(st))return done('Pagamento aprovado!','Recebemos seu pagamento. Seu presépio já está sendo preparado para envio.',lastRef);
  if(['processing','pending','authorized','processed'].includes(st)){
    if(id){for(let i=0;i<12;i++){await new Promise(r=>setTimeout(r,5000));const s=await getStatus(id).catch(()=>'');if(PAID.includes(s))return done('Pagamento aprovado!','Recebemos seu pagamento. Seu presépio já está sendo preparado para envio.',lastRef);if(DEAD.includes(s))throw new Error('refused')}}
    return done('Pagamento em análise','Estamos confirmando seu pagamento com o banco. Guarde o número do pedido e fale com a gente se precisar.',lastRef);
  }
  if(st==='canceled')throw new Error('canceled');
  throw new Error(st||'failed');
}

/* ---------- botão principal ---------- */
$('fin').onclick=async()=>{
  const er=$('erro');er.textContent='';
  if(busy)return;
  if(!cepOk){er.textContent='Informe seu CEP para ver as opções de frete.';$('cep').focus();return}
  if(!validate(true)){er.textContent='Preencha os campos destacados.';return}
  setBusy(true,method==='pix'?'Gerando Pix...':'Processando pagamento...');
  try{
    if(method==='pix')await payPix();else await payCard();
  }catch(e){
    const m=e&&e.message;
    if(m==='card_invalid'||m==='card_unavailable'){/* mensagem já exibida no campo do cartão */}
    else if(m==='canceled')er.textContent='A autenticação do cartão foi cancelada. Tente novamente.';
    else if(m==='refused'||m==='failed')er.textContent='Pagamento não aprovado. Confira os dados do cartão ou tente outro cartão / Pix.';
    else er.textContent=friendly(e);
  }finally{setBusy(false)}
};
})();
