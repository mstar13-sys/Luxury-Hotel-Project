/**
 * booking.js — Luxury Hotel
 * ─────────────────────────────────────────────────────────────
 * Handles the "Book Your Stay" modal workflow:
 *   Step 1 – Date & guest selection
 *   Step 2 – Room choice
 *   Step 3 – Guest details (name, email, requests)
 *   Step 4 – Confirmation with a generated reference number
 *
 * No backend / database required. On final submit the form
 * data is compiled and a mock confirmation is shown.
 * To wire a real backend, replace the `_submitInquiry` method
 * with your API call and keep everything else the same.
 * ─────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  /* ── Helpers ── */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ── Room catalogue (no database needed) ── */
  const ROOMS = [
    {
      id: 'royal-king',
      name: 'Royal King Room',
      price: 220,
      img: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=70',
    },
    {
      id: 'grand-suite',
      name: 'Grand Deluxe Suite',
      price: 340,
      img: 'https://www.peninsula.com/-/media/pbk/rooms/grand-deluxe-room.jpg',
    },
    {
      id: 'prestige-ocean',
      name: 'Prestige Ocean Suite',
      price: 410,
      img: 'https://www.theluxevoyager.com/wp-content/uploads/2019/05/The-Apurva-Kempinski-Bali-The-Apurva-Prestige-Ocean-Suite.jpg',
    },
  ];

  /* ── State ── */
  let _step = 1;
  const TOTAL_STEPS = 3; // confirmation is step 4 (not a "step")

  const state = {
    checkin: '',
    checkout: '',
    guests: '2',
    roomId: '',
    nights: 0,
    name: '',
    email: '',
    phone: '',
    requests: '',
  };

  /* ─────────────────────────────────────────────────────────
     BUILD MODAL HTML
     Called once on DOMContentLoaded; appended to <body>.
  ───────────────────────────────────────────────────────── */
  function _buildModal() {
    const overlay = document.createElement('div');
    overlay.className = 'booking-modal-overlay';
    overlay.id = 'bookingModalOverlay';
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Book Your Stay');

    overlay.innerHTML = `
      <div class="booking-modal" id="bookingModal">

        <!-- Header -->
        <div class="booking-modal__header">
          <div class="booking-modal__header-text">
            <h2 class="booking-modal__title">Book Your Stay</h2>
            <p class="booking-modal__subtitle">
              Fill in your details and we'll confirm your reservation within 2 hours.
            </p>
          </div>
          <button class="booking-modal__close" id="bookModalClose" aria-label="Close booking form" type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="booking-modal__body">

          <!-- Progress Steps -->
          <div class="booking-steps" id="bookingSteps">
            <div class="booking-step step--active" data-step="1">
              <div class="booking-step__num">1</div>
              <span class="booking-step__label">Dates</span>
            </div>
            <div class="booking-step" data-step="2">
              <div class="booking-step__num">2</div>
              <span class="booking-step__label">Room</span>
            </div>
            <div class="booking-step" data-step="3">
              <div class="booking-step__num">3</div>
              <span class="booking-step__label">Details</span>
            </div>
          </div>

          <!-- ── STEP 1: Dates & Guests ── -->
          <div class="booking-panel panel--active" id="bookPanel1">
            <div class="hero-date-row">
              <div class="field">
                <span class="label">Check-in Date</span>
                <input class="input" type="date" id="bm_checkin" required aria-label="Check-in date"/>
              </div>
              <div class="field">
                <span class="label">Check-out Date</span>
                <input class="input" type="date" id="bm_checkout" required aria-label="Check-out date"/>
              </div>
            </div>
            <div class="hero-guests-row">
              <div class="field">
                <span class="label">Guests</span>
                <select class="input" id="bm_guests" aria-label="Number of guests">
                  <option value="1">1 Guest</option>
                  <option value="2" selected>2 Guests</option>
                  <option value="3">3 Guests</option>
                  <option value="4">4 Guests</option>
                  <option value="5">5+ Guests (contact us)</option>
                </select>
              </div>
            </div>
            <div id="bm_dateError" style="color:rgba(242,100,100,.85); font-size:13px; margin-bottom:10px; display:none;"></div>
            <div class="form-actions" style="margin-top:0;">
              <button class="btn btn--primary" id="step1Next" type="button" style="flex:1;">
                Select Room
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- ── STEP 2: Room Selection ── -->
          <div class="booking-panel" id="bookPanel2">
            <div class="booking-summary" id="bookSummary1"></div>
            <div class="room-picker" id="roomPicker"></div>
            <div id="bm_roomError" style="color:rgba(242,100,100,.85); font-size:13px; margin-bottom:10px; display:none;"></div>
            <div class="form-actions" style="margin-top:0;">
              <button class="btn" id="step2Back" type="button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M19 12H5M11 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Back
              </button>
              <button class="btn btn--primary" id="step2Next" type="button" style="flex:1;">
                Your Details
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- ── STEP 3: Guest Details ── -->
          <div class="booking-panel" id="bookPanel3">
            <div class="booking-summary" id="bookSummary2"></div>
            <div class="form-grid" style="margin-top:0; margin-bottom:12px;">
              <div class="field">
                <span class="label">Full Name</span>
                <input class="input" type="text" id="bm_name" placeholder="Your full name" required/>
              </div>
              <div class="field">
                <span class="label">Email Address</span>
                <input class="input" type="email" id="bm_email" placeholder="you@example.com" required/>
              </div>
              <div class="field" style="grid-column:1/-1;">
                <span class="label">Phone (optional)</span>
                <input class="input" type="tel" id="bm_phone" placeholder="+63 917 123 4567"/>
              </div>
              <div class="field" style="grid-column:1/-1;">
                <span class="label">Special Requests</span>
                <textarea class="input textarea" id="bm_requests" placeholder="Dietary needs, early check-in, accessibility, etc." style="min-height:88px; resize:vertical;"></textarea>
              </div>
            </div>
            <div id="bm_detailError" style="color:rgba(242,100,100,.85); font-size:13px; margin-bottom:10px; display:none;"></div>
            <div class="form-actions" style="margin-top:0;">
              <button class="btn" id="step3Back" type="button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M19 12H5M11 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Back
              </button>
              <button class="btn btn--primary" id="step3Submit" type="button" style="flex:1;">
                Confirm Reservation
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- ── STEP 4: Confirmation ── -->
          <div class="booking-panel" id="bookPanel4">
            <div class="booking-confirm">
              <div class="booking-confirm__icon">✦</div>
              <h3 class="booking-confirm__title">Reservation Received</h3>
              <p class="booking-confirm__text">
                Thank you! Your request has been submitted. Our guest relations team
                will contact you within 2 hours to confirm availability and finalize details.
              </p>
              <div class="booking-confirm__ref" id="bookRef"></div>
              <div id="bookConfirmDetails" style="margin-bottom:22px; text-align:left;"></div>
              <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
                <button class="btn btn--primary" id="bookDone" type="button">
                  Done — Close
                </button>
                <a class="btn" href="#contact">Contact Us</a>
              </div>
            </div>
          </div>

        </div><!-- /.booking-modal__body -->
      </div><!-- /.booking-modal -->
    `;

    document.body.appendChild(overlay);
  }


  /* ─────────────────────────────────────────────────────────
     STEP NAVIGATION
  ───────────────────────────────────────────────────────── */

  function _goToStep(n) {
    _step = n;

    // Update panels
    for (let i = 1; i <= 4; i++) {
      const panel = $(`#bookPanel${i}`);
      if (panel) panel.classList.toggle('panel--active', i === n);
    }

    // Hide step indicators on confirmation (step 4)
    const stepsEl = $('#bookingSteps');
    if (stepsEl) stepsEl.style.display = n === 4 ? 'none' : '';

    // Update step indicator states
    $$('.booking-step[data-step]').forEach(el => {
      const s = Number(el.getAttribute('data-step'));
      el.classList.toggle('step--active', s === n);
      el.classList.toggle('step--done', s < n);
    });

    // Populate dynamic content per step
    if (n === 2) _renderRoomPicker();
    if (n === 2 || n === 3) _renderSummary(n);

    // Scroll modal to top
    const modal = $('#bookingModal');
    if (modal) modal.scrollTop = 0;
  }


  /* ─────────────────────────────────────────────────────────
     VALIDATION
  ───────────────────────────────────────────────────────── */

  function _validateStep1() {
    const checkin  = $('#bm_checkin').value;
    const checkout = $('#bm_checkout').value;
    const errEl    = $('#bm_dateError');

    if (!checkin || !checkout) {
      _showError(errEl, 'Please select both check-in and check-out dates.');
      return false;
    }

    const inDate  = new Date(checkin);
    const outDate = new Date(checkout);
    const today   = new Date(); today.setHours(0,0,0,0);

    if (inDate < today) {
      _showError(errEl, 'Check-in date cannot be in the past.');
      return false;
    }
    if (outDate <= inDate) {
      _showError(errEl, 'Check-out must be at least one night after check-in.');
      return false;
    }

    errEl.style.display = 'none';
    state.checkin  = checkin;
    state.checkout = checkout;
    state.guests   = $('#bm_guests').value;
    state.nights   = Math.round((outDate - inDate) / 86400000);
    return true;
  }

  function _validateStep2() {
    const errEl = $('#bm_roomError');
    if (!state.roomId) {
      _showError(errEl, 'Please select a room to continue.');
      return false;
    }
    errEl.style.display = 'none';
    return true;
  }

  function _validateStep3() {
    const name  = $('#bm_name').value.trim();
    const email = $('#bm_email').value.trim();
    const errEl = $('#bm_detailError');

    if (!name) {
      _showError(errEl, 'Please enter your full name.');
      return false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      _showError(errEl, 'Please enter a valid email address.');
      return false;
    }

    errEl.style.display = 'none';
    state.name     = name;
    state.email    = email;
    state.phone    = $('#bm_phone').value.trim();
    state.requests = $('#bm_requests').value.trim();
    return true;
  }

  function _showError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    el.style.animation = 'none';
    // force reflow then re-animate
    void el.offsetWidth;
    el.style.animation = 'fadeUp 0.3s ease both';
  }


  /* ─────────────────────────────────────────────────────────
     RENDER HELPERS
  ───────────────────────────────────────────────────────── */

  function _renderRoomPicker() {
    const picker = $('#roomPicker');
    if (!picker) return;
    picker.innerHTML = ROOMS.map(r => `
      <div class="room-option ${state.roomId === r.id ? 'room--selected' : ''}"
           data-room="${r.id}" tabindex="0" role="button" aria-pressed="${state.roomId === r.id}">
        <div class="room-option__check">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <img src="${r.img}" alt="${r.name}" loading="lazy"/>
        <div class="room-option__body">
          <p class="room-option__name">${r.name}</p>
          <div class="room-option__price">$${r.price}<span style="font-size:11px; font-weight:500; color:rgba(251,246,238,.55);">/night</span></div>
        </div>
      </div>
    `).join('');

    // Click & keyboard selection
    $$('.room-option', picker).forEach(el => {
      const select = () => {
        state.roomId = el.getAttribute('data-room');
        $$('.room-option', picker).forEach(o => {
          const sel = o.getAttribute('data-room') === state.roomId;
          o.classList.toggle('room--selected', sel);
          o.setAttribute('aria-pressed', sel);
        });
        const errEl = $('#bm_roomError');
        if (errEl) errEl.style.display = 'none';
      };
      el.addEventListener('click', select);
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); } });
    });
  }

  function _renderSummary(step) {
    const targetId = step === 2 ? 'bookSummary1' : 'bookSummary2';
    const el = $(`#${targetId}`);
    if (!el) return;

    const room = ROOMS.find(r => r.id === state.roomId);
    const total = room ? room.price * state.nights : null;

    const items = [
      { label: 'Check-in',  value: _formatDate(state.checkin) },
      { label: 'Check-out', value: _formatDate(state.checkout) },
      { label: 'Nights',    value: `${state.nights}` },
      { label: 'Guests',    value: state.guests },
    ];

    if (room && step === 3) {
      items.push({ label: 'Room',  value: room.name });
      items.push({ label: 'Total est.', value: total ? `$${total}` : '—' });
    }

    el.innerHTML = items.map(i => `
      <div class="booking-summary__item">
        <span class="booking-summary__label">${i.label}</span>
        <span class="booking-summary__value">${i.value || '—'}</span>
      </div>
    `).join('');
  }

  function _formatDate(str) {
    if (!str) return '—';
    const d = new Date(str + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function _genRef() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let ref = 'LH-';
    for (let i = 0; i < 8; i++) ref += chars[Math.floor(Math.random() * chars.length)];
    return ref;
  }


  /* ─────────────────────────────────────────────────────────
     SUBMIT INQUIRY
     Replace this function body with your actual API call.
  ───────────────────────────────────────────────────────── */
  function _submitInquiry(btn) {
    // Simulate async submission
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<span class="btn-spinner"></span> Sending…';
    btn.disabled = true;

    setTimeout(() => {
      const ref = _genRef();
      const room = ROOMS.find(r => r.id === state.roomId);

      // Populate confirmation panel
      const refEl = $('#bookRef');
      if (refEl) refEl.textContent = `Reference: ${ref}`;

      const detailsEl = $('#bookConfirmDetails');
      if (detailsEl) {
        detailsEl.innerHTML = `
          <div class="booking-summary" style="margin-bottom:0;">
            <div class="booking-summary__item">
              <span class="booking-summary__label">Guest</span>
              <span class="booking-summary__value">${state.name}</span>
            </div>
            <div class="booking-summary__item">
              <span class="booking-summary__label">Check-in</span>
              <span class="booking-summary__value">${_formatDate(state.checkin)}</span>
            </div>
            <div class="booking-summary__item">
              <span class="booking-summary__label">Check-out</span>
              <span class="booking-summary__value">${_formatDate(state.checkout)}</span>
            </div>
            ${room ? `
            <div class="booking-summary__item">
              <span class="booking-summary__label">Room</span>
              <span class="booking-summary__value">${room.name}</span>
            </div>
            <div class="booking-summary__item">
              <span class="booking-summary__label">Est. Total</span>
              <span class="booking-summary__value">$${room.price * state.nights}</span>
            </div>
            ` : ''}
          </div>
        `;
      }

      btn.innerHTML = originalHTML;
      btn.disabled = false;
      _goToStep(4);
    }, 1200);
  }


  /* ─────────────────────────────────────────────────────────
     OPEN / CLOSE MODAL
  ───────────────────────────────────────────────────────── */

  function openBookingModal(prefill = {}) {
    const overlay = $('#bookingModalOverlay');
    if (!overlay) return;

    // Reset state + form
    Object.assign(state, { checkin: '', checkout: '', guests: '2', roomId: '', nights: 0, name: '', email: '', phone: '', requests: '' });

    // Pre-fill from hero card if dates were entered
    if (prefill.checkin)  { state.checkin  = prefill.checkin;  const el = $('#bm_checkin');  if (el) el.value = prefill.checkin; }
    if (prefill.checkout) { state.checkout = prefill.checkout; const el = $('#bm_checkout'); if (el) el.value = prefill.checkout; }
    if (prefill.guests)   { state.guests   = prefill.guests;   const el = $('#bm_guests');   if (el) el.value = prefill.guests;  }

    _goToStep(1);
    overlay.classList.add('modal--open');
    document.body.style.overflow = 'hidden';

    // Focus first input
    setTimeout(() => {
      const first = $('#bm_checkin');
      if (first) first.focus();
    }, 200);
  }

  function closeBookingModal() {
    const overlay = $('#bookingModalOverlay');
    if (!overlay) return;
    overlay.classList.remove('modal--open');
    document.body.style.overflow = '';
  }

  // Expose globally for other modules / inline handlers
  window.openBookingModal  = openBookingModal;
  window.closeBookingModal = closeBookingModal;


  /* ─────────────────────────────────────────────────────────
     EVENT WIRING  (runs after modal is appended to DOM)
  ───────────────────────────────────────────────────────── */

  function _wireEvents() {
    // Close button
    const closeBtn = $('#bookModalClose');
    if (closeBtn) closeBtn.addEventListener('click', closeBookingModal);

    // Overlay backdrop click
    const overlay = $('#bookingModalOverlay');
    if (overlay) {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) closeBookingModal();
      });
    }

    // Escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay && overlay.classList.contains('modal--open')) {
        closeBookingModal();
      }
    });

    // Step 1 → 2
    const s1Next = $('#step1Next');
    if (s1Next) s1Next.addEventListener('click', () => {
      if (_validateStep1()) _goToStep(2);
    });

    // Step 2 → back / next
    const s2Back = $('#step2Back');
    if (s2Back) s2Back.addEventListener('click', () => _goToStep(1));

    const s2Next = $('#step2Next');
    if (s2Next) s2Next.addEventListener('click', () => {
      if (_validateStep2()) _goToStep(3);
    });

    // Step 3 → back / submit
    const s3Back = $('#step3Back');
    if (s3Back) s3Back.addEventListener('click', () => _goToStep(2));

    const s3Submit = $('#step3Submit');
    if (s3Submit) s3Submit.addEventListener('click', () => {
      if (_validateStep3()) _submitInquiry(s3Submit);
    });

    // Done button on confirmation
    const doneBtn = $('#bookDone');
    if (doneBtn) doneBtn.addEventListener('click', closeBookingModal);

    // Any element with [data-open-booking] triggers the modal
    document.addEventListener('click', e => {
      const trigger = e.target.closest('[data-open-booking]');
      if (!trigger) return;

      // Read any pre-fill values from hero card inputs
      const prefill = {
        checkin:  ($('#hero_checkin')  || {}).value || '',
        checkout: ($('#hero_checkout') || {}).value || '',
        guests:   ($('#hero_guests')   || {}).value || '2',
      };
      openBookingModal(prefill);
    });
  }


  /* ─────────────────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────────────── */

  function init() {
    _buildModal();
    _wireEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
