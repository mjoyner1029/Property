#!/usr/bin/env python
"""
This script helps identify and prioritize files that need test coverage improvement.
"""
import os
import sys
import json
import subprocess
from collections import defaultdict

def run_coverage():
    """Run pytest with coverage and generate JSON report"""
    print("Running test coverage analysis...")
    subprocess.run(
        ["python", "-m", "pytest", "--cov=src", "--cov-report=json"],
        check=True
    )
    
    # Load coverage data
    with open('coverage.json', 'r') as f:
        coverage_data = json.load(f)
    
    return coverage_data

def analyze_coverage(coverage_data):
    """Analyze coverage data and identify priorities"""
    # Extract file coverage
    files_by_coverage = []
    
    for file_path, data in coverage_data['files'].items():
        # Skip test files and debug files
        if 'tests/' in file_path or 'debug_' in file_path:
            continue
            
        total_lines = data['summary']['num_statements']
        covered_lines = data['summary']['covered_statements'] 
        
        if total_lines > 0:
            coverage_pct = (covered_lines / total_lines) * 100
            missing_lines = total_lines - covered_lines
            
            files_by_coverage.append({
                'path': file_path,
                'coverage': coverage_pct,
                'total_lines': total_lines,
                'missing_lines': missing_lines,
                'priority_score': missing_lines * (100 - coverage_pct) / 100
            })
    
    # Sort by priority (highest first)
    files_by_coverage.sort(key=lambda x: x['priority_score'], reverse=True)
    
    return files_by_coverage

def generate_report(files_by_coverage):
    """Generate a report of files needing coverage improvements"""
    print("\n===== TEST COVERAGE IMPROVEMENT PRIORITIES =====")
    print(f"{'File Path':<60} {'Coverage %':<10} {'Missing Lines':<15} {'Priority':<10}")
    print("-" * 95)
    
    for file in files_by_coverage[:30]:  # Show top 30 priorities
        print(f"{file['path']:<60} {file['coverage']:<10.1f} {file['missing_lines']:<15} {file['priority_score']:<10.1f}")
    
    # Generate category summary
    categories = defaultdict(list)
    for file in files_by_coverage:
        parts = file['path'].split('/')
        if len(parts) >= 2:
            category = parts[1] if parts[1] != '__init__.py' else parts[0]
            categories[category].append(file)
    
    print("\n===== COVERAGE BY CATEGORY =====")
    for category, files in sorted(categories.items()):
        total_lines = sum(f['total_lines'] for f in files)
        missing_lines = sum(f['missing_lines'] for f in files)
        if total_lines > 0:
            cat_coverage = ((total_lines - missing_lines) / total_lines) * 100
            print(f"{category:<20} {cat_coverage:<10.1f}% ({total_lines - missing_lines}/{total_lines} lines)")
    
    # Overall stats
    total_all = sum(f['total_lines'] for f in files_by_coverage)
    missing_all = sum(f['missing_lines'] for f in files_by_coverage)
    overall_coverage = ((total_all - missing_all) / total_all) * 100 if total_all > 0 else 0
    
    print("\n===== OVERALL COVERAGE =====")
    print(f"Coverage: {overall_coverage:.1f}% ({total_all - missing_all}/{total_all} lines)")
    print(f"Missing coverage: {missing_all} lines")

def generate_todo_list(files_by_coverage):
    """Generate a TODO list for test coverage improvements"""
    print("\n===== TEST COVERAGE TODO LIST =====")
    
    # Group by directory for better organization
    by_dir = defaultdict(list)
    for file in files_by_coverage:
        if file['missing_lines'] == 0:
            continue
            
        path = file['path']
        directory = os.path.dirname(path)
        by_dir[directory].append(file)
    
    for dir_name, files in sorted(by_dir.items()):
        if not files:
            continue
            
        print(f"\n== {dir_name} ==")
        for file in sorted(files, key=lambda x: x['priority_score'], reverse=True):
            if file['missing_lines'] > 0:
                filename = os.path.basename(file['path'])
                print(f"- [ ] {filename}: {file['missing_lines']} lines missing ({file['coverage']:.1f}% covered)")

def main():
    """Main function"""
    coverage_data = run_coverage()
    files_by_coverage = analyze_coverage(coverage_data)
    generate_report(files_by_coverage)
    generate_todo_list(files_by_coverage)

if __name__ == "__main__":
    main()
