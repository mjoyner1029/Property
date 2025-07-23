/**
 * Performance monitoring utility
 * In production, this could be connected to services like Google Analytics, New Relic, etc.
 */
import logger from './logger';

class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.timers = {};
    this.navigationTimings = {};
    this.STORE_KEY = 'assetAnchor_perfMetrics';

    // Initialize
    this.setupNavigationTracking();
  }

  // Track page navigation performance
  setupNavigationTracking() {
    try {
      if (window.performance && window.performance.timing) {
        window.addEventListener('load', () => {
          setTimeout(() => {
            const navTiming = window.performance.timing;
            const pageLoadTime = navTiming.loadEventEnd - navTiming.navigationStart;
            const domReadyTime = navTiming.domContentLoadedEventEnd - navTiming.navigationStart;
            
            this.recordMetric('page_load', pageLoadTime);
            this.recordMetric('dom_ready', domReadyTime);
            
            logger.info('Page performance metrics', {
              pageLoadTime: `${pageLoadTime}ms`,
              domReadyTime: `${domReadyTime}ms`
            });
          }, 0);
        });
      }
    } catch (error) {
      logger.error('Error setting up performance tracking', error);
    }
  }
  
  // Start timing an operation
  startTimer(label) {
    try {
      this.timers[label] = performance.now();
    } catch (error) {
      logger.error('Error starting timer', error, { label });
    }
  }
  
  // End timing and record the metric
  endTimer(label) {
    try {
      if (!this.timers[label]) {
        logger.warn(`Timer "${label}" doesn't exist`);
        return;
      }
      
      const duration = performance.now() - this.timers[label];
      delete this.timers[label];
      this.recordMetric(label, duration);
      
      return duration;
    } catch (error) {
      logger.error('Error ending timer', error, { label });
      return null;
    }
  }
  
  // Record a specific metric value
  recordMetric(name, value) {
    try {
      if (!this.metrics[name]) {
        this.metrics[name] = {
          values: [],
          min: value,
          max: value,
          sum: 0,
          count: 0
        };
      }
      
      const metric = this.metrics[name];
      metric.values.push(value);
      metric.min = Math.min(metric.min, value);
      metric.max = Math.max(metric.max, value);
      metric.sum += value;
      metric.count++;
      
      // Keep only last 100 values to avoid memory issues
      if (metric.values.length > 100) {
        metric.values.shift();
      }
      
      this.storeMetrics();
      
    } catch (error) {
      logger.error('Error recording metric', error, { name, value });
    }
  }
  
  // Get statistics for a specific metric
  getMetricStats(name) {
    try {
      const metric = this.metrics[name];
      if (!metric) {
        return null;
      }
      
      return {
        min: metric.min,
        max: metric.max,
        avg: metric.sum / metric.count,
        count: metric.count,
        latest: metric.values[metric.values.length - 1]
      };
    } catch (error) {
      logger.error('Error getting metric stats', error, { name });
      return null;
    }
  }
  
  // Get all metrics
  getAllMetrics() {
    const stats = {};
    
    Object.keys(this.metrics).forEach(name => {
      stats[name] = this.getMetricStats(name);
    });
    
    return stats;
  }
  
  // Store metrics in localStorage for persistence
  storeMetrics() {
    try {
      // Only store summary stats, not all values
      const storedMetrics = {};
      Object.keys(this.metrics).forEach(name => {
        storedMetrics[name] = this.getMetricStats(name);
      });
      
      localStorage.setItem(this.STORE_KEY, JSON.stringify({
        timestamp: new Date().toISOString(),
        metrics: storedMetrics
      }));
    } catch (error) {
      // Ignore localStorage errors
    }
  }
  
  // Load stored metrics from localStorage
  loadStoredMetrics() {
    try {
      const storedData = localStorage.getItem(this.STORE_KEY);
      if (storedData) {
        return JSON.parse(storedData);
      }
    } catch (error) {
      // Ignore localStorage errors
    }
    return null;
  }
}

export default new PerformanceMonitor();
