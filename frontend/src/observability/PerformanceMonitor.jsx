import { useEffect, useState } from 'react';
import * as Sentry from '@sentry/react';
import { IS_PRODUCTION } from '../config/environment';

/**
 * Performance metrics we want to track
 */
const WEB_VITALS = {
  FCP: 'first-contentful-paint',
  LCP: 'largest-contentful-paint',
  FID: 'first-input-delay',
  CLS: 'cumulative-layout-shift',
  TTFB: 'time-to-first-byte',
  INP: 'interaction-to-next-paint',
};

/**
 * Silently monitors web vitals and reports them to Sentry
 * This component doesn't render anything visible
 */
const PerformanceMonitor = () => {
  const [vitalsCollected, setVitalsCollected] = useState(false);

  useEffect(() => {
    // Only run in production or if debugging is enabled
    if (!IS_PRODUCTION && !window.localStorage.getItem('debug_perf')) {
      return;
    }

    // Import web vitals dynamically to avoid bloating the main bundle
    import('web-vitals').then(({ onFCP, onLCP, onFID, onCLS, onTTFB }) => {
      // First Contentful Paint
      onFCP(metric => reportVital('FCP', metric));
      
      // Largest Contentful Paint
      onLCP(metric => reportVital('LCP', metric));
      
      // First Input Delay
      onFID(metric => reportVital('FID', metric));
      
      // Cumulative Layout Shift
      onCLS(metric => reportVital('CLS', metric));
      
      // Time to First Byte
      onTTFB(metric => reportVital('TTFB', metric));
      
      setVitalsCollected(true);
    });

    // Custom metrics for app-specific performance
    trackCustomMetrics();

    return () => {
      // Cleanup any observers if needed
    };
  }, []);

  /**
   * Reports a web vital metric to Sentry
   * @param {string} name - Metric name
   * @param {Object} metric - Web Vitals metric object
   */
  const reportVital = (name, metric) => {
    // Log to console in development
    if (!IS_PRODUCTION) {
      console.log(`[Performance] ${name}: `, metric.value);
    }

    // Report to Sentry as a custom measurement
    Sentry.setMeasurement(name, metric.value, metric.name.toLowerCase());
    
    // For debugging purposes
    if (window.localStorage.getItem('debug_perf')) {
      window._vitals = window._vitals || {};
      window._vitals[name] = metric.value;
    }
  };

  /**
   * Tracks custom application-specific metrics
   */
  const trackCustomMetrics = () => {
    // Track time to interactive content (e.g., when dashboard data loads)
    const markDataLoaded = () => {
      if (window.performance && window.performance.mark) {
        window.performance.mark('app-data-loaded');
        
        // Measure from navigation start to data loaded
        window.performance.measure(
          'app-time-to-interactive', 
          'navigationStart', 
          'app-data-loaded'
        );
        
        const measures = window.performance.getEntriesByName('app-time-to-interactive');
        if (measures.length > 0) {
          Sentry.setMeasurement('TimeToInteractive', measures[0].duration, 'ms');
        }
      }
    };

    // Listen for custom event that signals when app data is loaded
    window.addEventListener('app:data-loaded', markDataLoaded);

    // Track resource loading performance
    if (window.performance && window.performance.getEntriesByType) {
      const trackResourcePerformance = () => {
        const resources = window.performance.getEntriesByType('resource');
        
        // Group by resource type
        const byType = resources.reduce((acc, resource) => {
          const type = resource.initiatorType || 'other';
          acc[type] = acc[type] || [];
          acc[type].push(resource);
          return acc;
        }, {});
        
        // Calculate average load time for each type
        Object.entries(byType).forEach(([type, items]) => {
          const avg = items.reduce((sum, item) => sum + item.duration, 0) / items.length;
          Sentry.setMeasurement(`ResourceLoad_${type}`, avg, 'ms');
        });
      };
      
      // Run after load to collect all initial resources
      window.addEventListener('load', () => {
        // Wait a bit to capture everything
        setTimeout(trackResourcePerformance, 3000);
      });
    }

    return () => {
      window.removeEventListener('app:data-loaded', markDataLoaded);
    };
  };

  // This component doesn't render anything
  return null;
};

export default PerformanceMonitor;
