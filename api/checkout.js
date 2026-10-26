/* Função serverless (Vercel). Cria o link de pagamento na Pagou.
   A chave fica em variável de ambiente — NUNCA no navegador. */
const BASES = { production: 'https://api.pagou.ai', sandbox: 'https://api.sandbox.pagou.ai' };

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const key = process.env.PAGOU_API_KEY;
  if (!key) return res.status(500).json({ error: 'not_configured' });

  // quantidade validada no servidor; o PREÇO nunca vem do navegador
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const qty = Number(body && body.qty);
  if (!Number.isInteger(qty) || qty < 1 || qty > 10) return res.status(400).json({ error: 'invalid_qty' });

  const ship = body && body.ship === 'sedex' ? 'sedex' : 'pac';
  if (body && body.ship !== undefined && body.ship !== 'pac' && body.ship !== 'sedex') return res.status(400).json({ error: 'invalid_ship' });
  const sedexPrice = parseInt(process.env.SEDEX_PRICE_CENTS || '1290', 10); // centavos
  const price = parseInt(process.env.PRODUCT_PRICE_CENTS || '6990', 10); // centavos
  const base = BASES[process.env.PAGOU_ENV === 'sandbox' ? 'sandbox' : 'production'];
  const product = {
    external_id: process.env.PRODUCT_SKU || 'presepio-bolso-latinha',
    name: 'Presépio de Bolso na Latinha',
    price, quantity: qty, type: 'physical'
  };
  // foto exibida no checkout da Pagou (precisa ser uma URL pública)
  product.image_url = process.env.PRODUCT_IMAGE_URL || 'https://obrellis.com/cdn/shop/files/presepio-bolso-latinha-obrellis-01.jpg?v=1791860837&width=600';
  const items = [product];
  if (ship === 'sedex') items.push({ external_id: 'frete-sedex', name: 'Frete SEDEX', price: sedexPrice, quantity: 1, type: 'physical' });

  try {
    const r = await fetch(base + '/v2/checkout-links', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ currency: 'BRL', title: 'Rena Encanto - Presépio de Bolso - Frete ' + ship.toUpperCase(), products: items })
    });
    const j = await r.json().catch(() => ({}));
    const url = j && j.data && j.data.url;
    if (!r.ok || !url) { console.error('pagou_error', r.status, JSON.stringify(j).slice(0, 500)); return res.status(502).json({ error: 'gateway_error' }); }
    return res.status(200).json({ url });
  } catch (e) {
    console.error('pagou_fetch_failed', e && e.message);
    return res.status(502).json({ error: 'gateway_unreachable' });
  }
};
