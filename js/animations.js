/**
 * animations.js — Luxury Hotel (OPTIMIZED)
 * ─────────────────────────────────────────────────────────────
 * Performance fixes applied:
 *  1. Card tilt: throttled with requestAnimationFrame (was firing raw on every mousemove)
 *  2. Hero parallax: capped shift + removed parallax on mobile/low-end devices
 *  3. Counter: uses requestAnimationFrame (unchanged — already optimal)
 *  4. Section lines: only injected once, checked via flag
 *  5. Stagger children: capped at 10 (was unbounded)
 *  6. All IntersectionObserver callbacks unobserve immediately (already good)
 * ─────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ── Reduced-motion guard ── */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Low-end device detection (skip expensive effects) ── */
  const isLowEnd = (
    navigator.hardwareConcurrency <= 2 ||
    (navigator.deviceMemory !== undefined && navigator.deviceMemory <= 2)
  );


  /* ─────────────────────────────────────────────────────────
     HERO PAGE-LOAD ENTRANCE
  ───────────────────────────────────────────────────────── */

  function initHeroEntrance() {
    const hero = $('#home');
    if (!hero) return;

    if (prefersReduced) {
      $$('[class*="-enter"]', hero).forEach(el => { el.style.opacity = 1; });
      return;
    }

    const badge = hero.querySelector('.badge[data-animate]');
    if (badge) badge.classList.add('hero-badge-enter');

    const h1 = hero.querySelector('h1[data-animate]');
    if (h1) h1.classList.add('hero-h1-enter');

    const p = hero.querySelector('p[data-animate]');
    if (p) p.classList.add('hero-p-enter');

    const ctas = hero.querySelector('.hero__ctas[data-animate]');
    if (ctas) ctas.classList.add('hero-ctas-enter');

    const note = hero.querySelector('.hero__note[data-animate]');
    if (note) note.classList.add('hero-note-enter');

    const card = hero.querySelector('.hero-book-card, .form-card, aside[data-animate]');
    if (card) card.classList.add('hero-card-enter');
  }


  /* ─────────────────────────────────────────────────────────
     SCROLL-REVEAL  (IntersectionObserver)
  ───────────────────────────────────────────────────────── */

  function initScrollReveal() {
    const selectors = [
      '[data-animate]',
      '[data-animate-left]',
      '[data-animate-right]',
      '[data-animate-scale]',
      '.section-line',
    ];

    const targets = $$(selectors.join(','));
    if (!targets.length) return;

    if (prefersReduced) {
      targets.forEach(el => el.classList.add('in-view'));
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        for (const ent of entries) {
          if (!ent.isIntersecting) continue;
          ent.target.classList.add('in-view');
          ent.target.removeAttribute('data-animate');
          observer.unobserve(ent.target);
        }
      },
      { threshold: 0.10, rootMargin: '0px 0px -40px 0px' }
    );

    targets.forEach(el => {
      el.classList.remove('in-view');
      observer.observe(el);
    });
  }


  /* ─────────────────────────────────────────────────────────
     COUNTER ANIMATION
  ───────────────────────────────────────────────────────── */

  function initCounters() {
    if (prefersReduced) return;

    const stats = $$('.stat__num');
    if (!stats.length) return;

    const observer = new IntersectionObserver(
      entries => {
        for (const ent of entries) {
          if (!ent.isIntersecting) continue;
          _animateCounter(ent.target);
          observer.unobserve(ent.target);
        }
      },
      { threshold: 0.50 }
    );

    stats.forEach(el => {
      el.setAttribute('data-original', el.textContent.trim());
      observer.observe(el);
    });
  }

  function _animateCounter(el) {
    const original = el.getAttribute('data-original') || el.textContent.trim();
    const match = original.match(/^(\d+\.?\d*)(.*)$/);
    if (!match) return;

    const target   = parseFloat(match[1]);
    const suffix   = match[2] || '';
    const decimal  = match[1].includes('.') ? (match[1].split('.')[1] || '').length : 0;
    const duration = 1200;
    const start    = performance.now();

    function tick(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      el.textContent = (target * eased).toFixed(decimal) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }


  /* ─────────────────────────────────────────────────────────
     SECTION DIVIDER LINES
  ───────────────────────────────────────────────────────── */

  function initSectionLines() {
    $$('.section-subtitle').forEach(el => {
      if (el.nextElementSibling && el.nextElementSibling.classList.contains('section-line')) return;
      const line = document.createElement('div');
      line.className = 'section-line';
      el.insertAdjacentElement('afterend', line);
    });
  }


  /* ─────────────────────────────────────────────────────────
     HERO PARALLAX
     FIXED: Skip on low-end devices and reduce shift amount.
     FIXED: Disconnect observer when hero leaves viewport to
     stop scroll handler firing during the rest of the page.
  ───────────────────────────────────────────────────────── */

  function initHeroParallax() {
    if (prefersReduced) return;
    if (window.matchMedia('(hover: none)').matches) return;
    // FIXED: Skip parallax on low-end devices entirely
    if (isLowEnd) return;

    const heroBg = $('.hero__bg');
    const hero   = $('#home');
    if (!heroBg || !hero) return;

    let ticking = false;
    let active   = true; // turns off once hero is scrolled out

    // Use IntersectionObserver to disable the handler when hero is off-screen
    const heroObserver = new IntersectionObserver(
      ([entry]) => { active = entry.isIntersecting; },
      { threshold: 0 }
    );
    heroObserver.observe(hero);

    window.addEventListener('scroll', () => {
      if (!active || ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        // FIXED: Reduced multiplier 0.25 → 0.18; capped at 120px
        const shift = Math.min(window.scrollY * 0.18, 120);
        heroBg.style.transform = `translateY(${shift}px)`;
        ticking = false;
      });
    }, { passive: true });
  }


  /* ─────────────────────────────────────────────────────────
     STAGGER CHILDREN
     FIXED: Was applying JS delays redundantly on top of CSS
     nth-child delays. Now only applies to items > 10 (>CSS coverage).
  ───────────────────────────────────────────────────────── */

  function initStaggerChildren() {
    const grids = $$(
      '.cards-4, .grid-3, .icon-grid, .grid-6, .team-grid, .grid-4, .attr-grid, .gallery-grid'
    );
    grids.forEach(grid => {
      const children = $$('[data-animate]', grid);
      children.forEach((child, i) => {
        if (i > 9) {
          child.style.transitionDelay = `${0.04 + i * 0.06}s`;
        }
      });
    });
  }


  /* ─────────────────────────────────────────────────────────
     CARD TILT  (subtle 3-D tilt on hover — desktop only)
     FIXED: Was calling style.transform on EVERY mousemove event
     (up to 60-120 events/second). Now throttled with rAF so
     only one transform update fires per animation frame.
  ───────────────────────────────────────────────────────── */

  function initCardTilt() {
    if (prefersReduced) return;
    if (window.matchMedia('(hover: none)').matches) return;
    // FIXED: Skip on low-end devices — 3D transforms with frequent updates tank perf
    if (isLowEnd) return;

    const cards = $$('.card, .stat, .why');

    cards.forEach(card => {
      let rafId = null;
      let pendingTilt = null;

      card.addEventListener('mousemove', e => {
        // Store latest mouse position
        pendingTilt = e;

        // Only schedule one rAF per frame
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          rafId = null;
          if (!pendingTilt) return;
          const rect  = card.getBoundingClientRect();
          const cx    = rect.left + rect.width / 2;
          const cy    = rect.top  + rect.height / 2;
          const dx    = (pendingTilt.clientX - cx) / (rect.width  / 2);
          const dy    = (pendingTilt.clientY - cy) / (rect.height / 2);
          const tiltX = dy * -4;
          const tiltY = dx *  4;
          card.style.transform = `translateY(-5px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
          card.style.transition = 'transform 0.05s linear';
          pendingTilt = null;
        });
      });

      card.addEventListener('mouseleave', () => {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        pendingTilt = null;
        card.style.transform = '';
        card.style.transition = 'transform 0.32s cubic-bezier(0.19,1,0.22,1)';
      });
    });
  }


  /* ─────────────────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────────────── */

  function init() {
    initSectionLines();
    initHeroEntrance();
    initScrollReveal();
    initCounters();
    initHeroParallax();
    initStaggerChildren();
    initCardTilt();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
