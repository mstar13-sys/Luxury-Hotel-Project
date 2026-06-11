/**
 * main.js — Luxury Hotel
 * ─────────────────────────────────────────────────────────────
 * Core UI: navigation, sticky bar, lightbox, carousel,
 * FAQ accordion, live-chat widget, forms & toasts.
 *
 * Animation logic lives in  js/animations.js
 * Booking modal logic lives in js/booking.js
 * ─────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));


  /* ─────────────────────────────────────────────────────────
     TOAST HELPER  (shared across all form submissions)
  ───────────────────────────────────────────────────────── */

  function showToast(msg, duration = 3400) {
    let toast = $('#globalToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'globalToast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      Object.assign(toast.style, {
        position:     'fixed',
        left:         '50%',
        transform:    'translateX(-50%)',
        bottom:       '22px',
        padding:      '12px 20px',
        zIndex:       '999',
        borderRadius: '20px',
        border:       '1px solid rgba(214,178,94,.35)',
        background:   'rgba(15,17,21,.88)',
        backdropFilter: 'blur(14px)',
        color:        'var(--beige)',
        fontWeight:   '700',
        fontSize:     '14px',
        maxWidth:     'calc(100vw - 32px)',
        textAlign:    'center',
        display:      'none',
        boxShadow:    '0 12px 40px rgba(0,0,0,.35)',
      });
      document.body.appendChild(toast);
    }

    toast.textContent = msg;
    toast.style.display = 'block';
    toast.style.animation = 'none';
    void toast.offsetWidth;
    toast.style.animation = 'toastUp 0.35s cubic-bezier(0.19,1,0.22,1) both';

    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => {
        toast.style.display = 'none';
        toast.style.opacity = '';
        toast.style.transition = '';
      }, 320);
    }, duration);
  }

  window.showToast = showToast; // expose for other modules


  /* ─────────────────────────────────────────────────────────
     NAV: scroll shadow + active link
  ───────────────────────────────────────────────────────── */

  const nav      = $('.nav');
  const navLinks = $$('.nav__link[data-target]');
  const sections = navLinks.map(l => $(l.getAttribute('data-target'))).filter(Boolean);

  function setNavScrolled() {
    if (!nav) return;
    nav.classList.toggle('nav--scrolled', window.scrollY > 10);
  }

  function setActiveLinkByScroll() {
    if (!sections.length) return;
    const y = window.scrollY + 110;
    let currentId = sections[0].id;
    for (const sec of sections) {
      if (sec.offsetTop <= y) currentId = sec.id;
    }
    for (const l of navLinks) {
      const t  = l.getAttribute('data-target');
      const id = t ? t.replace('#', '') : null;
      l.classList.toggle('nav__link--active', id === currentId);
    }
  }


  /* ─────────────────────────────────────────────────────────
     SMOOTH ANCHOR SCROLL  (delegated)
  ───────────────────────────────────────────────────────── */

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const href   = a.getAttribute('href');
    if (!href || href.length < 2) return;
    const target = $(href);
    if (!target) return;
    e.preventDefault();

    const mobileMenu = $('.mobile-menu');
    if (mobileMenu) mobileMenu.classList.remove('mobile-menu--open');

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', href);
  });


  /* ─────────────────────────────────────────────────────────
     MOBILE MENU
  ───────────────────────────────────────────────────────── */

  const burger     = $('.burger');
  const mobileMenu = $('.mobile-menu');

  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('mobile-menu--open');
      burger.setAttribute('aria-expanded', open);
    });

    document.addEventListener('click', e => {
      if (!mobileMenu.classList.contains('mobile-menu--open')) return;
      if (!e.target.closest('.nav')) {
        mobileMenu.classList.remove('mobile-menu--open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }


  /* ─────────────────────────────────────────────────────────
     STICKY BOOK CTA
  ───────────────────────────────────────────────────────── */

  const stickyBook = $('.sticky-book');
  const heroSection = $('#home');

  function setStickyBook() {
    if (!stickyBook || !heroSection) return;
    stickyBook.classList.toggle('sticky-book--show', window.scrollY > heroSection.offsetHeight * 0.45);
  }


  /* ─────────────────────────────────────────────────────────
     LIGHTBOX
  ───────────────────────────────────────────────────────── */

  const lightbox        = $('.lightbox');
  const lightboxImg     = $('.lightbox__img');
  const lightboxCaption = $('.lightbox__caption');
  const lbClose         = $('.lightbox__close');

  function openLightbox(src, caption) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxImg.alt = caption || 'Hotel image';
    if (lightboxCaption) lightboxCaption.textContent = caption || '';
    lightbox.classList.add('lightbox--open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('lightbox--open');
    document.body.style.overflow = '';
  }

  $$('[data-lightbox-src]').forEach(tile => {
    tile.addEventListener('click', () => {
      openLightbox(
        tile.getAttribute('data-lightbox-src'),
        tile.getAttribute('data-lightbox-caption') || ''
      );
    });
  });

  if (lbClose)   lbClose.addEventListener('click', closeLightbox);
  if (lightbox)  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });


  /* ─────────────────────────────────────────────────────────
     TESTIMONIALS CAROUSEL  (touch + auto-advance)
  ───────────────────────────────────────────────────────── */

  const track   = $('.carousel__track');
  const dotBtns = $$('.dotbtn[data-index]');
  const prevBtn = $('[data-carousel-prev]');
  const nextBtn = $('[data-carousel-next]');
  let carouselIndex = 0;
  let carouselTimer = null;

  function goToSlide(i) {
    const slides = $$('.tslide');
    if (!slides.length || !track) return;
    carouselIndex = ((i % slides.length) + slides.length) % slides.length;
    track.style.transform = `translateX(-${carouselIndex * 100}%)`;
    dotBtns.forEach(d => {
      d.classList.toggle('dotbtn--active', Number(d.getAttribute('data-index')) === carouselIndex);
    });
  }

  function startCarousel() {
    stopCarousel();
    carouselTimer = setInterval(() => goToSlide(carouselIndex + 1), 5200);
  }

  function stopCarousel() {
    if (carouselTimer) clearInterval(carouselTimer);
    carouselTimer = null;
  }

  if (track) {
    goToSlide(0);
    startCarousel();

    const carousel = track.closest('.carousel');
    if (carousel) {
      carousel.addEventListener('mouseenter', stopCarousel);
      carousel.addEventListener('mouseleave', startCarousel);
      carousel.addEventListener('touchstart', onCarouselTouch, { passive: true });
    }

    dotBtns.forEach(btn => btn.addEventListener('click', () => {
      goToSlide(Number(btn.getAttribute('data-index')));
      startCarousel();
    }));

    if (prevBtn) prevBtn.addEventListener('click', () => { goToSlide(carouselIndex - 1); startCarousel(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { goToSlide(carouselIndex + 1); startCarousel(); });
  }

  let touchStartX = 0;
  function onCarouselTouch(e) {
    touchStartX = e.touches[0].clientX;
    document.addEventListener('touchend', onCarouselTouchEnd, { passive: true, once: true });
  }
  function onCarouselTouchEnd(e) {
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 50) {
      goToSlide(diff < 0 ? carouselIndex + 1 : carouselIndex - 1);
      startCarousel();
    }
  }


  /* ─────────────────────────────────────────────────────────
     FAQ ACCORDION
  ───────────────────────────────────────────────────────── */

  $$('[data-faq-item]').forEach(item => {
    const btn = $('.faq-q', item);
    if (!btn) return;
    btn.addEventListener('click', () => {
      item.classList.toggle('faq-item--open');
      btn.setAttribute('aria-expanded', item.classList.contains('faq-item--open'));
    });
  });


  /* ─────────────────────────────────────────────────────────
     LIVE CHAT WIDGET
  ───────────────────────────────────────────────────────── */

  const chatBtn   = $('.chat-btn');
  const chatPanel = $('.chat-panel');
  const closeChat = $('.chat-close');

  function openChat()  { if (chatPanel) chatPanel.classList.add('chat-panel--open'); }
  function closeChat_() { if (chatPanel) chatPanel.classList.remove('chat-panel--open'); }

  if (chatBtn)   chatBtn.addEventListener('click', openChat);
  if (closeChat) closeChat.addEventListener('click', closeChat_);

  // Any [data-open-chat] button opens the panel
  document.addEventListener('click', e => {
    if (e.target.closest('[data-open-chat]')) openChat();
  });

  // Close via [data-chat-close]
  document.addEventListener('click', e => {
    if (e.target.closest('[data-chat-close]')) closeChat_();
  });

  // Escape closes chat & lightbox
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    closeLightbox();
    closeChat_();
  });

  // Schedule buttons
  $$('[data-schedule]').forEach(b => b.addEventListener('click', () => {
    showToast('Availability saved. Chat to confirm your preferred time.');
  }));


  /* ─────────────────────────────────────────────────────────
     CONTACT FORM
  ───────────────────────────────────────────────────────── */

  const contactForm = $('#contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(contactForm).entries());
      const btn  = contactForm.querySelector('button[type="submit"]');
      const orig = btn ? btn.innerHTML : '';

      if (btn) { btn.innerHTML = '<span class="btn-spinner"></span> Sending…'; btn.disabled = true; }

      setTimeout(() => {
        showToast(`Message sent. Thank you, ${data.name || 'guest'}! We'll be in touch shortly.`);
        contactForm.reset();
        if (btn) { btn.innerHTML = orig; btn.disabled = false; }
      }, 700);
    });
  }


  /* ─────────────────────────────────────────────────────────
     NEWSLETTER FORM
  ───────────────────────────────────────────────────────── */

  const newsletterForm = $('#newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', e => {
      e.preventDefault();
      newsletterForm.reset();
      showToast('Subscribed! Welcome to premium updates.');
    });
  }


  /* ─────────────────────────────────────────────────────────
     FOOTER YEAR
  ───────────────────────────────────────────────────────── */

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();


  /* ─────────────────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────────────── */

  setNavScrolled();
  setActiveLinkByScroll();
  setStickyBook();

  window.addEventListener('scroll', () => {
    setNavScrolled();
    setActiveLinkByScroll();
    setStickyBook();
  }, { passive: true });

})();
