/* Função serverless (Vercel) — checkout transparente com a Pagou.
   A chave secreta fica SÓ em variável de ambiente, nunca no navegador.
   Rotas (todas em /api/checkout):
     GET  ?config=1        -> chave pública + ambiente (para montar o campo de cartão)
     GET  ?status=<id>     -> status do pagamento (usado para acompanhar o Pix)
     POST {method:'pix'|'credit_card', ...} -> cria a cobrança */
const net = require('net');
const BASES = { production: 'https://api.pagou.ai', sandbox: 'https://api.sandbox.pagou.ai' };
const digits = s => String(s == null ? '' : s).replace(/\D/g, '');

function cpfOk(s) {
  s = digits(s);
  if (s.length !== 11 || /^(\d)\1+$/.test(s)) return false;
  for (let t = 9; t < 11; t++) {
    let d = 0;
    for (let c = 0; c < t; c++) d += Number(s[c]) * (t + 1 - c);
    d = ((10 * d) % 11) % 10;
    if (Number(s[t]) !== d) return false;
  }
  return true;
}
const str = (v, max) => String(v == null ? '' : v).trim().slice(0, max || 255);
const fail = (res, status, error, extra) => res.status(status).json(Object.assign({ error }, extra || {}));

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  const env = process.env.PAGOU_ENV === 'sandbox' ? 'sandbox' : 'production';
  const base = BASES[env];
  const key = process.env.PAGOU_API_KEY;
  const maxInst = Math.min(12, Math.max(1, parseInt(process.env.CARD_MAX_INSTALLMENTS || '3', 10) || 1));
  const auth = { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' };

  /* ---------- GET ---------- */
  if (req.method === 'GET') {
    const q = req.query || {};
    if (q.config) {
      return res.status(200).json({ publicKey: process.env.PAGOU_PUBLIC_KEY || '', env, maxInstallments: maxInst });
    }
    if (q.status) {
      if (!key) return fail(res, 500, 'not_configured');
      const id = String(q.status);
      if (!/^[0-9a-zA-Z-]{8,64}$/.test(id)) return fail(res, 400, 'invalid_id');
      try {
        const r = await fetch(base + '/v2/transactions/' + encodeURIComponent(id), { headers: auth });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.data) return fail(res, 502, 'gateway_error');
        return res.status(200).json({ status: j.data.status });
      } catch (e) {
        console.error('pagou_status_failed', e && e.message);
        return fail(res, 502, 'gateway_unreachable');
      }
    }
    return fail(res, 400, 'bad_request');
  }

  if (req.method !== 'POST') return fail(res, 405, 'method_not_allowed');
  if (!key) return fail(res, 500, 'not_configured');

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  /* ---------- validações (o PREÇO nunca vem do navegador) ---------- */
  const method = body.method === 'credit_card' ? 'credit_card' : body.method === 'pix' ? 'pix' : null;
  if (!method) return fail(res, 400, 'invalid_method');

  const qty = Number(body.qty);
  if (!Number.isInteger(qty) || qty < 1 || qty > 10) return fail(res, 400, 'invalid_qty');
  if (body.ship !== undefined && body.ship !== 'pac' && body.ship !== 'sedex') return fail(res, 400, 'invalid_ship');
  const ship = body.ship === 'sedex' ? 'sedex' : 'pac';

  const b = body.buyer || {}, a = body.address || {};
  const name = str(b.name), email = str(b.email), cpf = digits(b.cpf), phone = digits(b.phone);
  if (name.split(/\s+/).length < 2 || name.length < 5) return fail(res, 400, 'invalid_buyer', { field: 'nome' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail(res, 400, 'invalid_buyer', { field: 'email' });
  if (!cpfOk(cpf)) return fail(res, 400, 'invalid_buyer', { field: 'cpf' });
  if (phone.length < 10 || phone.length > 11) return fail(res, 400, 'invalid_buyer', { field: 'tel' });
  const zip = digits(a.cep), street = str(a.street), number = str(a.number, 20), neighborhood = str(a.neighborhood),
        city = str(a.city), state = str(a.state, 2).toUpperCase(), complement = str(a.complement) || null;
  if (zip.length !== 8) return fail(res, 400, 'invalid_address', { field: 'cep' });
  if (street.length < 2) return fail(res, 400, 'invalid_address', { field: 'rua' });
  if (!number) return fail(res, 400, 'invalid_address', { field: 'num' });
  if (neighborhood.length < 2) return fail(res, 400, 'invalid_address', { field: 'bairro' });
  if (city.length < 2) return fail(res, 400, 'invalid_address', { field: 'cidade' });
  if (!/^[A-Z]{2}$/.test(state)) return fail(res, 400, 'invalid_address', { field: 'uf' });

  const price = parseInt(process.env.PRODUCT_PRICE_CENTS || '6990', 10);       // centavos
  const sedexPrice = parseInt(process.env.SEDEX_PRICE_CENTS || '1290', 10);    // centavos
  const shipFee = ship === 'sedex' ? sedexPrice : 0;
  const amount = price * qty + shipFee;

  const products = [{
    name: 'Presépio de Bolso na Latinha', price, quantity: qty, tangible: true,
    sku: process.env.PRODUCT_SKU || 'presepio-bolso-latinha'
  }];
  if (shipFee) products.push({ name: 'Frete SEDEX', price: shipFee, quantity: 1, tangible: false, sku: 'frete-sedex' });

  const ref = 'RE' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
  const payload = {
    external_ref: ref,
    amount, currency: 'BRL', method,
    buyer: {
      name, email, phone: '+55' + phone,
      document: { type: 'CPF', number: cpf },
      address: { street, number, complement, neighborhood, city, state, zipCode: zip, country: 'BR' }
    },
    products,
    informations: [{ key: 'frete', value: ship.toUpperCase() }]
  };

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  if (ip && net.isIP(ip)) payload.ip_address = ip;

  if (method === 'credit_card') {
    const token = String(body.token || '');
    if (!/^(pgct_|pgpm_)/.test(token)) return fail(res, 400, 'invalid_token');
    const n = Number(body.installments || 1);
    if (!Number.isInteger(n) || n < 1 || n > maxInst) return fail(res, 400, 'invalid_installments');
    payload.token = token;
    payload.installments = n;
    payload.interest_free_installments = maxInst;
  }

  /* ---------- cria a cobrança na Pagou ---------- */
  try {
    const r = await fetch(base + '/v2/transactions', { method: 'POST', headers: auth, body: JSON.stringify(payload) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error('pagou_error', r.status, JSON.stringify(j).slice(0, 600));
      if (r.status === 422) {
        const e = (j.errors && j.errors[0]) || {};
        return fail(res, 422, 'validation', { field: String(e.field || ''), message: String(e.message || '') });
      }
      if (r.status === 409) return fail(res, 409, 'duplicate');
      return fail(res, 502, 'gateway_error');
    }
    const d = j.data || {};
    if (method === 'pix') {
      const qr = d.pix && d.pix.qr_code;
      if (!d.id || !qr) { console.error('pagou_no_qr', JSON.stringify(j).slice(0, 400)); return fail(res, 502, 'gateway_error'); }
      return res.status(200).json({ ref, id: d.id, status: d.status, qr_code: qr, expiration_date: d.pix.expiration_date || null });
    }
    // cartão: devolve a transação sem remover id/status/next_action (o SDK usa isso para o 3DS)
    return res.status(200).json({ ref, data: d });
  } catch (e) {
    console.error('pagou_fetch_failed', e && e.message);
    return fail(res, 502, 'gateway_unreachable');
  }
};
