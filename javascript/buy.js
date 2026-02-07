document.addEventListener('click', async (event) => {
  const button = event.target.closest('.buy-button');
  if (!button) return;

  event.preventDefault();

  try {
    const response = await fetch('/api/create-preference', {
      method: 'POST'
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
