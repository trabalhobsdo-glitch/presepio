RENA ENCANTO — Página de produto + checkout

ESTRUTURA
  index.html        página do produto (estilo marketplace)
  checkout.html     checkout (dados, entrega, pagamento)
  css/style.css     estilos
  js/config.js      PREÇO, PARCELAS, LINKS DE PAGAMENTO, WHATSAPP  <- edite aqui
  js/main.js        lógica da página (galeria, CEP, quantidade)
  js/checkout.js    lógica do checkout (validação, ViaCEP, envio)
  js/icons.js       ícones SVG
  images/           logo, favicon e imagem reserva

PUBLICAR NO GITHUB PAGES
  Suba o CONTEÚDO desta pasta na raiz do repositório (index.html na raiz).

PAGAMENTO
  Sem links em js/config.js o checkout roda em MODO TESTE (não cobra nada).
  Para vender: crie links de pagamento no seu gateway e cole em linkPagamento.

ATENÇÃO
  As fotos ainda são de outro site (obrellis.com). Troque por imagens suas ou
  autorizadas: coloque em images/ e ajuste a função IMG() em js/main.js.
