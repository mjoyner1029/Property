#!/usr/bin/env python
"""
Generate a test coverage badge for the README.md file.
"""
import json
import sys
import os
import re
from datetime import datetime

# Load coverage data
try:
    with open('coverage.json', 'r') as f:
        coverage_data = json.load(f)
    coverage_percent = coverage_data['totals']['percent_covered']
except FileNotFoundError:
    print("Error: coverage.json not found. Run pytest with coverage first.")
    sys.exit(1)

# Determine badge color based on coverage
if coverage_percent >= 90:
    color = 'brightgreen'
elif coverage_percent >= 80:
    color = 'green'
elif coverage_percent >= 70:
    color = 'yellowgreen'
elif coverage_percent >= 60:
    color = 'yellow'
elif coverage_percent >= 50:
    color = 'orange'
else:
    color = 'red'

# Create badge URL
badge_url = f"https://img.shields.io/badge/coverage-{coverage_percent:.1f}%25-{color}"

# Look for README.md in the project root
readme_path = None
for path in ['README.md', 'readme.md', '../README.md']:
    if os.path.exists(path):
        readme_path = path
        break

if readme_path:
    with open(readme_path, 'r') as f:
        content = f.read()
    
    # Check if the badge already exists
    badge_pattern = r"!\[Test Coverage\]\(https://img\.shields\.io/badge/coverage-[0-9.]+%25-[a-z]+\)"
    
    if re.search(badge_pattern, content):
        # Update existing badge
        updated_content = re.sub(
            badge_pattern,
            f"![Test Coverage]({badge_url})",
            content
        )
    else:
        # Add badge at the top of the file (after the title)
        title_end = content.find('\n') + 1
        updated_content = content[:title_end] + f"\n![Test Coverage]({badge_url})\n" + content[title_end:]
    
    # Write updated README
    with open(readme_path, 'w') as f:
        f.write(updated_content)
        
    print(f"Coverage badge updated in {readme_path}: {coverage_percent:.1f}%")
else:
    # Create a new badge markdown
    badge_markdown = f"![Test Coverage]({badge_url})"
    print("\nCopy this badge markdown to your README.md:")
    print(badge_markdown)

# Generate badge image using ansi colors if running in terminal
if sys.stdout.isatty():
    label_width = 9  # "coverage"
    value_width = len(f"{coverage_percent:.1f}%") + 2  # add 2 for padding
    
    # ANSI colors
    reset = "\033[0m"
    grey_bg = "\033[48;5;240m"
    white_fg = "\033[38;5;255m"
    
    # Set color based on coverage
    if coverage_percent >= 90:
        color_bg = "\033[48;5;34m"  # bright green
    elif coverage_percent >= 80:
        color_bg = "\033[48;5;28m"  # green
    elif coverage_percent >= 70:
        color_bg = "\033[48;5;106m"  # yellow green
    elif coverage_percent >= 60:
        color_bg = "\033[48;5;178m"  # yellow
    elif coverage_percent >= 50:
        color_bg = "\033[48;5;172m"  # orange
    else:
        color_bg = "\033[48;5;160m"  # red
    
    print("\n" + "=" * (label_width + value_width + 4))
    print(f"{grey_bg}{white_fg} coverage {reset}{color_bg}{white_fg} {coverage_percent:.1f}% {reset}")
    print("=" * (label_width + value_width + 4))
    print(f"Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
