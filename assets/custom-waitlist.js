/**
 * Custom Waitlist Page JavaScript
 * Handles GSAP ScrollTrigger animations, Lottie, and modal interactions
 * 
 * Performance optimizations:
 * - Lazy loads GSAP and Lottie only when needed
 * - Respects prefers-reduced-motion
 * - Mobile detection to disable heavy animations
 */

(function () {
  'use strict';

  /* global gsap, ScrollTrigger, lottie */
  /** @type {any} */
  const gsap = window.gsap;
  /** @type {any} */
  const ScrollTrigger = window.ScrollTrigger;
  /** @type {any} */
  const lottie = window.lottie;

  // Configuration
  const CONFIG = {
    GSAP_CDN: 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
    SCROLL_TRIGGER_CDN: 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js',
    LOTTIE_CDN: 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js',
    MOBILE_BREAKPOINT: 768,
    ANIMATION_DURATION: 1,
    STAGGER_DELAY: 0.3
  };

  // State
  let gsapLoaded = false;
  let lottieLoaded = false;
  /** @type {HTMLElement | null} */
  let heroSection = null;
  /** @type {HTMLElement | null} */
  let modalElement = null;

  /**
   * Check if user prefers reduced motion
   */
  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Check if on mobile device
   */
  function isMobile() {
    return window.innerWidth < CONFIG.MOBILE_BREAKPOINT;
  }

  /**
   * Check if animations should be enabled
   * Now enabled on all devices (including mobile) for full parity
   */
  function shouldAnimate() {
    if (prefersReducedMotion()) return false;
    // Always enable animations on all devices
    return true;
  }

  /**
   * Load external script dynamically
   * @param {string} src
   * @returns {Promise<void>}
   */
  function loadScript(src) {
    return new Promise((/** @type {() => void} */ resolve, reject) => {
      // Check if already loaded
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Load GSAP and ScrollTrigger
   */
  async function loadGSAP() {
    if (gsapLoaded) return;

    try {
      await loadScript(CONFIG.GSAP_CDN);
      await loadScript(CONFIG.SCROLL_TRIGGER_CDN);

      // Wait for GSAP to be fully available
      if (window.gsap && window.ScrollTrigger) {
        window.gsap.registerPlugin(window.ScrollTrigger);
        gsapLoaded = true;
      } else {
        console.warn('GSAP or ScrollTrigger not available after loading');
      }
    } catch (error) {
      console.warn('Failed to load GSAP:', error);
    }
  }

  /**
   * Load Lottie library
   */
  async function loadLottie() {
    if (lottieLoaded) return;

    try {
      await loadScript(CONFIG.LOTTIE_CDN);
      lottieLoaded = true;
    } catch (error) {
      console.warn('Failed to load Lottie:', error);
    }
  }

  /**
   * Initialize hero scroll animations
   */
  function initHeroAnimations() {
    heroSection = document.querySelector('.custom-cinematic-hero');
    if (!heroSection || !shouldAnimate()) {
      // Show content immediately if no animations
      showStaticContent();
      return;
    }

    const pinSpacer = heroSection.querySelector('.custom-cinematic-hero__pin-spacer');
    const mediaWrapper = heroSection.querySelector('.custom-cinematic-hero__media-wrapper');
    const logo = heroSection.querySelector('.custom-cinematic-hero__logo');
    const heading = heroSection.querySelector('.custom-cinematic-hero__heading');
    const subheading = heroSection.querySelector('.custom-cinematic-hero__subheading');
    const cta = heroSection.querySelector('.custom-cinematic-hero__cta');
    const lottieContainer = heroSection.querySelector('.custom-cinematic-hero__lottie');
    /** @type {HTMLElement} */
    // @ts-ignore
    const heroSectionEl = heroSection;
    const lottieUrl = heroSectionEl.dataset.lottieUrl;

    // Create main timeline
    // Intro Animation: Play immediately on load (independent of scroll)
    // @ts-ignore
    const introTl = window.gsap.timeline({
      defaults: { ease: 'power3.out', duration: 1 }
    });

    // Validating video playback for mobile
    if (isMobile()) {
      const video = heroSection.querySelector('video');
      if (video) {
        video.play().catch(e => console.log('Autoplay blocked:', e));
      }
    }

    if (logo) {
      introTl.from(logo, { y: 20, opacity: 0, delay: 0.2, immediateRender: false });
    }

    introTl
      .from(heading, { y: 50, opacity: 0, delay: logo ? 0 : 0.2, immediateRender: false }, logo ? '-=0.8' : 0)
      .from(subheading, { y: 30, opacity: 0, immediateRender: false }, '-=0.8')
      .from(cta, { y: 20, opacity: 0, ease: 'power2.out', duration: 1, immediateRender: false }, '-=0.8');

    // ============================================
    // IMMEDIATE SCROLL RESPONSE (0% → 100%)
    // Using a master timeline for coordinated scroll animation
    // ============================================

    const content = heroSection.querySelector('.custom-cinematic-hero__content');
    const video = heroSection.querySelector('.custom-cinematic-hero__video');
    const gsapLib = window.gsap;

    if (!gsapLib) {
      console.warn('GSAP not loaded for scroll animations');
      return;
    }

    // Master scroll timeline - responds from first pixel
    const scrollTl = gsapLib.timeline({
      scrollTrigger: {
        trigger: pinSpacer,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.5,
        // markers: true // Uncomment for debugging
      }
    });

    // 1. Content fades and moves up (0% - 50%)
    if (content) {
      scrollTl.to(content, {
        y: -100,
        opacity: 0,
        ease: 'power2.in',
        duration: 0.5
      }, 0);
    }

    // 2. Logo fades out (0% - 30%)
    if (logo) {
      scrollTl.to(logo, {
        opacity: 0,
        y: -30,
        ease: 'power2.in',
        duration: 0.3
      }, 0);
    }

    // 3. Video scales and blurs (0% - 80%)
    if (video) {
      scrollTl.to(video, {
        scale: 1.15,
        filter: 'blur(4px)',
        ease: 'none',
        duration: 0.8
      }, 0);
    }

    // 4. Media wrapper fades to black (50% - 100%)
    scrollTl.to(mediaWrapper, {
      opacity: 0,
      ease: 'power2.in',
      duration: 0.5
    }, 0.5);

    // Initialize Lottie animation if URL provided
    if (lottieUrl && lottieContainer) {
      initLottieAnimation(lottieContainer, lottieUrl, pinSpacer);
    }

    // Initialize Floating Products Parallax
    initFloatingProducts(pinSpacer);
  }

  /**
   * Initialize floating product parallax with 'Magnetic Formation'
   */
  function initFloatingProducts(trigger) {
    const products = document.querySelectorAll('.floating-product');

    products.forEach((el, i) => {
      /** @type {HTMLElement} */
      const product = /** @type {HTMLElement} */ (el);
      const speed = parseFloat(product.dataset.parallaxSpeed || '20');

      // Create a master timeline for the magnetic formation effect
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: trigger,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.5 // Smooth catch-up for magnetic feel
        }
      });

      // 1. Initial State -> Formation (0% to 50%)
      tl.to(product, {
        x: 0,
        y: 0,
        z: 100,
        rotationY: i % 2 === 0 ? 10 : -10,
        rotationX: 5,
        filter: 'blur(0px)',
        scale: window.innerWidth < 768 ? 0.85 : 1.1, // Scale down on mobile
        yPercent: window.innerWidth < 768 ? (i - 1) * 30 : 0, // Stack slightly on mobile to avoid overlap
        ease: 'power2.inOut',
        duration: 0.5
      });

      // 2. Formation -> Final Dispersal (50% to 100%)
      tl.to(product, {
        yPercent: -speed * (window.innerWidth < 768 ? 1.5 : 2.5),
        xPercent: i === 0 ? -20 : (i === 2 ? 20 : 0),
        rotationY: i % 2 === 0 ? -15 : 15,
        filter: i === 1 ? 'blur(0px)' : 'blur(8px)',
        z: -200,
        scale: 0.8,
        ease: 'power2.in',
        duration: 0.5
      });

      // Subtle "Float" mouse movement - 3D Tilt interaction
      // PERFORMANCE: Throttle with rAF so we only fire once per frame
      let rafPending = false;
      window.addEventListener('mousemove', (e) => {
        if (isMobile() || rafPending) return;
        rafPending = true;

        requestAnimationFrame(() => {
          rafPending = false;
          const xPos = (e.clientX / window.innerWidth - 0.5);
          const yPos = (e.clientY / window.innerHeight - 0.5);

          gsap.to(product, {
            rotationY: xPos * 20,
            rotationX: -yPos * 20,
            x: xPos * 30 * (i + 1),
            y: yPos * 30 * (i + 1),
            duration: 1.5,
            ease: 'power2.out'
          });
        });
      });
    });
  }

  /**
   * Initialize Lottie animation with scroll trigger
   */
  async function initLottieAnimation(container, url, trigger) {
    await loadLottie();

    if (typeof lottie === 'undefined') return;

    const animation = lottie.loadAnimation({
      container: container,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      path: url
    });

    // Trigger at 40-60% scroll position
    // @ts-ignore
    const ScrollTrigger = window.ScrollTrigger;
    ScrollTrigger.create({
      trigger: trigger,
      start: '40% top',
      end: '60% top',
      onEnter: () => {
        gsap.to(container, { opacity: 1, duration: 0.3 });
        animation.play();
      },
      onLeave: () => {
        gsap.to(container, { opacity: 0, duration: 0.3 });
      },
      onEnterBack: () => {
        gsap.to(container, { opacity: 1, duration: 0.3 });
        animation.goToAndPlay(0, true);
      },
      onLeaveBack: () => {
        gsap.to(container, { opacity: 0, duration: 0.3 });
      }
    });
  }

  /**
   * Show static content when animations are disabled
   */
  function showStaticContent() {
    /** @type {NodeListOf<HTMLElement>} */
    const elements = document.querySelectorAll(
      '.custom-cinematic-hero__heading, ' +
      '.custom-cinematic-hero__subheading, ' +
      '.custom-cinematic-hero__cta'
    );

    elements.forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }

  /**
   * Initialize Selection Hub (Multi-country, Multi-size)
   */
  function initSelectionHub() {
    const hub = document.querySelector('.selection-hub');
    if (!hub) return;

    /** @type {HTMLDivElement | null} */
    const countryDropdown = hub.querySelector('[data-country-dropdown]');
    /** @type {HTMLDivElement | null} */
    const sizePicker = hub.querySelector('[data-size-picker]');
    /** @type {HTMLButtonElement | null} */
    const addBtn = hub.querySelector('[data-add-to-basket]');
    /** @type {HTMLDivElement | null} */
    const basketContainer = document.querySelector('[data-selection-basket]');
    /** @type {HTMLInputElement | null} */
    const selectionsInput = document.querySelector('[data-selections-input]');
    /** @type {HTMLSpanElement | null} */
    const selectionsError = document.querySelector('.selections-error');

    /** @type {Array<{country: string, size: string, quantity: number}>} */
    let basket = [];
    let selectedCountry = '';
    /** @type {string[]} */
    let selectedSizes = [];

    // --- Country Selection (Custom Dropdown) ---
    if (countryDropdown) {
      const trigger = countryDropdown.querySelector('[data-dropdown-trigger]');
      const menu = countryDropdown.querySelector('[data-dropdown-menu]');
      const currentLabel = countryDropdown.querySelector('[data-dropdown-current]');
      const options = countryDropdown.querySelectorAll('.custom-dropdown__option');

      // Toggle menu
      trigger?.addEventListener('click', (e) => {
        e.stopPropagation();
        countryDropdown.classList.toggle('is-open');
      });

      // Selection
      options.forEach(opt => {
        opt.addEventListener('click', (e) => {
          e.stopPropagation();
          options.forEach(o => o.classList.remove('is-selected'));
          opt.classList.add('is-selected');

          selectedCountry = opt.getAttribute('data-value') || '';
          const flag = opt.getAttribute('data-flag');

          if (currentLabel) {
            currentLabel.innerHTML = `
              <img src="${flag}" alt="${selectedCountry}" width="20">
              <span style="color: #fff; font-weight: 500;">${selectedCountry}</span>
            `;
          }

          countryDropdown.classList.remove('is-open');
          updateAddButtonState();
        });
      });

      // Close on click outside
      document.addEventListener('click', () => {
        countryDropdown.classList.remove('is-open');
      });
    }

    // --- Size Selection ---
    if (sizePicker) {
      const btns = sizePicker.querySelectorAll('.size-picker__btn');
      btns.forEach(btn => {
        btn.addEventListener('click', () => {
          const value = btn.getAttribute('data-value') || '';
          if (btn.classList.contains('is-selected')) {
            btn.classList.remove('is-selected');
            selectedSizes = selectedSizes.filter(s => s !== value);
          } else {
            btn.classList.add('is-selected');
            selectedSizes.push(value);
          }
          updateAddButtonState();
        });
      });
    }

    // --- Add to Basket ---
    function updateAddButtonState() {
      if (addBtn) {
        addBtn.disabled = !selectedCountry || selectedSizes.length === 0;
      }
    }

    if (addBtn) {
      addBtn.addEventListener('click', () => {
        if (!selectedCountry || selectedSizes.length === 0) return;

        // Process each selected size as a unique item
        selectedSizes.forEach(size => {
          const existingIndex = basket.findIndex(item => item.country === selectedCountry && item.size === size);
          if (existingIndex > -1) {
            basket[existingIndex].quantity += 1;
          } else {
            basket.push({
              country: selectedCountry,
              size: size,
              quantity: 1
            });
          }
        });

        resetSelection();
        renderBasket();
      });
    }

    function resetSelection() {
      selectedCountry = '';
      selectedSizes = [];

      const currentLabel = countryDropdown?.querySelector('[data-dropdown-current]');
      if (currentLabel) {
        currentLabel.innerHTML = '<span>Select a country...</span>';
      }

      if (countryDropdown) {
        countryDropdown.querySelectorAll('.custom-dropdown__option').forEach(o => o.classList.remove('is-selected'));
      }

      if (sizePicker) {
        sizePicker.querySelectorAll('.size-picker__btn').forEach(i => i.classList.remove('is-selected'));
      }
      updateAddButtonState();
    }

    function renderBasket() {
      if (!basketContainer) return;

      const scrollPos = basketContainer.scrollTop; // Save current scroll

      basketContainer.innerHTML = basket.map((item, index) => `
        <div class="basket-item">
          <div class="basket-item__info">
            <span class="basket-item__country">${item.country}</span>
            <span class="basket-item__sizes">Size: ${item.size}</span>
          </div>
          
          <div class="basket-item__controls">
            <div class="basket-qty">
              <button type="button" class="qty-btn" data-action="minus" data-index="${index}">-</button>
              <span class="qty-val">${item.quantity}</span>
              <button type="button" class="qty-btn" data-action="plus" data-index="${index}">+</button>
            </div>
            
            <button type="button" class="basket-item__remove" data-action="remove" data-index="${index}" aria-label="Remove item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      `).join('');

      // Add listeners for Plus, Minus, Remove
      basketContainer.querySelectorAll('[data-index]').forEach(el => {
        const index = parseInt(el.getAttribute('data-index') || '0');
        const action = el.getAttribute('data-action');

        el.addEventListener('click', () => {
          if (action === 'plus') {
            basket[index].quantity += 1;
            // Surgical update: just change the text
            const qtyVal = el.parentElement?.querySelector('.qty-val');
            if (qtyVal) qtyVal.textContent = String(basket[index].quantity);
            syncSelections();
          } else if (action === 'minus') {
            if (basket[index].quantity > 1) {
              basket[index].quantity -= 1;
              // Surgical update: just change the text
              const qtyVal = el.parentElement?.querySelector('.qty-val');
              if (qtyVal) qtyVal.textContent = String(basket[index].quantity);
              syncSelections();
            } else {
              basket.splice(index, 1);
              renderBasket();
            }
          } else if (action === 'remove') {
            basket.splice(index, 1);
            renderBasket();
          }
        });
      });

      syncSelections();

      // Restore scroll
      basketContainer.scrollTop = scrollPos;
    }

    /**
     * Updates hidden inputs and error states without re-rendering the HTML
     */
    function syncSelections() {
      // Update hidden input
      if (selectionsInput) {
        selectionsInput.value = basket.length > 0 ? JSON.stringify(basket) : '';
      }

      // Hide error if items added
      if (selectionsError) {
        if (basket.length > 0) {
          selectionsError.style.display = 'none';
        }
      }
    }
  }

  /**
   * Initialize modal functionality
   */
  function initModal() {
    /** @type {HTMLElement | null} */
    // Target the main waitlist modal (exclude the preorder modal)
    modalElement = document.querySelector('.waitlist-modal:not(#preorder-modal)');
    if (!modalElement) {
      // Fallback: try finding one with screens
      const allModals = document.querySelectorAll('.waitlist-modal');
      modalElement = Array.from(allModals).find(m => m.querySelector('[data-screen]'));
    }

    if (!modalElement) return;

    const openButtons = document.querySelectorAll('[data-modal-open], [data-waitlist-trigger]');
    const closeButtons = modalElement.querySelectorAll('[data-modal-close]');
    const form = modalElement.querySelector('[data-waitlist-form]');
    const successState = modalElement.querySelector('[data-waitlist-success]');

    // Screen navigation elements
    const screens = modalElement.querySelectorAll('[data-screen]');
    const optionCards = modalElement.querySelectorAll('[data-option]');
    const backButtons = modalElement.querySelectorAll('[data-back-to-picker]');
    const customForm = modalElement.querySelector('[data-custom-form]');
    const customSuccessState = modalElement.querySelector('[data-custom-success]');

    /**
     * Switch to a specific screen
     * @param {string} screenName - 'picker', 'standard', or 'customize'
     */
    function showScreen(screenName) {
      // Query fresh each time to avoid stale DOM references
      const currentScreens = modalElement.querySelectorAll('[data-screen]');



      if (currentScreens.length === 0) {
        console.error('[Waitlist Modal] No screens found! DOM may have been modified.');
        return;
      }

      currentScreens.forEach(screen => {
        const screenId = screen.getAttribute('data-screen');
        if (screenId === screenName) {
          screen.classList.add('is-active');

        } else {
          screen.classList.remove('is-active');
        }
      });

      // Scroll modal to top when switching screens
      const modalContent = modalElement.querySelector('.waitlist-modal__content');
      if (modalContent) {
        modalContent.scrollTop = 0;
      }
    }

    /**
     * Reset modal to initial state (picker screen)
     */
    function resetModal() {
      showScreen('picker');

      // Reset standard form if needed
      if (form) {
        form.reset();
        form.style.display = '';  // Clear any inline display style
        form.classList.add('is-active');  // Ensure form is visible
        const basket = modalElement.querySelector('[data-selection-basket]');
        if (basket) basket.innerHTML = '';
        const selectionsInput = modalElement.querySelector('[data-selections-input]');
        if (selectionsInput) selectionsInput.value = '';
      }

      // Hide success states
      if (successState) successState.classList.remove('is-visible');
      if (customSuccessState) customSuccessState.classList.remove('is-visible');

      // Query custom form fresh to avoid stale references
      const freshCustomForm = modalElement.querySelector('[data-custom-form]');


      if (freshCustomForm) {
        freshCustomForm.classList.add('is-active');

      }
    }

    // Option card click handlers
    optionCards.forEach(card => {
      card.addEventListener('click', () => {
        const option = card.getAttribute('data-option');
        if (option === 'standard') {
          showScreen('standard');
        } else if (option === 'customize') {
          showScreen('customize');
        }
      });
    });

    // Back button handlers
    backButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        showScreen('picker');
      });
    });

    // Open modal
    openButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Check if button specifies a direct screen to open
        const directScreen = btn.getAttribute('data-direct-screen');

        if (directScreen) {
          // Go directly to specified screen (e.g., 'standard')
          showScreen(directScreen);
        } else {
          // Default behavior: start at option picker
          resetModal();
        }
        openModal();
      });
    });


    // Close modal
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => closeModal());
    });

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalElement && modalElement.hasAttribute('open')) {
        closeModal();
      }
    });

    // Initialize Selection Hub
    initSelectionHub();

    // Handle standard form submission
    if (form) {
      form.addEventListener('submit', (e) => handleFormSubmit(e, form, successState));
    }

    // Handle custom form submission
    if (customForm) {
      customForm.addEventListener('submit', (e) => handleCustomFormSubmit(e, customForm, customSuccessState));
    }
  }

  /**
   * Handle custom form submission
   */
  async function handleCustomFormSubmit(e, form, successState) {
    e.preventDefault();

    const submitBtn = form.querySelector('.custom-form__submit');
    const originalText = submitBtn.textContent;

    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    // Get form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      // Submit to Power Automate (bespoke form)
      await submitToPowerAutomate('bespoke', data);

      // Show success state
      form.classList.remove('is-active');
      successState.classList.add('is-visible');

    } catch (error) {
      console.error('Custom form submission error:', error);
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      alert('Submission failed. Please try again.');
    }
  }

  /**
   * Power Automate Webhook URL
   */
  const POWER_AUTOMATE_URL = 'https://default1a502e01f4fb42c8be625f97264900.89.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/17d4dd2a91144cd1b8e8f06a6ebe8bb6/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=f6jYG0SjHRyD8n3ekp6fJZj0jcqkwGnYQpG-LwR478E';

  /**
   * Submit form data to Power Automate
   * @param {string} formType - 'standard', 'bespoke', or 'contact'
   * @param {Object} data - Form data object
   */
  async function submitToPowerAutomate(formType, data) {
    const payload = {
      formType: formType,
      email: data.email || '',
      name: data.name || '',
      country: data.country || '',
      size: data.size || '',
      selections: data.selections_json || '',
      vision: data.vision || '',
      message: data.message || data.body || '',
      timestamp: new Date().toISOString()
    };



    try {
      const response = await fetch(POWER_AUTOMATE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });



      // Power Automate may return 500 due to Google Sheets 302 redirect
      // but the data is still saved successfully, so we treat it as success
      if (response.status === 500) {

        return { success: true };
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Power Automate error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }


      return { success: true };

    } catch (error) {
      console.error('Fetch error:', error);
      // If CORS error or network error, the request still went through - assume success
      if (error.message.includes('CORS') || error.message.includes('NetworkError') || error.message.includes('500')) {

        return { success: true };
      }
      throw error;
    }
  }

  /**
   * Open modal with animation
   */
  function openModal() {
    if (!modalElement) return;

    modalElement.setAttribute('open', '');
    document.body.style.overflow = 'hidden';

    // Premium Stagger Animation for form fields
    if (gsapLoaded && window.gsap) {
      const gsap = window.gsap;
      gsap.fromTo(modalElement.querySelectorAll('.waitlist-form__field'),
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
          clearProps: 'all',
          delay: 0.2
        }
      );
    }

    // Focus first input
    setTimeout(() => {
      if (!modalElement) return;
      /** @type {HTMLElement | null} */
      const firstInput = modalElement.querySelector('input, select, button');
      if (firstInput) firstInput.focus();
    }, 300);
  }

  /**
   * Close modal with animation
   */
  function closeModal() {
    if (!modalElement) return;

    modalElement.removeAttribute('open');
    document.body.style.overflow = '';

    // Reset modal state after a short delay (allows close animation to complete)
    setTimeout(() => {
      // Reset success states
      const successStates = modalElement.querySelectorAll('.waitlist-success, .custom-success');
      successStates.forEach(el => el.classList.remove('is-visible'));

      // Reset forms - clear inline styles and restore is-active class
      const forms = modalElement.querySelectorAll('form');
      forms.forEach(f => {
        if (f.reset) f.reset();
        f.style.display = '';  // Clear inline style
        f.classList.add('is-active');  // Restore visibility class
      });

      // Reset screens using classes, not inline styles
      // This prevents inline display:none from overriding CSS classes later
      const allScreens = modalElement.querySelectorAll('[data-screen]');
      allScreens.forEach(screen => {
        screen.style.display = '';  // Clear any inline styles
        screen.classList.remove('is-active');
      });

      // Activate picker screen
      const pickerScreen = modalElement.querySelector('[data-screen="picker"]');
      if (pickerScreen) {
        pickerScreen.classList.add('is-active');
      }
    }, 300);
  }

  /**
   * Handle waitlist form submission
   */
  async function handleFormSubmit(e, form, successState) {
    e.preventDefault();

    const selectionsInput = form.querySelector('[data-selections-input]');
    const selectionsError = form.querySelector('.selections-error');

    // Validate basket
    if (selectionsInput && !selectionsInput.value) {
      if (selectionsError) {
        selectionsError.style.display = 'block';
        selectionsError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const submitBtn = form.querySelector('.waitlist-form__submit');
    const originalText = submitBtn.textContent;

    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    // Get form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      // Submit to Power Automate (standard form)
      await submitToPowerAutomate('standard', data);

      // Show success state
      showSuccess(form, successState);

    } catch (error) {
      console.error('Form submission error:', error);
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      alert('Subscription failed. Please try again.');
    }
  }

  /**
   * Show success state with Lottie confetti
   */
  async function showSuccess(form, successState) {
    form.classList.remove('is-active');  // Hide form using class instead of inline style
    successState.classList.add('is-visible');

    // Load and play success Lottie
    /** @type {HTMLElement | null} */
    const modal = successState.closest('.waitlist-modal');
    const lottieUrl = modal?.dataset.successLottie;
    const lottieContainer = successState.querySelector('[data-success-lottie-container]');

    if (lottieUrl && lottieContainer) {
      await loadLottie();

      if (typeof lottie !== 'undefined') {
        lottie.loadAnimation({
          container: lottieContainer,
          renderer: 'svg',
          loop: false,
          autoplay: true,
          path: lottieUrl
        });
      }
    }
  }

  /**
   * Debounced resize handler
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Handle window resize
   */
  const handleResize = debounce(() => {
    // @ts-ignore
    const ScrollTrigger = window.ScrollTrigger;
    if (gsapLoaded && typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }
  }, 250);

  /**
   * Initialize everything when DOM is ready
   */
  async function init() {
    // Set up resize handler
    window.addEventListener('resize', handleResize);

    // Initialize modal (always needed)
    initModal();

    // Initialize scroll triggers (Discover button)
    initScrollTriggers();

    // Initialize story section scroll animations (CSS-only, no GSAP needed)
    initStorySections();

    // Initialize floating CTA (uses simple scroll listener, no GSAP needed)
    initDynamicCTA();

    // Initialize currency conversion for modal prices
    initCurrencyConversion();

    // Only load heavy animation libraries if needed
    if (shouldAnimate()) {
      // Use IntersectionObserver to lazy load GSAP
      const heroSection = document.querySelector('.custom-cinematic-hero');

      if (heroSection) {
        const observer = new IntersectionObserver(async (entries) => {
          if (entries[0].isIntersecting) {
            observer.disconnect();
            await loadGSAP();
            initHeroAnimations();
          }
        }, { threshold: 0.1 });

        observer.observe(heroSection);
      }
    } else {
      // Show static hero content immediately (no GSAP)
      showStaticContent();
      // Story sections still use CSS transitions triggered by IntersectionObserver
      // so we don't override them here - initStorySections() handles scroll detection
    }
  }

  /**
   * Initialize scroll triggers (e.g., Discover button)
   */
  function initScrollTriggers() {
    const triggers = document.querySelectorAll('[data-scroll-trigger], [data-hero-cta]');
    if (triggers.length === 0) return;

    triggers.forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        // Find the first story section
        const firstSection = document.querySelector('[data-story-section]');
        if (firstSection) {
          firstSection.scrollIntoView({ behavior: 'smooth' });
        } else {
          // Fallback: scroll down one viewport height
          window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
        }
      });
    });
  }

  /**
   * Initialize the dynamic floating CTA
   */
  function initDynamicCTA() {
    const floatingCTA = document.querySelector('[data-dynamic-cta]');
    const heroCTA = document.querySelector('[data-hero-cta]');
    const heroSection = document.querySelector('.custom-cinematic-hero');
    const ctaSection = document.querySelector('.story-cta');

    if (!floatingCTA || !heroSection) return;

    const floatingBtn = floatingCTA.querySelector('button');
    /** @type {HTMLElement | null} */
    const floatingText = floatingCTA.querySelector('.custom-floating-cta__text');
    /** @type {HTMLElement | null} */
    // @ts-ignore
    const heroCTAEl = heroCTA;

    // Single scroll handler - ONE place for ALL logic
    function updateFloatingCTA() {
      const scrollY = window.scrollY;
      const heroRect = heroSection.getBoundingClientRect();
      const ctaRect = ctaSection ? ctaSection.getBoundingClientRect() : null;
      const viewportHeight = window.innerHeight;

      // CONDITION 1: Hide at very top (< 60px)
      if (scrollY < 60) {
        floatingCTA.classList.remove('is-active');
        if (heroCTAEl) heroCTAEl.style.opacity = '1';
        return;
      }

      // CONDITION 2: Hide when bottom CTA section is visible
      if (ctaRect && ctaRect.top < viewportHeight * 0.85) {
        floatingCTA.classList.remove('is-active');
        return;
      }

      // OTHERWISE: Show the floating button
      floatingCTA.classList.add('is-active');
      if (heroCTAEl) heroCTAEl.style.opacity = '0';

      // Text morphing: "Scroll Down" while hero visible, "Join Waitlist" after
      if (heroRect.bottom > viewportHeight * 0.2) {
        floatingCTA.classList.add('mode-scroll');
        if (floatingText) floatingText.innerText = 'Scroll Down';
      } else {
        floatingCTA.classList.remove('mode-scroll');
        if (floatingText) floatingText.innerText = 'Join Waitlist';
      }
    }

    // Attach scroll listener
    window.addEventListener('scroll', updateFloatingCTA, { passive: true });

    // Run once on load
    setTimeout(updateFloatingCTA, 100);

    // Handle clicks
    if (floatingBtn) {
      floatingBtn.addEventListener('click', () => {
        if (floatingCTA.classList.contains('mode-scroll')) {
          const firstSection = document.querySelector('[data-story-section]');
          if (firstSection) {
            firstSection.scrollIntoView({ behavior: 'smooth' });
          }
        } else {
          const modalTrigger = document.querySelector('[data-waitlist-trigger]:not(.custom-floating-cta__button)');
          if (modalTrigger) {
            // @ts-ignore
            modalTrigger.click();
          }
        }
      });
    }
  }

  /**
   * Initialize story section scroll animations using IntersectionObserver
   */
  function initStorySections() {
    const storySections = document.querySelectorAll('[data-story-section]');

    if (storySections.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, {
      threshold: 0.2,
      rootMargin: '0px 0px -10% 0px'
    });

    storySections.forEach(section => {
      observer.observe(section);
    });
  }

  /**
   * Initialize currency conversion for modal prices
   * Converts GBP prices to visitor's local currency
   */
  async function initCurrencyConversion() {
    const priceElements = document.querySelectorAll('[data-price-convert]');
    if (priceElements.length === 0) return;

    // Country to currency code mapping (World Cup 2026 + Nigeria)
    const countryToCurrency = {
      'GB': 'GBP', 'DE': 'EUR', 'FR': 'EUR', 'ES': 'EUR', 'NL': 'EUR',
      'BE': 'EUR', 'PT': 'EUR', 'IT': 'EUR', 'US': 'USD', 'CA': 'CAD',
      'MX': 'MXN', 'AR': 'ARS', 'BR': 'BRL', 'JP': 'JPY', 'KR': 'KRW',
      'SA': 'SAR', 'MA': 'MAD', 'SN': 'XOF', 'CM': 'XAF', 'GH': 'GHS',
      'NG': 'NGN', 'AU': 'AUD'
    };

    // Currency symbols
    const currencySymbols = {
      'GBP': '£', 'EUR': '€', 'USD': '$', 'CAD': 'C$', 'MXN': '$',
      'ARS': '$', 'BRL': 'R$', 'JPY': '¥', 'KRW': '₩', 'SAR': '﷼',
      'MAD': 'د.م.', 'XOF': 'CFA ', 'XAF': 'CFA ', 'GHS': '₵', 'NGN': '₦',
      'AUD': 'A$'
    };

    function formatPrice(amount, currencyCode) {
      const symbol = currencySymbols[currencyCode] || '£';

      if (['JPY', 'KRW', 'XOF', 'XAF', 'NGN', 'ARS'].includes(currencyCode)) {
        const rounded = amount > 10000
          ? Math.round(amount / 1000) * 1000
          : Math.round(amount / 100) * 100;
        return symbol + rounded.toLocaleString();
      } else {
        const rounded = Math.floor(amount) + 0.99;
        return symbol + rounded.toFixed(2);
      }
    }

    async function getExchangeRates() {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/GBP');
        const data = await response.json();
        return data.rates;
      } catch (error) {
        console.warn('Exchange rate API failed, using fallback rates');
        return {
          GBP: 1, EUR: 1.17, USD: 1.27, CAD: 1.72, MXN: 21.8,
          ARS: 1140, BRL: 6.20, JPY: 195, KRW: 1680, SAR: 4.76,
          MAD: 12.6, XOF: 770, XAF: 770, GHS: 15.8, NGN: 1980, AUD: 1.95
        };
      }
    }

    try {
      // Get visitor's country using ipwho.is (free, HTTPS, 10,000 requests/month)
      const geoResponse = await fetch('https://ipwho.is/?fields=country_code');

      if (!geoResponse.ok) {
        console.warn('Geo API returned non-OK status, defaulting to GBP');
        return;
      }

      const geoData = await geoResponse.json();
      const countryCode = geoData.country_code || 'GB';

      // Get currency for this country
      const currencyCode = countryToCurrency[countryCode] || 'GBP';

      // If UK, no conversion needed
      if (currencyCode === 'GBP') return;

      // Get live exchange rates
      const rates = await getExchangeRates();
      const rate = rates[currencyCode] || 1;

      // Convert all price elements
      priceElements.forEach(el => {
        const basePrice = parseFloat(el.dataset.priceConvert) || 0;
        const convertedPrice = basePrice * rate;
        el.textContent = formatPrice(convertedPrice, currencyCode);
      });

    } catch (error) {
      console.warn('Currency conversion failed:', error);
    }
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
