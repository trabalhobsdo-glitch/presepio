RENA ENCANTO — Página de produto + checkout transparente Pagou (Pix e cartão dentro do site)

ESTRUTURA
  index.html        página do produto (estilo marketplace)
  checkout.html     checkout completo: frete, dados, endereço e pagamento (Pix / cartão)
  api/checkout.js   função do servidor (Vercel): cria a cobrança, config e status
  css/ js/          estilos e scripts (js/config.js = textos/preço de vitrine; js/pedido.js = lógica do checkout)
  images/           logo, favicon e imagem reserva

VARIÁVEIS NA VERCEL (Settings > Environment Variables)
  PAGOU_API_KEY          chave SECRETA da Pagou (painel Pagou > API)
  PAGOU_PUBLIC_KEY       chave PÚBLICA da Pagou (pk_test_... no sandbox, pk_live_... em produção)
  PAGOU_ENV              sandbox (testes)  |  production (vendas reais)
  PRODUCT_PRICE_CENTS    6990
  SEDEX_PRICE_CENTS      1290   (opcional)
  CARD_MAX_INSTALLMENTS  3      (opcional, parcelas sem juros no cartão)
  Depois de criar/alterar variáveis, faça Redeploy.

TESTE EM SANDBOX
  Pix: use o CPF 390.271.878-19 — o Pix é confirmado sozinho em ~15 segundos.
  Cartão aprovado: 4548 8120 4940 0004, validade 12/34, CVV 123.
  Cartão recusado: 1111 1111 1111 1117.   Cartão com 3DS: 4918 0191 9988 3839.
  Para vendas reais: PAGOU_ENV=production + chaves de PRODUÇÃO (secreta e pública).

IMPORTANTE
  - A chave secreta NUNCA vai no GitHub nem no navegador, só na Vercel.
  - O valor cobrado vem do servidor. Se mudar o preço, mude na Vercel E em js/config.js (que só exibe).
  - O GitHub Pages NÃO serve: ele não roda a pasta api/. Use a Vercel.
  - Pedidos, endereços e status aparecem no painel da Pagou.
  - js/checkout.js é antigo e não é mais usado: pode apagar.
