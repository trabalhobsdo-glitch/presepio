(function(){
const C=window.CONFIG,$=id=>document.getElementById(id);
const brl=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
let qty=1;try{qty=Math.min(10,Math.max(1,parseInt(localStorage.getItem('re_qty'))||1))}catch(e){}
$('pnome').textContent=C.produto;
const pi=$('pimg');pi.referrerPolicy='no-referrer';pi.onerror=()=>{pi.onerror=null;pi.src='images/placeholder.svg'};
pi.src='https://obrellis.com/cdn/shop/files/presepio-bolso-latinha-obrellis-01.jpg?v=1791860837&width=300';
function show(){const t=C.preco*qty;$('qtd').textContent=qty;$('resumo').textContent=qty+' × '+C.produto;$('sub').textContent=$('tot').textContent=brl(t);try{localStorage.setItem('re_qty',qty)}catch(e){}}
show();
$('menos').onclick=()=>{qty=Math.max(1,qty-1);show()};
$('mais').onclick=()=>{qty=Math.min(10,qty+1);show()};
if(C.whatsapp){const w=$('wa');w.hidden=false;w.href='https://wa.me/'+C.whatsapp+'?text='+encodeURIComponent('Olá! Preciso de ajuda com meu pedido.')}

$('fin').onclick=async()=>{
  const b=$('fin'),t=$('finTxt'),er=$('erro');er.textContent='';b.disabled=true;t.textContent='Gerando pagamento seguro...';
  try{
    const r=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({qty})});
    const j=await r.json().catch(()=>({}));
    if(!r.ok||!j.url)throw new Error(j.error||'erro');
    location.href=j.url;
  }catch(e){
    er.textContent='Não foi possível abrir o pagamento agora. Tente novamente em instantes.';
    b.disabled=false;t.textContent='Ir para o pagamento';
  }
};
})();
