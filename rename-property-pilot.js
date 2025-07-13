const fs = require('fs');
const path = require('path');

const patterns = [
  { regex: /Asset Anchor/g, replacement: 'Asset Anchor' },
  { regex: /asset anchor/g, replacement: 'asset anchor' },
  { regex: /ASSET ANCHOR/g, replacement: 'ASSET ANCHOR' },
  { regex: /Asset anchor/g, replacement: 'Asset anchor' },
  { regex: /asset Anchor/g, replacement: 'asset Anchor' },

  { regex: /Asset-Anchor/g, replacement: 'Asset-Anchor' },
  { regex: /asset-anchor/g, replacement: 'asset-anchor' },
  { regex: /ASSET-ANCHOR/g, replacement: 'ASSET-ANCHOR' },
  { regex: /Asset-anchor/g, replacement: 'Asset-anchor' },
  { regex: /asset-Anchor/g, replacement: 'asset-Anchor' },

  { regex: /Asset_Anchor/g, replacement: 'Asset_Anchor' },
  { regex: /asset_anchor/g, replacement: 'asset_anchor' },
  { regex: /ASSET_ANCHOR/g, replacement: 'ASSET_ANCHOR' },
  { regex: /Asset_anchor/g, replacement: 'Asset_anchor' },
  { regex: /asset_Anchor/g, replacement: 'asset_Anchor' },
];

const FILE_TYPES = [
  '.js', '.jsx', '.ts', '.tsx', '.py', '.md', '.html', '.json', '.env', '.txt', '.yml', '.yaml', '.css', '.scss'
];

const SKIP_DIRS = [
  'node_modules', '.git', 'venv', '.venv', '__pycache__'
];

function replaceInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let replaced = false;
    patterns.forEach(({ regex, replacement }) => {
      if (regex.test(content)) {
        content = content.replace(regex, replacement);
        replaced = true;
      }
    });
    if (replaced) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  } catch (err) {
    // Ignore files that can't be read
  }
}

function walkDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch (err) {
      // Skip files/directories that can't be accessed (e.g., broken symlinks)
      return;
    }
    if (stat.isDirectory()) {
      if (!SKIP_DIRS.includes(file)) {
        walkDir(fullPath);
      }
    } else if (FILE_TYPES.includes(path.extname(fullPath))) {
      replaceInFile(fullPath);
    }
  });
}

walkDir(process.cwd());
console.log('Done! All "Asset Anchor" variations replaced with "Asset Anchor".');