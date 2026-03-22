/**
 * Custom Product Page JavaScript
 * Handles multi-size basket, size chart modal, and checkout
 */

(function () {
    'use strict';

    // ===================================
    // STATE
    // ===================================

    /** @type {Array<{size: string, quantity: number, variantId: string}>} */
    let basket = [];
    let selectedSize = '';
    let productData = null;

    // ===================================
    // DOM ELEMENTS
    // ===================================

    const elements = {
        /** @returns {HTMLElement | null} */
        get sizeButtons() { return document.querySelectorAll('[data-size-btn]'); },
        /** @returns {HTMLElement | null} */
        get addToBasketBtn() { return document.querySelector('[data-add-to-basket]'); },
        /** @returns {HTMLElement | null} */
        get buyNowBtn() { return document.querySelector('[data-buy-now]'); },
        /** @returns {HTMLElement | null} */
        get basketContainer() { return document.querySelector('[data-basket-items]'); },
        /** @returns {HTMLElement | null} */
        get basketCount() { return document.querySelector('[data-basket-count]'); },
        /** @returns {HTMLElement | null} */
        get basketSubtotal() { return document.querySelector('[data-basket-subtotal]'); },
        /** @returns {HTMLElement | null} */
        get basketEmpty() { return document.querySelector('[data-basket-empty]'); },
        /** @returns {HTMLElement | null} */
        get basketSection() { return document.querySelector('[data-basket-section]'); },
        /** @returns {HTMLElement | null} */
        get sizeChartModal() { return document.querySelector('[data-size-chart-modal]'); },
        /** @returns {HTMLElement | null} */
        get stickyBar() { return document.querySelector('[data-sticky-bar]'); },
        /** @returns {HTMLElement | null} */
        get stickyBarSummary() { return document.querySelector('[data-sticky-summary]'); },
        /** @returns {HTMLElement | null} */
        get stickyBarBtn() { return document.querySelector('[data-sticky-buy]'); },
        /** @returns {HTMLElement | null} */
        get galleryMain() { return document.querySelector('[data-gallery-main]'); },
        /** @returns {HTMLElement | null} */
        get galleryThumbs() { return document.querySelectorAll('[data-gallery-thumb]'); }
    };

    // ===================================
    // INITIALIZATION
    // ===================================

    function init() {
        // Get product data from script tag
        const productScript = document.querySelector('[data-product-json]');
        if (productScript) {
            try {
                productData = JSON.parse(productScript.textContent);
            } catch (e) {
                console.error('Failed to parse product data:', e);
            }
        }

        initSizeSelector();
        initBasketActions();
        initSizeChartModal();
        initReturnsModal();
        initLightbox();
        initGallery();
        initStickyBar();
        updateUI();
    }


    // ===================================
    // SIZE SELECTOR
    // ===================================

    function initSizeSelector() {
        elements.sizeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const size = btn.dataset.size;

                // Toggle selection
                if (selectedSize === size) {
                    selectedSize = '';
                    btn.classList.remove('is-selected');
                } else {
                    // Remove selection from all
                    elements.sizeButtons.forEach(b => b.classList.remove('is-selected'));
                    // Select this one
                    selectedSize = size;
                    btn.classList.add('is-selected');
                }

                updateUI();
            });
        });
    }

    // ===================================
    // BASKET MANAGEMENT
    // ===================================

    function initBasketActions() {
        // Add to basket button
        const addBtn = elements.addToBasketBtn;
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                if (!selectedSize) return;
                addToBasket(selectedSize);
            });
        }

        // Buy now button
        const buyBtn = elements.buyNowBtn;
        if (buyBtn) {
            buyBtn.addEventListener('click', () => {
                buyNow();
            });
        }
    }

    function addToBasket(size) {
        const variant = getVariantBySize(size);
        if (!variant) return;

         // Check inventory availability (only if inventory is managed and policy denies overselling)
        const inventoryQty = variant.inventoryQuantity || 0;
        const inventoryPolicy = variant.inventoryPolicy || 'deny';
        const currentInBasket = getQuantityInBasketForSize(size);

        // Only enforce limit if policy is 'deny' (not 'continue' which allows overselling)
        if (inventoryPolicy === 'deny' && inventoryQty > 0 && currentInBasket >= inventoryQty) {
            showInventoryMessage(size, inventoryQty);
            return;
        }

        const existingIndex = basket.findIndex(item => item.size === size);

        if (existingIndex > -1) {
            basket[existingIndex].quantity += 1;
        } else {
            basket.push({
                size: size,
                quantity: 1,
                variantId: variant.id.toString()
            });
        }

        // Clear selection after adding
        selectedSize = '';
        elements.sizeButtons.forEach(b => b.classList.remove('is-selected'));

        renderBasket();
        updateUI();
    }

    function removeFromBasket(index) {
        basket.splice(index, 1);
        renderBasket();
        updateUI();
    }

    function updateQuantity(index, delta) {
        const item = basket[index];
        if (!item) return;

        // If increasing, check inventory limit
        if (delta > 0) {
            const variant = getVariantBySize(item.size);
            const inventoryQty = variant?.inventoryQuantity || 0;
            
            if (inventoryQty > 0 && item.quantity >= inventoryQty) {
                showInventoryMessage(item.size, inventoryQty);
                return;
            }
        }

        item.quantity += delta;

        if (item.quantity <= 0) {
            removeFromBasket(index);
        } else {
            renderBasket();
            updateUI();
        }
    }

    function getQuantityInBasketForSize(size) {
        const item = basket.find(i => i.size === size);
        return item ? item.quantity : 0;
    }

    function showInventoryMessage(size, maxQty) {
        // Create and show a temporary notification
        const existing = document.querySelector('.inventory-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'inventory-toast';
        toast.innerHTML = `<span>Only ${maxQty} available for size ${size}</span>`;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(239, 68, 68, 0.95);
            color: #fff;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 500;
            z-index: 9999;
            animation: toastIn 0.3s ease;
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function renderBasket() {
        const container = elements.basketContainer;
        const emptyState = elements.basketEmpty;

        if (!container) return;

        if (basket.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        container.innerHTML = basket.map((item, index) => `
      <div class="product-basket__item">
        <span class="product-basket__item-size">Size ${item.size}</span>
        <div class="product-basket__item-qty">
          <button type="button" class="product-basket__qty-btn" data-qty-minus="${index}">−</button>
          <span class="product-basket__qty-value">${item.quantity}</span>
          <button type="button" class="product-basket__qty-btn" data-qty-plus="${index}">+</button>
        </div>
        <button type="button" class="product-basket__item-remove" data-remove="${index}" aria-label="Remove">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `).join('');

        // Attach event listeners
        container.querySelectorAll('[data-qty-minus]').forEach(btn => {
            btn.addEventListener('click', () => {
                updateQuantity(parseInt(btn.dataset.qtyMinus), -1);
            });
        });

        container.querySelectorAll('[data-qty-plus]').forEach(btn => {
            btn.addEventListener('click', () => {
                updateQuantity(parseInt(btn.dataset.qtyPlus), 1);
            });
        });

        container.querySelectorAll('[data-remove]').forEach(btn => {
            btn.addEventListener('click', () => {
                removeFromBasket(parseInt(btn.dataset.remove));
            });
        });
    }

    function getVariantBySize(size) {
        if (!productData || !productData.variants) return null;

        return productData.variants.find(v => {
            // Check variant options for size match
            return v.options && v.options.some(opt =>
                opt.toLowerCase() === size.toLowerCase()
            );
        });
    }

    function getTotalItems() {
        return basket.reduce((sum, item) => sum + item.quantity, 0);
    }

    function getSubtotal() {
        if (!productData) return 0;

        return basket.reduce((sum, item) => {
            const variant = getVariantBySize(item.size);
            if (variant) {
                return sum + (variant.price * item.quantity);
            }
            return sum;
        }, 0);
    }

    function formatMoney(cents) {
        const amount = cents / 100;
        // Get currency from product data or default to GBP
        const currency = productData?.currency || 'GBP';
        const symbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '';
        return `${symbol}${amount.toFixed(2)}`;
    }

    // ===================================
    // BUY NOW - DIRECT TO CHECKOUT
    // ===================================

    async function buyNow() {
        if (basket.length === 0) return;

        const buyBtn = elements.buyNowBtn;
        const stickyBtn = elements.stickyBarBtn;

        // Show loading state
        if (buyBtn) {
            buyBtn.disabled = true;
            buyBtn.classList.add('is-loading');
            buyBtn.textContent = 'Processing...';
        }
        if (stickyBtn) {
            stickyBtn.disabled = true;
        }

        try {
            // Build cart items
            const items = basket.map(item => ({
                id: parseInt(item.variantId),
                quantity: item.quantity
            }));

            // Clear cart first, then add items
            await fetch('/cart/clear.js', { method: 'POST' });

            // Add all items to cart
            const response = await fetch('/cart/add.js', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ items: items })
            });

            if (!response.ok) {
                throw new Error('Failed to add to cart');
            }

            // Redirect to checkout
            window.location.href = '/checkout';

        } catch (error) {
            console.error('Checkout error:', error);
            alert('Something went wrong. Please try again.');

            // Reset button state
            if (buyBtn) {
                buyBtn.disabled = false;
                buyBtn.classList.remove('is-loading');
                buyBtn.textContent = 'Buy Now';
            }
            if (stickyBtn) {
                stickyBtn.disabled = false;
            }
        }
    }

    // ===================================
    // SIZE CHART MODAL
    // ===================================

    function initSizeChartModal() {
        const modal = elements.sizeChartModal;
        if (!modal) return;

        // Open triggers
        document.querySelectorAll('[data-open-size-chart]').forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                openSizeChart();
            });
        });

        // Close triggers
        modal.querySelectorAll('[data-close-size-chart]').forEach(trigger => {
            trigger.addEventListener('click', () => {
                closeSizeChart();
            });
        });

        // Close on backdrop click
        modal.querySelector('.size-chart-modal__backdrop')?.addEventListener('click', () => {
            closeSizeChart();
        });

        // Close on ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('is-open')) {
                closeSizeChart();
            }
        });
    }

    function openSizeChart() {
        const modal = elements.sizeChartModal;
        if (modal) {
            modal.classList.add('is-open');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeSizeChart() {
        const modal = elements.sizeChartModal;
        if (modal) {
            modal.classList.remove('is-open');
            document.body.style.overflow = '';
        }
    }

    // ===================================
    // RETURNS MODAL
    // ===================================

    function initReturnsModal() {
        const modal = document.querySelector('[data-returns-modal]');
        if (!modal) return;

        // Open triggers
        document.querySelectorAll('[data-open-returns]').forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                openReturnsModal();
            });
        });

        // Close triggers
        modal.querySelectorAll('[data-close-returns]').forEach(trigger => {
            trigger.addEventListener('click', () => {
                closeReturnsModal();
            });
        });

        // Close on backdrop click
        modal.querySelector('.returns-modal__backdrop')?.addEventListener('click', () => {
            closeReturnsModal();
        });

        // Close on ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('is-open')) {
                closeReturnsModal();
            }
        });
    }

    function openReturnsModal() {
        const modal = document.querySelector('[data-returns-modal]');
        if (modal) {
            modal.classList.add('is-open');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeReturnsModal() {
        const modal = document.querySelector('[data-returns-modal]');
        if (modal) {
            modal.classList.remove('is-open');
            document.body.style.overflow = '';
        }
    }

    // ===================================
    // LIGHTBOX
    // ===================================

    let lightboxImages = [];
    let currentLightboxIndex = 0;

    function initLightbox() {
        const lightbox = document.querySelector('[data-lightbox]');
        const openTrigger = document.querySelector('[data-open-lightbox]');

        if (!lightbox) return;

        // Collect all product images
        const thumbs = document.querySelectorAll('[data-gallery-thumb] img');
        if (thumbs.length > 0) {
            thumbs.forEach(img => {
                // Get high-res URL
                const src = img.src.replace(/width=\d+/, 'width=1800');
                lightboxImages.push({
                    src: src,
                    alt: img.alt
                });
            });
        } else {
            // Single image, get from main gallery
            const mainImg = document.querySelector('[data-gallery-main] img');
            if (mainImg) {
                lightboxImages.push({
                    src: mainImg.src.replace(/width=\d+/, 'width=1800'),
                    alt: mainImg.alt
                });
            }
        }

        // Open lightbox on main image click
        if (openTrigger) {
            openTrigger.addEventListener('click', () => {
                openLightbox(currentLightboxIndex);
            });
        }

        // Close button
        lightbox.querySelector('[data-close-lightbox]')?.addEventListener('click', () => {
            closeLightbox();
        });

        // Click outside image to close
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });

        // Previous button
        lightbox.querySelector('[data-lightbox-prev]')?.addEventListener('click', () => {
            navigateLightbox(-1);
        });

        // Next button
        lightbox.querySelector('[data-lightbox-next]')?.addEventListener('click', () => {
            navigateLightbox(1);
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('is-open')) return;

            if (e.key === 'Escape') {
                closeLightbox();
            } else if (e.key === 'ArrowLeft') {
                navigateLightbox(-1);
            } else if (e.key === 'ArrowRight') {
                navigateLightbox(1);
            }
        });
    }

    function openLightbox(index) {
        const lightbox = document.querySelector('[data-lightbox]');
        if (!lightbox || lightboxImages.length === 0) return;

        currentLightboxIndex = index;
        updateLightboxImage();

        lightbox.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        const lightbox = document.querySelector('[data-lightbox]');
        if (lightbox) {
            lightbox.classList.remove('is-open');
            document.body.style.overflow = '';
        }
    }

    function navigateLightbox(direction) {
        if (lightboxImages.length <= 1) return;

        currentLightboxIndex += direction;

        // Wrap around
        if (currentLightboxIndex < 0) {
            currentLightboxIndex = lightboxImages.length - 1;
        } else if (currentLightboxIndex >= lightboxImages.length) {
            currentLightboxIndex = 0;
        }

        updateLightboxImage();
    }

    function updateLightboxImage() {
        const lightboxImg = document.querySelector('[data-lightbox-image]');
        const lightboxCounter = document.querySelector('[data-lightbox-counter]');

        if (lightboxImg && lightboxImages[currentLightboxIndex]) {
            const imgData = lightboxImages[currentLightboxIndex];
            lightboxImg.src = imgData.src;
            lightboxImg.alt = imgData.alt;
        }

        if (lightboxCounter && lightboxImages.length > 1) {
            lightboxCounter.textContent = `${currentLightboxIndex + 1} / ${lightboxImages.length}`;
        }

        // Also sync the main gallery thumb selection
        const thumbs = document.querySelectorAll('[data-gallery-thumb]');
        thumbs.forEach((thumb, i) => {
            thumb.classList.toggle('is-active', i === currentLightboxIndex);
        });

        // Update main image too
        const mainImg = document.querySelector('[data-gallery-main] img');
        if (mainImg && lightboxImages[currentLightboxIndex]) {
            mainImg.src = lightboxImages[currentLightboxIndex].src.replace(/width=1800/, 'width=1200');
        }
    }

    // ===================================
    // GALLERY
    // ===================================

    function initGallery() {
        const mainImage = elements.galleryMain;
        const thumbs = elements.galleryThumbs;

        if (!mainImage || !thumbs.length) return;

        thumbs.forEach(thumb => {
            thumb.addEventListener('click', () => {
                const src = thumb.querySelector('img')?.src;
                const srcset = thumb.querySelector('img')?.srcset;

                if (src) {
                    // Update main image
                    const mainImg = mainImage.querySelector('img');
                    if (mainImg) {
                        // Get high-res version
                        const highResSrc = src.replace(/width=\d+/, 'width=1200');
                        mainImg.src = highResSrc;
                        if (srcset) {
                            mainImg.srcset = srcset;
                        }
                    }

                    // Update active state
                    thumbs.forEach(t => t.classList.remove('is-active'));
                    thumb.classList.add('is-active');
                }
            });
        });
    }

    // ===================================
    // STICKY BAR
    // ===================================

    function initStickyBar() {
        const stickyBar = elements.stickyBar;
        const basketSection = elements.basketSection;

        if (!stickyBar || !basketSection) return;

        // Sticky buy button handler
        const stickyBtn = elements.stickyBarBtn;
        if (stickyBtn) {
            stickyBtn.addEventListener('click', () => {
                buyNow();
            });
        }

        // Show/hide based on scroll position
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    stickyBar.classList.remove('is-visible');
                } else {
                    // Only show if we've scrolled past (not before)
                    if (entry.boundingClientRect.top < 0) {
                        stickyBar.classList.add('is-visible');
                    }
                }
            });
        }, {
            threshold: 0,
            rootMargin: '0px'
        });

        observer.observe(basketSection);
    }

    // ===================================
    // UI UPDATES
    // ===================================

    function updateUI() {
        const totalItems = getTotalItems();
        const subtotal = getSubtotal();

        // Update basket count
        const countEl = elements.basketCount;
        if (countEl) {
            countEl.textContent = totalItems;
            countEl.style.display = totalItems > 0 ? 'inline-flex' : 'none';
        }

        // Update subtotal
        const subtotalEl = elements.basketSubtotal;
        if (subtotalEl) {
            subtotalEl.textContent = formatMoney(subtotal);
        }

        // Update basket section visibility
        const subtotalRow = document.querySelector('[data-basket-subtotal-row]');
        if (subtotalRow) {
            subtotalRow.style.display = totalItems > 0 ? 'flex' : 'none';
        }

        // Update add button state
        const addBtn = elements.addToBasketBtn;
        if (addBtn) {
            addBtn.disabled = !selectedSize;
        }

        // Update buy button state
        const buyBtn = elements.buyNowBtn;
        if (buyBtn) {
            buyBtn.disabled = totalItems === 0;
        }

        // Update sticky bar
        const stickySummary = elements.stickyBarSummary;
        if (stickySummary) {
            if (totalItems > 0) {
                stickySummary.textContent = `${totalItems} ${totalItems === 1 ? 'item' : 'items'} • ${formatMoney(subtotal)}`;
            } else {
                stickySummary.textContent = 'No items selected';
            }
        }

        const stickyBtn = elements.stickyBarBtn;
        if (stickyBtn) {
            stickyBtn.disabled = totalItems === 0;
        }
    }

    // ===================================
    // INIT ON DOM READY
    // ===================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
