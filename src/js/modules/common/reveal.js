// Enhance only after observation is available; content stays visible otherwise.
export function mountReveal(root, view = window, { selector = '.project', pendingClass = 'project-pending' } = {}) {
  const projects = [...root.querySelectorAll(selector)];
  const preference = view.matchMedia('(prefers-reduced-motion: reduce)');
  if (preference.matches || !view.IntersectionObserver) return () => {};

  const show = node => node.classList.remove(pendingClass);
  const observer = new view.IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        show(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  const stop = () => {
    observer.disconnect();
    projects.forEach(show);
    preference.removeEventListener('change', onPreference);
    root.removeEventListener('focusin', onFocus);
  };
  const onPreference = event => { if (event.matches) stop(); };
  const onFocus = event => {
    const project = event.target.closest(selector);
    if (project) { show(project); observer.unobserve(project); }
  };
  projects.forEach(project => {
    project.classList.add(pendingClass);
    observer.observe(project);
  });
  preference.addEventListener('change', onPreference);
  root.addEventListener('focusin', onFocus);
  return stop;
}
