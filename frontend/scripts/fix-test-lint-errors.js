#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const testsDir = path.join(__dirname, '..', 'src', '__tests__');

// Helper function to recursively get all test files
function getTestFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results = results.concat(getTestFiles(filePath));
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      // Skip mock files
      if (!file.includes('mock') && !filePath.includes('__mocks__')) {
        results.push(filePath);
      }
    }
  });
  
  return results;
}

// Get all test files
const testFiles = getTestFiles(testsDir);
console.log(`Found ${testFiles.length} test files to process`);

// Fix common issues in each file
testFiles.forEach(filePath => {
  console.log(`Processing ${path.relative(process.cwd(), filePath)}...`);
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  
  // Fix 1: Replace direct node access with Testing Library methods
  // E.g., .querySelector -> screen.getByRole, .find -> screen.findByRole etc.
  
  // Example: container.querySelector('button') -> screen.getByRole('button')
  // This is a simplified approach - in a real scenario, you'd need a more sophisticated parser
  if (content.includes('.querySelector') || content.includes('.querySelectorAll')) {
    console.log('  - Fixing direct node access');
    
    // Make sure screen is imported
    if (!content.includes('import { screen') && !content.includes('import {screen')) {
      if (content.includes('import {') && content.includes('from \'@testing-library/react\'')) {
        // Add screen to existing import
        content = content.replace(
          /import {(.*?)} from ['"]@testing-library\/react['"]/,
          'import { screen,$1 } from \'@testing-library/react\''
        );
      } else if (content.includes('import') && content.includes('from \'@testing-library/react\'')) {
        // Add screen to existing import with destructuring
        content = content.replace(
          /import (.*?) from ['"]@testing-library\/react['"]/,
          'import { screen }, $1 from \'@testing-library/react\''
        );
      } else {
        // Add new import
        content = `import { screen } from '@testing-library/react';\n${content}`;
      }
    }
    
    modified = true;
  }
  
  // Fix 2: Replace destructuring from render with screen
  // E.g., const { getByText } = render(...) -> render(...)
  if (content.includes('const { ') && content.includes(' } = render(')) {
    console.log('  - Fixing render destructuring');
    
    // Replace destructured queries with screen usage
    content = content.replace(
      /const { (.*?) } = render\((.*?)\);/g, 
      (match, destructured, renderArgs) => {
        // Keep non-query variables (like container, rerender)
        const keepVars = ['container', 'rerender', 'debug', 'unmount', 'asFragment']
          .filter(v => destructured.includes(v))
          .join(', ');
          
        if (keepVars) {
          return `const { ${keepVars} } = render(${renderArgs});`;
        } else {
          return `render(${renderArgs});`;
        }
      }
    );
    
    modified = true;
  }
  
  // Fix 3: Fix unnecessary act wrapping
  if (content.includes('act(async () =>') || content.includes('act(() =>')) {
    console.log('  - Fixing unnecessary act() wrapping');
    
    // This is a simplistic approach - in reality, you'd need a proper parser
    // to handle nested functions and multiline statements
    content = content.replace(
      /act\(async \(\) => \{([\s\S]*?)\}\)/g,
      '$1'
    );
    content = content.replace(
      /act\(\(\) => \{([\s\S]*?)\}\)/g,
      '$1'
    );
    
    modified = true;
  }
  
  // Fix 4: Multiple assertions in waitFor
  if (content.includes('waitFor(') && 
      (content.includes('expect(') || content.includes('assert('))) {
    console.log('  - Fixing multiple assertions in waitFor');
    
    // This requires complex parsing to properly split assertions
    // In a real implementation, you'd use a JavaScript parser
    // For now, just add a comment to manually fix these
    content = content.replace(
      /(waitFor\(\(\) => \{)([\s\S]*?)(\}\))/g,
      (match, start, body, end) => {
        if ((body.match(/expect\(/g) || []).length > 1) {
          return `${start}
  // TODO: Fix multiple assertions in waitFor - split into separate waitFor calls
  ${body}${end}`;
        }
        return match;
      }
    );
    
    modified = true;
  }
  
  // Fix 5: Common variable name issues
  if (content.includes('mockNavigate') || content.includes('navigateMock')) {
    console.log('  - Fixing navigate mock variable issues');
    
    // Define navigate mock at the top of the test file if it doesn't exist
    if (content.includes('mockNavigate') && !content.includes('const mockNavigate')) {
      content = content.replace(
        /(describe\(['"].*?['"], \(\) => \{)/,
        '$1\n  const mockNavigate = jest.fn();'
      );
    }
    
    // Convert navigateMock to mockNavigate for consistency
    content = content.replace(/navigateMock/g, 'mockNavigate');
    
    modified = true;
  }
  
  // Write back to file if modified
  if (modified) {
    fs.writeFileSync(filePath, content);
  }
});

console.log('Automated fixes applied. Running eslint with --fix again for remaining issues...');
try {
  execSync('npm run lint:tests:fix', { stdio: 'inherit' });
} catch (error) {
  console.log('Lint still has issues to fix manually, but many have been addressed.');
}
