import { mountMetricMotion } from '../common/metric-motion.js';
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
    item.dataset.metric = metric.id;
    const value = document.createElement('dt');
    value.className = 'evidence-value';
    bind(value, 'attr:aria-label', () => metric.id === 'clinical'
      ? ui.evidence.loadTime
      : metric.id === 'web' ? `${metric.value} ${ui.evidence.years}` : metric.value);
    const visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');
    bind(visual, 'innerHTML', () => {
      const escape = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const label = metric.id === 'web' ? `${metric.value} ${ui.evidence.years}` : metric.value;
      if (metric.id === 'clinical') {
        const [before, after] = label.split(' → ');
        return `<span class="metric-symbol" data-motion="before">${escape(before)}</span> <span class="metric-symbol" data-motion="arrow">→</span> <span class="metric-symbol" data-motion="after">${escape(after)}</span>`;
      }
      return `<span class="metric-count">${escape(label).replace(/\+/g, '<span class="metric-symbol" data-motion="plus">+</span>')}</span>`;
    });
    value.append(visual);
    const context = document.createElement('dd');
    context.className = 'evidence-context';
    text(context, () => ui.evidence.contexts[metric.id]);
    item.append(value, context);
    list.append(item);
  });
  mountMetricMotion(list);
  container.append(heading, list);
  section.append(container);
  return section;
}
