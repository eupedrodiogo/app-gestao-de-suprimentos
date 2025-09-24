// Performance Optimization Script for Supply Management System

// Lazy Loading for Images
const LazyLoader = {
    init: () => {
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }
};

// Resource Preloader
const ResourcePreloader = {
    preloadCriticalResources: () => {
        const criticalResources = [
            'css/global-styles.css',
            'js/global-functions.js',
            'js/mobile-menu.js'
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = resource.endsWith('.css') ? 'style' : 'script';
            link.href = resource;
            document.head.appendChild(link);
        });
    },

    preloadNextPage: (url) => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
    }
};

// Cache Management
const CacheManager = {
    set: (key, data, expiration = 3600000) => { // 1 hour default
        const item = {
            data: data,
            timestamp: Date.now(),
            expiration: expiration
        };
        localStorage.setItem(`sms_${key}`, JSON.stringify(item));
    },

    get: (key) => {
        const item = localStorage.getItem(`sms_${key}`);
        if (!item) return null;

        const parsed = JSON.parse(item);
        if (Date.now() - parsed.timestamp > parsed.expiration) {
            localStorage.removeItem(`sms_${key}`);
            return null;
        }

        return parsed.data;
    },

    clear: () => {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('sms_')) {
                localStorage.removeItem(key);
            }
        });
    }
};

// API Request Optimizer
const APIOptimizer = {
    pendingRequests: new Map(),

    // Debounced API calls
    debouncedFetch: Utils.debounce(async (url, options = {}) => {
        return await fetch(url, options);
    }, 300),

    // Request deduplication
    fetch: async (url, options = {}) => {
        const requestKey = `${url}_${JSON.stringify(options)}`;
        
        // Check if same request is already pending
        if (APIOptimizer.pendingRequests.has(requestKey)) {
            return APIOptimizer.pendingRequests.get(requestKey);
        }

        // Check cache first
        const cacheKey = `api_${btoa(requestKey)}`;
        const cachedData = CacheManager.get(cacheKey);
        if (cachedData && options.method !== 'POST') {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(cachedData)
            });
        }

        // Make request
        const requestPromise = fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        }).then(response => {
            APIOptimizer.pendingRequests.delete(requestKey);
            
            // Cache successful GET requests
            if (response.ok && (!options.method || options.method === 'GET')) {
                response.clone().json().then(data => {
                    CacheManager.set(cacheKey, data, 300000); // 5 minutes
                });
            }
            
            return response;
        }).catch(error => {
            APIOptimizer.pendingRequests.delete(requestKey);
            throw error;
        });

        APIOptimizer.pendingRequests.set(requestKey, requestPromise);
        return requestPromise;
    }
};

// DOM Optimization
const DOMOptimizer = {
    // Virtual scrolling for large lists
    virtualScroll: (container, items, itemHeight, renderItem) => {
        const containerHeight = container.clientHeight;
        const visibleItems = Math.ceil(containerHeight / itemHeight) + 2;
        let scrollTop = 0;

        const viewport = document.createElement('div');
        viewport.style.height = `${items.length * itemHeight}px`;
        viewport.style.position = 'relative';
        viewport.style.overflow = 'hidden';

        const content = document.createElement('div');
        content.style.position = 'absolute';
        content.style.top = '0';
        content.style.width = '100%';

        viewport.appendChild(content);
        container.appendChild(viewport);

        const render = () => {
            const startIndex = Math.floor(scrollTop / itemHeight);
            const endIndex = Math.min(startIndex + visibleItems, items.length);

            content.innerHTML = '';
            content.style.transform = `translateY(${startIndex * itemHeight}px)`;

            for (let i = startIndex; i < endIndex; i++) {
                const item = renderItem(items[i], i);
                content.appendChild(item);
            }
        };

        container.addEventListener('scroll', () => {
            scrollTop = container.scrollTop;
            requestAnimationFrame(render);
        });

        render();
    },

    // Batch DOM updates
    batchUpdate: (callback) => {
        requestAnimationFrame(() => {
            callback();
        });
    }
};

// Performance Monitor
const PerformanceMonitor = {
    metrics: {
        pageLoadTime: 0,
        apiCallTimes: [],
        renderTimes: []
    },

    startTimer: (name) => {
        performance.mark(`${name}-start`);
    },

    endTimer: (name) => {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
        
        const measure = performance.getEntriesByName(name)[0];
        return measure.duration;
    },

    logPageLoad: () => {
        window.addEventListener('load', () => {
            const navigation = performance.getEntriesByType('navigation')[0];
            PerformanceMonitor.metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
            
            console.log(`Page load time: ${PerformanceMonitor.metrics.pageLoadTime.toFixed(2)}ms`);
        });
    },

    logAPICall: (url, duration) => {
        PerformanceMonitor.metrics.apiCallTimes.push({
            url,
            duration,
            timestamp: Date.now()
        });
    },

    getReport: () => {
        return {
            pageLoadTime: PerformanceMonitor.metrics.pageLoadTime,
            averageAPITime: PerformanceMonitor.metrics.apiCallTimes.reduce((sum, call) => sum + call.duration, 0) / PerformanceMonitor.metrics.apiCallTimes.length || 0,
            totalAPICalls: PerformanceMonitor.metrics.apiCallTimes.length
        };
    }
};

// Service Worker Registration
const ServiceWorkerManager = {
    register: () => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered successfully');
                })
                .catch(error => {
                    console.log('Service Worker registration failed');
                });
        }
    }
};

// Initialize performance optimizations
document.addEventListener('DOMContentLoaded', () => {
    // Initialize lazy loading
    LazyLoader.init();
    
    // Preload critical resources
    ResourcePreloader.preloadCriticalResources();
    
    // Start performance monitoring
    PerformanceMonitor.logPageLoad();
    
    // Register service worker
    ServiceWorkerManager.register();
    
    // Optimize navigation links for prefetching
    // Use touchstart for mobile devices, mouseenter for desktop
    const isMobile = 'ontouchstart' in window;
    const eventType = isMobile ? 'touchstart' : 'mouseenter';
    
    document.querySelectorAll('a[href], [data-route]').forEach(link => {
        link.addEventListener(eventType, () => {
            const href = link.getAttribute('href') || link.getAttribute('data-route');
            if (href && (href.endsWith('.html') || href.includes('/'))) {
                ResourcePreloader.preloadNextPage(href);
            }
        }, { passive: true });
    });
    
    // Mobile-specific optimizations
    if (isMobile) {
        // Reduce animation duration for better performance
        document.documentElement.style.setProperty('--animation-duration', '0.2s');
        
        // Optimize touch scrolling
        document.body.style.webkitOverflowScrolling = 'touch';
        
        // Disable hover effects on mobile
        const style = document.createElement('style');
        style.textContent = `
            @media (hover: none) and (pointer: coarse) {
                *:hover {
                    transition: none !important;
                }
            }
        `;
        document.head.appendChild(style);
    }
});

// Export for global use
window.LazyLoader = LazyLoader;
window.ResourcePreloader = ResourcePreloader;
window.CacheManager = CacheManager;
window.APIOptimizer = APIOptimizer;
window.DOMOptimizer = DOMOptimizer;
window.PerformanceMonitor = PerformanceMonitor;