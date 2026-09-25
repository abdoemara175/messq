/**
 * ====================================================================
 * MAIN JAVASCRIPT - "رائحة المسك"
 * Interactions, Sticky Header, Drawer Navigation & Call Tracking
 * ====================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  initStickyNavbar();
  initMobileDrawer();
  initSmoothScroll();
  initNavbarActiveScrollSpy();
  initWhatsAppForm();
  initServiceModal();
  initFaqAccordion();
});

/**
 * Sticky Navbar Elevation on Scroll
 */
function initStickyNavbar() {
  const navbar = document.querySelector('.navbar-wrapper');
  if (!navbar) return;

  const handleScroll = () => {
    if (window.scrollY > 20) {
      navbar.classList.add('is-scrolled');
    } else {
      navbar.classList.remove('is-scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Initial check
}

/**
 * Mobile Navigation Drawer Toggle & Accessibility
 */
function initMobileDrawer() {
  const toggleBtn = document.querySelector('.nav-toggle-btn');
  const drawer = document.querySelector('.mobile-drawer');
  const overlay = document.querySelector('.mobile-drawer-overlay');
  const closeBtn = document.querySelector('.drawer-close-btn');
  const drawerLinks = document.querySelectorAll('.drawer-nav-link');

  if (!drawer || !toggleBtn || !overlay) return;

  const openDrawer = () => {
    drawer.classList.add('is-open');
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    toggleBtn.setAttribute('aria-expanded', 'true');
  };

  const closeDrawer = () => {
    drawer.classList.remove('is-open');
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    toggleBtn.setAttribute('aria-expanded', 'false');
  };

  toggleBtn.addEventListener('click', () => {
    const isOpen = drawer.classList.contains('is-open');
    if (isOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeDrawer);
  }

  overlay.addEventListener('click', closeDrawer);

  drawerLinks.forEach((link) => {
    link.addEventListener('click', closeDrawer);
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
      closeDrawer();
    }
  });
}

/**
 * Smooth scrolling for internal anchor links
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || !targetId) return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = targetEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    });
  });
}

/**
 * Active Navbar Section Indicator (Scroll-Spy)
 * Synchronizes active tab state with currently visible section on scroll & click
 */
function initNavbarActiveScrollSpy() {
  const sectionIds = [
    'hero',
    'services',
    'equipment',
    'coverage',
    'why-us',
    'faq',
    'contact'
  ];

  const desktopLinks = document.querySelectorAll('.nav-menu .nav-link');
  const drawerLinks = document.querySelectorAll('.drawer-nav-list .drawer-nav-link');

  if (!desktopLinks.length && !drawerLinks.length) return;

  const navbar = document.querySelector('.navbar-wrapper');
  let isProgrammaticScroll = false;
  let scrollTimeout = null;
  let currentActiveId = null;

  function setActiveNavItem(activeId) {
    if (!activeId || activeId === currentActiveId) return;
    currentActiveId = activeId;

    desktopLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href === `#${activeId}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    drawerLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href === `#${activeId}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  function getActiveSection() {
    const scrollY = window.scrollY || window.pageYOffset;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;

    // 1. Top of page: always highlight hero
    if (scrollY < 80) {
      return 'hero';
    }

    // 2. Near bottom of page (footer / final CTA): always highlight contact
    if (windowHeight + scrollY >= docHeight - 80) {
      return 'contact';
    }

    // 3. Dynamic activation line: header height + comfortable offset into viewport
    const headerHeight = navbar ? navbar.offsetHeight : 74;
    const threshold = headerHeight + Math.min(windowHeight * 0.25, 160);

    let activeId = 'hero';

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (rect.top <= threshold) {
        activeId = id;
      }
    }

    return activeId;
  }

  let ticking = false;
  function onScroll() {
    if (isProgrammaticScroll) return;

    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (!isProgrammaticScroll) {
          const activeId = getActiveSection();
          setActiveNavItem(activeId);
        }
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  // Handle immediate visual feedback when any navigation link is clicked
  const allNavAnchors = document.querySelectorAll('.nav-menu a[href^="#"], .drawer-nav-list a[href^="#"]');
  allNavAnchors.forEach((anchor) => {
    anchor.addEventListener('click', function () {
      const href = this.getAttribute('href');
      if (href && href.startsWith('#')) {
        const id = href.substring(1);
        setActiveNavItem(id);

        isProgrammaticScroll = true;
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          isProgrammaticScroll = false;
          const finalActiveId = getActiveSection();
          setActiveNavItem(finalActiveId);
        }, 850);
      }
    });
  });

  // Initial detection on page load
  const initialId = getActiveSection();
  setActiveNavItem(initialId);
}

/**
 * ====================================================================
 * SHARED WHATSAPP SERVICE REQUEST FORM & GPS GEOLOCATION ENGINE
 * Powers both the Contact section form and the Service Request Modal
 * ====================================================================
 */
function setupServiceRequestForm(prefix = '', onSuccess = null) {
  const formId = prefix ? `${prefix}whatsapp-form` : 'whatsapp-request-form';
  const form = document.getElementById(formId);
  if (!form) return;

  const id = (name) => document.getElementById(prefix ? `${prefix}${name}` : name);

  // Form Fields
  const inputFullname = id('input-fullname');
  const inputPhone = id('input-phone');
  const selectArea = id('select-area');
  const selectService = id('select-service');
  const textareaNotes = id('textarea-notes');

  // Groups & Errors
  const groupFullname = id('group-fullname');
  const groupPhone = id('group-phone');
  const groupArea = id('group-area');
  const groupService = id('group-service');
  const groupGps = id('group-gps');

  const errorFullname = id('error-fullname');
  const errorPhone = id('error-phone');
  const errorArea = id('error-area');
  const errorService = id('error-service');
  const errorGps = id('error-gps');
  const formGeneralError = id('form-general-error');

  // GPS Elements
  const gpsCard = id('gps-card');
  const btnGetGps = id('btn-get-gps');
  const gpsBtnLabel = id('gps-btn-label');
  const gpsHelperMsg = id('gps-helper-msg');
  const gpsStatusIcon = id('gps-status-icon');

  // Submit Button
  const btnSubmit = id('btn-submit-whatsapp');
  const btnSubmitText = id('btn-submit-text');

  // State
  let userCoordinates = null;
  let isLocating = false;

  // Real-time validation cleaners
  if (inputFullname) {
    inputFullname.addEventListener('input', () => {
      clearFieldError(groupFullname, errorFullname);
    });
  }

  if (inputPhone) {
    inputPhone.addEventListener('input', (e) => {
      const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
      if (e.target.value !== cleaned) {
        e.target.value = cleaned;
      }
      clearFieldError(groupPhone, errorPhone);
    });
  }

  if (selectArea) {
    selectArea.addEventListener('change', () => {
      clearFieldError(groupArea, errorArea);
    });
  }

  if (selectService) {
    selectService.addEventListener('change', () => {
      clearFieldError(groupService, errorService);
    });
  }

  // GPS Location Handler
  if (btnGetGps) {
    btnGetGps.addEventListener('click', handleGetGps);
  }

  function handleGetGps() {
    if (isLocating) return;

    clearFieldError(groupGps, errorGps);
    if (formGeneralError) formGeneralError.style.display = 'none';

    if (!('geolocation' in navigator)) {
      showFieldError(groupGps, errorGps, 'المتصفح الحالي لا يدعم تحديد الموقع الجغرافي.');
      return;
    }

    isLocating = true;
    if (gpsCard) gpsCard.classList.add('is-loading');
    if (gpsBtnLabel) gpsBtnLabel.textContent = 'جاري تحديد موقعك الجغرافي...';
    if (gpsHelperMsg) gpsHelperMsg.textContent = 'يرجى تأكيد إذن الوصول إلى موقعك إذا ظهرت رسالة المتصفح.';
    if (gpsStatusIcon) {
      gpsStatusIcon.innerHTML = `
        <svg class="spin-animation" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
        </svg>
      `;
    }

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        isLocating = false;
        if (gpsCard) {
          gpsCard.classList.remove('is-loading');
          gpsCard.classList.add('is-success');
        }
        clearFieldError(groupGps, errorGps);

        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        userCoordinates = { lat, lng };

        if (gpsBtnLabel) gpsBtnLabel.textContent = 'تم تحديد موقعك بنجاح ✓';
        if (gpsHelperMsg) gpsHelperMsg.textContent = 'تم تسجيل موقعك وسيتم إرفاق رابط الخريطة مع الطلب عبر الواتساب.';
        if (gpsStatusIcon) {
          gpsStatusIcon.innerHTML = `
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#25d366" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          `;
        }
      },
      (error) => {
        isLocating = false;
        if (gpsCard) {
          gpsCard.classList.remove('is-loading');
          gpsCard.classList.remove('is-success');
        }
        userCoordinates = null;

        if (gpsBtnLabel) gpsBtnLabel.textContent = 'إعادة محاولة تحديد الموقع';
        if (gpsHelperMsg) gpsHelperMsg.textContent = 'سيتم استخدام موقعك لمشاركته مع الفني عبر واتساب.';
        if (gpsStatusIcon) {
          gpsStatusIcon.innerHTML = `
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          `;
        }

        let msg = 'تعذر تحديد موقعك حالياً. حاول مرة أخرى.';
        if (error.code === 1) { // PERMISSION_DENIED
          msg = 'لم نتمكن من الوصول إلى موقعك. يرجى السماح بالوصول إلى الموقع ثم المحاولة مرة أخرى.';
        } else if (error.code === 2) { // POSITION_UNAVAILABLE
          msg = 'تعذر تحديد موقعك حالياً. حاول مرة أخرى.';
        } else if (error.code === 3) { // TIMEOUT
          msg = 'استغرق تحديد الموقع وقتاً طويلاً. حاول مرة أخرى.';
        }

        showFieldError(groupGps, errorGps, msg);
      },
      geoOptions
    );
  }

  // Form Submit Handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (formGeneralError) formGeneralError.style.display = 'none';

    let isValid = true;
    let firstInvalidField = null;

    // 1. Fullname Validation
    const nameVal = inputFullname ? inputFullname.value.trim() : '';
    if (!nameVal || nameVal.length < 2) {
      showFieldError(groupFullname, errorFullname, 'يرجى كتابة الاسم الكامل.');
      isValid = false;
      if (!firstInvalidField) firstInvalidField = inputFullname;
    } else {
      clearFieldError(groupFullname, errorFullname);
    }

    // 2. Phone Validation (Saudi 05xxxxxxxx format: 10 digits)
    const phoneVal = inputPhone ? inputPhone.value.trim() : '';
    const saudiPhoneRegex = /^05\d{8}$/;
    if (!phoneVal || !saudiPhoneRegex.test(phoneVal)) {
      showFieldError(groupPhone, errorPhone, 'يرجى إدخال رقم جوال سعودي صحيح يتكون من 10 أرقام ويبدأ بـ 05 (مثال: 05xxxxxxxx).');
      isValid = false;
      if (!firstInvalidField) firstInvalidField = inputPhone;
    } else {
      clearFieldError(groupPhone, errorPhone);
    }

    // 3. Area Validation
    const areaVal = selectArea ? selectArea.value : '';
    if (!areaVal) {
      showFieldError(groupArea, errorArea, 'يرجى اختيار الحي في مكة المكرمة.');
      isValid = false;
      if (!firstInvalidField) firstInvalidField = selectArea;
    } else {
      clearFieldError(groupArea, errorArea);
    }

    // 4. Service Validation
    const serviceVal = selectService ? selectService.value : '';
    if (!serviceVal) {
      showFieldError(groupService, errorService, 'يرجى اختيار الخدمة المطلوبة.');
      isValid = false;
      if (!firstInvalidField) firstInvalidField = selectService;
    } else {
      clearFieldError(groupService, errorService);
    }

    // 5. GPS Location Validation
    if (!userCoordinates || !userCoordinates.lat || !userCoordinates.lng) {
      showFieldError(groupGps, errorGps, 'يرجى تحديد موقعك الحالي أولاً لإرسال الطلب.');
      isValid = false;
      if (!firstInvalidField) firstInvalidField = btnGetGps;
    } else {
      clearFieldError(groupGps, errorGps);
    }

    // If validation failed
    if (!isValid) {
      if (firstInvalidField) {
        firstInvalidField.focus();
        firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Prepare WhatsApp Message
    const originalBtnText = btnSubmitText ? btnSubmitText.textContent : 'إرسال الطلب عبر واتساب';
    if (btnSubmit) btnSubmit.classList.add('is-loading');
    if (btnSubmitText) btnSubmitText.textContent = 'جاري تجهيز الطلب...';

    const googleMapsUrl = `https://www.google.com/maps?q=${userCoordinates.lat},${userCoordinates.lng}`;
    const notesVal = textareaNotes ? textareaNotes.value.trim() : '';

    let message = `طلب خدمة جديد — رائحة المسك\n\n`;
    message += `الاسم: ${nameVal}\n\n`;
    message += `رقم الجوال: ${phoneVal}\n\n`;
    message += `الحي: ${areaVal}\n\n`;
    message += `الخدمة المطلوبة: ${serviceVal}\n\n`;
    message += `الموقع:\n${googleMapsUrl}`;

    if (notesVal) {
      message += `\n\nالملاحظات:\n${notesVal}`;
    }

    const whatsappTargetNumber = '966563440779';
    const whatsappUrl = `https://wa.me/${whatsappTargetNumber}?text=${encodeURIComponent(message)}`;

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');

    // Trigger success callback (e.g., close modal)
    if (typeof onSuccess === 'function') {
      setTimeout(() => {
        onSuccess();
      }, 600);
    }

    // Reset button state
    setTimeout(() => {
      if (btnSubmit) btnSubmit.classList.remove('is-loading');
      if (btnSubmitText) btnSubmitText.textContent = originalBtnText;
    }, 1200);
  });

  function showFieldError(groupEl, errorEl, msg) {
    if (groupEl) groupEl.classList.add('has-error');
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
    }
  }

  function clearFieldError(groupEl, errorEl) {
    if (groupEl) groupEl.classList.remove('has-error');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    }
  }
}

/**
 * ====================================================================
 * CONTACT SECTION FORM INITIALIZER
 * ====================================================================
 */
function initWhatsAppForm() {
  setupServiceRequestForm('', null);
}

/**
 * ====================================================================
 * SERVICE REQUEST MODAL CONTROLLER
 * Handles modal open, close, backdrop clicks, Escape key, and focus
 * ====================================================================
 */
function initServiceModal() {
  const modal = document.getElementById('service-request-modal');
  const openBtn = document.getElementById('btn-hero-open-modal');
  const closeBtn = document.getElementById('btn-close-modal');

  if (!modal || !openBtn) return;

  const openModal = () => {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus first input field
    const firstInput = document.getElementById('modal-input-fullname');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 120);
    }
  };

  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (openBtn) openBtn.focus();
  };

  openBtn.addEventListener('click', openModal);

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  // Backdrop click dismiss
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Escape key listener
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });

  // Initialize form inside modal with 'modal-' prefix and closeModal callback
  setupServiceRequestForm('modal-', closeModal);
}

/**
 * ====================================================================
 * FAQ ACCORDION INTERACTIVITY & ACCESSIBILITY
 * ====================================================================
 */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  if (!faqItems.length) return;

  faqItems.forEach((item) => {
    const trigger = item.querySelector('.faq-question-btn');
    const answer = item.querySelector('.faq-answer-collapse');

    if (!trigger || !answer) return;

    trigger.addEventListener('click', () => {
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

      if (isExpanded) {
        // Collapse
        trigger.setAttribute('aria-expanded', 'false');
        item.classList.remove('is-open');
        answer.style.maxHeight = null;
      } else {
        // Expand
        trigger.setAttribute('aria-expanded', 'true');
        item.classList.add('is-open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
}


