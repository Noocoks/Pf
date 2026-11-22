(() => {
  const root = document.getElementById('cv-document');
  const updated = document.getElementById('cv-updated');
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  const node = (tag, className, value) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (value !== undefined && value !== null) el.textContent = String(value);
    return el;
  };
  const link = (href, label, className = '') => {
    const a = node('a', className, label);
    a.href = href;
    if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    return a;
  };
  const section = (title) => {
    const el = node('section', 'cv-section');
    el.append(node('h2', '', title));
    root.append(el);
    return el;
  };
  const entry = (parent, title, meta, period) => {
    const el = node('article', 'cv-entry');
    const head = node('div', 'cv-entry-head');
    head.append(node('h3', '', title));
    if (period) head.append(node('span', 'cv-period', period));
    el.append(head);
    if (meta) el.append(node('div', 'cv-meta', meta));
    parent.append(el);
    return el;
  };

  fetch('data/cv.json', { cache: 'no-store' })
    .then((response) => { if (!response.ok) throw new Error('No se pudo cargar el CV'); return response.json(); })
    .then((data) => {
      root.replaceChildren();
      const identity = data.identity || {};
      const header = node('header', 'cv-header');
      header.append(node('h1', 'cv-name', identity.name || 'Noocoks'));
      header.append(node('p', 'cv-role', identity.role || ''));
      const contact = node('div', 'cv-contact');
      [identity.location, identity.email].filter(Boolean).forEach((value) => contact.append(node('span', '', value)));
      if (identity.github) contact.append(link(identity.github, 'GitHub'));
      if (identity.portfolio) contact.append(link(identity.portfolio, 'Portfolio'));
      header.append(contact);
      root.append(header);

      const profile = section('Perfil profesional');
      profile.append(node('p', 'cv-summary', data.summary || ''));

      if ((data.education || []).length) {
        const area = section('Formación');
        data.education.forEach((item) => {
          const el = entry(area, item.title, item.institution, item.period);
          if (item.details) el.append(node('p', '', item.details));
        });
      }
      if ((data.experience || []).length) {
        const area = section('Experiencia');
        data.experience.forEach((item) => {
          const el = entry(area, item.role, item.organization, item.period);
          (item.details || []).forEach((detail) => el.append(node('p', '', '• ' + detail)));
        });
      }
      if ((data.projects || []).length) {
        const area = section('Proyectos seleccionados');
        data.projects.forEach((item) => {
          const el = entry(area, item.name);
          el.append(node('p', '', item.description || ''));
          if ((item.technologies || []).length) el.append(node('div', 'cv-tags', 'TECNOLOGÍAS  /  ' + item.technologies.join(' · ')));
          if (item.url) el.append(link(item.url, 'Repositorio ↗', 'cv-project-link'));
        });
      }
      if ((data.skills || []).length) {
        const area = section('Competencias técnicas');
        const grid = node('div', 'cv-skills');
        data.skills.forEach((group) => {
          const item = node('div', 'cv-skill');
          item.append(node('strong', '', group.area));
          item.append(node('span', '', (group.items || []).join(' · ')));
          grid.append(item);
        });
        area.append(grid);
      }
      if ((data.languages || []).length) {
        const area = section('Idiomas');
        const list = node('div', 'cv-languages');
        data.languages.forEach((item) => list.append(node('span', '', typeof item === 'string' ? item : [item.name, item.level].filter(Boolean).join(' — '))));
        area.append(list);
      }
      const date = data.updated_at ? new Date(data.updated_at) : new Date();
      updated.textContent = 'Información actualizada: ' + new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
    })
    .catch(() => {
      root.replaceChildren(node('p', 'cv-loading', 'No se ha podido cargar la información del currículum. Puedes descargar la última versión PDF.'));
      updated.textContent = 'Información temporalmente no disponible';
    });
})();