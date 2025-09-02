/**
 * Frontend Optimization Functions
 * Implements various performance improvements for the application
 */

/**
 * Dynamically load components based on viewport visibility
 * @param {string} componentName - Name of the component to be lazy loaded
 * @returns {Promise<Component>} - Lazy loaded component
 */
export const lazyWithPreload = (componentName) => {
  // Create a lazily-loaded component that can be preloaded
  const Component = React.lazy(() => 
    import(`./pages/${componentName}`).then(module => ({ 
      default: module.default || module[componentName] 
    }))
  );
  
  // Attach preload method to allow preloading before rendering
  Component.preload = () => 
    import(`./pages/${componentName}`).then(module => ({ 
      default: module.default || module[componentName] 
    }));
  
  return Component;
};

/**
 * Preloads critical components that might be needed soon
 * Call this function when user is likely to navigate to these pages
 */
export const preloadCriticalComponents = () => {
  // Preload most commonly accessed pages
  const criticalComponents = ['Dashboard', 'Properties', 'Payments'];
  
  // Use requestIdleCallback for better performance
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      criticalComponents.forEach(component => {
        const LazyComponent = lazyWithPreload(component);
        LazyComponent.preload();
      });
    }, { timeout: 2000 });
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    setTimeout(() => {
      criticalComponents.forEach(component => {
        const LazyComponent = lazyWithPreload(component);
        LazyComponent.preload();
      });
    }, 1000);
  }
};

/**
 * Optimizes image loading using Intersection Observer
 * @param {string} selector - CSS selector for images to optimize
 */
export const optimizeImageLoading = (selector = 'img[data-src]') => {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.getAttribute('data-src');
          
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    });

    document.querySelectorAll(selector).forEach(img => {
      imageObserver.observe(img);
    });
  } else {
    // Fallback for browsers without Intersection Observer
    document.querySelectorAll(selector).forEach(img => {
      const src = img.getAttribute('data-src');
      if (src) {
        img.src = src;
        img.removeAttribute('data-src');
      }
    });
  }
};

/**
 * Implements critical CSS inlining
 * @param {Array} styleIds - Array of style IDs to be considered critical
 */
export const inlineCriticalCSS = (styleIds = ['critical-styles']) => {
  styleIds.forEach(id => {
    const styleElement = document.getElementById(id);
    
    if (styleElement && styleElement.textContent) {
      // Create an inline style element
      const inlineStyle = document.createElement('style');
      inlineStyle.textContent = styleElement.textContent;
      document.head.appendChild(inlineStyle);
      
      // Remove original link element
      styleElement.parentNode.removeChild(styleElement);
    }
  });
};

/**
 * Resource hint setup for performance
 * @param {Object} resources - Object containing URLs to preconnect, prefetch, and preload
 */
export const setupResourceHints = (resources = {
  preconnect: [],
  prefetch: [],
  preload: []
}) => {
  // Preconnect to important origins
  resources.preconnect.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = url;
    document.head.appendChild(link);
  });
  
  // Prefetch resources likely to be used
  resources.prefetch.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
  
  // Preload critical resources
  resources.preload.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.url;
    link.as = resource.type || 'script';
    if (resource.crossorigin) link.crossOrigin = resource.crossorigin;
    document.head.appendChild(link);
  });
};

/**
 * Cleanup unnecessary event listeners to prevent memory leaks
 * @param {Array} listeners - Array of listener references to clean up
 */
export const cleanupEventListeners = (listeners = []) => {
  listeners.forEach(listener => {
    if (listener && typeof listener.cleanup === 'function') {
      listener.cleanup();
    }
  });
};
