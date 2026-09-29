import { content, ui, format, bind, text } from '../../../content/index.js';
import { loadImageRegistry, resolveImage } from '../images/registry.js';

export function Projects(){
  const sec  = document.createElement('section');
  sec.id = 'work';
  sec.className = 'section reveal';

  const wrap = document.createElement('div');
  wrap.className = 'container';

  const h2 = document.createElement('h2');
  h2.className = 'h2';
  text(h2, () => content.projects.title);

  const grid = document.createElement('div');
  grid.className = 'grid';

  wrap.append(h2, grid);
  sec.appendChild(wrap);

  (async ()=>{
    try{
      const reg = await loadImageRegistry();
      const items = content?.projects?.items || [];

      items.forEach(item => {
        const meta = item.imageId ? resolveImage(reg, item.imageId) : null;
        const fallback = item.imageId
          ? { src: `media/${String(item.imageId).trim()}.webp`, alt: item.title }
          : null;
        const image = (meta && meta.src) ? meta : fallback;

        grid.append(card({ ...item, image }));
      });
    }catch(err){
      console.error('[images.json error]', err);
    }
  })();

  return sec;
}

// ------------------------------ card --------------------------------

function card({ id, title, desc, tags = [], actions = [], badges = [], bullets = [], image }){
  const current = () => content.projects.items.find(item => item.id === id);
  const art   = document.createElement('article');
  art.className = 'card';

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
    media.style.background = 'linear-gradient(135deg,#2a3350,#171e33)';
  }

  // Título (enlazado al CTA primario si existe)
  const h3 = document.createElement('h3');
  h3.className = 'h3';

  const primary = pickPrimary(actions);
  const linkTitle = primary ? createActionElement(primary) : document.createElement('span');
  linkTitle.className = 'card-title-link';
  text(linkTitle, () => current().title);
  if (primary) bind(linkTitle, 'attr:aria-label', () => `${current().title}: ${pickPrimary(current().actions).text}`);
  h3.appendChild(linkTitle);

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
    text(s, () => current().tags[i]);
    tagsBox.appendChild(s);
  });

  // Acciones (soporta <a> normales y botón con data-book)
  const acts = document.createElement('div');
  acts.className = 'card-actions';
  (actions || []).forEach((act, i) => { const node = createActionElement(act); text(node, () => current().actions[i].text); acts.appendChild(node); });

  // Orden final
  if (image?.src) art.append(media);
  art.append(h3);
  if (meta) art.appendChild(meta);
  art.append(p);
  if (ul) art.appendChild(ul);
  art.append(tagsBox, acts);

  return art;
}

// --------------------------- helpers --------------------------------

function pickPrimary(actions){
  if (!Array.isArray(actions) || actions.length === 0) return null;
  const byClass = actions.find(a => (a.className || '').includes('btn-primary'));
  return byClass || actions[0];
}

function createActionElement(act = {}){
  const isBook = act.kind === 'booking';
  const text = act.text || (isBook ? ui.work.book : ui.work.open);
  const className = act.className || '';

  if (isBook){
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = className;
    btn.textContent = text;
    btn.setAttribute('data-book', 'true'); // el listener global de booking abrirá el modal
    return btn;
  }

  const a = document.createElement('a');
  a.className = className;
  a.textContent = text;
  const href = act.href;
  a.href = href;

  // enlaces externos seguros
  if (/^https?:\/\//i.test(href)){
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
  return a;
}
