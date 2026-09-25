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
