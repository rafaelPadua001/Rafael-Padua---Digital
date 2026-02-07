const nodemailer = require('nodemailer');

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

function getStatusFromPayload(payload) {
  return payload?.data?.status || payload?.status || null;
}

async function fetchPaymentStatus(paymentId, accessToken) {
  if (!paymentId || !accessToken) return null;

  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) return null;
  const data = await response.json();
  return data?.status || null;
}

async function sendApprovedEmail({ paymentId, payload }) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass) return;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const amount =
    payload?.data?.transaction_amount ||
    payload?.transaction_amount ||
    payload?.data?.total_amount ||
    payload?.total_amount ||
    null;

  const lines = [
    'Pagamento aprovado recebido pelo webhook do Mercado Pago.',
    paymentId ? `ID do pagamento: ${paymentId}` : null,
    amount ? `Valor: ${amount}` : null,
  ].filter(Boolean);

  await transporter.sendMail({
    from,
    to: 'rafael.f.p.farjadk@gmail.com',
    subject: 'Pagamento aprovado - Mercado Pago',
    text: lines.join('\n'),
  });
}

module.exports = async (req, res) => {
  try {
    const payload = await readJsonBody(req);
    const paymentId = getPaymentId(payload);
    const statusFromPayload = getStatusFromPayload(payload);
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    const status =
      statusFromPayload ||
      (await fetchPaymentStatus(paymentId, accessToken));

    if (status === 'approved') {
      await sendApprovedEmail({ paymentId, payload });
    }
  } catch {
    // Always return 200 for Mercado Pago webhooks.
  }

  res.status(200).json({ received: true });
};
