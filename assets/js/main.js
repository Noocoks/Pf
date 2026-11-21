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

  // Full-screen animated atmosphere. Adjacent color fields crossfade continuously
  // according to the viewport's position between section centers (wheel or scrollbar).
  {
    const scenes = [
      ['inicio', 'hero'], ['sobre-mi', 'profile'], ['proyectos', 'projects'],
      ['especialidades', 'stack'], ['laboratorio', 'lab'], ['contacto', 'contact']
    ].map(([id, name]) => ({ element: document.getElementById(id), name }))
      .filter((scene) => scene.element);

    const atmosphere = document.createElement('div');
    atmosphere.className = 'scroll-atmosphere';
    atmosphere.setAttribute('aria-hidden', 'true');
    const layers = scenes.map(({ name }) => {
      const layer = document.createElement('span');
      layer.className = 'atmosphere-layer scene-' + name;
      atmosphere.appendChild(layer);
      return layer;
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

    let anchors = [];
    let ticking = false;
    const measure = () => {
      anchors = scenes.map(({ element }) => element.getBoundingClientRect().top + window.scrollY + element.offsetHeight * 0.5);
      render();
    };
    const render = () => {
      const focus = window.scrollY + window.innerHeight * 0.48;
      if (layers.length === 1) {
        layers[0].style.opacity = '1';
      } else if (layers.length > 1) {
        let next = anchors.findIndex((point) => point >= focus);
        if (next < 0) next = anchors.length - 1;
        const previous = Math.max(0, next - 1);
        const distance = Math.max(1, anchors[next] - anchors[previous]);
        const blend = next === previous ? 0 : Math.min(1, Math.max(0, (focus - anchors[previous]) / distance));
        layers.forEach((layer, index) => {
          let opacity = 0;
          if (index === previous) opacity = 1 - blend;
          if (index === next) opacity = blend;
          if (focus <= anchors[0]) opacity = index === 0 ? 1 : 0;
          if (focus >= anchors[anchors.length - 1]) opacity = index === anchors.length - 1 ? 1 : 0;
          layer.style.opacity = String(opacity);
        });
      }
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const amount = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      progressBar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, amount)) + ')';
      ticking = false;
    };
    const requestRender = () => {
      if (!ticking) {
        window.requestAnimationFrame(render);
        ticking = true;
      }
    };
    if (reduceMotion) {
      layers.forEach((layer, index) => { layer.style.opacity = index === 0 ? '1' : '0'; });
    } else {
      window.addEventListener('scroll', requestRender, { passive: true });
    }
    window.addEventListener('resize', measure, { passive: true });
    measure();
    if ('ResizeObserver' in window) {
      const pageObserver = new ResizeObserver(measure);
      scenes.forEach(({ element }) => pageObserver.observe(element));
    }
  }

  // Gentle pointer parallax for the hero instrument panel (desktop only).
  const heroVisual = document.querySelector('.hero-visual');
  if (heroVisual && !reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let pointerFrame = 0;
    heroVisual.addEventListener('pointermove', (event) => {
      if (pointerFrame) cancelAnimationFrame(pointerFrame);
      pointerFrame = requestAnimationFrame(() => {
        const bounds = heroVisual.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
        const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
        heroVisual.style.setProperty('--pointer-x', String(x));
        heroVisual.style.setProperty('--pointer-y', String(y));
        pointerFrame = 0;
      });
    });
    heroVisual.addEventListener('pointerleave', () => {
      heroVisual.style.setProperty('--pointer-x', '0');
      heroVisual.style.setProperty('--pointer-y', '0');
    });
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