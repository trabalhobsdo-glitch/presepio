/* ========= CONFIGURAÇÕES — edite aqui, sem mexer no resto ========= */
window.CONFIG = {
  produto: "Presépio de Bolso na Latinha",
  preco: 69.90,
  parcelasSemJuros: 3,          // 1 = esconde o parcelamento
  prazoEntrega: "",             // ex.: "5 a 12 dias úteis" (vazio = "calculado no checkout")
  whatsapp: "",                 // ex.: "5531999999999" (vazio = esconde o botão)

  /* PAGAMENTO — cole aqui os links de pagamento do seu gateway
     (Mercado Pago, Pagar.me, Yampi, Appmax, Kiwify etc.). Vazio = modo teste. */
  linkPagamento: { pix: "", cartao: "", boleto: "" },
  webhookPedido: ""             // opcional: URL que recebe o pedido (POST JSON)
};
