const fs = require('fs');
const path = require('path');

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

function getPaymentId(payload) {
  return (
    payload?.data?.id ||
    payload?.data?.payment_id ||
    payload?.id ||
    payload?.payment_id ||
    null
  );
}

async function fetchPayment(paymentId, accessToken) {
  if (!paymentId || !accessToken) return null;
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return null;
  return response.json();
}

function loadProjectsData() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'projects.json');
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function resolveProjectName(slug) {
  if (!slug) return 'Projeto';
  const projects = loadProjectsData();
  if (!Array.isArray(projects)) return slug;
  const project = projects.find((item) => String(item.slug).toLowerCase() === String(slug).toLowerCase());
  return project?.name || slug;
}

async function sendWhatsappMessage({ projectName, amount, payerEmail }) {
  const token = process.env.WHATSAPP_CLOUD_TOKEN;
  const phoneId = process.env.WHATSAPP_CLOUD_PHONE_ID;
  const notifyTo = process.env.WHATSAPP_NOTIFY_TO;
  const apiVersion = process.env.WHATSAPP_CLOUD_API_VERSION || 'v19.0';

  if (!token || !phoneId || !notifyTo) return;

  const message = [
    'Nova venda no site do Padua Studio',
    `Projeto: ${projectName}`,
    amount ? `Valor: ${amount}` : null,
    payerEmail ? `Cliente: ${payerEmail}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  await fetch(`https://graph.facebook.com/${apiVersion}/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: notifyTo,
      type: 'text',
      text: { body: message },
    }),
  });
}

module.exports = async (req, res) => {
  try {
    const payload = await readJsonBody(req);
    const paymentId = getPaymentId(payload);
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    const payment = await fetchPayment(paymentId, accessToken);
    const status = payment?.status || payload?.data?.status || payload?.status;

    if (status === 'approved') {
      const projectSlug = payment?.external_reference || payment?.metadata?.demo || null;
      const projectName = resolveProjectName(projectSlug);
      const amount = payment?.transaction_amount || payload?.data?.transaction_amount;
      const payerEmail = payment?.payer?.email || payload?.data?.payer?.email;

      await sendWhatsappMessage({ projectName, amount, payerEmail });
      console.log('Pagamento aprovado registrado', { paymentId, projectSlug, amount });
    }
  } catch {
    // always return 200 for Mercado Pago
  }

  res.status(200).json({ received: true });
};
