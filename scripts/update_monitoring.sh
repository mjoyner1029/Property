#!/bin/bash
# Script to update monitoring configuration files

set -e

echo "Updating monitoring configuration files..."

# Check if we're in the correct directory
if [ ! -d "monitoring" ]; then
  echo "Error: This script must be run from the root of the Property repository."
  exit 1
fi

# Function to replace a file if it exists
replace_file() {
  local src=$1
  local dest=$2
  
  if [ -f "$dest" ] && [ -f "$src" ]; then
    echo "Replacing $dest with $src"
    mv "$src" "$dest"
  elif [ -f "$src" ]; then
    echo "Creating new file $dest from $src"
    mv "$src" "$dest"
  else
    echo "Warning: Source file $src doesn't exist"
  fi
}

# Update Prometheus configuration
if [ -f "monitoring/prometheus/prometheus.yml.new" ]; then
  replace_file "monitoring/prometheus/prometheus.yml.new" "monitoring/prometheus/prometheus.yml"
fi

# Create directories if they don't exist
mkdir -p monitoring/prometheus/rules
mkdir -p monitoring/alertmanager/templates
mkdir -p monitoring/loki/rules
mkdir -p monitoring/tempo
mkdir -p monitoring/grafana/dashboards/slos
mkdir -p monitoring/grafana/dashboards/infrastructure
mkdir -p monitoring/otel-collector
mkdir -p monitoring/blackbox-exporter

# Check config files with their respective tools if available
if command -v promtool &> /dev/null; then
  echo "Validating Prometheus config..."
  promtool check config monitoring/prometheus/prometheus.yml
  promtool check rules monitoring/prometheus/rules/recording_rules.yml
  promtool check rules monitoring/prometheus/rules/alerts_slo.yml
fi

if command -v amtool &> /dev/null; then
  echo "Validating Alertmanager config..."
  amtool check-config monitoring/alertmanager/alertmanager.yml
fi

# Create a simple test for the configuration
echo "Testing configurations with Docker Compose..."
if command -v docker-compose &> /dev/null; then
  # Run a simple test
  docker-compose -f docker-compose.yml up -d prometheus alertmanager
  sleep 5
  
  # Check if services are up
  if curl -s http://localhost:9090/-/ready > /dev/null; then
    echo "Prometheus is running correctly."
  else
    echo "Warning: Prometheus failed to start properly."
  fi
  
  if curl -s http://localhost:9093/-/ready > /dev/null; then
    echo "Alertmanager is running correctly."
  else
    echo "Warning: Alertmanager failed to start properly."
  fi
  
  # Clean up
  docker-compose -f docker-compose.yml down
fi

echo "Configuration update completed."
