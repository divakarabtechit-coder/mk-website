import '../index.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

/**
 * Shared HTML website controller:
 * 1) Lenis smooth scroll + GSAP ScrollTrigger spatial choreography
 * 2) Pointer-driven 3D tilt + Z-depth specular sheen for all [data-3d-tilt] cards
 * 3) Header mobile drawer + Products dropdown
 * 4) Request Quote modal & inline Contact forms
 */
function initMotionArchitecture(): void {
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;

  const lenis = new Lenis({
    duration: 1.05,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  lenis.on('scroll', ScrollTrigger.update);

  const rafTick = (time: number) => {
    lenis.raf(time * 1000);
  };
  gsap.ticker.add(rafTick);
  gsap.ticker.lagSmoothing(0);

  // Choreograph non-hero sections smoothly using compositor properties only
  const sections = document.querySelectorAll<HTMLElement>('main > section:not(:first-child)');
  sections.forEach((sec) => {
    gsap.fromTo(
      sec,
      { y: 22, opacity: 0.92 },
      {
        y: 0,
        opacity: 1,
        duration: 0.55,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: sec,
          start: 'top 90%',
          once: true,
        },
      }
    );
  });

  window.addEventListener('beforeunload', () => {
    gsap.ticker.remove(rafTick);
    lenis.destroy();
  });
}

function init3DTiltCards(): void {
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const cards = document.querySelectorAll<HTMLElement>('[data-3d-tilt]');

  cards.forEach((card) => {
    const maxTilt = Number(card.dataset.maxTilt ?? 7);
    const depthLift = Number(card.dataset.depthLift ?? 12);

    card.style.transformStyle = 'preserve-3d';
    card.style.willChange = 'transform';

    // Ensure specular glare layer exists inside card
    let glare = card.querySelector<HTMLElement>('.mk-3d-glare');
    if (!glare) {
      glare = document.createElement('div');
      glare.className = 'mk-3d-glare pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-200';
      glare.style.opacity = '0';
      glare.setAttribute('aria-hidden', 'true');
      card.style.position = card.style.position || 'relative';
      card.prepend(glare);
    }

    card.addEventListener('pointermove', (e) => {
      if (reducedMotion) return;
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / Math.max(1, rect.width);
      const py = (e.clientY - rect.top) / Math.max(1, rect.height);
      const ry = (px - 0.5) * maxTilt * 2;
      const rx = (0.5 - py) * maxTilt * 2;

      card.style.transition = 'transform 90ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms ease';
      card.style.transform = `perspective(1100px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translate3d(0, -3px, ${depthLift}px)`;
      card.style.boxShadow = '0 22px 44px -18px rgba(15, 23, 42, 0.16), 0 8px 18px -10px rgba(200, 16, 46, 0.12)';
      if (glare) {
        glare.style.opacity = '1';
        glare.style.background = `radial-gradient(circle at ${(px * 100).toFixed(1)}% ${(py * 100).toFixed(1)}%, rgba(200, 16, 46, 0.06), rgba(255, 255, 255, 0) 64%)`;
      }
    });

    card.addEventListener('pointerleave', () => {
      card.style.transition = 'transform 340ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 340ms ease';
      card.style.transform = 'perspective(1100px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0)';
      card.style.boxShadow = '';
      if (glare) {
        glare.style.opacity = '0';
      }
    });
  });
}

function initHeaderNavigation(): void {
  const dropdownWrap = document.getElementById('products-dropdown-wrap');
  const dropdownBtn = document.getElementById('products-dropdown-btn');
  const dropdownMenu = document.getElementById('products-dropdown-menu');
  const dropdownChevron = document.getElementById('products-dropdown-chevron');

  const setDropdown = (open: boolean) => {
    if (!dropdownMenu || !dropdownBtn) return;
    dropdownMenu.classList.toggle('hidden', !open);
    dropdownBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (dropdownChevron) {
      dropdownChevron.classList.toggle('rotate-180', open);
      dropdownChevron.classList.toggle('text-[#C8102E]', open);
    }
  };

  if (dropdownWrap && dropdownBtn && dropdownMenu) {
    dropdownWrap.addEventListener('mouseenter', () => setDropdown(true));
    dropdownWrap.addEventListener('mouseleave', () => setDropdown(false));
    dropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = !dropdownMenu.classList.contains('hidden');
      setDropdown(!isOpen);
    });
    dropdownMenu.querySelectorAll<HTMLElement>('[role="menuitem"]').forEach((item) => {
      item.addEventListener('click', () => setDropdown(false));
    });
    document.addEventListener('mousedown', (e) => {
      if (!dropdownWrap.contains(e.target as Node)) setDropdown(false);
    });
  }

  const mobileBtn = document.getElementById('mobile-menu-btn');
  const mobileDrawer = document.getElementById('mobile-nav-drawer');
  const mobileOpenIcon = document.getElementById('mobile-icon-open');
  const mobileCloseIcon = document.getElementById('mobile-icon-close');

  const setMobile = (open: boolean) => {
    if (!mobileDrawer || !mobileBtn) return;
    mobileDrawer.classList.toggle('hidden', !open);
    mobileBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    mobileOpenIcon?.classList.toggle('hidden', open);
    mobileCloseIcon?.classList.toggle('hidden', !open);
  };

  mobileBtn?.addEventListener('click', () => {
    const isOpen = mobileDrawer && !mobileDrawer.classList.contains('hidden');
    setMobile(!isOpen);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      setDropdown(false);
      setMobile(false);
    }
  });
}

function initQuoteModal(): void {
  const modal = document.getElementById('quote-modal');
  if (!modal) return;

  const openTriggers = document.querySelectorAll<HTMLElement>('[data-open-quote]');
  const closeTriggers = modal.querySelectorAll<HTMLElement>('[data-close-quote]');
  const form = modal.querySelector<HTMLFormElement>('#quote-form');
  const formView = modal.querySelector<HTMLElement>('#quote-form-view');
  const successView = modal.querySelector<HTMLElement>('#quote-success-view');
  const errorBox = modal.querySelector<HTMLElement>('#quote-error');
  const resetBtn = modal.querySelector<HTMLElement>('#quote-reset-btn');

  const openModal = () => {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
  };

  openTriggers.forEach((btn) => btn.addEventListener('click', openModal));
  closeTriggers.forEach((btn) => btn.addEventListener('click', closeModal));

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameEl = form.querySelector<HTMLInputElement>('[name="name"]');
    const phoneEl = form.querySelector<HTMLInputElement>('[name="phone"]');
    const emailEl = form.querySelector<HTMLInputElement>('[name="email"]');
    const name = nameEl?.value.trim() ?? '';
    const phone = phoneEl?.value.trim() ?? '';
    const email = emailEl?.value.trim() ?? '';

    if (!name || !phone || !email) {
      if (errorBox) {
        errorBox.textContent = 'Please provide your name, phone number, and work email.';
        errorBox.classList.remove('hidden');
      }
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (errorBox) {
        errorBox.textContent = 'Please enter a valid work email address.';
        errorBox.classList.remove('hidden');
      }
      return;
    }

    errorBox?.classList.add('hidden');
    formView?.classList.add('hidden');
    successView?.classList.remove('hidden');
  });

  resetBtn?.addEventListener('click', () => {
    form?.reset();
    errorBox?.classList.add('hidden');
    successView?.classList.add('hidden');
    formView?.classList.remove('hidden');
    closeModal();
  });
}

function initContactForms(): void {
  const forms = document.querySelectorAll<HTMLFormElement>('[data-contact-form]');
  forms.forEach((form) => {
    const wrapper = form.closest('[data-contact-wrapper]');
    const successEl = wrapper?.querySelector<HTMLElement>('[data-contact-success]');
    const errorEl = form.querySelector<HTMLElement>('[data-contact-error]');
    const senderSpan = wrapper?.querySelector<HTMLElement>('[data-contact-sender]');
    const againBtn = wrapper?.querySelector<HTMLElement>('[data-contact-again]');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.querySelector<HTMLInputElement>('[name="name"]')?.value.trim() ?? '';
      const email = form.querySelector<HTMLInputElement>('[name="email"]')?.value.trim() ?? '';
      const msg = form.querySelector<HTMLTextAreaElement>('[name="message"]')?.value.trim() ?? '';

      if (!name || !email || !msg) {
        if (errorEl) {
          errorEl.textContent = 'Please fill in your name, email address, and inquiry details.';
          errorEl.classList.remove('hidden');
        }
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (errorEl) {
          errorEl.textContent = 'Please enter a valid work email address.';
          errorEl.classList.remove('hidden');
        }
        return;
      }

      errorEl?.classList.add('hidden');
      if (senderSpan) senderSpan.textContent = name;
      form.classList.add('hidden');
      successEl?.classList.remove('hidden');
    });

    const presetButtons = document.querySelectorAll<HTMLElement>('[data-prefill-spec]');
    const messageField = form.querySelector<HTMLTextAreaElement>('[name="message"]');
    presetButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const specText = btn.dataset.prefillSpec;
        if (!specText || !messageField) return;
        messageField.value = `Requesting pricing & availability for: ${specText}\nTarget Delivery City: `;
        messageField.focus();
        presetButtons.forEach((b) => {
          const active = b === btn;
          b.classList.toggle('border-[#C8102E]', active);
          b.classList.toggle('bg-red-50/40', active);
          b.classList.toggle('border-slate-200', !active);
        });
      });
    });

    againBtn?.addEventListener('click', () => {
      form.reset();
      errorEl?.classList.add('hidden');
      successEl?.classList.add('hidden');
      form.classList.remove('hidden');
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initMotionArchitecture();
  init3DTiltCards();
  initHeaderNavigation();
  initQuoteModal();
  initContactForms();
});
