#!/usr/bin/env python
"""
Update SQLAlchemy Query.get() calls to Session.get() throughout the codebase.
This script helps eliminate SQLAlchemy 2.0 deprecation warnings.
"""
import os
import re
from pathlib import Path

def update_file(file_path):
    """Update SQLAlchemy Query.get() to Session.get() in a file"""
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()

    # Define regex patterns to match different variations of Query.get()
    patterns = [
        # Basic pattern: db.session.get(Model, id)
        (r'(\w+)\.query\.get\(([^)]+)\)', r'db.session.get(\1, \2)'),
        
        # With assignment: var = db.session.get(Model, id)
        (r'(\w+)\s*=\s*(\w+)\.query\.get\(([^)]+)\)', r'\1 = db.session.get(\2, \3)'),
        
        # Query from session: db.session.get(Model, id)
        (r'db\.session\.query\((\w+)\)\.get\(([^)]+)\)', r'db.session.get(\1, \2)'),
    ]
    
    # Keep track of changes
    original_content = content
    
    # Apply each regex pattern
    for pattern, replacement in patterns:
        content = re.sub(pattern, replacement, content)
    
    # Write updated content back if changes were made
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(content)
        return True
    return False

def add_import_if_needed(file_path):
    """Add import for db if it's not already present"""
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Check for existing db import
    if 'from ..extensions import db' not in content and 'from src.extensions import db' not in content:
        # If using models but no db import, add it
        if re.search(r'from \.\.(models|models\.\w+) import', content) or re.search(r'from src\.(models|models\.\w+) import', content):
            if 'from ..' in content:
                new_import = 'from ..extensions import db\n'
            else:
                new_import = 'from src.extensions import db\n'
            
            # Find a good place to insert the import
            lines = content.split('\n')
            import_section_end = 0
            for i, line in enumerate(lines):
                if line.startswith('import ') or line.startswith('from '):
                    import_section_end = i + 1
                elif line.strip() and import_section_end > 0:
                    break
            
            lines.insert(import_section_end, new_import)
            
            # Write updated content back
            with open(file_path, 'w', encoding='utf-8') as file:
                file.write('\n'.join(lines))
            return True
    return False

def process_directory(directory):
    """Process all Python files in directory and subdirectories"""
    changed_files = []
    
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(root, file)
                file_changed = update_file(file_path)
                import_added = add_import_if_needed(file_path)
                
                if file_changed or import_added:
                    changed_files.append(file_path)
    
    return changed_files

if __name__ == '__main__':
    src_dir = Path(__file__).resolve().parent.parent
    changed = process_directory(src_dir)
    
    print(f"Updated {len(changed)} files:")
    for file in changed:
        print(f" - {file}")
