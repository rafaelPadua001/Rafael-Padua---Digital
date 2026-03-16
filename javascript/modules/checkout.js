(() => {
  async function createMercadoPagoPreference(plan, project, planId) {
    if (!project?.slug) {
      alert('Projeto nao identificado.');
      return;
    }

    const response = await fetch('/api/create-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project: project.slug,
        plan,
        planId,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (data?.init_point) {
      window.location.href = data.init_point;
      return;
    }

    alert('Erro ao iniciar pagamento');
  }

  window.PaduaCheckout = {
    createMercadoPagoPreference,
    createPreference({ project, plan, planId }) {
      return createMercadoPagoPreference(plan, { slug: project }, planId);
    },
  };
})();
