#!/usr/bin/env node

/**
 * React Test to DOM Test Converter
 * 
 * This script analyzes a React component test file and generates
 * a DOM-based test file that achieves the same test coverage.
 * 
 * Usage: node convert-to-dom-test.js <test-file-path>
 */

const fs = require('fs');
const path = require('path');

// Get file path from command line args
const filePath = process.argv[2];

if (!filePath) {
  console.error('Please provide a test file path');
  process.exit(1);
}

// Check if file exists
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

// Read the file
const fileContent = fs.readFileSync(filePath, 'utf8');

// Define patterns to look for
const importPattern = /import\s+{([^}]*)}\s+from\s+['"]@testing-library\/react['"];?/;
const renderPattern = /render\(\s*<([^>]+)(?:\s+([^>]*))?>\s*(?:<\/\1>)?\s*\)/g;
const fireEventPattern = /fireEvent\.(\w+)\(([^)]+)\)/g;
const userEventPattern = /userEvent\.(\w+)\(([^)]+)\)/g;
const getByPattern = /(?:getBy|queryBy|findBy)(\w+)\(([^)]+)\)/g;
const expectPattern = /expect\(([^)]+)\)\.([^;]+);/g;
const mockPattern = /jest\.mock\(['"]([^'"]+)['"]/g;
const reactImportPattern = /import\s+(?:React,?\s*{[^}]*}|React|\{[^}]*\})\s+from\s+['"]react['"];?/;

// Generate the output DOM test file
function generateDomTest() {
  let domTest = '';
  
  // Add file header comment
  domTest += '/**\n';
  domTest += ' * DOM-based Test for Component\n';
  domTest += ' * \n';
  domTest += ' * This is an auto-generated DOM-based test that replaces React Testing Library\n';
  domTest += ' * with direct DOM manipulation for more reliable tests.\n';
  domTest += ' */\n\n';
  
  // Add imports
  domTest += 'import { \n';
  domTest += '  createDomElement,\n';
  domTest += '  clearBody\n';
  domTest += '} from \'../../test/utils/domTestUtils\';\n\n';
  
  // Extract and add mocks
  const mocks = [];
  let match;
  while ((match = mockPattern.exec(fileContent)) !== null) {
    mocks.push(`jest.mock('${match[1]}');`);
  }
  
  if (mocks.length > 0) {
    domTest += '// Move all jest.mock calls to the top\n';
    domTest += mocks.join('\n') + '\n\n';
  }
  
  // Add other imports (excluding React and RTL)
  const lines = fileContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('import ') && 
        !line.includes('@testing-library/react') && 
        !reactImportPattern.test(line)) {
      domTest += line + '\n';
    }
  }
  domTest += '\n';
  
  // Add describe blocks
  let inDescribe = false;
  let describeIndentation = 0;
  let testContent = '';
  
  for (const line of lines) {
    if (line.includes('describe(')) {
      inDescribe = true;
      domTest += line + '\n';
      describeIndentation = line.indexOf('describe');
    } 
    else if (inDescribe && line.includes('});') && 
             line.indexOf('});') === describeIndentation) {
      inDescribe = false;
      
      // Add afterEach to clear body
      const indentation = ' '.repeat(describeIndentation + 2);
      domTest += indentation + '// Clear the body after each test\n';
      domTest += indentation + 'afterEach(() => {\n';
      domTest += indentation + '  clearBody();\n';
      domTest += indentation + '  jest.clearAllMocks();\n';
      domTest += indentation + '});\n\n';
      
      // Add the test content
      domTest += testContent;
      
      // Close the describe block
      domTest += line + '\n';
      testContent = '';
    } 
    else if (inDescribe && line.includes('test(') || line.includes('it(')) {
      testContent += line + '\n';
      
      // Handle the test content
      const testEndIndex = findTestEndIndex(lines, lines.indexOf(line));
      let currentTestContent = '';
      
      for (let i = lines.indexOf(line) + 1; i < testEndIndex; i++) {
        const testLine = lines[i];
        
        // Replace render with createDomElement
        if (testLine.includes('render(')) {
          const componentMatch = renderPattern.exec(testLine);
          if (componentMatch) {
            const componentName = componentMatch[1];
            currentTestContent += `      // Create DOM element for ${componentName}\n`;
            currentTestContent += `      const container = createDomElement(\`\n`;
            currentTestContent += `        <div data-testid="${componentName.toLowerCase()}-container">\n`;
            currentTestContent += `          <!-- Replace with appropriate HTML structure -->\n`;
            currentTestContent += `          <div data-testid="${componentName.toLowerCase()}-content"></div>\n`;
            currentTestContent += `        </div>\n`;
            currentTestContent += `      \`);\n\n`;
          } else {
            currentTestContent += `      // TODO: Replace with createDomElement\n`;
            currentTestContent += `      // ${testLine}\n`;
          }
        }
        // Replace fireEvent with direct DOM events
        else if (testLine.includes('fireEvent.')) {
          const eventMatch = fireEventPattern.exec(testLine);
          if (eventMatch) {
            const eventType = eventMatch[1];
            const element = eventMatch[2].split(',')[0].trim();
            
            currentTestContent += `      // Create and dispatch ${eventType} event\n`;
            currentTestContent += `      const element = document.querySelector('[data-testid="element-id"]'); // Replace with correct selector\n`;
            currentTestContent += `      element.${eventType === 'click' ? 'click()' : `dispatchEvent(new Event('${eventType}'))`};\n`;
          } else {
            currentTestContent += `      // TODO: Replace with direct DOM event\n`;
            currentTestContent += `      // ${testLine}\n`;
          }
        }
        // Replace userEvent with direct DOM events
        else if (testLine.includes('userEvent.')) {
          const eventMatch = userEventPattern.exec(testLine);
          if (eventMatch) {
            const eventType = eventMatch[1];
            const element = eventMatch[2].split(',')[0].trim();
            
            currentTestContent += `      // Create and dispatch ${eventType} event\n`;
            if (eventType === 'click') {
              currentTestContent += `      const element = document.querySelector('[data-testid="element-id"]'); // Replace with correct selector\n`;
              currentTestContent += `      element.click();\n`;
            } else if (eventType === 'type') {
              currentTestContent += `      const element = document.querySelector('[data-testid="input-id"]'); // Replace with correct selector\n`;
              currentTestContent += `      element.value = "test value"; // Replace with correct value\n`;
              currentTestContent += `      element.dispatchEvent(new Event('change'));\n`;
            } else {
              currentTestContent += `      // TODO: Replace with direct DOM event for ${eventType}\n`;
              currentTestContent += `      // ${testLine}\n`;
            }
          } else {
            currentTestContent += `      // TODO: Replace with direct DOM event\n`;
            currentTestContent += `      // ${testLine}\n`;
          }
        }
        // Replace getBy queries with document.querySelector
        else if (testLine.match(getByPattern)) {
          const queryMatch = getByPattern.exec(testLine);
          if (queryMatch) {
            const queryType = queryMatch[1];
            const selector = queryMatch[2];
            
            if (queryType === 'TestId') {
              currentTestContent += `      const element = document.querySelector('[data-testid="${selector.replace(/['"]/g, '')}"]');\n`;
            } else {
              currentTestContent += `      // TODO: Replace with document.querySelector\n`;
              currentTestContent += `      // ${testLine}\n`;
            }
          } else {
            currentTestContent += testLine + '\n';
          }
        }
        // Keep expect statements
        else if (testLine.includes('expect(')) {
          currentTestContent += testLine + '\n';
        }
        // Keep other lines
        else {
          currentTestContent += testLine + '\n';
        }
      }
      
      testContent += currentTestContent;
      testContent += `    });\n\n`;
    }
    else if (!inDescribe && !line.startsWith('import ')) {
      domTest += line + '\n';
    }
  }
  
  return domTest;
}

// Helper to find the end of a test block
function findTestEndIndex(lines, startIndex) {
  let openBraces = 0;
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    
    // Count opening braces
    const openCount = (line.match(/\{/g) || []).length;
    openBraces += openCount;
    
    // Count closing braces
    const closeCount = (line.match(/\}/g) || []).length;
    openBraces -= closeCount;
    
    if (openBraces === 0 && line.includes('});')) {
      return i + 1;
    }
  }
  
  return lines.length;
}

// Generate output file path
const dir = path.dirname(filePath);
const ext = path.extname(filePath);
const baseName = path.basename(filePath, ext);
const outputPath = path.join(dir, `${baseName}.dom${ext}`);

// Generate DOM test
const domTest = generateDomTest();

// Write to output file
fs.writeFileSync(outputPath, domTest);

console.log(`DOM test file generated at: ${outputPath}`);
console.log('');
console.log('NOTE: The generated file contains placeholders you need to replace:');
console.log('1. Replace HTML structure placeholders with the appropriate HTML');
console.log('2. Replace element selectors with the correct data-testid values');
console.log('3. Update event handlers as needed');
console.log('');
console.log('See the DOM Testing Migration Guide for more help:');
console.log('/frontend/docs/DOM_TESTING_MIGRATION_GUIDE.md');
