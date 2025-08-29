#!/usr/bin/env python3
"""
Comprehensive test runner that focuses on improving test coverage.
"""
import os
import sys
import argparse
import subprocess
from pathlib import Path


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Run tests with coverage analysis")
    parser.add_argument('--target', '-t', type=int, default=60,
                       help='Target coverage percentage (default: 60)')
    parser.add_argument('--module', '-m', type=str, default=None,
                       help='Specific module to test (e.g., controllers.auth_controller)')
    parser.add_argument('--report', '-r', action='store_true',
                       help='Generate HTML coverage report')
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='Verbose output')
    parser.add_argument('--missing', action='store_true',
                       help='Show missing lines')
    return parser.parse_args()


def get_current_coverage():
    """Get the current coverage percentage."""
    result = subprocess.run(
        ["pytest", "--cov=src", "--cov-report=term"],
        capture_output=True,
        text=True
    )
    
    for line in result.stdout.split('\n'):
        if "TOTAL" in line:
            parts = line.split()
            if len(parts) >= 4:
                try:
                    return float(parts[3].strip('%'))
                except ValueError:
                    pass
    
    return 0.0


def find_low_coverage_modules(threshold=50):
    """Find modules with coverage below threshold."""
    result = subprocess.run(
        ["pytest", "--cov=src", "--cov-report=term"],
        capture_output=True,
        text=True
    )
    
    low_coverage = []
    current_module = None
    
    for line in result.stdout.split('\n'):
        if "src/" in line and "%" in line:
            parts = line.split()
            if len(parts) >= 4:
                module = parts[0].strip()
                try:
                    coverage = float(parts[3].strip('%'))
                    if coverage < threshold:
                        low_coverage.append((module, coverage))
                except ValueError:
                    pass
    
    return sorted(low_coverage, key=lambda x: x[1])


def suggest_improvements(low_coverage_modules):
    """Suggest improvements based on low coverage modules."""
    if not low_coverage_modules:
        print("\nAll modules meet minimum coverage threshold!")
        return
        
    print("\n===== SUGGESTED IMPROVEMENTS =====")
    print("The following modules need more test coverage:")
    
    for module, coverage in low_coverage_modules:
        print(f"  {module}: {coverage}% coverage")
    
    worst_modules = low_coverage_modules[:3]
    print("\nFocus on these modules first:")
    for module, coverage in worst_modules:
        print(f"  {module}: {coverage}% coverage")
        module_path = Path(module)
        test_module = f"src/tests/{module.replace('src/', '')}"
        test_module = test_module.replace('.py', '_test.py')
        if not Path(test_module).exists():
            test_module = f"src/tests/test_{module.split('/')[-1]}"
        print(f"  Run: pytest --cov={module} {test_module}")


def run_tests(args):
    """Run tests with coverage analysis."""
    cmd = ["pytest"]
    
    if args.verbose:
        cmd.append("-v")
    
    if args.module:
        module_path = f"src/{args.module.replace('.', '/')}.py"
        test_path = f"src/tests/{args.module.replace('.', '/')}_test.py"
        if not Path(test_path).exists():
            test_path = f"src/tests/test_{args.module.split('.')[-1]}.py"
        
        cmd.extend([f"--cov={module_path}", test_path])
    else:
        cmd.extend(["--cov=src", "src/tests"])
    
    if args.missing:
        cmd.append("--cov-report=term-missing")
    else:
        cmd.append("--cov-report=term")
    
    if args.report:
        cmd.append("--cov-report=html")
    
    print(f"Running: {' '.join(cmd)}")
    subprocess.run(cmd)
    
    current = get_current_coverage()
    target = args.target
    
    print(f"\nCurrent coverage: {current}%")
    print(f"Target coverage: {target}%")
    
    if current < target:
        diff = target - current
        print(f"Need to improve by {diff:.1f}%")
        low_coverage_modules = find_low_coverage_modules(threshold=50)
        suggest_improvements(low_coverage_modules)
    else:
        print("Target coverage achieved!")


if __name__ == "__main__":
    os.environ["PYTHONPATH"] = os.getcwd()
    args = parse_args()
    run_tests(args)
