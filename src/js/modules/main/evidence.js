import { evidenceMetrics, ui, text, bind } from '../../../content/index.js';

export function Evidence() {
  if (!evidenceMetrics.length) return null;
  const section = document.createElement('section');
  section.className = 'section evidence';
  section.setAttribute('aria-labelledby', 'evidence-title');
  const container = document.createElement('div');
  container.className = 'container';
  const heading = document.createElement('h2');
  heading.id = 'evidence-title';
  heading.className = 'visually-hidden';
  text(heading, () => ui.evidence.title);
  const list = document.createElement('dl');
  list.className = 'evidence-list';
  evidenceMetrics.forEach(metric => {
    const item = document.createElement('div');
    item.className = 'evidence-item';
    const value = document.createElement('dt');
    value.className = 'evidence-value';
    text(value, () => metric.id === 'web' ? `${metric.value} ${ui.evidence.years}` : metric.value);
    if (metric.id === 'clinical') {
      bind(value, 'attr:aria-label', () => ui.evidence.loadTime);
    }
    const context = document.createElement('dd');
    context.className = 'evidence-context';
    text(context, () => ui.evidence.contexts[metric.id]);
    item.append(value, context);
    list.append(item);
  });
  container.append(heading, list);
  section.append(container);
  return section;
}
