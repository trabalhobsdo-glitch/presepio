(function(){
const C=window.CONFIG,$=id=>document.getElementById(id);
const brl=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const IMG=n=>'https://obrellis.com/cdn/shop/files/presepio-bolso-latinha-obrellis-0'+n+'.jpg?v=1791860837&width=1200';
const FALL='images/placeholder.svg';
function img(el,src){el.referrerPolicy='no-referrer';el.onerror=()=>{el.onerror=null;el.src=FALL};el.src=src}
let qty=1;
try{qty=Math.min(10,Math.max(1,parseInt(localStorage.getItem('re_qty'))||1))}catch(e){}

// preço e parcelamento
const [r,c]=C.preco.toFixed(2).split('.');
$('preco').innerHTML='<small>R$</small>'+r+',<small>'+c+'</small>';
$('mpreco').textContent=brl(C.preco);
$('parc').textContent=C.parcelasSemJuros>1?'ou '+C.parcelasSemJuros+'x de '+brl(C.preco/C.parcelasSemJuros)+' sem juros no cartão':'';

// galeria
const th=$('thumbs'),big=$('big');
[1,2,3,4,5].forEach(n=>{
  const b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Foto '+n);
  const i=document.createElement('img');i.alt='';img(i,IMG(n));b.append(i);
  b.onclick=()=>{img(big,IMG(n));th.querySelectorAll('button').forEach(x=>x.classList.remove('on'));b.classList.add('on')};
  th.append(b);if(n==1){b.classList.add('on');img(big,IMG(n))}
});
img($('foto2'),IMG(2));
[3,4,5].forEach(n=>{const i=document.createElement('img');i.alt='Presépio de Bolso em detalhe';i.loading='lazy';img(i,IMG(n));$('fotos').append(i)});

// quantidade
const show=()=>{$('qtd').textContent=qty};show();
$('menos').onclick=()=>{qty=Math.max(1,qty-1);show()};
$('mais').onclick=()=>{qty=Math.min(10,qty+1);show()};

// CEP
$('cep').addEventListener('input',e=>{let v=e.target.value.replace(/\D/g,'').slice(0,8);e.target.value=v.length>5?v.slice(0,5)+'-'+v.slice(5):v});
async function cep(){
  const v=$('cep').value.replace(/\D/g,''),m=$('cepMsg');
  if(v.length!==8){m.textContent='Digite um CEP com 8 números.';return}
  m.textContent='Consultando...';
  try{
    const d=await (await fetch('https://viacep.com.br/ws/'+v+'/json/')).json();
    if(d.erro){m.textContent='CEP não encontrado.';return}
    m.innerHTML='<b style="color:#1a8f4c">Frete grátis</b> para '+d.localidade+'/'+d.uf+'. '+(C.prazoEntrega?'Entrega em '+C.prazoEntrega+'.':'Prazo calculado no checkout.');
  }catch(e){m.textContent='Não foi possível consultar agora. O frete é grátis e o prazo aparece no checkout.'}
}
$('cepBtn').onclick=cep;
$('cep').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();cep()}});

// comprar
function buy(){try{localStorage.setItem('re_qty',qty)}catch(e){}location.href='checkout.html'}
$('comprar').onclick=buy;$('comprar2').onclick=buy;

// WhatsApp (opcional)
if(C.whatsapp){const w=$('wa');w.hidden=false;w.href='https://wa.me/'+C.whatsapp+'?text='+encodeURIComponent('Olá! Tenho uma dúvida sobre o '+C.produto)}
})();
