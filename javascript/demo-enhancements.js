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
        `<a class="btn-primary" data-track="checkout_click" data-checkout-type="setup" href="${links.setup}">Contratar agora</a>`
      );
    }
    if (links.subscription && links.setup) {
      actions.push(
        `<a class="btn-secondary" data-track="checkout_click" data-checkout-type="subscription" href="${links.subscription}">Ativar mensalidade</a>`
      );
    }
    if (links.subscription && !links.setup) {
      actions.push(
        `<a class="btn-primary" data-track="checkout_click" data-checkout-type="subscription" href="${links.subscription}">Ativar plano</a>`
      );
    }
    actions.push(
      `<a class="btn-secondary" data-track="demo_click" href="${project.demo_url || '#'}">Testar demo</a>`
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
  });
})();
