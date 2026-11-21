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
        heroVisual.style.setProperty('--pointer-rotate-y', (-x * 3).toFixed(2) + 'deg');
        heroVisual.style.setProperty('--pointer-rotate-x', (y * 3).toFixed(2) + 'deg');
        pointerFrame = 0;
      });
    });
    heroVisual.addEventListener('pointerleave', () => {
      heroVisual.style.setProperty('--pointer-rotate-y', '0deg');
      heroVisual.style.setProperty('--pointer-rotate-x', '0deg');
    });
  }

  // Scroll choreography: every scene is scrubbed by the real scroll position.
  // Unlike one-shot reveal observers, this runs in both directions and also when
  // the user drags the scrollbar thumb.
  if (!reduceMotion) {
    const sceneDefinitions = [
      { selector: '.hero', content: '.hero-copy, .hero-visual, .hero-index' },
      { selector: '.intro-strip', content: '.strip-inner' },
      { selector: '#sobre-mi', content: '.section-heading, .about-grid' },
      { selector: '#proyectos', content: '.section-heading, .project-list, .projects-footnote, .support-repos' },
      { selector: '#especialidades', content: '.section-heading, .stack-grid, .tech-logos' },
      { selector: '#laboratorio', content: '.lab-grid' },
      { selector: '#contacto', content: '.contact-panel' }
    ];
    const scenes = sceneDefinitions.map(({ selector, content }) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      element.classList.add('scroll-scene');
      const targets = Array.from(element.querySelectorAll(content));
      targets.forEach((target, index) => {
        target.classList.add('scroll-scene-content');
        target.style.setProperty('--scene-order', String(index));
      });
      return { element, targets };
    }).filter(Boolean);

    let sceneFrame = 0;
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const smoothstep = (value) => {
      const t = clamp(value, 0, 1);
      return t * t * (3 - 2 * t);
    };
    const paintScenes = () => {
      const viewport = window.innerHeight;
      scenes.forEach(({ element, targets }) => {
        const rect = element.getBoundingClientRect();
        const travel = Math.max(1, rect.height + viewport * 0.72);
        const progress = clamp((viewport * 0.86 - rect.top) / travel, 0, 1);
        const enter = smoothstep(progress / 0.2);
        const leave = smoothstep((1 - progress) / 0.2);
        const visibility = Math.min(enter, leave);
        const shift = (1 - visibility) * 54;
        const scale = 0.975 + visibility * 0.025;
        targets.forEach((target) => {
          target.style.setProperty('--scene-opacity', visibility.toFixed(3));
          target.style.setProperty('--scene-shift', shift.toFixed(1) + 'px');
          target.style.setProperty('--scene-scale', scale.toFixed(4));
        });
        element.style.setProperty('--scene-progress', progress.toFixed(4));
      });
      sceneFrame = 0;
    };
    const scheduleScenes = () => {
      if (!sceneFrame) sceneFrame = requestAnimationFrame(paintScenes);
    };
    window.addEventListener('scroll', scheduleScenes, { passive: true });
    window.addEventListener('resize', scheduleScenes, { passive: true });
    if ('ResizeObserver' in window) {
      const sceneObserver = new ResizeObserver(scheduleScenes);
      scenes.forEach(({ element }) => sceneObserver.observe(element));
    }
    paintScenes();
  }
})();