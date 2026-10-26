(function(){
const C=window.CONFIG,$=id=>document.getElementById(id),F=$('form');
const brl=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
let qty=1;try{qty=Math.min(10,Math.max(1,parseInt(localStorage.getItem('re_qty'))||1))}catch(e){}
const total=C.preco*qty;
$('pnome').textContent=C.produto;$('pq').textContent='Quantidade: '+qty;
$('sub').textContent=$('tot').textContent=brl(total);
const pi=$('pimg');pi.referrerPolicy='no-referrer';pi.onerror=()=>{pi.onerror=null;pi.src='images/placeholder.svg'};
pi.src='https://obrellis.com/cdn/shop/files/presepio-bolso-latinha-obrellis-01.jpg?v=1791860837&width=300';
if(C.parcelasSemJuros>1)$('parcTxt').textContent='Até '+C.parcelasSemJuros+'x de '+brl(total/C.parcelasSemJuros)+' sem juros';

const dig=s=>s.replace(/\D/g,'');
const mask={
  cpf:v=>dig(v).slice(0,11).replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2'),
  tel:v=>{v=dig(v).slice(0,11);return v.length>10?v.replace(/(\d{2})(\d{5})(\d{4})/,'($1) $2-$3'):v.replace(/(\d{2})(\d{4})(\d{0,4})/,'($1) $2-$3').replace(/-$/,'')},
  cep:v=>dig(v).slice(0,8).replace(/(\d{5})(\d)/,'$1-$2')
};
Object.keys(mask).forEach(n=>F[n].addEventListener('input',e=>e.target.value=mask[n](e.target.value)));

function cpfOk(v){v=dig(v);if(v.length!==11||/^(\d)\1+$/.test(v))return false;
  for(let t=9;t<11;t++){let s=0;for(let i=0;i<t;i++)s+=v[i]*(t+1-i);if((s*10%11)%10!=v[t])return false}return true}
const rules={
  nome:v=>v.trim().split(/\s+/).length>=2&&v.trim().length>4,
  email:v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v),
  cpf:cpfOk,tel:v=>{v=dig(v);return v.length>=10&&v.length<=11&&+v.slice(0,2)>10},
  cep:v=>dig(v).length===8,rua:v=>v.trim().length>1,numero:v=>v.trim().length>0,
  bairro:v=>v.trim().length>1,cidade:v=>v.trim().length>1,uf:v=>/^[a-zA-Z]{2}$/.test(v)
};
function check(n){const ok=rules[n](F[n].value);F[n].classList.toggle('bad',!ok);return ok}
Object.keys(rules).forEach(n=>F[n].addEventListener('blur',()=>check(n)));

// CEP → endereço
F.cep.addEventListener('input',async()=>{
  if(dig(F.cep.value).length!==8)return;
  try{const d=await (await fetch('https://viacep.com.br/ws/'+dig(F.cep.value)+'/json/')).json();
    if(d.erro){F.cep.classList.add('bad');return}
    F.cep.classList.remove('bad');
    F.rua.value=d.logradouro||F.rua.value;F.bairro.value=d.bairro||F.bairro.value;F.cidade.value=d.localidade;F.uf.value=d.uf;
    (F.rua.value?F.numero:F.rua).focus();
  }catch(e){}
});

F.addEventListener('submit',async e=>{
  e.preventDefault();
  const bad=Object.keys(rules).filter(n=>!check(n));
  if(bad.length){F[bad[0]].focus();return}
  const btn=$('fin');btn.disabled=true;btn.lastChild.textContent='Processando...';
  const fd=Object.fromEntries(new FormData(F));
  const pedido={id:'RE'+Date.now().toString(36).toUpperCase(),produto:C.produto,quantidade:qty,total:+total.toFixed(2),pagamento:fd.pg,
    cliente:{nome:fd.nome,email:fd.email,cpf:dig(fd.cpf),telefone:dig(fd.tel)},
    entrega:{cep:dig(fd.cep),rua:fd.rua,numero:fd.numero,complemento:fd.comp,bairro:fd.bairro,cidade:fd.cidade,uf:fd.uf.toUpperCase()}};
  if(C.webhookPedido){try{await fetch(C.webhookPedido,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(pedido),keepalive:true})}catch(e){}}
  const link=C.linkPagamento[fd.pg];
  if(link){location.href=link;return}
  // modo teste: nenhum pagamento é cobrado
  F.hidden=true;const d=$('done');d.hidden=false;
  d.innerHTML='<span class="i" data-i="check" data-s="64"></span><h2>Pedido de teste registrado</h2><p>Número: <b>'+pedido.id+'</b><br>Total: <b>'+brl(total)+'</b></p><div class="test"><b>Modo teste:</b> nenhum pagamento foi cobrado. Para vender de verdade, cole o link de pagamento do seu gateway em <code>js/config.js</code>.</div><a class="btn" href="index.html">Voltar à loja</a>';
  window.scrollTo(0,0);
  const s=d.querySelector('[data-i]');s.innerHTML='<svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><use href="#i-check"/></svg>';
});
})();
