#!/usr/bin/env python3
"""
Script to update outdated dependencies.
"""
import os
import sys
import subprocess
import tempfile
from pathlib import Path


def get_outdated_packages():
    """Get a list of outdated packages."""
    result = subprocess.run(
        ["pip", "list", "--outdated", "--format=json"],
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        print(f"Error checking outdated packages: {result.stderr}")
        return []
    
    import json
    try:
        packages = json.loads(result.stdout)
        return packages
    except json.JSONDecodeError:
        print(f"Error parsing outdated packages: {result.stdout}")
        return []


def update_requirements(packages):
    """Update requirements.txt and requirements-dev.txt with updated package versions."""
    req_files = ["requirements.txt", "requirements-dev.txt"]
    updated_files = []
    
    for req_file in req_files:
        path = Path(__file__).parent / req_file
        if not path.exists():
            print(f"Skipping {req_file} - file does not exist")
            continue
            
        print(f"\nUpdating {req_file}...")
        updated = False
        
        # Read existing requirements
        with open(path, 'r') as f:
            requirements = f.readlines()
            
        # Create a temporary file for writing the updated requirements
        with tempfile.NamedTemporaryFile(mode='w', delete=False) as tmp:
            for line in requirements:
                line = line.strip()
                
                # Skip empty lines and comments
                if not line or line.startswith('#'):
                    tmp.write(f"{line}\n")
                    continue
                    
                # Extract package name and version spec
                if "==" in line:
                    pkg_name = line.split("==")[0].strip()
                    is_pinned = True
                elif ">=" in line:
                    pkg_name = line.split(">=")[0].strip()
                    is_pinned = False
                elif "~=" in line:
                    pkg_name = line.split("~=")[0].strip()
                    is_pinned = False
                else:
                    # Keep unpinned dependencies as is
                    tmp.write(f"{line}\n")
                    continue
                
                # Check if package is outdated
                outdated_pkg = next((p for p in packages if p["name"].lower() == pkg_name.lower()), None)
                
                if outdated_pkg:
                    latest_version = outdated_pkg["latest_version"]
                    if is_pinned:
                        updated_line = f"{pkg_name}=={latest_version}"
                    else:
                        # Keep the original comparison operator
                        operator = ">=" if ">=" in line else "~=" if "~=" in line else "=="
                        updated_line = f"{pkg_name}{operator}{latest_version}"
                    
                    print(f"  Updating {pkg_name} to version {latest_version}")
                    tmp.write(f"{updated_line}\n")
                    updated = True
                else:
                    # Keep the original line
                    tmp.write(f"{line}\n")
                    
        # Replace the original file with the updated one
        tmp_path = Path(tmp.name)
        tmp_path.replace(path)
        
        if updated:
            updated_files.append(req_file)
            
    return updated_files


def main():
    """Main function to update dependencies."""
    print("Checking for outdated packages...")
    packages = get_outdated_packages()
    
    if not packages:
        print("All packages are up to date.")
        return
    
    print(f"Found {len(packages)} outdated packages.")
    
    updated_files = update_requirements(packages)
    
    if updated_files:
        print("\nUpdated dependencies in the following files:")
        for file in updated_files:
            print(f"- {file}")
        print("\nTo install updated dependencies, run:")
        print("  pip install -r requirements.txt")
        print("  pip install -r requirements-dev.txt  # if applicable")
    else:
        print("\nNo files were updated.")


if __name__ == "__main__":
    main()
