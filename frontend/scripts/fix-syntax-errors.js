#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files with known syntax issues
const filesToFix = [
  {
    path: 'src/__tests__/properties/PropertyForm.test.jsx',
    replacements: [
      {
        search: /await\s+fireEvent\.click\(screen\.getByRole\('button', { name: \/save property details\/i \);[\s\S]*?\}\);/m,
        replace: "fireEvent.click(screen.getByRole('button', { name: /save property details/i }));"
      }
    ]
  },
  {
    path: 'src/__tests__/maintenance/MaintenanceCreate.great.test.jsx',
    replacements: [
      {
        search: /import { render, screen, fireEvent, waitFor, within } from '@testing-library\/react';[\s\S]*?userEvent from '@testing-library\/user-event';/m,
        replace: "import { render, fireEvent, waitFor, within } from '@testing-library/react';\nimport { screen } from '@testing-library/react';"
      }
    ]
  },
  {
    path: 'src/__tests__/maintenance/MaintenanceCreate.mega.test.jsx',
    replacements: [
      {
        search: /import { render, screen, fireEvent, waitFor, within } from '@testing-library\/react';[\s\S]*?userEvent from '@testing-library\/user-event';/m,
        replace: "import { render, fireEvent, waitFor, within } from '@testing-library/react';\nimport { screen } from '@testing-library/react';"
      }
    ]
  },
  {
    path: 'src/__tests__/notifications/NotificationBadge.test.jsx',
    replacements: [
      {
        search: /import { render, screen, fireEvent } from '@testing-library\/react';[\s\S]*?userEvent from '@testing-library\/user-event';/m,
        replace: "import { render, fireEvent } from '@testing-library/react';\nimport { screen } from '@testing-library/react';\nimport userEvent from '@testing-library/user-event';"
      }
    ]
  }
];

// Fix each file
filesToFix.forEach(file => {
  const filePath = path.join(process.cwd(), file.path);
  console.log(`Fixing ${file.path}...`);

  if (!fs.existsSync(filePath)) {
    console.log(`  File does not exist: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  file.replacements.forEach(rep => {
    const originalContent = content;
    content = content.replace(rep.search, rep.replace);
    if (content !== originalContent) {
      modified = true;
      console.log('  Applied replacement');
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log('  File updated successfully.');
  } else {
    console.log('  No changes needed or replacements did not match.');
  }
});
