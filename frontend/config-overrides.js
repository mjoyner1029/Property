/**
 * Custom webpack configuration overrides for React app
 */
const path = require('path');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CompressionPlugin = require('compression-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = function override(config, env) {
  // Only apply optimizations for production builds
  if (env === 'production') {
    // Split chunks more aggressively
    config.optimization.splitChunks = {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 20000,
      maxSize: 244000, // Keep chunks under ~240KB
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            // Get the package name from node_modules
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
            
            // Group major dependencies (like mui, recharts) together
            if (packageName.includes('@mui')) return 'vendor.mui';
            if (packageName.includes('react-dom')) return 'vendor.react-dom';
            if (packageName.includes('react-router')) return 'vendor.router';
            if (packageName === 'recharts' || packageName.includes('d3')) return 'vendor.charts';
            if (packageName.includes('@sentry')) return 'vendor.sentry';
            
            // npm package names are URL-safe, but some servers don't like @ symbols
            return `vendor.${packageName.replace('@', '')}`;
          },
        },
      },
    };

    // Configure Terser for better minification
    config.optimization.minimizer = [
      new TerserPlugin({
        terserOptions: {
          parse: {
            ecma: 8,
          },
          compress: {
            ecma: 5,
            warnings: false,
            comparisons: false,
            inline: 2,
            drop_console: true, // Remove console.log in production
          },
          mangle: {
            safari10: true,
          },
          output: {
            ecma: 5,
            comments: false,
            ascii_only: true,
          },
        },
        parallel: true,
      }),
      ...config.optimization.minimizer, // keep the CSS minimizer
    ];

    // Add bundle analyzer if ANALYZE flag is set
    if (process.env.ANALYZE) {
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: 'bundle-report.html',
          openAnalyzer: false,
          generateStatsFile: true,
          statsFilename: 'bundle-stats.json',
        })
      );
    }

    // Add compression for assets
    config.plugins.push(
      new CompressionPlugin({
        algorithm: 'gzip',
        test: /\.(js|css|html|svg|json)$/,
        threshold: 10240,
        minRatio: 0.8,
      })
    );

    // Cache busting with contenthash
    config.output.filename = 'static/js/[name].[contenthash:8].js';
    config.output.chunkFilename = 'static/js/[name].[contenthash:8].chunk.js';
  }

  return config;
};
