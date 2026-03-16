(() => {
  const cache = {
    projects: null,
    loading: null,
  };

  function normalizeProjects(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.projects)) return data.projects;
    return [];
  }

  async function loadProjects() {
    if (cache.projects) return cache.projects;
    if (!cache.loading) {
      cache.loading = fetch('/data/projects.json', { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          cache.projects = normalizeProjects(data);
          return cache.projects;
        })
        .catch(() => {
          cache.projects = [];
          return cache.projects;
        });
    }
    return cache.loading;
  }

  function getSlugFromPath(pathname) {
    const parts = pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1] || '';
    return last.replace('.html', '');
  }

  function findBySlug(projects, slug) {
    const target = String(slug || '').toLowerCase();
    return projects.find((project) => String(project.slug).toLowerCase() === target) || null;
  }

  function resolvePrice(project, plan) {
    const pricing = project?.pricing || {};
    const setup = pricing.setup ?? pricing.setup_price ?? null;
    const monthly = pricing.monthly ?? pricing.monthly_price ?? null;
    if (plan === 'subscription') {
      if (setup && monthly) return setup + monthly;
      return monthly || setup || null;
    }
    return setup || null;
  }

  window.PaduaProjectsLoader = {
    loadProjects,
    getSlugFromPath,
    findBySlug,
    resolvePrice,
  };
})();
