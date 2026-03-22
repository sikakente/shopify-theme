/**
 * Global Pulse - Social Proof Notification Engine
 * Creates subtle, non-intrusive 'glassmorphism' notifications 
 * to show global waitlist activity.
 */

class GlobalPulse {
    constructor(options = {}) {
        this.container = null;
        this.options = Object.assign({
            interval: 15000,
            stayDuration: 6000,
            mockData: [
                // Ghana (heavy weight)
                { name: 'Kofi', country: 'Ghana' },
                { name: 'Ama', country: 'Ghana' },
                { name: 'Kwame', country: 'Ghana' },
                { name: 'Abena', country: 'Ghana' },
                { name: 'Yaw', country: 'Ghana' },
                { name: 'Akosua', country: 'Ghana' },
                { name: 'Kwesi', country: 'Ghana' },
                { name: 'Efua', country: 'Ghana' },
                // UK (heavy weight)
                { name: 'Marcus', country: 'UK' },
                { name: 'Sarah', country: 'UK' },
                { name: 'James', country: 'UK' },
                { name: 'Emma', country: 'UK' },
                { name: 'Oliver', country: 'UK' },
                { name: 'Charlotte', country: 'UK' },
                { name: 'Harry', country: 'UK' },
                { name: 'Amelia', country: 'UK' },
                // USA (heavy weight)
                { name: 'Jordan', country: 'USA' },
                { name: 'Ashley', country: 'USA' },
                { name: 'Marcus', country: 'USA' },
                { name: 'Taylor', country: 'USA' },
                { name: 'Brandon', country: 'USA' },
                { name: 'Jasmine', country: 'USA' },
                { name: 'Tyler', country: 'USA' },
                { name: 'Brittany', country: 'USA' },
                // Canada (heavy weight)
                { name: 'Chloe', country: 'Canada' },
                { name: 'Liam', country: 'Canada' },
                { name: 'Ethan', country: 'Canada' },
                { name: 'Sophia', country: 'Canada' },
                { name: 'Noah', country: 'Canada' },
                { name: 'Olivia', country: 'Canada' },
                { name: 'Lucas', country: 'Canada' },
                { name: 'Emma', country: 'Canada' },
                // A few others for variety (minimal)
                { name: 'Chidi', country: 'Nigeria' },
                { name: 'Aicha', country: 'France' }
            ],
            actions: [
                'just joined the waitlist',
                'is repping their roots',
                'selected a Nigeria jersey',
                'selected a Ghana jersey',
                'secured early access',
                'reserved their spot'
            ]
        }, options);

        this.init();
    }

    init() {
        this.createContainer();
        this.startPulse();
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'global-pulse-container';
        document.body.appendChild(this.container);
    }

    /**
     * @param {any[]} array
     */
    getRandomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    async showPulse() {
        if (!this.container) return;

        const data = this.getRandomItem(this.options.mockData);
        const action = this.getRandomItem(this.options.actions);

        const notification = document.createElement('div');
        notification.className = 'global-pulse-toast';
        notification.innerHTML = `
      <div class="pulse-icon">
        <span class="pulse-dot"></span>
      </div>
      <div class="pulse-content">
        <p class="pulse-text">
          <span class="pulse-name">${data.name}</span> from ${data.country} ${action}.
        </p>
      </div>
    `;

        this.container.appendChild(notification);

        // GSAP Animation
        // @ts-ignore
        const gsap = window.gsap;
        if (gsap) {
            const tl = gsap.timeline();

            tl.fromTo(notification,
                {
                    x: -50,
                    opacity: 0,
                    scale: 0.9,
                    filter: 'blur(10px)'
                },
                {
                    x: 0,
                    opacity: 1,
                    scale: 1,
                    filter: 'blur(0px)',
                    duration: 1,
                    ease: 'expo.out'
                }
            );

            tl.to(notification,
                {
                    y: -20,
                    opacity: 0,
                    filter: 'blur(10px)',
                    duration: 1,
                    ease: 'expo.in',
                    delay: this.options.stayDuration / 1000
                }
            );

            tl.set(notification, { display: 'none' }, '+=0');
            tl.eventCallback('onComplete', () => {
                notification.remove();
            });
        } else {
            // Fallback if GSAP is not ready
            setTimeout(() => {
                notification.classList.add('is-visible');
                setTimeout(() => {
                    notification.classList.remove('is-visible');
                    setTimeout(() => notification.remove(), 500);
                }, this.options.stayDuration);
            }, 100);
        }
    }

    startPulse() {
        // Initial delay so it doesn't pop up immediately on load
        setTimeout(() => {
            this.showPulse();
            setInterval(() => this.showPulse(), this.options.interval);
        }, 5000);
    }
}

// @ts-ignore
window.GlobalPulse = GlobalPulse;
