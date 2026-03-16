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

  function createCheckoutButtons(project, links) {
    const actions = [];
    if (links.setup) {
      actions.push(
        `<button class="btn-primary" data-plan="setup" data-track="checkout_click" data-checkout-type="setup">Contratar setup</button>`
      );
    }
    if (links.subscription && links.setup) {
      actions.push(
        `<button class="btn-secondary" data-plan="subscription" data-track="checkout_click" data-checkout-type="subscription">Setup + assinatura</button>`
      );
    }
    if (links.subscription && !links.setup) {
      actions.push(
        `<button class="btn-primary" data-plan="subscription" data-track="checkout_click" data-checkout-type="subscription">Ativar plano</button>`
      );
    }
    actions.push(
      `<a class="btn-secondary" data-track="demo_click" href="${window.PaduaProjects.resolveDemoUrl(project) || '#'}">Testar demo</a>`
    );
    return actions.join('');
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

    const pricingLines = window.PaduaProjects.buildPricingLines(project);
    const pricingLabel = window.PaduaProjects.resolvePricingLabel(project);
    const checkoutLinks = window.PaduaProjects.resolveCheckoutLinks(project);
    const actions = createCheckoutButtons(project, checkoutLinks);

    return `
      <section class="demo-conversion">
        <div class="container">
          <div class="text-divider">
            <h2>Pronto para colocar no ar</h2>
          </div>
          <p class="section-lead">Escolha o plano ideal e comece a captar clientes com um projeto pronto para conversao.</p>
          <div class="conversion-grid">
            <article class="conversion-card">
              <h3>${project.name || 'Projeto pronto para vender'}</h3>
              <p class="conversion-badge">${pricingLabel}</p>
              ${createPricingList(pricingLines)}
              <div class="hero-actions conversion-actions">
                ${actions}
              </div>
              ${nicheLink ? `<a class="btn-secondary" href="${nicheLink}">Ver solucao completa para ${nicheLabel}</a>` : ''}
            </article>
            <article class="conversion-card">
              <h3>Como funciona</h3>
              <ol class="conversion-steps">
                <li><span>1</span> Contrate o projeto ideal</li>
                <li><span>2</span> Envie os dados do seu negocio</li>
                <li><span>3</span> Configuramos e colocamos no ar</li>
                <li><span>4</span> Suporte e hospedagem inclusos</li>
              </ol>
            </article>
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
