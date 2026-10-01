// Enhance only after observation is available; content stays visible otherwise.
export function mountProjectReveal(root, view = window) {
  const projects = [...root.querySelectorAll('.project')];
  const preference = view.matchMedia('(prefers-reduced-motion: reduce)');
  if (preference.matches || !view.IntersectionObserver) return () => {};

  const show = node => node.classList.remove('project-pending');
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
    const project = event.target.closest('.project');
    if (project) { show(project); observer.unobserve(project); }
  };
  projects.forEach(project => {
    project.classList.add('project-pending');
    observer.observe(project);
  });
  preference.addEventListener('change', onPreference);
  root.addEventListener('focusin', onFocus);
  return stop;
}
