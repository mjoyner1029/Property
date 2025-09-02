#!/usr/bin/env node

/**
 * Bundle Analyzer Setup Script
 * 
 * This script helps set up webpack-bundle-analyzer for your project
 * to analyze bundle sizes and optimize the application.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

const rootDir = process.cwd();

// Check if we are in a React project
if (!fs.existsSync(path.join(rootDir, 'package.json'))) {
  console.error(chalk.red('package.json not found. Please run this script from your project root.'));
  process.exit(1);
}

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));

// Install required dependencies
console.log(chalk.blue('Installing required dependencies...'));

try {
  execSync('npm install --save-dev webpack-bundle-analyzer compression-webpack-plugin', { stdio: 'inherit' });
  console.log(chalk.green('Dependencies installed successfully.'));
} catch (error) {
  console.error(chalk.red('Failed to install dependencies:'), error.message);
  process.exit(1);
}

// Create webpack config overrides if it doesn't exist
const configOverridesPath = path.join(rootDir, 'config-overrides.js');

if (!fs.existsSync(configOverridesPath)) {
  console.log(chalk.blue('Creating config-overrides.js...'));
  
  const configOverridesContent = `
const path = require('path');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = function override(config, env) {
  // Only apply optimizations for production builds
  if (env === 'production') {
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
        test: /\\.(js|css|html|svg|json)$/,
        threshold: 10240,
        minRatio: 0.8,
      })
    );
    
    // Split chunks more efficiently
    config.optimization.splitChunks = {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 20000,
      maxSize: 244000, // Keep chunks under ~240KB
      cacheGroups: {
        vendor: {
          test: /[\\\\/]node_modules[\\\\/]/,
          name(module) {
            // Get the package name from node_modules
            const packageName = module.context.match(/[\\\\/]node_modules[\\\\/](.*?)([\\\\/]|$)/)[1];
            
            // Group major dependencies together
            if (packageName.includes('@mui')) return 'vendor.mui';
            if (packageName.includes('react-dom')) return 'vendor.react-dom';
            if (packageName.includes('react-router')) return 'vendor.router';
            if (packageName === 'recharts' || packageName.includes('d3')) return 'vendor.charts';
            if (packageName.includes('@sentry')) return 'vendor.sentry';
            
            // npm package names are URL-safe, but some servers don't like @ symbols
            return \`vendor.\${packageName.replace('@', '')}\`;
          },
        },
      },
    };
  }

  return config;
};
`;
  
  fs.writeFileSync(configOverridesPath, configOverridesContent.trim(), 'utf8');
  console.log(chalk.green('Created config-overrides.js successfully.'));
} else {
  console.log(chalk.yellow('config-overrides.js already exists. Please add webpack-bundle-analyzer manually.'));
}

// Check if react-app-rewired is installed
let needsRewired = false;
try {
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  if (!dependencies['react-app-rewired']) {
    needsRewired = true;
    console.log(chalk.blue('Installing react-app-rewired...'));
    execSync('npm install --save-dev react-app-rewired', { stdio: 'inherit' });
    console.log(chalk.green('Installed react-app-rewired successfully.'));
  }
} catch (error) {
  console.error(chalk.red('Failed to install react-app-rewired:'), error.message);
  process.exit(1);
}

// Update package.json scripts
console.log(chalk.blue('Updating package.json scripts...'));

const updatedScripts = {
  ...packageJson.scripts,
  'build:analyze': 'ANALYZE=true react-app-rewired build',
  'analyze:chunks': 'webpack-bundle-analyzer build/bundle-stats.json',
};

// If we had to install react-app-rewired, update the scripts
if (needsRewired) {
  // Only update main scripts if using react-scripts
  if (packageJson.scripts.start?.includes('react-scripts')) {
    updatedScripts.start = 'react-app-rewired start';
    updatedScripts.build = 'react-app-rewired build';
    updatedScripts['build:prod'] = 'GENERATE_SOURCEMAP=false react-app-rewired build';
  }
}

packageJson.scripts = updatedScripts;

// Write updated package.json
fs.writeFileSync(path.join(rootDir, 'package.json'), JSON.stringify(packageJson, null, 2), 'utf8');
console.log(chalk.green('Updated package.json scripts successfully.'));

// Print instructions
console.log(chalk.blue('\nSetup complete! You can now analyze your bundle with:'));
console.log(chalk.green('  npm run build:analyze'));
console.log(chalk.blue('After the build completes, open the report with:'));
console.log(chalk.green('  open build/bundle-report.html'));
console.log(chalk.blue('Or analyze the chunks with:'));
console.log(chalk.green('  npm run analyze:chunks'));
console.log(chalk.blue('\nHappy optimizing! 🚀'));
