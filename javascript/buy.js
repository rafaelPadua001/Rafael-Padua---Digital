document.addEventListener('click', async (event) => {
  const button = event.target.closest('.buy-button');
  if (!button) return;

  event.preventDefault();

  const demo = button.dataset.demo;
  const project = button.dataset.project || demo;
  const plan = button.dataset.plan;
  const planId = button.dataset.planId;
  const title = button.dataset.title;

  if (!project) {
    alert('Erro: projeto nao identificado.');
    return;
  }

  if (window.PaduaCheckout && (plan || planId)) {
    try {
      await window.PaduaCheckout.createPreference({
        project,
        plan: plan || 'setup',
        planId: planId || undefined,
      });
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Erro ao iniciar pagamento');
    }
    return;
  }

  try {
    const response = await fetch('/api/create-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        demo: project,
        title,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok && data.init_point) {
      window.location.href = data.init_point;
      return;
    }

    console.error('Legacy checkout error:', data);
    alert('Erro ao iniciar pagamento');
  } catch (err) {
    console.error('Legacy checkout request failed:', err);
    alert('Erro de conexao');
  }
});
