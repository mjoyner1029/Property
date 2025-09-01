const fs = require('fs');
const path = require('path');

// Get file path from command line argument
const filePath = process.argv[2];
if (!filePath) {
  console.error('Please provide a file path');
  process.exit(1);
}

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace the render pattern
const renderPattern = /render\(\s*<MemoryRouter>\s*<([A-Za-z][A-Za-z0-9]*)\s+([^>]*)\/>\s*<\/MemoryRouter>\s*\)/g;
const renderWithProvidersPattern = /render\(\s*<MemoryRouter>\s*<([A-Za-z][A-Za-z0-9]*)\s*\/>\s*<\/MemoryRouter>\s*\)/g;

// Replace with props
content = content.replace(renderPattern, 'renderWithProviders(<$1 $2/>)');

// Replace without props
content = content.replace(renderWithProvidersPattern, 'renderWithProviders(<$1 />)');

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log(`Updated render calls in ${filePath}`);
