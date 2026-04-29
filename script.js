'use strict';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ══════════════════════════════════════════════════════
   HAPPY BIRTHDAY MUSIC  (Web Audio API — no files needed)
══════════════════════════════════════════════════════ */
const FREQS = {
  C4:261.63, D4:293.66, E4:329.63, F4:349.23,
  G4:392.00, A4:440.00, Bb4:466.16, C5:523.25,
};

/* Happy Birthday melody: [note, beatDuration, gapAfterBeats] */
const MELODY = [
  ['C4',.3,.1],['C4',.18,.07],['D4',.48,.1],['C4',.48,.1],['F4',.48,.1],['E4',.96,.25],
  ['C4',.3,.1],['C4',.18,.07],['D4',.48,.1],['C4',.48,.1],['G4',.48,.1],['F4',.96,.25],
  ['C4',.3,.1],['C4',.18,.07],['C5',.48,.1],['A4',.48,.1],['F4',.48,.1],['E4',.48,.1],['D4',.96,.25],
  ['Bb4',.3,.1],['Bb4',.18,.07],['A4',.48,.1],['F4',.48,.1],['G4',.48,.1],['F4',1.4,.0],
];

const TEMPO   = 0.44; /* seconds per beat */
const LOOP_GAP = 2.2; /* seconds between loops */

class BirthdayMusic {
  constructor() {
    this.ctx      = null;
    this.loopTimer = null;
    this.playing  = false;
    this.started  = false;
  }

  _initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  _playNote(freq, startTime, durSec) {
    const ctx = this.ctx;
    /* Soft piano: sine fundamental + quieter octave overtone */
    [[freq, 0.55], [freq * 2, 0.18], [freq * 3, 0.08]].forEach(([f, vol]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      /* gentle low-pass to round the tone */
      const lpf  = ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.value = 2800;

      osc.type = 'triangle';
      osc.frequency.value = f;

      /* ADSR */
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(vol, startTime + 0.025);
      gain.gain.setTargetAtTime(vol * 0.35, startTime + 0.08, 0.12);
      gain.gain.setTargetAtTime(0.001, startTime + durSec * 0.7, durSec * 0.28);

      osc.connect(lpf);
      lpf.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + durSec + 0.2);
    });
  }

  _scheduleLoop() {
    if (!this.playing) return;
    this._initCtx();
    const ctx = this.ctx;
    let t = ctx.currentTime + 0.08;

    MELODY.forEach(([note, beats, gap]) => {
      const dur = beats * TEMPO;
      this._playNote(FREQS[note], t, dur);
      t += dur + gap * TEMPO;
    });

    const totalMs = (t - ctx.currentTime + LOOP_GAP) * 1000;
    this.loopTimer = setTimeout(() => this._scheduleLoop(), totalMs);
  }

  play() {
    if (this.playing) return;
    this.playing = true;
    this._initCtx();
    this._scheduleLoop();
    this.started = true;
  }

  stop() {
    this.playing = false;
    clearTimeout(this.loopTimer);
    this.loopTimer = null;
    if (this.ctx) this.ctx.suspend();
  }

  toggle() {
    this.playing ? this.stop() : this.play();
    return this.playing;
  }
}

const music = new BirthdayMusic();

/* Music button */
const musicBtn = document.getElementById('musicBtn');
if (musicBtn) {
  musicBtn.addEventListener('click', () => {
    const on = music.toggle();
    musicBtn.textContent = on ? '♪' : '♩';
    musicBtn.classList.toggle('playing', on);
    musicBtn.classList.toggle('muted', !on);
  });
}

/* Auto-start music when page 2 is reached (user gesture already happened) */
function startMusicIfNotStarted() {
  if (!music.started && !reducedMotion) {
    music.play();
    if (musicBtn) {
      musicBtn.classList.add('playing');
      musicBtn.textContent = '♪';
    }
  }
}

/* ══════════════════════════════════════════════════════
   PAGE 2 SPARKLES
══════════════════════════════════════════════════════ */
const SPARKLE_COLORS = ['#e88aa0','#f4846a','#d4a574','#f5c4d0','#ffb347'];
const SPARKLE_CHARS  = ['✦','✧','❤','✿','★','·'];
let sparkleInterval  = null;

function createSparkle(container) {
  const el = document.createElement('span');
  el.className = 'sparkle';
  const size   = 10 + Math.random() * 16;
  const color  = SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)];
  const char   = SPARKLE_CHARS[Math.floor(Math.random() * SPARKLE_CHARS.length)];
  const dur    = 2.4 + Math.random() * 2.4;
  const delay  = Math.random() * 0.6;

  el.style.cssText = `
    left:${5 + Math.random() * 90}%;
    top:${5 + Math.random() * 90}%;
    --size:${size}px;
    --color:${color};
    --dur:${dur}s;
    --delay:${delay}s;
    width:${size}px; height:${size}px;
  `;
  el.textContent = char;
  el.style.fontSize = size + 'px';
  el.style.color = color;
  el.style.position = 'absolute';
  el.style.opacity = '0';
  el.style.animation = `sparkle-life ${dur}s ease-in-out ${delay}s 1 forwards`;
  el.style.pointerEvents = 'none';

  container.appendChild(el);
  setTimeout(() => el.remove(), (dur + delay + 0.1) * 1000);
}

function startSparkles() {
  const container = document.getElementById('page2Sparkles');
  if (!container || reducedMotion) return;
  stopSparkles();
  /* Burst a few immediately */
  for (let i = 0; i < 6; i++) {
    setTimeout(() => createSparkle(container), i * 120);
  }
  sparkleInterval = setInterval(() => {
    createSparkle(container);
    if (Math.random() > .65) createSparkle(container); /* occasional double */
  }, 420);
}

function stopSparkles() {
  clearInterval(sparkleInterval);
  sparkleInterval = null;
}

/* ══════════════════════════════════════════════════════
   PAGE STATE
══════════════════════════════════════════════════════ */
let currentPage = 1;

function showPage(n) {
  if (n === currentPage) return;
  const prev = document.getElementById(`page-${currentPage}`);
  const next = document.getElementById(`page-${n}`);
  if (!next) return;

  /* Leaving page 2 → stop sparkles */
  if (currentPage === 2) stopSparkles();

  prev.classList.remove('active');
  prev.classList.add('exit');
  setTimeout(() => prev.classList.remove('exit'), 600);

  next.classList.add('active');
  currentPage = n;
  updateDots();

  if (n === 1) resetPage1();
  if (n === 2) { animateWish(); startSparkles(); startMusicIfNotStarted(); }
}

function updateDots() {
  document.querySelectorAll('.dot-btn').forEach((b, i) => {
    b.classList.toggle('active', i + 1 === currentPage);
  });
}

/* ══════════════════════════════════════════════════════
   PAGE 1 — ENVELOPE + TWO-SIDED CARD
══════════════════════════════════════════════════════ */
let envelopeOpened = false;
let cardTextDone   = false;

function openEnvelope() {
  if (envelopeOpened) return;
  envelopeOpened = true;

  const envFlap   = document.getElementById('envFlap');
  const envScene  = document.getElementById('envScene');
  const cardScene = document.getElementById('cardScene');
  const bookRight = document.getElementById('bookRight');

  envFlap.classList.add('open');

  const hideDelay = reducedMotion ? 50 : 720;
  setTimeout(() => envScene.classList.add('hiding'), hideDelay);

  const showDelay = reducedMotion ? 100 : 1150;
  setTimeout(() => {
    cardScene.classList.add('visible');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      cardScene.classList.add('faded-in');
    }));
    setTimeout(() => {
      bookRight.classList.add('open');
      setTimeout(animateCardText, reducedMotion ? 0 : 520);
    }, reducedMotion ? 0 : 280);
  }, showDelay);
}

function animateCardText() {
  const lines     = document.querySelectorAll('.hand-line');
  const underline = document.querySelector('.underline-path');
  const sentences = document.querySelectorAll('.hand-sentence');
  const tapBtn    = document.getElementById('cardTapBtn');
  const step = reducedMotion ? 0 : 270;
  let t = reducedMotion ? 0 : 180;

  lines.forEach(el => { setTimeout(() => el.classList.add('visible'), t); t += step; });
  setTimeout(() => underline && underline.classList.add('drawn'), t);
  t += reducedMotion ? 0 : 150;
  sentences.forEach(el => { setTimeout(() => el.classList.add('visible'), t); t += step; });
  setTimeout(() => {
    tapBtn && tapBtn.classList.add('show');
    cardTextDone = true;
  }, t + (reducedMotion ? 0 : 300));
}

function resetPage1() {
  envelopeOpened = false;
  cardTextDone   = false;
  document.getElementById('envFlap').classList.remove('open');
  document.getElementById('envScene').classList.remove('hiding');
  document.getElementById('cardScene').classList.remove('visible','faded-in');
  document.getElementById('bookRight').classList.remove('open');
  document.querySelectorAll('.hand-line,.hand-sentence').forEach(el => el.classList.remove('visible'));
  const ul = document.querySelector('.underline-path');
  if (ul) ul.classList.remove('drawn');
  const btn = document.getElementById('cardTapBtn');
  if (btn) btn.classList.remove('show');
}

/* ══════════════════════════════════════════════════════
   PAGE 2 — STAGGERED TEXT REVEAL
══════════════════════════════════════════════════════ */
function animateWish() {
  const els = document.querySelectorAll('#page-2 .w-anim');
  /* reset first */
  els.forEach(el => el.classList.remove('w-visible'));

  requestAnimationFrame(() => requestAnimationFrame(() => {
    els.forEach((el, i) => {
      const delay = reducedMotion ? 0 : i * 200;
      el.style.transitionDelay = delay + 'ms';
      el.classList.add('w-visible');
    });
  }));
}

/* ══════════════════════════════════════════════════════
   NAVIGATION
══════════════════════════════════════════════════════ */
document.getElementById('envelope').addEventListener('click', openEnvelope);
document.getElementById('cardTapBtn')?.addEventListener('click', () => showPage(2));

document.querySelectorAll('[data-next]').forEach(btn => {
  btn.addEventListener('click', () => { if (currentPage < 4) showPage(currentPage + 1); });
});

document.getElementById('restartBtn')?.addEventListener('click', () => {
  stopSparkles();
  showPage(1);
});

document.querySelectorAll('.dot-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const t = parseInt(btn.dataset.go);
    if (t && t !== currentPage) showPage(t);
  });
});

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    if (currentPage === 1 && !envelopeOpened) { openEnvelope(); return; }
    if (currentPage < 4) showPage(currentPage + 1);
  }
  if ((e.key === 'ArrowLeft' || e.key === 'ArrowUp') && currentPage > 1) showPage(currentPage - 1);
});

let tx = 0, ty = 0;
document.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive:true });
document.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - tx;
  const dy = e.changedTouches[0].clientY - ty;
  if (Math.abs(dx) < 40 && Math.abs(dy) < 40) return;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx < -40 && currentPage < 4) showPage(currentPage + 1);
    if (dx >  40 && currentPage > 1) showPage(currentPage - 1);
  }
}, { passive:true });

updateDots();
