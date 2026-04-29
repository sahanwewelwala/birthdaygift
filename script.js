'use strict';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Page state ── */
let currentPage = 1;

function showPage(n) {
  if (n === currentPage) return;
  const prev = document.getElementById(`page-${currentPage}`);
  const next = document.getElementById(`page-${n}`);
  if (!next) return;

  prev.classList.remove('active');
  prev.classList.add('exit');
  setTimeout(() => prev.classList.remove('exit'), 600);

  next.classList.add('active');
  currentPage = n;
  updateDots();

  if (n === 1) resetPage1();
  if (n === 2) animateWish();
}

function updateDots() {
  document.querySelectorAll('.dot-btn').forEach((b, i) => {
    b.classList.toggle('active', i + 1 === currentPage);
  });
}

/* ════════════════════════════════════
   PAGE 1 — envelope + two-sided card
════════════════════════════════════ */
let envelopeOpened = false;
let cardTextDone   = false;

/* Step 1: tap envelope → flap opens → envelope hides → card appears */
function openEnvelope() {
  if (envelopeOpened) return;
  envelopeOpened = true;

  const envFlap   = document.getElementById('envFlap');
  const envScene  = document.getElementById('envScene');
  const cardScene = document.getElementById('cardScene');
  const bookRight = document.getElementById('bookRight');

  /* 1. Open the flap */
  envFlap.classList.add('open');

  /* 2. Fade envelope out */
  const hideDelay = reducedMotion ? 50 : 720;
  setTimeout(() => envScene.classList.add('hiding'), hideDelay);

  /* 3. Show card scene — set display:flex first, then on next frame trigger fade */
  const showDelay = reducedMotion ? 100 : 1150;
  setTimeout(() => {
    cardScene.classList.add('visible');          /* display:flex, opacity:0 */
    requestAnimationFrame(() => requestAnimationFrame(() => {
      cardScene.classList.add('faded-in');       /* fade to opacity:1 */
    }));

    /* 4. Swing right panel open */
    setTimeout(() => {
      bookRight.classList.add('open');
      /* 5. Animate text after panel is halfway open */
      setTimeout(animateCardText, reducedMotion ? 0 : 520);
    }, reducedMotion ? 0 : 280);

  }, showDelay);
}

/* Step 2: text writes itself in */
function animateCardText() {
  const lines     = document.querySelectorAll('.hand-line');
  const underline = document.querySelector('.underline-path');
  const sentences = document.querySelectorAll('.hand-sentence');
  const tapBtn    = document.getElementById('cardTapBtn');
  const step = reducedMotion ? 0 : 270;
  let t = reducedMotion ? 0 : 180;

  lines.forEach(el => {
    setTimeout(() => el.classList.add('visible'), t);
    t += step;
  });

  /* draw underline */
  setTimeout(() => underline && underline.classList.add('drawn'), t);
  t += reducedMotion ? 0 : 150;

  sentences.forEach(el => {
    setTimeout(() => el.classList.add('visible'), t);
    t += step;
  });

  /* show the continue button */
  setTimeout(() => {
    tapBtn && tapBtn.classList.add('show');
    cardTextDone = true;
  }, t + (reducedMotion ? 0 : 300));
}

/* Reset page 1 for replay */
function resetPage1() {
  envelopeOpened = false;
  cardTextDone   = false;

  const envFlap   = document.getElementById('envFlap');
  const envScene  = document.getElementById('envScene');
  const cardScene = document.getElementById('cardScene');
  const bookRight = document.getElementById('bookRight');

  envFlap.classList.remove('open');
  envScene.classList.remove('hiding');
  cardScene.classList.remove('visible', 'faded-in');
  bookRight.classList.remove('open');

  document.querySelectorAll('.hand-line, .hand-sentence').forEach(el => el.classList.remove('visible'));
  const ul = document.querySelector('.underline-path');
  if (ul) ul.classList.remove('drawn');
  const btn = document.getElementById('cardTapBtn');
  if (btn) btn.classList.remove('show');
}

/* ── Envelope click ── */
document.getElementById('envelope').addEventListener('click', openEnvelope);

/* ── Card continue button ── */
document.getElementById('cardTapBtn')?.addEventListener('click', () => showPage(2));

/* ── Page 2 wish fade-in ── */
function animateWish() {
  const els = document.querySelectorAll('#page-2 .wish-eyebrow, #page-2 .wish-title, #page-2 .wish-body, #page-2 .wish-sign');
  els.forEach(el => {
    el.style.transition = 'none';
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(16px)';
  });
  requestAnimationFrame(() => requestAnimationFrame(() => {
    els.forEach((el, i) => {
      const delay = reducedMotion ? 0 : i * 170;
      el.style.transition = `opacity .6s ease ${delay}ms, transform .6s ease ${delay}ms`;
      el.style.opacity    = '1';
      el.style.transform  = 'translateY(0)';
    });
  }));
}

/* ── Next buttons (pages 2 and 3) ── */
document.querySelectorAll('[data-next]').forEach(btn => {
  btn.addEventListener('click', () => {
    if (currentPage < 4) showPage(currentPage + 1);
  });
});

/* ── Restart ── */
document.getElementById('restartBtn')?.addEventListener('click', () => showPage(1));

/* ── Dot navigation ── */
document.querySelectorAll('.dot-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const t = parseInt(btn.dataset.go);
    if (t && t !== currentPage) showPage(t);
  });
});

/* ── Keyboard navigation ── */
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    if (currentPage === 1 && !envelopeOpened) { openEnvelope(); return; }
    if (currentPage < 4) showPage(currentPage + 1);
  }
  if ((e.key === 'ArrowLeft' || e.key === 'ArrowUp') && currentPage > 1) {
    showPage(currentPage - 1);
  }
});

/* ── Swipe gestures ── */
let tx = 0, ty = 0;
document.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
document.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - tx;
  const dy = e.changedTouches[0].clientY - ty;
  if (Math.abs(dx) < 40 && Math.abs(dy) < 40) return;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx < -40 && currentPage < 4) showPage(currentPage + 1);
    if (dx >  40 && currentPage > 1) showPage(currentPage - 1);
  }
}, { passive: true });

/* ── Init ── */
updateDots();
