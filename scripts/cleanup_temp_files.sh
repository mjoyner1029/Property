#!/bin/bash
# Script to delete all .bak, .new, and .tmp files from the repository

set -euo pipefail

# Store the list of files to be deleted
FILES_TO_DELETE=$(find . -type f \( -name "*.bak" -o -name "*.new" -o -name "*.tmp" \) | sort)

# Print the files that will be deleted
if [ -z "$FILES_TO_DELETE" ]; then
  echo "No .bak, .new, or .tmp files found."
  exit 0
else
  echo "The following files will be deleted:"
  echo "$FILES_TO_DELETE" | while read -r file; do
    echo "  $file"
  done
  
  # Delete the files
  echo "$FILES_TO_DELETE" | xargs rm -f
  
  echo "All temporary files have been deleted."
fi
