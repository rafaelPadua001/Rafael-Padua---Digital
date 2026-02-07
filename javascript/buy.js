document.addEventListener('click', async (event) => {
  const button = event.target.closest('.buy-button');
  if (!button) return;

  event.preventDefault();

  const demo = button.dataset.demo;
  const title = button.dataset.title;

  if (!demo) {
    alert('Erro: demo não identificada.');
    return;
  }

  try {
    const response = await fetch('/api/create-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        demo,
        title,
      }),
    });

    const data = await response.json();

    if (data.init_point) {
      window.location.href = data.init_point;
    } else {
      alert('Erro ao iniciar pagamento');
    }
  } catch (err) {
    console.error(err);
    alert('Erro de conexão');
  }
});
