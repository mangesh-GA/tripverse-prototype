/* ============================================================
   TripVerse - Main JavaScript
   All interactive features: modals, forms, live updates, etc.
   ============================================================ */

'use strict';

/* ── Helpers ── */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ======================================================
   1. NAVBAR – Sticky scroll + mobile toggle
====================================================== */
function initNavbar() {
  const navbar = $('.navbar');
  if (!navbar) return;

  // Scroll shadow
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  // Mobile toggle
  const toggle  = $('.nav-toggle');
  const navLinks = $('.nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      toggle.classList.toggle('open');
    });
  }

  // Active link highlight
  const path = window.location.pathname.split('/').pop() || 'index.html';
  $$('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path) a.classList.add('active');
  });
}

/* ======================================================
   2. SCROLL FADE-IN ANIMATIONS
====================================================== */
function initScrollAnimations() {
  const elements = $$('.fade-in');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  elements.forEach(el => observer.observe(el));
}

/* ======================================================
   3. MODAL SYSTEM
====================================================== */
function openModal(id) {
  const overlay = $(`#${id}`);
  if (!overlay) return;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const overlay = $(`#${id}`);
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function initModals() {
  // Close on overlay click
  $$('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // Close buttons
  $$('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const overlay = btn.closest('.modal-overlay');
      if (overlay) closeModal(overlay.id);
    });
  });

  // ESC key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      $$('.modal-overlay.open').forEach(o => closeModal(o.id));
    }
  });

  // Open triggers
  $$('[data-modal]').forEach(trigger => {
    trigger.addEventListener('click', () => {
      openModal(trigger.dataset.modal);
    });
  });
}

/* ======================================================
   4. TOAST NOTIFICATIONS
====================================================== */
function showToast(message, type = 'success', duration = 3500) {
  let container = $('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || '✅'}</span> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all .3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ======================================================
   5. FORM VALIDATION
====================================================== */
function validateForm(form) {
  let valid = true;

  // Clear previous errors
  $$('.form-error', form).forEach(e => e.classList.remove('show'));
  $$('.form-control', form).forEach(c => c.style.borderColor = '');

  const fields = $$('[data-required]', form);
  fields.forEach(field => {
    if (!field.value.trim()) {
      valid = false;
      field.style.borderColor = '#ef4444';
      const errEl = field.nextElementSibling;
      if (errEl && errEl.classList.contains('form-error')) {
        errEl.classList.add('show');
      }
    }
  });

  // Email check
  const emailField = $('[type="email"]', form);
  if (emailField && emailField.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value)) {
    valid = false;
    emailField.style.borderColor = '#ef4444';
  }

  return valid;
}

function initForms() {
  $$('form[data-validate]').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (validateForm(form)) {
        const btn = $('[type="submit"]', form);
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="loader"></span> Processing...';
        btn.disabled = true;

        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.disabled = false;
          form.reset();

          // Close parent modal if any
          const modal = form.closest('.modal-overlay');
          if (modal) closeModal(modal.id);

          showToast(form.dataset.successMsg || 'Submitted successfully!', 'success');
        }, 1800);
      }
    });
  });
}

/* ======================================================
   6. PAYMENT MODAL
====================================================== */
function initPayment() {
  // Pay option selection
  $$('.pay-option').forEach(opt => {
    opt.addEventListener('click', () => {
      $$('.pay-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });

  // Pay confirm
  const payBtn = $('#confirm-pay');
  if (payBtn) {
    payBtn.addEventListener('click', () => {
      const selected = $('.pay-option.selected');
      if (!selected) {
        showToast('Please select a payment method', 'error');
        return;
      }
      payBtn.innerHTML = '<span class="loader"></span> Processing...';
      payBtn.disabled = true;

      setTimeout(() => {
        closeModal('pay-modal');
        showToast('Payment successful! Booking confirmed 🎉', 'success', 5000);
        payBtn.innerHTML = 'Pay Now';
        payBtn.disabled = false;
        $$('.pay-option').forEach(o => o.classList.remove('selected'));
      }, 2500);
    });
  }
}

/* ======================================================
   7. STAR RATING SYSTEM
====================================================== */
function initStarRating() {
  $$('.star-rating').forEach(container => {
    const stars = $$('.star', container);
    const input = $('input[type="hidden"]', container.closest('.form-group') || container.parentElement);

    stars.forEach((star, i) => {
      star.addEventListener('mouseenter', () => {
        stars.forEach((s, j) => s.classList.toggle('filled', j <= i));
      });
      star.addEventListener('mouseleave', () => {
        const val = input ? parseInt(input.value) - 1 : -1;
        stars.forEach((s, j) => s.classList.toggle('filled', j <= val));
      });
      star.addEventListener('click', () => {
        if (input) input.value = i + 1;
        stars.forEach((s, j) => s.classList.toggle('filled', j <= i));
      });
    });
  });
}

/* ======================================================
   8. LIVE STATUS SIMULATION
====================================================== */
function initLiveStatus() {
  // Update crowd bar widths after load
  setTimeout(() => {
    $$('.crowd-fill').forEach(bar => {
      const width = bar.classList.contains('low') ? 30
                  : bar.classList.contains('medium') ? 65 : 90;
      bar.style.width = width + '%';
    });
  }, 500);

  // Simulate live time updates
  function updateTimes() {
    $$('.live-time').forEach(el => {
      const now = new Date();
      const offset = parseInt(el.dataset.offset || 0);
      const d = new Date(now.getTime() + offset * 60000);
      el.textContent = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    });
  }
  updateTimes();
  setInterval(updateTimes, 30000);

  // Animate status dots
  $$('.status-dot').forEach(dot => {
    dot.style.animationDuration = (1.5 + Math.random()).toFixed(1) + 's';
  });
}

/* ======================================================
   9. FAQ ACCORDION
====================================================== */
function initFAQ() {
  $$('.faq-q').forEach(q => {
    q.addEventListener('click', () => {
      const answer = q.nextElementSibling;
      const isOpen = q.classList.contains('open');

      // Close all
      $$('.faq-q').forEach(other => {
        other.classList.remove('open');
        if (other.nextElementSibling) other.nextElementSibling.classList.remove('open');
      });

      if (!isOpen) {
        q.classList.add('open');
        if (answer) answer.classList.add('open');
      }
    });
  });
}

/* ======================================================
   10. LIVE CHAT SIMULATION
====================================================== */
function initChat() {
  const chatInput = $('#chat-input');
  const chatSend  = $('#chat-send');
  const chatMsgs  = $('#chat-messages');
  if (!chatInput || !chatSend || !chatMsgs) return;

  const botResponses = [
    "Thanks for reaching out! Let me look into that for you.",
    "I can help you with that. Could you please provide your booking ID?",
    "Our support team typically responds within 2 hours.",
    "Your refund request has been noted and will be processed in 5-7 business days.",
    "Is there anything else I can assist you with today?",
    "I've escalated this to a senior agent who will contact you shortly.",
    "Your ticket has been booked successfully. You'll receive a confirmation email.",
  ];

  function addMessage(text, type) {
    const div = document.createElement('div');
    div.className = `chat-bubble ${type}`;
    div.textContent = text;
    chatMsgs.appendChild(div);
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
  }

  function sendMessage() {
    const msg = chatInput.value.trim();
    if (!msg) return;
    addMessage(msg, 'user');
    chatInput.value = '';

    // Typing indicator
    setTimeout(() => {
      const typing = document.createElement('div');
      typing.className = 'chat-bubble bot';
      typing.textContent = 'Typing...';
      typing.id = 'typing-indicator';
      chatMsgs.appendChild(typing);
      chatMsgs.scrollTop = chatMsgs.scrollHeight;

      setTimeout(() => {
        typing.remove();
        const reply = botResponses[Math.floor(Math.random() * botResponses.length)];
        addMessage(reply, 'bot');
      }, 1200);
    }, 400);
  }

  chatSend.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') sendMessage();
  });
}

/* ======================================================
   11. FLIGHT TABS
====================================================== */
function initFlightTabs() {
  $$('.flight-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.flight-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
}

/* ======================================================
   12. DASHBOARD TABS
====================================================== */
function initDashTabs() {
  $$('.dash-nav a[data-tab]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      $$('.dash-nav a').forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      const targetId = link.dataset.tab;
      $$('.dash-panel').forEach(p => p.classList.add('hidden'));
      const target = $(`#${targetId}`);
      if (target) target.classList.remove('hidden');
    });
  });
}

/* ======================================================
   13. COUNTER ANIMATION (Stats)
====================================================== */
function animateCounters() {
  $$('.counter').forEach(el => {
    const target = parseInt(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    let count = 0;
    const step = Math.ceil(target / 60);

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        const timer = setInterval(() => {
          count = Math.min(count + step, target);
          el.textContent = count.toLocaleString() + suffix;
          if (count >= target) clearInterval(timer);
        }, 25);
        observer.disconnect();
      }
    }, { threshold: 0.5 });

    observer.observe(el);
  });
}

/* ======================================================
   14. FILE UPLOAD PREVIEW
====================================================== */
function initFileUpload() {
  $$('.file-upload').forEach(area => {
    const input = $('input[type="file"]', area);
    if (!input) return;

    area.addEventListener('click', () => input.click());
    area.addEventListener('dragover', e => {
      e.preventDefault();
      area.style.borderColor = 'var(--orange)';
    });
    area.addEventListener('dragleave', () => {
      area.style.borderColor = '';
    });
    area.addEventListener('drop', e => {
      e.preventDefault();
      input.files = e.dataTransfer.files;
      updateFileLabel(area, input);
    });
    input.addEventListener('change', () => updateFileLabel(area, input));
  });
}

function updateFileLabel(area, input) {
  const label = $('.file-label', area);
  if (!label) return;
  if (input.files.length > 0) {
    label.textContent = `📎 ${input.files[0].name}`;
    area.style.borderColor = 'var(--orange)';
    area.style.background = 'var(--orange-pale)';
  }
}

/* ======================================================
   15. REFUND TRACKER STEPS
====================================================== */
function initRefundTracker() {
  $$('.refund-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const steps = $$('.refund-step');
      const currentDone = steps.filter(s => s.classList.contains('done')).length;
      if (currentDone < steps.length) {
        steps[currentDone].classList.remove('active');
        steps[currentDone].classList.add('done');
        if (steps[currentDone + 1]) steps[currentDone + 1].classList.add('active');
        if (currentDone + 1 === steps.length) {
          showToast('Refund has been processed! ₹ will be credited in 5-7 days.', 'success', 5000);
        }
      }
    });
  });
}

/* ======================================================
   16. SMOOTH SCROLL for anchor links
====================================================== */
function initSmoothScroll() {
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = $(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/* ======================================================
   INIT ALL
====================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollAnimations();
  initModals();
  initForms();
  initPayment();
  initStarRating();
  initLiveStatus();
  initFAQ();
  initChat();
  initFlightTabs();
  initDashTabs();
  animateCounters();
  initFileUpload();
  initRefundTracker();
  initSmoothScroll();
});
