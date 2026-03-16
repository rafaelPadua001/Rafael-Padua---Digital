(() => {
  const container = document.body;
  if (!container || !container.classList.contains('demo-page')) return;

  const demoSlug = container.dataset.demo;
  if (!demoSlug || !window.PaduaProjects) return;

  function createPricingList(lines) {
    if (!lines.length) return '';
    const items = lines
      .map((line) => `<li><strong>${line.label}:</strong> ${line.value}</li>`)
      .join('');
    return `<ul class="conversion-price-list">${items}</ul>`;
  }

  function createCheckoutButtons(project) {
    const demoUrl = window.PaduaProjects.resolveDemoUrl(project) || '#';

    return `
      <button data-plan="setup" class="cta-primary" data-track="checkout_click" data-checkout-type="setup">Contratar setup</button>
      <button data-plan="subscription" class="cta-secondary" data-track="checkout_click" data-checkout-type="subscription">Setup + assinatura</button>
      <a href="${demoUrl}" class="cta-outline demo-real-link" data-track="demo_click">Ver demo real</a>
      <a href="/#contato" class="cta-outline">Começar projeto</a>
    `;
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

    const setupPrice = window.PaduaProjects.formatPrice(490);
    const monthlyPrice = window.PaduaProjects.formatPrice(79);
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
              <p><strong>Setup:</strong> ${setupPrice || 'R$ 490'}</p>
              <p><strong>Mensalidade:</strong> ${monthlyPrice || 'R$ 79'} / mês</p>
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

    const planButtons = document.querySelectorAll('.demo-conversion [data-plan]');
    planButtons.forEach((button) => {
      button.addEventListener('click', () => {
        if (!window.PaduaCheckout) return;
        window.PaduaCheckout.createMercadoPagoPreference(button.dataset.plan, project);
      });
    });

    const legacyBuyButtons = document.querySelectorAll('.buy-button');
    legacyBuyButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!window.PaduaCheckout) return;
        window.PaduaCheckout.createMercadoPagoPreference('setup', project);
      });
    });
  });
})();
