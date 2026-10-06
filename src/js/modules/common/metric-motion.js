export function mountMetricMotion(list, view = window) {
  const preference = view.matchMedia('(prefers-reduced-motion: reduce)');
  const items = [...list.querySelectorAll('.evidence-item')];
  const clinical = items.find(item => item.dataset.metric === 'clinical');
  let running = false, sequence = 0, clinicalRun;
  let observeCenter;
  const ready = () => {
    const main = list.closest?.('main');
    return !main?.hidden && main?.dataset?.navigationReady !== 'false';
  };
  const centered = item => {
    const bounds = item.querySelector('.evidence-value').getBoundingClientRect();
    const center = (bounds.top + bounds.bottom) / 2;
    return center >= view.innerHeight * .4 && center <= view.innerHeight * .6;
  };
  const animate = (node, middle, duration, delay = 0) => {
    if (!node?.animate) return;
    node.getAnimations().forEach(animation => animation.cancel());
    return node.animate([
      { transform: 'none' },
      { transform: middle, offset: .45 },
      { transform: 'none' },
    ], { duration, delay, easing: 'ease-in-out' });
  };
  const playCount = item => {
    if (preference.matches || !ready()) return;
    const animations = [
      animate(item.querySelector('.metric-count'), 'translateY(-4px) scale(1.09)', 1400),
      animate(item.querySelector('[data-motion="plus"]'), 'translateY(-2px) scale(1.22)', 1200),
    ];
    return Promise.all(animations.filter(Boolean).map(animation => animation.finished)).catch(() => {});
  };
  const playTime = () => {
    if (preference.matches || !clinical || !ready()) return;
    const animations = [...clinical.querySelectorAll('.metric-symbol')].map(symbol => {
      const motion = symbol.dataset.motion;
      const middle = motion === 'before' ? 'scale(1.16)' : motion === 'after' ? 'scale(.86)' : 'translateX(5px)';
      return animate(symbol, middle, 1000, motion === 'arrow' ? 650 : motion === 'after' ? 1300 : 0);
    });
    clinicalRun = Promise.all(animations.filter(Boolean).map(animation => animation.finished)).catch(() => {});
    return clinicalRun;
  };
  const playClinical = async () => {
    if (preference.matches || !clinical || running || !ready()) return;
    running = true;
    const version = ++sequence;
    let current = playTime();
    // If hover restarts the time metric, finish that run before the auto counts.
    do {
      await current;
      if (version !== sequence || preference.matches) return;
      if (current === clinicalRun) break;
      current = clinicalRun;
    } while (current);
    const counts = items.filter(item => item !== clinical);
    if (view.matchMedia('(max-width: 767px)').matches) {
      for (const item of counts) {
        if (version !== sequence || preference.matches) return;
        await playCount(item);
      }
    } else await Promise.all(counts.map(playCount));
    if (version === sequence) running = false;
  };
  items.forEach(item => {
    // Each hovered metric responds independently of the automatic sequence.
    item.addEventListener('pointerenter', (event = {}) => {
      if (preference.matches || event.pointerType === 'touch') return;
      if (item === clinical) playTime();
      else playCount(item);
    });
  });
  if (view.IntersectionObserver) {
    let observer;
    observeCenter = () => {
      observer?.disconnect();
      const visible = new Set();
      const inset = view.innerHeight * .4;
      observer = new view.IntersectionObserver(entries => {
        entries.forEach(entry => {
          const item = entry.target.closest('.evidence-item');
          const inCenter = ready() && entry.isIntersecting && entry.intersectionRatio >= .5 && centered(item);
          if (inCenter && !visible.has(item)) {
            if (item === clinical) playClinical();
          }
          if (inCenter) visible.add(item);
          else visible.delete(item);
        });
      }, { rootMargin: `-${inset}px 0px -${inset}px 0px`, threshold: .5 });
      if (clinical) observer.observe(clinical.querySelector('.evidence-value'));
    };
    observeCenter();
    view.addEventListener('resize', observeCenter);
  }
  list.ownerDocument?.addEventListener('site:home-paused', () => {
    sequence++; running = false;
    list.querySelectorAll('.metric-symbol, .metric-count, [data-motion="plus"]').forEach(node =>
      node.getAnimations?.().forEach(animation => animation.cancel()));
  });
  list.ownerDocument?.addEventListener('site:home-arrived', () => { if (ready()) observeCenter?.(); });
  preference.addEventListener('change', event => {
    if (!event.matches) return;
    sequence++;
    running = false;
    list.querySelectorAll('.metric-symbol, .metric-count').forEach(node =>
      node.getAnimations?.().forEach(animation => animation.cancel()));
  });
}
