// RaiClinic: WhatsApp, abertura com a logo, animações presas à rolagem, rolagem suave e mapa.

// ---------------------------------------------------------------- WhatsApp
// Número da Raiane em um só lugar: 55 + DDD + número, só dígitos (ex.: 5511912345678).
const WHATSAPP = '55DDDNUMERO';

document.querySelectorAll('[data-wa]').forEach((a) => {
  a.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(a.dataset.wa)}`;
  a.target = '_blank';
  a.rel = 'noopener';
  if (!a.querySelector('.sr-only')) a.insertAdjacentHTML('beforeend', '<span class="sr-only"> (abre o WhatsApp)</span>');
});

// ---------------------------------------------------------------- utilidades
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

// ---------------------------------------------------------------- abertura com a logo
const intro = document.querySelector('.intro');
const flyer = document.querySelector('.intro-logo');
const navLogo = document.querySelector('.nav .nav__logo--img img');
const nav = document.querySelector('.nav');
const bar = document.querySelector('.wa-float');

function introFrame() {
  if (!root.classList.contains('has-intro') || !intro || !flyer || !navLogo) return;
  const H = intro.offsetHeight || innerHeight;
  const p = clamp(scrollY / (H * 0.9));
  const e = easeInOut(p);
  // tamanho inicial = largura do CSS; destino = a logo do menu
  const w0 = flyer.offsetWidth, h0 = flyer.offsetHeight;
  const t = navLogo.getBoundingClientRect();
  const x0 = (innerWidth - w0) / 2, y0 = (innerHeight - h0) / 2;
  const s = lerp(1, t.width / w0, e);
  flyer.style.transform = `translate3d(${lerp(x0, t.left, e)}px, ${lerp(y0, t.top, e)}px, 0) scale(${s})`;
  // menu e barra do celular surgem na reta final
  const o = clamp((p - 0.55) / 0.45);
  for (const el of [nav, bar]) {
    if (!el) continue;
    el.style.opacity = String(o);
    el.style.pointerEvents = o > 0.6 ? '' : 'none';
  }
  root.classList.toggle('intro-done', p >= 1);
}

// ---------------------------------------------------------------- elementos que entram com a rolagem
// data-r="up" (cards, de baixo para cima), "left" / "right" (textos, pelo lado em que estão).
// O progresso depende só da posição na tela: aparece ao descer e se desfaz ao subir.
const DIST = 52;
const items = [...document.querySelectorAll('[data-r]')].map((el) => ({ el, top: 0, dir: el.dataset.r, delay: 0, ill: el.querySelector('.ill') }));

// o hero acompanha a abertura: termina de aparecer quando a logo chega no menu
let heroOrder = 0;
for (const it of items) if (it.el.closest('.hero')) it.hero = heroOrder++;

// cards lado a lado entram um pouco depois do vizinho
for (const it of items) {
  if (it.dir !== 'up') continue;
  const sibs = [...it.el.parentElement.children].filter((c) => c.dataset.r === 'up');
  it.delay = sibs.indexOf(it.el) * 0.06;
}

function measure() {
  const phone = innerWidth < 640;
  let k = 0;
  for (const it of items) {
    it.el.style.transform = 'none';
    // no celular tudo fica numa coluna: os textos alternam o lado
    it.side = it.dir === 'up' ? 'up' : phone ? (k++ % 2 ? 'right' : 'left') : it.dir;
  }
  for (const it of items) it.top = it.el.getBoundingClientRect().top + scrollY;
  revealFrame();
}

function revealFrame() {
  const vh = innerHeight;
  // celular: deslize menor e mais curto, para nada parar cortado na borda da tela
  const phone = innerWidth < 640;
  const dist = phone ? 24 : DIST, range = phone ? 0.22 : 0.38;
  const introH = root.classList.contains('has-intro') && intro ? (intro.offsetHeight || vh) * 0.9 : 0;
  for (const it of items) {
    const top = it.top - scrollY;
    const raw = it.hero !== undefined && introH
      ? clamp((scrollY / introH - 0.3 - it.hero * 0.07) / 0.45)
      : clamp((vh - top) / (vh * range) - it.delay);
    const e = easeOut(raw);
    const d = (1 - e) * dist;
    const dx = it.side === 'left' ? -d : it.side === 'right' ? d : 0;
    const dy = it.side === 'up' ? d : 0;
    it.el.style.opacity = e >= 1 ? '' : String(e);
    it.el.style.transform = e >= 1 ? '' : `translate3d(${dx}px, ${dy}px, 0)`;
    if (it.ill) it.ill.style.setProperty('--draw', String(clamp((vh - top) / (vh * 0.62) - it.delay)));
  }
}

// ---------------------------------------------------------------- laço da rolagem
let ticking = false;
function frame() { ticking = false; introFrame(); revealFrame(); }
function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }

function start() {
  if (reduce.matches) return;   // reduzir movimento: tudo parado e visível, logo já no menu
  measure();
  introFrame();
  root.classList.add('intro-ready');
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => requestAnimationFrame(() => { measure(); introFrame(); }));
  // fontes, fotos e o mapa mudam as alturas depois do carregamento
  let pending = false;
  const remeasure = () => { if (!pending) { pending = true; requestAnimationFrame(() => { pending = false; measure(); }); } };
  if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(document.body);
  document.fonts?.ready.then(remeasure);
  addEventListener('load', remeasure);
}
start();
reduce.addEventListener?.('change', () => location.reload());

// ---------------------------------------------------------------- rolagem suave dos links do menu
let anim = 0;
function scrollToY(y) {
  cancelAnimationFrame(anim);
  const from = scrollY, dist = y - from;
  if (reduce.matches || Math.abs(dist) < 2) { scrollTo(0, y); return; }
  const dur = clamp(500 + Math.abs(dist) * 0.25, 650, 1400);
  const t0 = performance.now();
  const step = (now) => {
    const t = clamp((now - t0) / dur);
    scrollTo(0, from + dist * easeInOut(t));
    if (t < 1) anim = requestAnimationFrame(step);
  };
  anim = requestAnimationFrame(step);
}
// a pessoa rolou por conta própria: a animação para
for (const ev of ['wheel', 'touchstart', 'keydown']) addEventListener(ev, () => cancelAnimationFrame(anim), { passive: true });

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
  const id = a.getAttribute('href');
  if (id.length < 2) return;
  const target = document.querySelector(id);
  if (!target) return;
  e.preventDefault();
  scrollToY(target.getBoundingClientRect().top + scrollY);
  history.pushState(null, '', id);
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
});

// ---------------------------------------------------------------- mapa do consultório (fx-map do kit)
const map = document.querySelector('.cx-map');
if (map) {
  const mount = async () => {
    try {
      const { default: init } = await import('../assets/components/fx-map/component.js');
      init(map);
    } catch (err) {
      console.warn('mapa não carregou', err);
    }
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); mount(); }
    }, { rootMargin: '400px 0px' });
    io.observe(map);
  } else {
    mount();
  }
}
