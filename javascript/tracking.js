(() => {
  const GA_ID = 'G-H1E187F4M6';
  let gtagLoaded = false;

  function loadGtag() {
    if (gtagLoaded || !GA_ID) return;
    gtagLoaded = true;

    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    script.async = true;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = window.gtag || gtag;
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
  }

  function track(eventName, params) {
    loadGtag();
    if (!window.gtag) return;
    window.gtag('event', eventName, params || {});
  }

  const trackedScroll = new Set();
  function trackScrollDepth() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    const percent = Math.round((scrollTop / docHeight) * 100);
    [25, 50, 75, 90].forEach((depth) => {
      if (percent >= depth && !trackedScroll.has(depth)) {
        trackedScroll.add(depth);
        track('scroll_depth', { depth });
      }
    });
  }

  function handleClick(event) {
    const target = event.target.closest('a, button');
    if (!target) return;

    const href = target.getAttribute('href') || '';
    const isWhatsapp = href.includes('wa.me') || target.dataset.track === 'whatsapp_click';
    if (isWhatsapp) {
      track('click_whatsapp', { label: href });
      return;
    }

    const trackType = target.dataset.track;
    if (trackType === 'demo_click') {
      track('click_demo', { label: href });
    }

    if (trackType === 'checkout_click') {
      track('payment_initiated', { type: target.dataset.checkoutType || 'unknown' });
    }

    if (target.classList.contains('buy-button')) {
      track('payment_initiated', { type: 'preference' });
    }
  }

  function trackDemoView() {
    if (!document.body.classList.contains('demo-page')) return;
    track('demo_view', { slug: document.body.dataset.demo || 'unknown' });
  }

  function trackCheckoutSuccess() {
    if (!document.body.dataset.checkoutSuccess) return;
    track('payment_approved', { source: 'checkout_success' });
  }

  document.addEventListener('click', handleClick);
  window.addEventListener('scroll', trackScrollDepth, { passive: true });
  window.addEventListener('load', () => {
    trackDemoView();
    trackCheckoutSuccess();
  });
})();
