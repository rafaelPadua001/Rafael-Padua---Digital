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

const fs = require('fs');
const path = require('path');

let cachedProjects = null;

function loadProjectsData() {
  if (cachedProjects) return cachedProjects;
  try {
    const filePath = path.join(process.cwd(), 'data', 'projects.json');
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    cachedProjects = Array.isArray(parsed) ? parsed : parsed.projects || [];
  } catch {
    cachedProjects = [];
  }
  return cachedProjects;
}

function resolveProjectByDemo(demo) {
  const projects = loadProjectsData();
  if (!Array.isArray(projects)) return null;
  const target = String(demo || '').toLowerCase();
  return projects.find((project) => String(project.slug).toLowerCase() === target) || null;
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
  const plan = String(payload.plan || 'setup').toLowerCase();
  const projectSlug = payload.project || payload.demo;
  const project = resolveProjectByDemo(projectSlug);
  const planId = payload.planId ? String(payload.planId) : null;
  const selectedPlan = planId
    ? project?.plans?.find((p) => String(p.id) === planId)
    : null;

  const setup = selectedPlan?.setup ?? project?.pricing?.setup ?? project?.pricing?.setup_price ?? null;
  const monthly = selectedPlan?.monthly ?? project?.pricing?.monthly ?? project?.pricing?.monthly_price ?? null;
  let unitPrice = null;

  if (plan === 'subscription') {
    if (setup && monthly) unitPrice = setup + monthly;
    else unitPrice = monthly || setup;
  } else {
    unitPrice = setup || monthly;
  }

  if (!project || !unitPrice || isNaN(unitPrice) || unitPrice <= 0) {
    res.status(400).json({
      error: 'Invalid demo or price',
      received_demo: payload.demo,
      received_project: payload.project,
      received_plan: payload.plan,
    });
    return;
  }

  const items = [
    {
      title: payload.title || selectedPlan?.name || project.name || 'Landing Page Profissional',
      quantity: 1,
      unit_price: Number(Number(unitPrice).toFixed(2)),
      currency_id: 'BRL',
    },
  ];


  const baseUrl = getBaseUrl(req);
  const notificationUrl = baseUrl
    ? `${baseUrl}/api/payments-webhook`
    : undefined;

  const preference = {
    items,
    notification_url: notificationUrl,
    back_urls: baseUrl
      ? {
          success: `${baseUrl}/checkout-success.html`,
          failure: `${baseUrl}/checkout-success.html`,
          pending: `${baseUrl}/checkout-success.html`,
        }
      : undefined,
    auto_return: 'approved',
    external_reference: project.slug,
    metadata: {
      demo: project.slug,
      project_name: project.name || '',
      plan,
      plan_id: planId || '',
    },
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
