#!/usr/bin/env node

/**
 * Unused Import Detector and Fixer
 * 
 * This script scans your React codebase to find and optionally fix unused imports
 * that can bloat your bundle size unnecessarily.
 * 
 * Usage:
 * node fix-unused-imports.js [--fix] [--path=src/components]
 * 
 * Options:
 * --fix    Auto-fix detected issues by removing unused imports
 * --path   Specific directory path to scan (default: src/)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

// Parse command line arguments
const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');
const pathArg = args.find(arg => arg.startsWith('--path='));
const scanPath = pathArg ? pathArg.split('=')[1] : 'src';
const rootDir = path.resolve(process.cwd());
const fullScanPath = path.resolve(rootDir, scanPath);

// Check if directory exists
if (!fs.existsSync(fullScanPath)) {
  console.error(chalk.red(`Directory not found: ${fullScanPath}`));
  process.exit(1);
}

console.log(chalk.blue(`Scanning ${chalk.yellow(fullScanPath)} for unused imports...`));

// Run ESLint to find unused imports
try {
  // Build the ESLint command
  const command = `npx eslint "${fullScanPath}/**/*.{js,jsx}" --rule "no-unused-vars: error" --format json`;
  
  // Execute the command
  const output = execSync(command, { encoding: 'utf8' });
  const results = JSON.parse(output);
  
  // Filter for unused vars warnings only
  const unusedImports = {};
  let totalIssues = 0;
  
  results.forEach(file => {
    const filePath = file.filePath;
    const unusedVarsInFile = file.messages.filter(msg => 
      msg.ruleId === 'no-unused-vars' && 
      msg.message.includes("'") && 
      msg.message.includes("defined but never used")
    );
    
    if (unusedVarsInFile.length > 0) {
      unusedImports[filePath] = unusedVarsInFile;
      totalIssues += unusedVarsInFile.length;
    }
  });
  
  // Print summary
  console.log(chalk.blue(`Found ${chalk.yellow(totalIssues)} unused imports in ${chalk.yellow(Object.keys(unusedImports).length)} files`));
  
  // Process each file with unused imports
  for (const filePath in unusedImports) {
    console.log(chalk.blue(`\nFile: ${chalk.yellow(path.relative(rootDir, filePath))}`));
    
    // Read the file content
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n');
    
    // Track imports to remove
    const importsToRemove = [];
    
    // Process each unused import in the file
    unusedImports[filePath].forEach(issue => {
      const unusedVar = issue.message.match(/'([^']+)'/)[1];
      console.log(chalk.yellow(`- Unused import: ${chalk.red(unusedVar)} at line ${issue.line}`));
      
      // Find the import line
      const line = lines[issue.line - 1];
      importsToRemove.push({ line: issue.line - 1, var: unusedVar });
    });
    
    // Fix the issues if requested
    if (shouldFix) {
      let newContent = fileContent;
      const processed = new Set();
      
      // Process imports from bottom to top to avoid line number issues
      importsToRemove.sort((a, b) => b.line - a.line).forEach(item => {
        if (processed.has(item.line)) return;
        
        const line = lines[item.line];
        if (!line) return;
        
        // Process the import statement
        if (line.includes('import') && line.includes('from')) {
          let newLine = line;
          
          // Case 1: Named import in brackets: import { X, Y, Z } from 'module'
          if (line.includes('{') && line.includes('}')) {
            const importPattern = new RegExp(`\\{([^}]*)\\}\\s+from\\s+['"][^'"]+['"]`);
            const match = line.match(importPattern);
            
            if (match) {
              const imports = match[1].split(',').map(i => i.trim());
              const remainingImports = imports.filter(i => i !== item.var);
              
              if (remainingImports.length === 0) {
                // All imports were removed, delete the whole line
                newLine = '';
              } else {
                // Recreate the import statement with remaining imports
                const newImports = `{ ${remainingImports.join(', ')} }`;
                newLine = line.replace(importPattern, `${newImports} from ${line.split('from')[1]}`);
              }
              
              // Update the file content
              if (newLine !== line) {
                newContent = newContent.replace(line, newLine);
              }
            }
          } 
          // Case 2: Default import: import X from 'module'
          else if (line.match(new RegExp(`import\\s+${item.var}\\s+from`))) {
            // Remove the entire line for default imports
            newContent = newContent.replace(line, '');
          }
          
          processed.add(item.line);
        }
      });
      
      // Write the updated content back to the file
      if (newContent !== fileContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(chalk.green(`  Fixed: Removed unused imports in ${path.relative(rootDir, filePath)}`));
      }
    }
  }
  
  console.log(chalk.blue('\nSummary:'));
  console.log(chalk.yellow(`Total unused imports: ${totalIssues}`));
  console.log(chalk.yellow(`Files affected: ${Object.keys(unusedImports).length}`));
  
  if (!shouldFix && totalIssues > 0) {
    console.log(chalk.blue('\nTo automatically fix these issues, run:'));
    console.log(chalk.green(`  node fix-unused-imports.js --fix ${pathArg || ''}`));
  }
  
} catch (error) {
  console.error(chalk.red('Error executing ESLint:'), error.message);
  process.exit(1);
}
