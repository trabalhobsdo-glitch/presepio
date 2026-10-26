RENA ENCANTO — Página de produto + checkout Pagou

ESTRUTURA
  index.html        página do produto (estilo marketplace)
  checkout.html     revisão do pedido -> redireciona para o pagamento da Pagou
  api/checkout.js   função do servidor (Vercel) que cria o link de pagamento
  css/ js/          estilos e scripts (js/config.js = textos/preço de vitrine)
  images/           logo, favicon e imagem reserva
  .env.example      variáveis que você configura na Vercel

COMO COLOCAR PARA VENDER
 1. Suba o conteúdo desta pasta na RAIZ do repositório no GitHub.
 2. Na Vercel: Add New > Project > importe o repositório (sem build, é site estático).
 3. Vercel > Settings > Environment Variables, crie:
      PAGOU_API_KEY        chave secreta da Pagou (painel Pagou > API)
      PAGOU_ENV            sandbox (testes)  |  production (vendas reais)
      PRODUCT_PRICE_CENTS  6990
 4. Redeploy. Teste em sandbox. Depois troque PAGOU_ENV para production
    (e use a chave de PRODUÇÃO — as chaves de sandbox e produção são diferentes).

IMPORTANTE
  - A chave da Pagou NUNCA vai no GitHub nem no navegador, só na Vercel.
  - O valor cobrado vem do servidor (PRODUCT_PRICE_CENTS). Se mudar o preço,
    mude lá E em js/config.js (que só exibe).
  - O GitHub Pages NÃO serve: ele não roda a pasta api/. Use a Vercel.
  - As fotos ainda são de outro site (obrellis.com). Troque por fotos suas.
  - Pedidos, endereços e status aparecem no painel da Pagou.
