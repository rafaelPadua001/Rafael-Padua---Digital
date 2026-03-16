(() => {
  async function createMercadoPagoPreference(plan, project) {
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
  };
})();
