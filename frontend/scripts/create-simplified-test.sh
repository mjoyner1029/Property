#!/bin/bash

# Script to create simplified test files from existing tests
# This script will:
# 1. Take an existing test file
# 2. Create a simplified version that uses mocked contexts and direct component rendering
# 3. Replace complex getByText/getByLabelText queries with role-based queries when possible

if [ $# -ne 1 ]; then
  echo "Usage: $0 <test_file_path>"
  exit 1
fi

# Get the full path of the input file
INPUT_FILE=$1
OUTPUT_FILE=$(echo "$INPUT_FILE" | sed 's/\.test\./Simplified.test./')

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
  echo "Error: File $INPUT_FILE does not exist"
  exit 1
fi

# Check if output file already exists
if [ -f "$OUTPUT_FILE" ]; then
  echo "Warning: $OUTPUT_FILE already exists. It will be overwritten."
fi

echo "Creating simplified test file from $INPUT_FILE..."
echo "Output file: $OUTPUT_FILE"

# Extract component name from the file path
COMPONENT_NAME=$(basename "$INPUT_FILE" | sed -E 's/(.*)\..*/\1/')
COMPONENT_NAME=${COMPONENT_NAME%.test}

# Extract import statements from the original file
IMPORTS=$(grep -E '^import' "$INPUT_FILE")

# Create simplified test file
cat > "$OUTPUT_FILE" << EOL
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ${COMPONENT_NAME} from 'src/pages/${COMPONENT_NAME}';
import { act } from 'react';

// Mock dependencies
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock auth context
const mockAuthActions = {
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn()
};

jest.mock('src/context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    loading: false,
    error: null,
    ...mockAuthActions
  }),
}));

const theme = createTheme();

describe('${COMPONENT_NAME} page simplified', () => {
  const renderComponent = (props = {}) => {
    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <${COMPONENT_NAME} {...props} />
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', async () => {
    renderComponent();
    // Add assertions here
  });
});
EOL

echo "Created simplified test file: $OUTPUT_FILE"
echo "Remember to add appropriate test assertions!"
