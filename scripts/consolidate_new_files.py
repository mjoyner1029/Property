#!/usr/bin/env python3
"""
Script to consolidate .new files with their original counterparts in the Property repository.
This script compares the .new files with their originals and offers options to:
1. Keep the newer file (based on timestamp)
2. Keep the file with the most changes
3. Remove .new files if identical
4. View diffs between files
"""

import os
import sys
import difflib
import filecmp
import datetime
import argparse
from pathlib import Path


def get_file_info(file_path):
    """Get file modification time and size."""
    stat = os.stat(file_path)
    mod_time = datetime.datetime.fromtimestamp(stat.st_mtime)
    size = stat.st_size
    return mod_time, size


def compare_files(original_path, new_path):
    """Compare two files and return a dict with comparison results."""
    if not os.path.exists(original_path) or not os.path.exists(new_path):
        return None

    orig_mod_time, orig_size = get_file_info(original_path)
    new_mod_time, new_size = get_file_info(new_path)
    
    # Check if files are identical
    are_identical = filecmp.cmp(original_path, new_path, shallow=False)
    
    # Get diff info
    if not are_identical:
        with open(original_path, 'r', encoding='utf-8', errors='replace') as f1:
            orig_lines = f1.readlines()
        with open(new_path, 'r', encoding='utf-8', errors='replace') as f2:
            new_lines = f2.readlines()
        
        differ = difflib.Differ()
        diff = list(differ.compare(orig_lines, new_lines))
        
        # Count lines added/removed
        added = sum(1 for line in diff if line.startswith('+ '))
        removed = sum(1 for line in diff if line.startswith('- '))
        
        # Generate unified diff
        unified_diff = '\n'.join(difflib.unified_diff(
            orig_lines, new_lines, 
            fromfile=f"a/{os.path.basename(original_path)}", 
            tofile=f"b/{os.path.basename(new_path)}", 
            n=3
        ))
    else:
        added = 0
        removed = 0
        unified_diff = ""
    
    return {
        "original_path": original_path,
        "new_path": new_path,
        "original_mod_time": orig_mod_time,
        "new_mod_time": new_mod_time,
        "are_identical": are_identical,
        "lines_added": added,
        "lines_removed": removed,
        "unified_diff": unified_diff,
        "original_is_newer": orig_mod_time > new_mod_time,
        "new_is_newer": new_mod_time > orig_mod_time,
    }


def find_all_new_files(base_dir):
    """Find all .new files in the repository."""
    new_files = []
    for root, _, files in os.walk(base_dir):
        for file in files:
            if file.endswith(".new"):
                new_path = os.path.join(root, file)
                original_path = new_path[:-4]  # Remove .new extension
                if os.path.exists(original_path):
                    new_files.append((original_path, new_path))
    
    return new_files


def process_files(file_pairs, mode="interactive"):
    """Process all file pairs based on the selected mode."""
    results = {
        "kept_original": 0,
        "kept_new": 0,
        "removed_new": 0,
        "error": 0
    }
    
    for original_path, new_path in file_pairs:
        print(f"\nProcessing: {os.path.basename(original_path)} and {os.path.basename(new_path)}")
        
        comparison = compare_files(original_path, new_path)
        if not comparison:
            print(f"Error: Could not compare files.")
            results["error"] += 1
            continue
        
        if comparison["are_identical"]:
            print(f"Files are identical. Removing {new_path}")
            if mode != "dry-run":
                os.remove(new_path)
            results["removed_new"] += 1
            continue
        
        # Print comparison info
        print(f"Original last modified: {comparison['original_mod_time']}")
        print(f"New file last modified: {comparison['new_mod_time']}")
        print(f"Changes: +{comparison['lines_added']} -{comparison['lines_removed']} lines")
        
        if mode == "interactive":
            print("\nDiff:")
            print(comparison["unified_diff"])
            
            choice = input("\nActions:\n"
                          "1) Keep original file (remove .new)\n"
                          "2) Replace with .new file\n"
                          "s) Skip this pair\n"
                          "Enter choice [1/2/s]: ").strip().lower()
                          
            if choice == '1':
                os.remove(new_path)
                results["kept_original"] += 1
            elif choice == '2':
                with open(new_path, 'r', encoding='utf-8', errors='replace') as f:
                    content = f.read()
                with open(original_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                os.remove(new_path)
                results["kept_new"] += 1
            else:
                print("Skipping this file pair.")
        
        elif mode == "keep-newest":
            if comparison["new_is_newer"]:
                print(f"Keeping newer .new file content")
                if mode != "dry-run":
                    with open(new_path, 'r', encoding='utf-8', errors='replace') as f:
                        content = f.read()
                    with open(original_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    os.remove(new_path)
                results["kept_new"] += 1
            else:
                print(f"Original file is newer, removing .new file")
                if mode != "dry-run":
                    os.remove(new_path)
                results["kept_original"] += 1
                
        elif mode == "dry-run":
            if comparison["new_is_newer"]:
                print(f"Would keep newer .new file content")
                results["kept_new"] += 1
            else:
                print(f"Original file is newer, would remove .new file")
                results["kept_original"] += 1
    
    return results


def main():
    parser = argparse.ArgumentParser(description='Consolidate .new files with their originals')
    parser.add_argument('--mode', choices=['interactive', 'keep-newest', 'dry-run'], 
                        default='interactive', help='Processing mode')
    parser.add_argument('--base-dir', default=os.getcwd(), 
                        help='Base directory to search for .new files')
    
    args = parser.parse_args()
    
    # Find all .new files with existing originals
    print(f"Searching for .new files in {args.base_dir}...")
    file_pairs = find_all_new_files(args.base_dir)
    
    if not file_pairs:
        print("No .new files found with matching originals.")
        return
    
    print(f"Found {len(file_pairs)} .new files with matching originals.")
    
    # Process files
    results = process_files(file_pairs, mode=args.mode)
    
    # Print summary
    print("\nSummary:")
    print(f"Kept original files: {results['kept_original']}")
    print(f"Updated with .new content: {results['kept_new']}")
    print(f"Removed identical .new files: {results['removed_new']}")
    if results['error'] > 0:
        print(f"Errors encountered: {results['error']}")


if __name__ == "__main__":
    main()
