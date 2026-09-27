import manifest from '../../../data/images.json' assert { type: 'json' };

let _cache = null;

export async function loadImageRegistry(){
  if (_cache) return _cache;

  const base = (manifest.base || '').replace(/\/?$/, '/'); // asegura trailing slash
  const map  = new Map((manifest.images || []).map(img => {
    const id = (img.id || '').toString().trim();
    return [id, { ...img, src: base + img.src }];
  }));

  _cache = { base, map };
  return _cache;
}

export function resolveImage(reg, id){
  const key = (id ?? '').toString().trim();
  return reg?.map?.get(key) || null;
}
