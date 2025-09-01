/**
 * Codemod script to convert relative imports in test files to absolute imports
 * 
 * Usage: node scripts/codemods/tests-absolute-imports.js
 * 
 * This script converts import statements like:
 *   import X from '../../context/Y';
 *   import X from '../../contexts/Y';
 *   import X from '../../components/Y';
 * To:
 *   import X from 'src/context/Y';
 *   import X from 'src/contexts/Y';
 *   import X from 'src/components/Y';
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Helper function to process a file
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Handle specific imports that might be missed by the more general pattern
    
    // Convert imports using * as Namespace with relative paths
    const starImportRegex = /import\s+\*\s+as\s+(\w+)\s+from\s+['"]\.\.\/\.\.\/([^'"]+)['"]/g;
    content = content.replace(starImportRegex, (match, namespace, pathPart) => {
      return `import * as ${namespace} from 'src/${pathPart}'`;
    });
    
    // Convert imports with deeper relative paths (e.g. "../../../")
    const deeperStarImportRegex = /import\s+\*\s+as\s+(\w+)\s+from\s+['"]\.\.\/\.\.\/\.\.\/([^'"]+)['"]/g;
    content = content.replace(deeperStarImportRegex, (match, namespace, pathPart) => {
      return `import * as ${namespace} from 'src/${pathPart}'`;
    });
    
    // Convert require statements with relative paths
    const requireRegex = /require\(['"]\.\.\/\.\.\/([^'"]+)['"]\)/g;
    content = content.replace(requireRegex, (match, pathPart) => {
      return `require('src/${pathPart}')`;
    });
    
    // Convert deeper require statements
    const deeperRequireRegex = /require\(['"]\.\.\/\.\.\/\.\.\/([^'"]+)['"]\)/g;
    content = content.replace(deeperRequireRegex, (match, pathPart) => {
      return `require('src/${pathPart}')`;
    });
    
    // Regex to match regular import statements with relative paths (two levels up)
    const importRegex = /import\s+(?:(?:{[^}]*})|(?:[\w*]+))\s+from\s+['"]\.\.\/\.\.\/([^'"]+)['"]/g;
    
    // Replace relative paths with absolute paths
    content = content.replace(importRegex, (match, pathPart) => {
      return match.replace(`'../../${pathPart}'`, `'src/${pathPart}'`);
    });

    // Also match import statements with deeper relative paths (e.g., '../../../')
    const deeperImportRegex = /import\s+(?:(?:{[^}]*})|(?:[\w*]+))\s+from\s+['"]\.\.\/\.\.\/\.\.\/([^'"]+)['"]/g;
    
    // Replace deeper relative paths
    content = content.replace(deeperImportRegex, (match, pathPart) => {
      return match.replace(`'../../../${pathPart}'`, `'src/${pathPart}'`);
    });
    
    // If content changed, write back to file
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }
    
    console.log(`⏭️ Skipped: ${filePath} (no changes needed)`);
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
    return false;
  }
}

// Main function to run the script
function run() {
  console.log('🔍 Finding test files...');
  
  // Find all test files
  const testFiles = glob.sync('src/__tests__/**/*.{jsx,js}', {
    cwd: process.cwd(),
    absolute: true,
  });
  
  console.log(`📋 Found ${testFiles.length} test files`);
  
  let updatedCount = 0;
  
  // Process each file
  testFiles.forEach(file => {
    if (processFile(file)) {
      updatedCount++;
    }
  });
  
  console.log(`\n✨ Done! Updated ${updatedCount} of ${testFiles.length} files.`);
}

// Run the script
run();
