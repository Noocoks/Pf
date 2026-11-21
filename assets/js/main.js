(() => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');
  const year = document.querySelector('#year');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (year) year.textContent = String(new Date().getFullYear());

  if (toggle && nav) {
    const closeMenu = () => {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menú');
      nav.classList.remove('open');
    };

    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'Abrir menú' : 'Cerrar menú');
      nav.classList.toggle('open', !isOpen);
    });

    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeMenu();
        toggle.focus();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 680) closeMenu();
    });
  }

  // Smooth anchor travel with a restrained easing curve.
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      if (history.replaceState) history.replaceState(null, '', targetId);
    });
  });

  // Progressive reveal: content stays visible if IntersectionObserver is unavailable.
  const revealTargets = document.querySelectorAll(
    '.section-heading, .about-main, .about-facts, .project-card, .stack-card, .tech-logos, .lab-copy, .contact-panel, .intro-strip'
  );

  if (!reduceMotion && 'IntersectionObserver' in window && revealTargets.length) {
    document.documentElement.classList.add('motion-ready');
    revealTargets.forEach((element, index) => {
      element.classList.add('reveal');
      if (element.classList.contains('about-facts') || element.classList.contains('lab-copy')) {
        element.classList.add('reveal-right');
      }
      if (element.classList.contains('about-main')) element.classList.add('reveal-left');
      if (element.classList.contains('stack-card') || element.classList.contains('project-card')) {
        element.style.setProperty('--reveal-delay', (index % 4) * 75 + 'ms');
      }
    });

    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        currentObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -45px 0px' });

    revealTargets.forEach((element) => observer.observe(element));
  }
})();