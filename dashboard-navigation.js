(() => {
  const sections = new Set(['#gmail-integration', '#sheets-integration']);
  function scrollToSection(hash, smooth = true) {
    if (!sections.has(hash)) return;
    const section = document.querySelector(hash);
    if (!section) return;
    section.focus({ preventScroll: true });
    section.scrollIntoView({ block: 'end', behavior: smooth && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'instant' });
  }
  for (const link of document.querySelectorAll('aside a.integration')) {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !sections.has(link.hash)) return;
      event.preventDefault();
      if (location.hash !== link.hash) history.pushState(null, '', link.hash);
      scrollToSection(link.hash);
    });
  }
  window.addEventListener('popstate', () => scrollToSection(location.hash));
  window.addEventListener('hashchange', () => scrollToSection(location.hash));
  // Wait for integration content when arriving from the Settings page.
  if (sections.has(location.hash)) {
    Promise.allSettled([globalThis.EmailUI?.render(), globalThis.SheetsUI?.render()])
      .then(() => requestAnimationFrame(() => scrollToSection(location.hash, false)));
  }
})();
