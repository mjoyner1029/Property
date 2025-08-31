#!/bin/bash
# Script to run tests with coverage and track improvements over time

# Set variables
COVERAGE_DIR="coverage_reports"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
COVERAGE_FILE="${COVERAGE_DIR}/coverage_${DATE}.json"
SUMMARY_FILE="${COVERAGE_DIR}/summary.txt"

# Create directory for coverage reports if it doesn't exist
mkdir -p $COVERAGE_DIR

# Run the tests with coverage
echo "Running tests with coverage..."
python -m pytest -v --cov=src --cov-report=term --cov-report=json

# If coverage.json exists, save it with timestamp
if [ -f "coverage.json" ]; then
    echo "Saving coverage report to ${COVERAGE_FILE}..."
    cp coverage.json $COVERAGE_FILE
    
    # Extract overall coverage percentage
    COVERAGE=$(python -c "import json; data = json.load(open('coverage.json')); print(data['totals']['percent_covered'])")
    
    # Save to summary file
    echo "${DATE},${COVERAGE}" >> $SUMMARY_FILE
    echo "Current coverage: ${COVERAGE}%"
    
    # Generate HTML report
    python -m pytest --cov=src --cov-report=html
    echo "HTML report generated in htmlcov/ directory"
    
    # Run the coverage analyzer script if it exists
    if [ -f "coverage_analyzer.py" ]; then
        echo "Running coverage analyzer..."
        python coverage_analyzer.py
    fi
else
    echo "Error: coverage.json not found"
    exit 1
fi

# Check if we have previous coverage data to compare
if [ $(wc -l < $SUMMARY_FILE) -gt 1 ]; then
    # Get previous coverage
    PREV_COVERAGE=$(tail -n 2 $SUMMARY_FILE | head -n 1 | cut -d ',' -f 2)
    
    # Calculate difference
    DIFF=$(python -c "print(round(float('${COVERAGE}') - float('${PREV_COVERAGE}'), 2))")
    
    if (( $(echo "$DIFF > 0" | bc -l) )); then
        echo "Coverage improved by ${DIFF}% since last run! 🎉"
    elif (( $(echo "$DIFF < 0" | bc -l) )); then
        echo "Warning: Coverage decreased by ${DIFF}% since last run! 📉"
    else
        echo "Coverage unchanged since last run."
    fi
fi

# Print next steps
echo ""
echo "Next steps:"
echo "1. Review the HTML report in htmlcov/"
echo "2. Focus on files with lowest coverage first"
echo "3. Run './improve_coverage.sh' again after adding tests to track progress"
