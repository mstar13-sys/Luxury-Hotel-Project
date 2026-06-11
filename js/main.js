/* Luxury Hotel Landing Page - main.js */

(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ─── Sticky nav shadow + active link highlighting ───
  const nav = $('.nav');
  const links = $$('.nav__link[data-target]');
  const sections = links
    .map((l) => $(l.getAttribute('data-target')))
    .filter(Boolean);

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

    for (const l of links) {
      const t = l.getAttribute('data-target');
      const id = t ? t.replace('#', '') : null;
      l.classList.toggle('nav__link--active', id === currentId);
    }
  }

  // ─── Smooth anchor scrolling (delegated) ───
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.length < 2) return;

    const target = $(href);
    if (!target) return;
    e.preventDefault();

    // close mobile menu
    const mobileMenu = $('.mobile-menu');
    if (mobileMenu) mobileMenu.classList.remove('mobile-menu--open');

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', href);
  });

  // ─── Mobile menu ───
  const burger = $('.burger');
  const mobileMenu = $('.mobile-menu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      mobileMenu.classList.toggle('mobile-menu--open');
      const open = mobileMenu.classList.contains('mobile-menu--open');
      burger.setAttribute('aria-expanded', open);
    });

    document.addEventListener('click', (e) => {
      if (!mobileMenu.classList.contains('mobile-menu--open')) return;
      if (!e.target.closest('.nav')) {
        mobileMenu.classList.remove('mobile-menu--open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ─── Scroll animations with IntersectionObserver ───
  const animObserver = new IntersectionObserver(
    (entries) => {
      for (const ent of entries) {
        if (ent.isIntersecting) {
          ent.target.classList.add('in-view');
          ent.target.removeAttribute('data-animate');
          animObserver.unobserve(ent.target);
        }
      }
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  $$('[data-animate]').forEach((el) => {
    el.classList.remove('in-view');
    animObserver.observe(el);
  });

  // ─── Sticky booking CTA ───
  const stickyBook = $('.sticky-book');
  const hero = $('#home');
  function setStickyBook() {
    if (!stickyBook || !hero) return;
    stickyBook.classList.toggle('sticky-book--show', window.scrollY > hero.offsetHeight * 0.45);
  }

  // ─── Booking form ───
  const heroForm = $('#bookingForm');
  if (heroForm) {
    heroForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(heroForm).entries());
      const checkIn = data['checkin'] || '';
      const checkOut = data['checkout'] || '';
      const guests = data['guests'] || '1';

      const toast = $('#bookingToast');
      const msg = `Request received: ${checkIn || '—'} → ${checkOut || '—'} · ${guests} guest(s).`;

      if (toast) {
        toast.textContent = msg;
        toast.classList.add('toast--show');
        clearTimeout(window.__toastTimer);
        window.__toastTimer = setTimeout(() => toast.classList.remove('toast--show'), 3400);
      }
      heroForm.reset();
    });
  }

  // ─── Contact form ───
  const contactForm = $('#contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const toast = $('#bookingToast'); // reuse same style
      const btn = contactForm.querySelector('button[type="submit"]');
      const orig = btn.textContent;
      btn.textContent = 'Sending…';
      btn.disabled = true;

      setTimeout(() => {
        alert('Thank you! We will get back to you shortly.');
        contactForm.reset();
        btn.textContent = orig;
        btn.disabled = false;
      }, 600);
    });
  }

  // ─── Lightbox ───
  const lightbox = $('.lightbox');
  const lightboxImg = $('.lightbox__img');
  const lightboxCaption = $('.lightbox__caption');
  const lbClose = $('.lightbox__close');

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

  $$('[data-lightbox-src]').forEach((tile) => {
    tile.addEventListener('click', () => {
      const src = tile.getAttribute('data-lightbox-src');
      const cap = tile.getAttribute('data-lightbox-caption') || '';
      openLightbox(src, cap);
    });
  });

  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLightbox();
      closeChatPanel();
    }
  });

  // ─── Testimonials carousel (with touch support) ───
  const track = $('.carousel__track');
  const dotBtns = $$('.dotbtn[data-index]');
  const prevBtn = $('[data-carousel-prev]');
  const nextBtn = $('[data-carousel-next]');
  let carouselIndex = 0;
  let carouselTimer = null;

  function goToSlide(i) {
    const slides = $$('.tslide');
    if (!slides.length || !track) return;
    carouselIndex = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${carouselIndex * 100}%)`;

    for (const d of dotBtns) {
      const di = Number(d.getAttribute('data-index'));
      d.classList.toggle('dotbtn--active', di === carouselIndex);
    }
  }

  function startCarousel() {
    stopCarousel();
    carouselTimer = setInterval(() => goToSlide(carouselIndex + 1), 5200);
  }

  function stopCarousel() {
    if (carouselTimer) clearInterval(carouselTimer);
    carouselTimer = null;
  }

  // Init carousel if track exists
  if (track) {
    goToSlide(0);
    startCarousel();
    const carousel = track.closest('.carousel');
    if (carousel) {
      carousel.addEventListener('mouseenter', stopCarousel);
      carousel.addEventListener('mouseleave', startCarousel);
      carousel.addEventListener('touchstart', onCarouselTouch, { passive: true });
    }

    dotBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        goToSlide(Number(btn.getAttribute('data-index')));
        startCarousel();
      });
    });

    if (prevBtn) prevBtn.addEventListener('click', () => { goToSlide(carouselIndex - 1); startCarousel(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { goToSlide(carouselIndex + 1); startCarousel(); });
  }

  // Touch swipe for carousel
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

  // ─── FAQ accordion ───
  $$('[data-faq-item]').forEach((item) => {
    const btn = $('.faq-q', item);
    if (!btn) return;
    btn.addEventListener('click', () => {
      item.classList.toggle('faq-item--open');
      btn.setAttribute('aria-expanded', item.classList.contains('faq-item--open'));
    });
  });

  // ─── Live chat widget ───
  const chatBtn = $('.chat-btn');
  const chatPanel = $('.chat-panel');
  const closeChat = $('.chat-close');

  function openChat() {
    if (chatPanel) chatPanel.classList.add('chat-panel--open');
  }

  function closeChatPanel() {
    if (chatPanel) chatPanel.classList.remove('chat-panel--open');
  }

  if (chatBtn) chatBtn.addEventListener('click', openChat);
  if (closeChat) closeChat.addEventListener('click', closeChatPanel);

  // Chat from contact sidebar
  document.addEventListener('click', (e) => {
    const openBtn = e.target.closest('[data-open-chat]');
    if (openBtn) openChat();
  });

  // ─── Initialise ───
  setNavScrolled();
  setActiveLinkByScroll();
  setStickyBook();

  window.addEventListener('scroll', () => {
    setNavScrolled();
    setActiveLinkByScroll();
    setStickyBook();
  });

  // ─── Redundant: clean up duplicate .toast hit from old code ───
  // The HTML previously had duplicate `class="toast"` attributes.
  // This resolves it: the toast now uses id="bookingToast".
})();
