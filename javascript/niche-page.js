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

  function renderPlanSelector(project) {
    const plans = Array.isArray(project?.plans) ? project.plans : [];
    if (!plans.length) return '';
    return `
      <div class="plan-header">
        <span class="plan-badge"></span>
        <h4 class="plan-title"></h4>
      </div>
      <div class="plans-container"></div>
      <div class="plan-selector-wrap">
        <select class="plan-selector">
          ${plans.map((plan) => `<option value="${plan.id}">${plan.name}</option>`).join('')}
        </select>
      </div>
    `;
  }

  function renderPlanButtons(project) {
    if (!project) return '';
    return `
      <div class="conversion-buttons">
        <button class="cta-primary" data-plan="setup">Contratar setup</button>
        <button class="cta-secondary" data-plan="subscription">Setup + assinatura</button>
        <a class="cta-outline" data-track="demo_click" data-project-demo href="#">Ver demo real</a>
      </div>
    `;
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
        setHtml('[data-project-image]', renderDemoImage(project));

        if (Array.isArray(project.plans) && project.plans.length) {
          setHtml('[data-project-pricing]', '');
          setHtml(
            '[data-project-plans]',
            `${renderPlanSelector(project)}
             <div class="pricing-info">
               <p class="pricing-setup"></p>
               <p class="pricing-monthly"></p>
             </div>
             ${renderPlanButtons(project)}`
          );
        } else {
          setHtml('[data-project-pricing]', renderPricing(project));
          setHtml('[data-project-plans]', renderPlanButtons(project));
        }

        const checkoutLinks = window.PaduaProjects.resolveCheckoutLinks(project);
        const checkoutPrimary = checkoutLinks.setup || checkoutLinks.subscription;
        setLink('[data-project-checkout]', checkoutPrimary);
      }

      if (niche.keywords) {
        setHtml('[data-niche-keywords]', renderKeywords(niche.keywords));
      }

      root.classList.add('ready');
      document.body.classList.add('plans-ready');

      const selector = document.querySelector('.plan-selector');
      const planTitle = document.querySelector('.plan-title');
      const planBadge = document.querySelector('.plan-badge');
      const pricingSetup = document.querySelector('.pricing-setup');
      const pricingMonthly = document.querySelector('.pricing-monthly');
      const plansContainer = document.querySelector('.plans-container');

      function updatePlan(planId) {
        const plans = Array.isArray(project?.plans) ? project.plans : [];
        const plan = plans.find((item) => item.id === planId) || plans[0] || null;
        if (!plan) return;

        if (planTitle) planTitle.textContent = plan.name || project.name || '';
        if (planBadge) {
          planBadge.textContent = plan.badge || '';
          planBadge.style.display = plan.badge ? 'inline-flex' : 'none';
        }

        if (pricingSetup) {
          pricingSetup.textContent = `Setup: R$ ${plan.setup}`;
        }

        if (pricingMonthly) {
          if (plan.monthly) {
            pricingMonthly.textContent = `Mensalidade: R$ ${plan.monthly} / mes`;
            pricingMonthly.style.display = '';
          } else {
            pricingMonthly.textContent = 'Mensalidade: Sem mensalidade';
            pricingMonthly.style.display = '';
          }
        }


        if (plansContainer) {
          plansContainer.querySelectorAll('.plan-card').forEach((card) => {
            card.classList.toggle('selected', card.dataset.planId === plan.id);
          });
        }
      }

      if (plansContainer && project?.plans?.length) {
        plansContainer.innerHTML = '';
        project.plans.forEach((plan, index) => {
          const card = document.createElement('div');
          card.className = `plan-card${plan.badge ? ' plan-featured' : ''}${index === 0 ? ' selected' : ''}`;
          card.dataset.planId = plan.id;
          card.innerHTML = `
            ${plan.badge ? `<span class="plan-badge">${plan.badge}</span>` : ''}
            <h3>${plan.name}</h3>
            <p class="plan-setup">Setup: R$ ${plan.setup}</p>
            <p class="plan-monthly">${plan.monthly ? `Mensalidade: R$ ${plan.monthly}` : 'Mensalidade: Sem mensalidade'}</p>
            <button class="plan-cta" type="button">Solicitar demonstracao</button>
          `;
          plansContainer.appendChild(card);
        });
      }

      if (selector && project?.plans?.length) {
        updatePlan(selector.value);
        selector.addEventListener('change', () => updatePlan(selector.value));
      }

      if (plansContainer) {
        plansContainer.querySelectorAll('.plan-card').forEach((card) => {
          card.addEventListener('click', () => {
            const planId = card.dataset.planId;
            if (selector) selector.value = planId;
            updatePlan(planId);
          });

          const cta = card.querySelector('.plan-cta');
          if (cta) {
            cta.addEventListener('click', (event) => {
              event.preventDefault();
              event.stopPropagation();
              const planId = card.dataset.planId;
              if (selector) selector.value = planId;
              updatePlan(planId);
            });
          }
        });
      }

      const planButtons = document.querySelectorAll('[data-project-plans] button');
      planButtons.forEach((button) => {
        button.addEventListener('click', () => {
          if (!window.PaduaCheckout) return;
          const activePlanId = selector?.value || null;
          window.PaduaCheckout.createMercadoPagoPreference(button.dataset.plan, project, activePlanId);
        });
      });
    })
    .catch(() => {});
})();
