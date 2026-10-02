import { mountNavigationWave } from '../common/navigation-wave.js';
import { content, ui, format, bind, text } from '../../../content/index.js';
import { loadImageRegistry, resolveImage } from '../images/registry.js';
import { mountReveal } from '../common/reveal.js';

export function Projects(){
  const sec  = document.createElement('section');
  sec.id = 'work';
  sec.className = 'section projects';

  const wrap = document.createElement('div');
  wrap.className = 'container';

  const h2 = document.createElement('h2');
  h2.className = 'h2';
  mountNavigationWave(h2, sec, () => content.projects.title);

  const grid = document.createElement('div');
  grid.className = 'projects-layout';

  wrap.append(h2, grid);
  sec.appendChild(wrap);

  (async ()=>{
    try{
      const reg = await loadImageRegistry();
      const items = content?.projects?.items || [];

      items.forEach((item, index) => {
        const meta = item.imageId ? resolveImage(reg, item.imageId) : null;
        const fallback = item.imageId
          ? { src: `media/${String(item.imageId).trim()}.webp`, alt: item.title }
          : null;
        const image = (meta && meta.src) ? meta : fallback;

        grid.append(card({ ...item, image, featured: index === 0 }));
      });
      mountReveal(grid);
    }catch(err){
      console.error('[images.json error]', err);
    }
  })();

  return sec;
}

// ------------------------------ card --------------------------------

function card({ id, title, desc, tags = [], tagStyles = {}, actions = [], badges = [], bullets = [], image, featured }){
  const current = () => content.projects.items.find(item => item.id === id);
  const art   = document.createElement('article');
  art.className = featured ? 'project project-featured' : 'project project-secondary';

  // Media
  const media = document.createElement('div');
  media.className = 'media';

  if (image?.src){
    const el = new Image();
    el.src = image.src;
    bind(el, 'alt', () => format(ui.work.image, { title: current().title }));
    el.loading = 'lazy';
    el.decoding = 'async';
    el.width = 1600;
    el.height = 900;
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.objectFit = 'cover';
    media.appendChild(el);
  } else {
    media.classList.add('media-placeholder');
  }

  const body = document.createElement('div');
  body.className = 'project-body';
  const h3 = document.createElement('h3');
  h3.className = 'h3';
  text(h3, () => current().title);

  // Badges (debajo del título)
  let meta = null;
  if (badges.length){
    meta = document.createElement('div');
    meta.className = 'badges';
    badges.forEach((b, i) => {
      const s = document.createElement('span');
      text(s, () => current().badges[i]);
      meta.appendChild(s);
    });
  }

  // Descripción
  const p = document.createElement('p');
  text(p, () => current().desc);

  // Bullets especiales (solo para "Consulting")
  let ul = null;
  if (bullets.length){
    ul = document.createElement('ul');
    ul.className = 'value-list';
    bullets
      .forEach((t, i) => { const li = document.createElement('li'); text(li, () => current().bullets[i]); ul.appendChild(li); });
  }

  // Tags
  const tagsBox = document.createElement('div');
  tagsBox.className = 'tags';
  tags.forEach((t, i) => {
    const s = document.createElement('span');
    s.className = `tag-${tagStyles[t] || 'neutral'}`;
    text(s, () => current().tags[i]);
    tagsBox.appendChild(s);
  });

  // Acciones (soporta <a> normales y botón con data-book)
  const acts = document.createElement('div');
  acts.className = 'card-actions';
  (actions || []).forEach((act, i) => {
    const node = createActionElement(act);
    const label = document.createElement('span');
    text(label, () => current().actions[i].text);
    node.append(label);
    if (act.kind === 'link') {
      const arrow = document.createElement('span');
      arrow.className = 'project-link-arrow';
      arrow.textContent = '→';
      arrow.setAttribute('aria-hidden', 'true');
      node.append(arrow);
    }
    acts.appendChild(node);
  });

  if (image?.src) art.append(media);
  if (featured) {
    const titleRow = document.createElement('div');
    titleRow.className = 'project-title-row';
    const number = document.createElement('span');
    number.className = 'project-number';
    number.textContent = '01 —';
    number.setAttribute('aria-hidden', 'true');
    titleRow.append(number, h3);
    body.append(titleRow);
  } else body.append(h3);
  if (meta) body.append(meta);
  body.append(p);
  if (featured) {
    if (ul) body.append(ul);
    body.append(tagsBox);
  } else {
    const details = document.createElement('details');
    details.className = 'project-details';
    const summary = document.createElement('summary');
    text(summary, () => ui.work.details);
    details.append(summary);
    if (ul) details.append(ul);
    details.append(tagsBox);
    body.append(details);
  }
  body.append(acts);
  art.append(body);
  return art;
}

function createActionElement(act = {}){
  const isBook = act.kind === 'booking';
  const className = act.className || '';

  if (isBook){
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = className;

    btn.setAttribute('data-book', 'true'); // el listener global de booking abrirá el modal
    return btn;
  }

  const a = document.createElement('a');
  a.className = 'project-link';

  const href = act.href;
  a.href = href;

  // enlaces externos seguros
  if (/^https?:\/\//i.test(href)){
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
  return a;
}
