// Accordéon des projets
document.querySelectorAll('.project__row').forEach((btn) => {
  btn.addEventListener('click', () => {
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    btn.closest('.project').classList.toggle('is-open', !open);
    panel.hidden = open;
  });
});

// Apparitions discrètes au scroll
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const items = document.querySelectorAll('.reveal, .project, .map');
if (!reduce && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('js-reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  items.forEach((el) => io.observe(el));
}

document.getElementById('year').textContent = new Date().getFullYear();


// ------------------------------------------------------------------
// Hero : un seul contrôleur rAF pour la souris et le scroll.
// Écrit uniquement transform / opacity, et seulement quand le hero est visible.
// ------------------------------------------------------------------
const heroEl = document.querySelector('.hero');
const layer = document.querySelector('.sc-parallax');
const space = document.querySelector('.hero__space');
const desktopFx = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 901px)');
const lowPower = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;

if (heroEl && layer && !reduce) {
  let heroH = heroEl.offsetHeight;
  let visible = true;
  let mx = 0, my = 0, px = 0, py = 0;   // souris : cible / valeur lissée
  let sy = 0;                            // scroll
  let raf = 0;

  const scrollFx = () => desktopFx.matches && !lowPower;

  const frame = () => {
    raf = 0;
    px += (mx - px) * 0.06;
    py += (my - py) * 0.06;
    const s = scrollFx() ? Math.min(sy / heroH, 1) : 0;
    // Uniquement translate3d, amplitude réduite ; aucune opacité, rotation ou filtre pendant le scroll.
    layer.style.transform = `translate3d(${(px * -9).toFixed(2)}px, ${(py * -7 - s * 28).toFixed(2)}px, 0)`;
    if (space) space.style.transform = `translate3d(0, ${(s * 36).toFixed(1)}px, 0)`;
    if (Math.abs(mx - px) > 0.001 || Math.abs(my - py) > 0.001) request();
  };
  const request = () => { if (!raf && visible) raf = requestAnimationFrame(frame); };

  window.addEventListener('scroll', () => { sy = window.scrollY; if (scrollFx()) request(); }, { passive: true });
  window.addEventListener('resize', () => { heroH = heroEl.offsetHeight; request(); }, { passive: true });
  heroEl.addEventListener('pointermove', (e) => {
    if (!desktopFx.matches) return;
    const r = heroEl.getBoundingClientRect();
    mx = (e.clientX - r.left) / r.width * 2 - 1;
    my = (e.clientY - r.top) / r.height * 2 - 1;
    request();
  }, { passive: true });
  heroEl.addEventListener('pointerleave', () => { mx = 0; my = 0; request(); });

  // Hors écran : on met en pause les animations du hero et on n'écrit plus rien.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      heroEl.classList.toggle('is-off', !visible);
      if (visible) { sy = window.scrollY; request(); }
    }).observe(heroEl);
  }
  if (desktopFx.matches) { layer.style.willChange = 'transform'; if (space) space.style.willChange = 'transform'; }
  sy = window.scrollY;
  request();
}

// Cartes : les lignes ne s'animent que lorsque la carte est à l'écran.
if ('IntersectionObserver' in window) {
  const live = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.classList.toggle('is-live', e.isIntersecting));
  }, { rootMargin: '100px 0px' });
  document.querySelectorAll('.map').forEach((m) => live.observe(m));
}

// ------------------------------------------------------------------
// Carte Solvane : l'étincelle parcourt Solvane → 4 étapes → Radar Pro.
// Web Animations API : transform / opacity ; en pause hors écran.
// ------------------------------------------------------------------
(() => {
  const map = document.querySelector('.map--solvane');
  if (!map || reduce || !('animate' in Element.prototype)) return;
  const plot = map.querySelector('.map__plot');
  const flow = map.querySelector('.map__flow');
  const hub = map.querySelector('.node--hub');
  const steps = [...map.querySelectorAll('.node--step')];
  const product = map.querySelector('.node--product');
  const sparks = [...map.querySelectorAll('.spark')];   // traînée 2, traînée 1, tête
  const lit = map.querySelector('.node__lit');
  const CYCLE = 7000;                                    // 6 s de trajet + pause
  const STOPS = [0, 1100, 2200, 3300, 4400, 5600];       // Solvane, 4 étapes, Radar Pro
  let anims = [];

  const vertical = () => window.matchMedia('(max-width: 1080px)').matches;
  // Positions de mise en page (offset*) : insensibles aux animations d'entrée et au survol
  const center = (el) => [
    flow.offsetLeft + el.offsetLeft + el.offsetWidth / 2,
    flow.offsetTop + el.offsetTop + el.offsetHeight / 2,
  ];

  const build = () => {
    anims.forEach((a) => a.cancel());
    anims = [];
    let pts = [hub, ...steps, product].map(center);
    if (vertical()) {                                    // mobile : sur la ligne verticale
      const x = flow.offsetLeft + parseFloat(getComputedStyle(flow, '::before').left || 0) + .5;
      pts = pts.map(([, y]) => [x, y]);
    }
    const t = (ms) => ms / CYCLE;
    const at = ([x, y]) => `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    const frames = [
      { offset: 0, transform: at(pts[0]), opacity: 0 },
      { offset: t(250), transform: at(pts[0]), opacity: 1 },
      ...STOPS.slice(1).map((ms, k) => ({ offset: t(ms), transform: at(pts[k + 1]), opacity: 1 })),
      { offset: t(6000), transform: at(pts[pts.length - 1]), opacity: 0 },
      { offset: 1, transform: at(pts[pts.length - 1]), opacity: 0 },
    ];
    const timing = { duration: CYCLE, iterations: Infinity, easing: 'linear' };
    sparks.forEach((el, k) => {
      const lag = (2 - k) * 70;                          // la traînée suit à 70 / 140 ms
      const o = [.35, .6, 1][k];
      const f = frames.map((fr) => ({ ...fr, opacity: fr.opacity * o }));
      anims.push(el.animate(f, { ...timing, delay: lag }));
    });
    // Numéro de chaque étape : bref éclat au passage
    steps.forEach((step, k) => {
      const idx = step.querySelector('.node__idx');
      const ms = STOPS[k + 1];
      anims.push(idx.animate([
        { offset: 0, color: 'rgba(244, 241, 234, .55)' },
        { offset: t(ms - 250), color: 'rgba(244, 241, 234, .55)' },
        { offset: t(ms), color: '#BFEFFA' },
        { offset: t(ms + 600), color: 'rgba(244, 241, 234, .55)' },
        { offset: 1, color: 'rgba(244, 241, 234, .55)' },
      ], timing));
    });
    // Radar Pro s'illumine à l'arrivée
    anims.push(lit.animate([
      { offset: 0, opacity: 0 },
      { offset: t(5450), opacity: 0 },
      { offset: t(5900), opacity: 1 },
      { offset: t(6800), opacity: 0 },
      { offset: 1, opacity: 0 },
    ], timing));
    if (!map.classList.contains('is-live')) anims.forEach((a) => a.pause());
  };

  // Lecture uniquement quand la carte est visible
  let measured = false;
  new IntersectionObserver(([e]) => {
    anims.forEach((a) => (e.isIntersecting ? a.play() : a.pause()));
    // Première apparition : on remesure une fois l'animation d'entrée des modules terminée
    if (e.isIntersecting && !measured) { measured = true; setTimeout(build, 1800); }
  }, { rootMargin: '100px 0px' }).observe(map);

  // Fin de l'entrée de la planche (échelle .985 → 1) : positions définitives
  let tt = 0;
  map.addEventListener('transitionend', (e) => {
    if (e.propertyName !== 'transform' || e.target.closest('.spark-layer')) return;
    clearTimeout(tt); tt = setTimeout(build, 120);   // une seule remesure après la dernière
  });
  let rt = 0;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); }, { passive: true });
  // Construire après l'apparition de la carte (les modules ont alors leur position finale)
  const ready = () => setTimeout(build, 1600);
  if (document.readyState === 'complete') ready(); else window.addEventListener('load', ready);
})();
