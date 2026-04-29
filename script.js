'use strict';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── page state ── */
let currentPage = 1;
const TOTAL = 4;

function showPage(n, direction = 'next') {
  const prev = document.getElementById(`page-${currentPage}`);
  const next = document.getElementById(`page-${n}`);
  if (!next || n === currentPage) return;

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

/* ── page 1: envelope + card ── */
let envelopeOpened = false;
let cardAnimDone   = false;

function openEnvelope() {
  if (envelopeOpened) return;
  envelopeOpened = true;

  const flap = document.getElementById('envFlap');
  const card = document.getElementById('card');
  const seal = document.querySelector('.wax-seal');
  const hint = document.getElementById('hintEnvelope');

  /* open flap */
  flap.classList.add('open');
  if (seal) seal.style.opacity = '0';
  if (hint) hint.style.opacity = '0';

  /* lift card */
  const liftDelay = reducedMotion ? 100 : 700;
  setTimeout(() => {
    card.classList.add('lifted');
    animateCardText();
  }, liftDelay);
}

function animateCardText() {
  const lines     = document.querySelectorAll('.hand-line');
  const sentences = document.querySelectorAll('.hand-sentence');
  const underline = document.querySelector('.hand-underline');
  const tapHint   = document.getElementById('cardTap');

  const base = reducedMotion ? 0 : 200;
  const step = reducedMotion ? 0 : 280;

  lines.forEach((el, i) => {
    setTimeout(() => el.classList.add('visible'), base + i * step);
  });

  /* draw underline after lines appear */
  const underlineAt = base + lines.length * step + 50;
  setTimeout(() => underline && underline.classList.add('drawn'), underlineAt);

  /* sentences */
  sentences.forEach((el, i) => {
    setTimeout(() => el.classList.add('visible'), underlineAt + 200 + i * step);
  });

  /* show tap hint */
  const tapAt = underlineAt + 200 + sentences.length * step + 300;
  setTimeout(() => {
    if (tapHint) tapHint.classList.add('show');
    cardAnimDone = true;
  }, tapAt);
}

function resetPage1() {
  envelopeOpened = false;
  cardAnimDone   = false;
  const flap  = document.getElementById('envFlap');
  const card  = document.getElementById('card');
  const seal  = document.querySelector('.wax-seal');
  const hint  = document.getElementById('hintEnvelope');
  const tapHint = document.getElementById('cardTap');

  flap.classList.remove('open');
  card.classList.remove('lifted');
  if (seal) seal.style.opacity = '1';
  if (hint) hint.style.opacity = '1';
  if (tapHint) tapHint.classList.remove('show');

  document.querySelectorAll('.hand-line, .hand-sentence').forEach(el => el.classList.remove('visible'));
  const underline = document.querySelector('.hand-underline');
  if (underline) underline.classList.remove('drawn');
}

/* ── page 2: staggered wish fade-in ── */
function animateWish() {
  const els = document.querySelectorAll('#page-2 .wish-eyebrow, #page-2 .wish-title, #page-2 .wish-body, #page-2 .wish-sign');
  els.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    el.style.transition = 'none';
  });
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const step = reducedMotion ? 0 : 180;
      els.forEach((el, i) => {
        el.style.transition = `opacity .6s ease ${i * step}ms, transform .6s ease ${i * step}ms`;
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
    });
  });
}

/* ── click / tap handlers ── */

/* envelope tap → open */
document.getElementById('envelope').addEventListener('click', () => {
  if (!envelopeOpened) {
    openEnvelope();
  } else if (cardAnimDone) {
    showPage(2);
  }
});

/* card tap to continue */
document.getElementById('cardTap')?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (cardAnimDone) showPage(2);
});

/* next buttons */
document.querySelectorAll('[data-next]').forEach(btn => {
  btn.addEventListener('click', () => {
    if (currentPage < TOTAL) showPage(currentPage + 1);
  });
});

/* restart */
document.getElementById('restartBtn')?.addEventListener('click', () => showPage(1));

/* dot nav */
document.querySelectorAll('.dot-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = parseInt(btn.dataset.go);
    if (target && target !== currentPage) showPage(target);
  });
});

/* ── keyboard navigation ── */
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    if (currentPage === 1 && !envelopeOpened) { openEnvelope(); return; }
    if (currentPage === 1 && cardAnimDone) { showPage(2); return; }
    if (currentPage > 1 && currentPage < TOTAL) showPage(currentPage + 1);
  }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    if (currentPage > 1) showPage(currentPage - 1);
  }
});

/* ── swipe gestures ── */
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) < 40 && Math.abs(dy) < 40) return;   /* tap, not swipe */
  if (Math.abs(dx) > Math.abs(dy)) {
    /* horizontal swipe */
    if (dx < -40 && currentPage < TOTAL) showPage(currentPage + 1);
    if (dx >  40 && currentPage > 1)     showPage(currentPage - 1);
  }
}, { passive: true });

/* ── init ── */
updateDots();
