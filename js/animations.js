/**
 * animations.js — Luxury Hotel
 * ─────────────────────────────────────────────────────────────
 * Handles all scroll-reveal, hero entrance, parallax,
 * counter animations, and section dividers.
 * Completely separated from UI logic — safe to modify
 * without touching main.js or booking.js.
 * ─────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ── Reduced-motion guard ── */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ─────────────────────────────────────────────────────────
     HERO PAGE-LOAD ENTRANCE
     Add CSS class names to trigger keyframe animations
     defined in animations.css.
  ───────────────────────────────────────────────────────── */

  function initHeroEntrance() {
    // Bail early if elements don't exist (future pages may not have a hero)
    const hero = $('#home');
    if (!hero) return;

    if (prefersReduced) {
      // Make everything instantly visible
      $$('[class*="-enter"]', hero).forEach(el => { el.style.opacity = 1; });
      return;
    }

    // Badge
    const badge = hero.querySelector('.badge[data-animate]');
    if (badge) badge.classList.add('hero-badge-enter');

    // H1
    const h1 = hero.querySelector('h1[data-animate]');
    if (h1) h1.classList.add('hero-h1-enter');

    // Paragraph
    const p = hero.querySelector('p[data-animate]');
    if (p) p.classList.add('hero-p-enter');

    // CTAs
    const ctas = hero.querySelector('.hero__ctas[data-animate]');
    if (ctas) ctas.classList.add('hero-ctas-enter');

    // Note
    const note = hero.querySelector('.hero__note[data-animate]');
    if (note) note.classList.add('hero-note-enter');

    // Booking card
    const card = hero.querySelector('.hero-book-card, .form-card, aside[data-animate]');
    if (card) card.classList.add('hero-card-enter');
  }


  /* ─────────────────────────────────────────────────────────
     SCROLL-REVEAL  (IntersectionObserver)
     Observes [data-animate], [data-animate-left],
     [data-animate-right], [data-animate-scale], .section-line
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
          // Remove data-animate attribute so the transition only fires once
          ent.target.removeAttribute('data-animate');
          observer.unobserve(ent.target);
        }
      },
      { threshold: 0.10, rootMargin: '0px 0px -40px 0px' }
    );

    targets.forEach(el => {
      // Ensure initial state (CSS handles opacity/transform)
      el.classList.remove('in-view');
      observer.observe(el);
    });
  }


  /* ─────────────────────────────────────────────────────────
     COUNTER ANIMATION
     Animates numbers inside .stat__num elements.
     Looks for a number + optional suffix (e.g. "120+", "4.9/5")
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
      // Store original text so we can parse it
      el.setAttribute('data-original', el.textContent.trim());
      observer.observe(el);
    });
  }

  function _animateCounter(el) {
    const original = el.getAttribute('data-original') || el.textContent.trim();
    // Extract leading number (integer or decimal) and trailing suffix
    const match = original.match(/^(\d+\.?\d*)(.*)$/);
    if (!match) return;

    const target  = parseFloat(match[1]);
    const suffix  = match[2] || '';
    const decimal = match[1].includes('.') ? (match[1].split('.')[1] || '').length : 0;
    const duration = 1400;
    const start    = performance.now();

    function tick(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      el.textContent = current.toFixed(decimal) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }


  /* ─────────────────────────────────────────────────────────
     SECTION DIVIDER LINES
     Injects .section-line elements after section subtitles
     that don't already have one.
  ───────────────────────────────────────────────────────── */

  function initSectionLines() {
    $$('.section-subtitle').forEach(el => {
      // Only add if parent doesn't already have one
      if (el.nextElementSibling && el.nextElementSibling.classList.contains('section-line')) return;
      const line = document.createElement('div');
      line.className = 'section-line';
      el.insertAdjacentElement('afterend', line);
    });
  }


  /* ─────────────────────────────────────────────────────────
     HERO PARALLAX  (subtle vertical shift on hero bg)
     Only active on non-reduced-motion, non-touch devices.
  ───────────────────────────────────────────────────────── */

  function initHeroParallax() {
    if (prefersReduced) return;
    // Skip on touch-primary devices (mobile) — avoid jank
    if (window.matchMedia('(hover: none)').matches) return;

    const heroBg = $('.hero__bg');
    if (!heroBg) return;

    let ticking = false;

    window.addEventListener('scroll', () => {
      if (ticking) return;
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const shift   = scrollY * 0.25;
        heroBg.style.transform = `translateY(${shift}px)`;
        ticking = false;
      });
      ticking = true;
    }, { passive: true });
  }


  /* ─────────────────────────────────────────────────────────
     STAGGER CHILDREN  (adds CSS var --i for custom stagger delays)
     Some sections may want fine-grained per-item delays
     beyond what the CSS nth-child rules cover.
  ───────────────────────────────────────────────────────── */

  function initStaggerChildren() {
    const grids = $$(
      '.cards-4, .grid-3, .icon-grid, .grid-6, .team-grid, .grid-4, .attr-grid, .gallery-grid'
    );
    grids.forEach(grid => {
      const children = $$('[data-animate]', grid);
      children.forEach((child, i) => {
        // Only set if not already handled by CSS nth-child
        if (i > 9) {
          child.style.transitionDelay = `${0.04 + i * 0.06}s`;
        }
      });
    });
  }


  /* ─────────────────────────────────────────────────────────
     CARD TILT  (subtle 3-D tilt on hover — desktop only)
  ───────────────────────────────────────────────────────── */

  function initCardTilt() {
    if (prefersReduced) return;
    if (window.matchMedia('(hover: none)').matches) return;

    const cards = $$('.card, .stat, .why');

    cards.forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect    = card.getBoundingClientRect();
        const cx      = rect.left + rect.width / 2;
        const cy      = rect.top  + rect.height / 2;
        const dx      = (e.clientX - cx) / (rect.width  / 2);
        const dy      = (e.clientY - cy) / (rect.height / 2);
        const tiltX   = dy * -4;   // degrees
        const tiltY   = dx *  4;

        card.style.transform = `translateY(-5px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
        card.style.transition = 'transform 0.05s linear';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'transform 0.35s cubic-bezier(0.19,1,0.22,1)';
      });
    });
  }


  /* ─────────────────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────────────── */

  function init() {
    initSectionLines();   // inject lines before reveal observer
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
