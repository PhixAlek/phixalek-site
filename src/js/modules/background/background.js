// ===== Orbes dentro del MAIN, sin bajar al footer =====

// Cantidad y tamaños
const N = 6;
const SIZE_MIN = 240;
const SIZE_MAX = 420;

// Movimiento MUY lento
const SPEED_MIN = 0.6;   // px/s
const SPEED_MAX = 1.4;   // px/s

// Drift senoidal suave
const DRIFT_AX_MIN = 3;  // px/s
const DRIFT_AX_MAX = 10; // px/s
const DRIFT_FX_MIN = 0.04; // Hz aprox
const DRIFT_FX_MAX = 0.10;

const palette = ['#8b5cf6', '#3b82f6', '#22d3ee'];
const rnd = (a,b)=> a + Math.random()*(b-a);

// Reparto uniforme por el área del main (estratificado)
function spawnPositions(count, w, h){
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const cellW = w / cols, cellH = h / rows;
  const positions = [];
  let i = 0;
  for (let r = 0; r < rows && i < count; r++){
    for (let c = 0; c < cols && i < count; c++){
      const padW = Math.min(80, cellW * 0.2);
      const padH = Math.min(80, cellH * 0.2);
      positions.push({
        x: c * cellW + rnd(padW, cellW - padW),
        y: r * cellH + rnd(padH, cellH - padH),
      });
      i++;
    }
  }
  return positions;
}

export function mountBackground(main){
  // Respetar usuarios con reduced motion
  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Asegura el contenedor de orbes dentro del MAIN
  let layer = main.querySelector('#orbs');
  if (!layer){
    layer = document.createElement('div');
    layer.id = 'orbs';
    layer.setAttribute('aria-hidden','true');
    main.prepend(layer);
  } else if (layer.children.length){
    // Evita duplicados en HMR
    return;
  }

  // Dimensiones iniciales del main
  const w0 = main.clientWidth  || window.innerWidth;
  const h0 = main.scrollHeight || main.clientHeight || window.innerHeight;
  const positions = spawnPositions(N, w0, h0);

  function spawn(i){
    const el = document.createElement('div');
    el.className = 'orb';

    const size = rnd(SIZE_MIN, SIZE_MAX);
    const base = positions[i] || { x: rnd(0, w0 - size), y: rnd(0, h0 - size) };
    const color = palette[Math.floor(rnd(0, palette.length))];

    el.style.setProperty('--color', color);
    el.style.width  = `${size}px`;
    el.style.height = `${size}px`;
    layer.appendChild(el);

    // Velocidad base muy lenta y dirección única
    const speed = rnd(SPEED_MIN, SPEED_MAX);
    const angle = rnd(0, Math.PI * 2);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    // Drift senoidal (amplitud/frecuencia únicas)
    const driftAx = rnd(DRIFT_AX_MIN, DRIFT_AX_MAX);
    const driftAy = rnd(DRIFT_AX_MIN, DRIFT_AX_MAX);
    const driftFx = rnd(DRIFT_FX_MIN, DRIFT_FX_MAX);
    const driftFy = rnd(DRIFT_FX_MIN, DRIFT_FX_MAX);
    const phaseX  = rnd(0, Math.PI * 2);
    const phaseY  = rnd(0, Math.PI * 2);

    return { el, size, x: base.x, y: base.y, vx, vy, driftAx, driftAy, driftFx, driftFy, phaseX, phaseY };
  }

  const orbs = Array.from({length: N}, (_, i) => spawn(i));

  if (prefersReduce){
    // Posiciona sin animar
    for (const o of orbs){
      o.el.style.transform = `translate3d(${o.x}px,${o.y}px,0)`;
    }
    return;
  }

  // Observa cambios de tamaño del MAIN (contenido que crece)
  let bounds = {
    w: main.clientWidth  || window.innerWidth,
    h: main.scrollHeight || main.clientHeight || window.innerHeight
  };

  const ro = new ResizeObserver(() => {
    bounds.w = main.clientWidth  || window.innerWidth;
    bounds.h = main.scrollHeight || main.clientHeight || window.innerHeight;
  });
  ro.observe(main);

  // Animación
  let prev = performance.now();
  function tick(now){
    const dt = (now - prev) / 1000;
    prev = now;

    const w = bounds.w;
    const h = bounds.h;

    for (const o of orbs){
      // Movimiento base + drift senoidal
      const dx = o.vx + Math.sin(o.phaseX) * (o.driftAx * dt);
      const dy = o.vy + Math.sin(o.phaseY) * (o.driftAy * dt);
      o.x += dx;
      o.y += dy;

      // Avanza fases (2π f dt)
      o.phaseX += (2 * Math.PI * o.driftFx) * dt;
      o.phaseY += (2 * Math.PI * o.driftFy) * dt;

      // Wrap SUAVE dentro del MAIN (no llega al borde/footers)
      const margin = o.size * 0.25;         // 👈 margen de seguridad
      if (o.x >  w - margin)  o.x = -o.size;
      if (o.y >  h - margin)  o.y = -o.size;
      if (o.x < -o.size)      o.x =  w - margin;
      if (o.y < -o.size)      o.y =  h - margin;

      o.el.style.transform = `translate3d(${o.x}px,${o.y}px,0)`;
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}
