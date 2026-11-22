/* Progressive reveal effects for project case studies. */
(() => {
  const page = document.querySelector('.project-detail-page');
  if (!page) return;

  const targets = page.querySelectorAll(
    '.detail-section, .detail-feature-grid article, .architecture-list > div, .pipeline > div, .aside-block, .detail-status-note, .detail-next'
  );

  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  targets.forEach((element) => element.classList.add('js-reveal'));

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      currentObserver.unobserve(entry.target);
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -42px 0px'
  });

  targets.forEach((element) => observer.observe(element));
})();
