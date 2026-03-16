(() => {
  const state = {
    projects: null,
    loading: null,
  };

  const priceFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });

  function formatPrice(value) {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    if (Number.isNaN(number)) return null;
    return priceFormatter.format(number);
  }

  function normalizeProjects(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.projects)) return data.projects;
    return [];
  }

  async function loadProjects() {
    if (state.projects) return state.projects;
    if (!state.loading) {
      state.loading = fetch('/data/projects.json', { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          state.projects = normalizeProjects(data);
          return state.projects;
        })
        .catch(() => {
          state.projects = [];
          return state.projects;
        });
    }
    return state.loading;
  }

  function getProjectBySlug(projects, slug) {
    if (!slug) return null;
    const target = String(slug).toLowerCase();
    return projects.find((project) => String(project.slug).toLowerCase() === target) || null;
  }

  function resolvePricingLabel(project) {
    if (!project) return '';
    const billing = project.billing_type;
    if (billing === 'setup_subscription') return 'Setup + mensalidade';
    if (billing === 'subscription') return 'Assinatura mensal';
    return 'Setup unico';
  }

  function buildPricingLines(project) {
    if (!project || !project.pricing) return [];
    const setup = formatPrice(project.pricing.setup ?? project.pricing.setup_price);
    const monthly = formatPrice(project.pricing.monthly ?? project.pricing.monthly_price);
    const lines = [];
    if (setup) lines.push({ label: 'Setup', value: setup });
    if (monthly) lines.push({ label: 'Mensalidade', value: `${monthly} / mes` });
    if (!setup && monthly) {
      lines.push({ label: 'Plano', value: 'Assinatura mensal' });
    }
    if (setup && !monthly) {
      lines.push({ label: 'Plano', value: 'Pagamento unico' });
    }
    return lines;
  }

  function resolveCheckoutLinks(project) {
    if (!project || !project.checkout) return {};
    return {
      setup: project.checkout.setup_link || null,
      subscription: project.checkout.subscription_link || null,
    };
  }

  function resolveImage(project) {
    return project?.image || project?.preview || null;
  }

  function resolveDemoUrl(project) {
    return project?.demo || project?.demo_url || null;
  }

  function resolveNichePage(project) {
    return project?.niche_page || null;
  }

  window.PaduaProjects = {
    loadProjects,
    getProjectBySlug,
    formatPrice,
    resolvePricingLabel,
    buildPricingLines,
    resolveCheckoutLinks,
    resolveImage,
    resolveDemoUrl,
    resolveNichePage,
  };
})();
