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
      if (event.key === 'Escape') { closeMenu(); toggle.focus(); }
    });
    window.addEventListener('resize', () => { if (window.innerWidth > 680) closeMenu(); });
  }

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

  // Ambient background layers fade between the page's visual chapters.
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const atmosphere = document.createElement('div');
    atmosphere.className = 'scroll-atmosphere';
    atmosphere.setAttribute('aria-hidden', 'true');
    const scenes = ['hero', 'profile', 'projects', 'stack', 'lab', 'contact'];
    scenes.forEach((scene) => {
      const layer = document.createElement('span');
      layer.className = 'atmosphere-layer scene-' + scene + (scene === 'hero' ? ' is-active' : '');
      atmosphere.appendChild(layer);
    });
    const grain = document.createElement('span');
    grain.className = 'atmosphere-grain';
    atmosphere.appendChild(grain);
    document.body.prepend(atmosphere);

    const progress = document.createElement('div');
    progress.className = 'scroll-progress';
    progress.setAttribute('aria-hidden', 'true');
    progress.innerHTML = '<span></span>';
    document.body.appendChild(progress);
    const progressBar = progress.firstElementChild;
    let ticking = false;
    const updateProgress = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const amount = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      progressBar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, amount)) + ')';
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { window.requestAnimationFrame(updateProgress); ticking = true; }
    }, { passive: true });
    updateProgress();

    const sceneTargets = [
      ['inicio', 'hero'], ['sobre-mi', 'profile'], ['proyectos', 'projects'],
      ['especialidades', 'stack'], ['laboratorio', 'lab'], ['contacto', 'contact']
    ].map(([id, scene]) => ({ element: document.getElementById(id), scene })).filter((item) => item.element);

    const sceneObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const match = sceneTargets.find((item) => item.element === visible.target);
      if (!match) return;
      atmosphere.querySelectorAll('.atmosphere-layer').forEach((layer) => {
        layer.classList.toggle('is-active', layer.classList.contains('scene-' + match.scene));
      });
    }, { threshold: [0.12, 0.25, 0.4, 0.6], rootMargin: '-18% 0px -28% 0px' });
    sceneTargets.forEach(({ element }) => sceneObserver.observe(element));
  }

  // Progressive reveal; content remains visible if observation is unavailable.
  const revealTargets = document.querySelectorAll(
    '.section-heading, .about-main, .about-facts, .project-card, .stack-card, .tech-logos, .lab-copy, .contact-panel, .intro-strip'
  );
  if (!reduceMotion && 'IntersectionObserver' in window && revealTargets.length) {
    document.documentElement.classList.add('motion-ready');
    revealTargets.forEach((element, index) => {
      element.classList.add('reveal');
      if (element.classList.contains('about-facts') || element.classList.contains('lab-copy')) element.classList.add('reveal-right');
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