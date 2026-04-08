(() => {
  const container = document.body;
  if (!container || !container.classList.contains('demo-page')) return;

  const demoSlug = container.dataset.demo;
  if (!demoSlug || !window.PaduaProjects) return;

  function createCheckoutButtons(project) {
    const demoUrl = window.PaduaProjects.resolveDemoUrl(project) || '#';

    return `
      <button data-plan="setup" class="cta-primary" data-track="checkout_click" data-checkout-type="setup">Contratar setup</button>
      <button data-plan="subscription" class="cta-secondary" data-track="checkout_click" data-checkout-type="subscription">Setup + assinatura</button>
      <a href="${demoUrl}" class="cta-outline demo-real-link" data-track="demo_click">Ver demo real</a>
      <a href="/#contato" class="cta-outline">Comecar projeto</a>
    `;
  }

  function getPlanPricing(project, plan) {
    const setup = plan?.setup ?? project?.pricing?.setup ?? null;
    const monthly = plan?.monthly ?? project?.pricing?.monthly ?? null;
    return { setup, monthly };
  }

  function createConversionSection(project) {
    const nicheMap = {
      pizzaria: 'pizzarias',
      restaurante: 'restaurantes',
      barbearia: 'barbearias',
      clinica: 'clinicas',
      petshop: 'petshops',
    };
    const nicheSlug = project.niche;
    const nicheLabel = nicheMap[nicheSlug];
    const nicheLink = nicheLabel ? `/site-para-${nicheSlug}.html` : null;
    const actions = createCheckoutButtons(project);

    return `
      <section class="demo-conversion">
        <div class="container">
          <div class="text-divider">
            <h2>Pronto para colocar no ar</h2>
          </div>
          <div class="demo-conversion-box">
            <h3>Comece seu projeto hoje</h3>
            <div class="pricing-info">
              <p class="pricing-setup"></p>
              <p class="pricing-monthly"></p>
            </div>
            <div class="plans-container"></div>
            <div class="plan-selector-wrap">
              <select class="plan-selector"></select>
            </div>
            <div class="conversion-buttons">
              ${actions}
            </div>
            ${nicheLink ? `<a class="btn-secondary" href="${nicheLink}">Ver solucao completa para ${nicheLabel}</a>` : ''}
          </div>
        </div>
      </section>
    `;
  }

  function renderPlans(project) {
    const selector = document.querySelector('.plan-selector');
    const container = document.querySelector('.plans-container');
    if (!selector || !container) return;

    const plans = Array.isArray(project.plans) ? project.plans : [];
    selector.innerHTML = '';
    container.innerHTML = '';

    if (!plans.length) {
      selector.style.display = '';
      return;
    }

    plans.forEach((plan, index) => {
      const option = document.createElement('option');
      option.value = plan.id;
      option.textContent = plan.name;
      selector.appendChild(option);

      const card = document.createElement('div');
      card.className = `plan-card${plan.badge ? ' plan-featured' : ''}`;
      card.dataset.planId = plan.id;
      card.innerHTML = `
        ${plan.badge ? `<span class="plan-badge">${plan.badge}</span>` : ''}
        <h3>${plan.name}</h3>
        <p class="plan-setup">${plan.setup ? `Setup: R$ ${plan.setup}` : 'Setup: Sem taxa de setup'}</p>
        <p class="plan-monthly">${plan.monthly ? `Mensalidade: R$ ${plan.monthly}` : 'Mensalidade: Sem mensalidade'}</p>
        <button class="plan-cta" type="button">Solicitar demonstracao</button>
      `;
      if (index === 0) card.classList.add('selected');
      container.appendChild(card);
    });

    document.body.classList.add('plans-ready');
  }

  function updatePlan(project, planId) {
    const setupEl = document.querySelector('.pricing-setup');
    const monthlyEl = document.querySelector('.pricing-monthly');

    const plans = Array.isArray(project.plans) ? project.plans : [];
    const plan = plans.find((p) => p.id === planId) || plans[0] || null;

    const { setup, monthly } = getPlanPricing(project, plan);


    if (setupEl) {
      if (setup) {
        setupEl.textContent = `Setup: R$ ${setup}`;
        setupEl.style.display = '';
      } else if (monthly) {
        setupEl.textContent = `Plano: R$ ${monthly} / mes`;
        setupEl.style.display = '';
      } else {
        setupEl.style.display = 'none';
      }
    }

    if (monthlyEl) {
      if (monthly) {
        monthlyEl.textContent = `Mensalidade: R$ ${monthly} / mes`;
        monthlyEl.style.display = '';
      } else {
        monthlyEl.textContent = 'Mensalidade: Sem mensalidade';
        monthlyEl.style.display = '';
      }
    }

    document.querySelectorAll('.plan-card').forEach((card) => {
      card.classList.toggle('selected', card.dataset.planId === plan?.id);
    });

    return plan?.id || null;
  }

  window.PaduaProjects.loadProjects().then((projects) => {
    const project = window.PaduaProjects.getProjectBySlug(projects, demoSlug);
    if (!project) return;

    const anchor =
      document.querySelector('.demo-cta') ||
      document.querySelector('.demo-steps') ||
      document.querySelector('.demo-benefits');
    if (!anchor) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = createConversionSection(project);
    anchor.parentNode.insertBefore(wrapper.firstElementChild, anchor);

    renderPlans(project);
    let activePlanId = updatePlan(project, document.querySelector('.plan-selector')?.value);

    const selector = document.querySelector('.plan-selector');
    if (selector) {
      selector.addEventListener('change', () => {
        activePlanId = updatePlan(project, selector.value);
      });
    }

    document.querySelectorAll('.plan-card').forEach((card) => {
      card.addEventListener('click', () => {
        const planId = card.dataset.planId;
        if (selector) selector.value = planId;
        activePlanId = updatePlan(project, planId);
      });

      const cta = card.querySelector('.plan-cta');
      if (cta) {
        cta.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          const planId = card.dataset.planId;
          if (selector) selector.value = planId;
          activePlanId = updatePlan(project, planId);
        });
      }
    });

    const planButtons = document.querySelectorAll('.demo-conversion [data-plan]');
    planButtons.forEach((button) => {
      button.addEventListener('click', () => {
        if (!window.PaduaCheckout) return;
        window.PaduaCheckout.createMercadoPagoPreference(button.dataset.plan, project, activePlanId);
      });
    });

    const legacyBuyButtons = document.querySelectorAll('.buy-button');
    legacyBuyButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
        if (!window.PaduaCheckout) return;
        const buttonPlan = button.dataset.plan || 'setup';
        const buttonPlanId = button.dataset.planId || activePlanId;
        window.PaduaCheckout.createMercadoPagoPreference(buttonPlan, project, buttonPlanId);
      });
    });
  });
})();
