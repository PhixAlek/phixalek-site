// Enhance only after observation is available; content stays visible otherwise.
export function mountReveal(root, view = window, { selector = '.project', pendingClass = 'project-pending' } = {}) {
  const projects = [...root.querySelectorAll(selector)];
  const preference = view.matchMedia('(prefers-reduced-motion: reduce)');
  if (preference.matches || !view.IntersectionObserver) return () => {};

  const show = node => node.classList.remove(pendingClass);
  const ready = () => {
    const main = root.closest?.('main');
    return !main?.hidden && main?.dataset?.navigationReady !== 'false';
  };
  const observer = new view.IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && ready()) {
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
    root.ownerDocument?.removeEventListener('site:home-arrived', onArrival);
  };
  const onPreference = event => { if (event.matches) stop(); };
  const onFocus = event => {
    if (!ready()) return;
    const project = event.target.closest(selector);
    if (project) { show(project); observer.unobserve(project); }
  };
  const onArrival = () => {
    if (!ready()) return;
    projects.filter(project => project.classList.contains(pendingClass)).forEach(project => {
      observer.unobserve(project); observer.observe(project);
    });
  };
  projects.forEach(project => {
    project.classList.add(pendingClass);
    observer.observe(project);
  });
  preference.addEventListener('change', onPreference);
  root.addEventListener('focusin', onFocus);
  root.ownerDocument?.addEventListener('site:home-arrived', onArrival);
  return stop;
}
