async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function getBaseUrl(req) {
  if (process.env.BASE_URL) return process.env.BASE_URL;
  if (process.env.WEBHOOK_BASE_URL) return process.env.WEBHOOK_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (host) return `${proto}://${host}`;
  return '';
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    res.status(500).json({ error: 'Missing MERCADOPAGO_ACCESS_TOKEN' });
    return;
  }

  const payload = await readJsonBody(req);
const demoMap = {
  pizzaria: 'pizzaria',
  pizza: 'pizzaria',
  barbearia: 'barbearia',
  barber: 'barbearia',
  tattoo: 'tattoo',
  tatuagem: 'tattoo',
};

const rawDemo = String(payload.demo || '').toLowerCase();
const demoKey = demoMap[rawDemo];
const unitPrice = priceByDemo[demoKey];

if (!unitPrice || isNaN(unitPrice) || unitPrice <= 0) {
  res.status(400).json({
    error: 'Invalid demo or price',
    received_demo: payload.demo,
  });
  return;
}


  const items = [
  {
    title: payload.title || 'Landing Page Profissional',
    quantity: 1,
    unit_price: Number(unitPrice.toFixed(2)),
    currency_id: 'BRL',
  },
];


  const baseUrl = getBaseUrl(req);
  const notificationUrl = baseUrl
    ? `${baseUrl}/api/webhook`
    : undefined;

  const preference = {
    items,
    notification_url: notificationUrl,
  };

  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preference),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    res.status(response.status).json({
      error: 'Mercado Pago error',
      details: data,
    });
    return;
  }

  res.status(200).json({
    id: data.id,
    init_point: data.init_point,
    sandbox_init_point: data.sandbox_init_point,
  });
};
