(() => {
  const root = document.documentElement;
  const page = document.body;
  if (!page || !page.classList.contains('niche-page')) return;

  const slug = page.dataset.niche;
  if (!slug) return;

  async function loadJson(path) {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  }

  function setText(selector, value) {
    const el = document.querySelector(selector);
    if (el) el.textContent = value;
  }

  function setHtml(selector, value) {
    const el = document.querySelector(selector);
    if (el) el.innerHTML = value;
  }

  function setLink(selector, href) {
    const el = document.querySelector(selector);
    if (el && href) el.setAttribute('href', href);
  }

  function updateMeta(name, content) {
    if (!content) return;
    const meta = document.querySelector(`meta[name="${name}"]`);
    if (meta) meta.setAttribute('content', content);
  }

  function updateTitle(value) {
    if (value) document.title = value;
  }

  function updateCanonical(value) {
    if (!value) return;
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', value);
  }

  function renderKeywords(list) {
    if (!Array.isArray(list)) return '';
    return list
      .map((keyword) => `<span>${keyword}</span>`)
      .join('');
  }

  function renderPricing(project) {
    if (!project || !window.PaduaProjects) return '';
    const lines = window.PaduaProjects.buildPricingLines(project);
    if (!lines.length) return '';
    return `
      <ul class="conversion-price-list">
        ${lines
          .map((line) => `<li><strong>${line.label}:</strong> ${line.value}</li>`)
          .join('')}
      </ul>
    `;
  }

  function renderDemoImage(project) {
    const image = window.PaduaProjects.resolveImage(project);
    if (!image) return '';
    return `
      <div class="demo-preview-container">
        <div class="demo-preview">
          <img src="${image}" alt="Preview da demo" loading="lazy" decoding="async" />
        </div>
      </div>
    `;
  }

  function renderPlanButtons(project) {
    if (!project) return '';
    const setupPrice = project?.pricing?.setup ?? project?.pricing?.setup_price;
    const monthlyPrice = project?.pricing?.monthly ?? project?.pricing?.monthly_price;
    const buttons = [];

    if (setupPrice) {
      buttons.push('<button class="btn-primary" data-plan="setup">Contratar setup</button>');
    }
    if (monthlyPrice) {
      buttons.push('<button class="btn-secondary" data-plan="subscription">Setup + assinatura</button>');
    }

    return buttons.join('');
  }

  Promise.all([loadJson('/data/niches.json'), window.PaduaProjects.loadProjects()])
    .then(([niches, projects]) => {
      if (!Array.isArray(niches)) return;
      const niche = niches.find((item) => item.slug === slug);
      if (!niche) return;

      const project = window.PaduaProjects.getProjectBySlug(projects, niche.demo_project);
      const heroTitle = `Site para ${niche.name}`;
      const description = `Solucao digital para ${niche.name.toLowerCase()} com foco em conversao e pedidos diretos.`;

      updateTitle(`${heroTitle} | Padua Studio Digital`);
      updateMeta('description', description);
      updateCanonical(`https://paduastudiodigital.vercel.app/site-para-${slug}.html`);

      setText('[data-niche-title]', heroTitle);
      setText('[data-niche-problem]', niche.problem);
      setText('[data-niche-solution]', niche.solution);
      setText('[data-niche-name]', niche.name);

      if (project) {
        setText('[data-project-name]', project.name);
        setLink('[data-project-demo]', window.PaduaProjects.resolveDemoUrl(project));
        setHtml('[data-project-pricing]', renderPricing(project));
        setHtml('[data-project-image]', renderDemoImage(project));
        setHtml('[data-project-plans]', renderPlanButtons(project));

        const checkoutLinks = window.PaduaProjects.resolveCheckoutLinks(project);
        const checkoutPrimary = checkoutLinks.setup || checkoutLinks.subscription;
        setLink('[data-project-checkout]', checkoutPrimary);
      }

      if (niche.keywords) {
        setHtml('[data-niche-keywords]', renderKeywords(niche.keywords));
      }

      root.classList.add('ready');

      const planButtons = document.querySelectorAll('[data-project-plans] button');
      planButtons.forEach((button) => {
        button.addEventListener('click', () => {
          if (!window.PaduaCheckout) return;
          window.PaduaCheckout.createMercadoPagoPreference(button.dataset.plan, project);
        });
      });
    })
    .catch(() => {});
})();
