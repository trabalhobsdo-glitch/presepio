(function(){
const C=window.CONFIG,$=id=>document.getElementById(id);
const brl=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
let qty=1,ship='pac',cepOk=false;
try{qty=Math.min(10,Math.max(1,parseInt(localStorage.getItem('re_qty'))||1))}catch(e){}
$('pnome').textContent=C.produto;

// foto do produto: arquivo próprio -> foto de referência -> imagem reserva
const pi=$('pimg'),chain=['images/produto.jpg','https://obrellis.com/cdn/shop/files/presepio-bolso-latinha-obrellis-01.jpg?v=1791860837&width=300','images/placeholder.svg'];let k=0;
pi.referrerPolicy='no-referrer';pi.onerror=()=>{if(++k<chain.length)pi.src=chain[k]};pi.src=chain[0];

$('sedexPreco').textContent=brl(C.sedexPreco);
if(C.prazoPac)$('pacTxt').textContent='Entrega em '+C.prazoPac;
if(C.prazoSedex)$('sedexTxt').textContent='Entrega em '+C.prazoSedex;

function show(){
  const f=ship==='sedex'?C.sedexPreco:0,sub=C.preco*qty;
  $('qtd').textContent=qty;$('rc').textContent=qty;$('pprice').textContent=brl(sub);$('resumo').textContent='Produtos';$('sub').textContent=brl(sub);
  $('fnome').textContent='Frete '+ship.toUpperCase();
  const fv=$('fval');fv.textContent=f?brl(f):'Grátis';fv.className=f?'':'ok';
  $('tot').textContent=brl(sub+f);
  $('parc').textContent=C.parcelasSemJuros>1?'ou em até '+C.parcelasSemJuros+'x de '+brl((sub+f)/C.parcelasSemJuros)+' sem juros no cartão':'';
  try{localStorage.setItem('re_qty',qty)}catch(e){}
}
show();
$('menos').onclick=()=>{qty=Math.max(1,qty-1);show()};
$('mais').onclick=()=>{qty=Math.min(10,qty+1);show()};
document.querySelectorAll('input[name=frete]').forEach(r=>r.onchange=()=>{ship=r.value;show()});
if(C.whatsapp){const w=$('wa');w.hidden=false;w.href='https://wa.me/'+C.whatsapp+'?text='+encodeURIComponent('Olá! Preciso de ajuda com meu pedido.')}

// CEP -> mostra as opções de frete
$('cep').addEventListener('input',async e=>{
  const v=e.target.value.replace(/\D/g,'').slice(0,8);e.target.value=v.length>5?v.slice(0,5)+'-'+v.slice(5):v;
  const m=$('cepMsg');cepOk=false;$('opts').hidden=true;
  if(v.length!==8){m.textContent='';return}
  m.textContent='Consultando...';
  try{
    const d=await (await fetch('https://viacep.com.br/ws/'+v+'/json/')).json();
    if(d.erro){m.textContent='CEP não encontrado. Confira os números.';return}
    m.innerHTML='Entrega para <b>'+d.localidade+'/'+d.uf+'</b>. Escolha o frete:';
  }catch(err){m.textContent='Escolha o frete:'}
  cepOk=true;$('opts').hidden=false;$('erro').textContent='';
});

$('fin').onclick=async()=>{
  const b=$('fin'),t=$('finTxt'),er=$('erro');er.textContent='';
  if(!cepOk){er.textContent='Informe seu CEP para ver as opções de frete.';$('cep').focus();return}
  b.disabled=true;t.textContent='Gerando pagamento seguro...';
  try{
    const r=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({qty,ship})});
    const j=await r.json().catch(()=>({}));
    if(!r.ok||!j.url)throw new Error(j.error||'erro');
    location.href=j.url;
  }catch(e){
    er.textContent='Não foi possível abrir o pagamento agora. Tente novamente em instantes.';
    b.disabled=false;t.textContent='Ir para o pagamento';
  }
};
})();
