# Asset Anchor Production Monitoring Stack

This directory contains the configuration files and setup for the Asset Anchor production monitoring stack using Prometheus, Grafana, and Alertmanager.

## Components

- **Prometheus**: Metrics collection and storage
- **Grafana**: Data visualization and dashboarding
- **Alertmanager**: Alert handling and notifications
- **Node Exporter**: Host metrics collection

## Setup Instructions

### Prerequisites

- Docker and Docker Compose installed
- Access to SMTP server for email alerts
- Slack workspace for notifications (optional)
- PagerDuty account for critical alerts (optional)

### Configuration

1. Create environment file:

```bash
cp monitoring/.env.template monitoring/.env
```

2. Edit the `.env` file with your production values:

```bash
# Use your favorite editor
nano monitoring/.env
```

3. Set up production configurations:

```bash
# Prometheus
cp monitoring/prometheus/prometheus.yml.production monitoring/prometheus/prometheus.yml

# Alertmanager
cp monitoring/alertmanager/alertmanager.yml.production monitoring/alertmanager/alertmanager.yml

# Grafana datasources
cp monitoring/grafana/provisioning/datasources/datasources.production.yml monitoring/grafana/provisioning/datasources/datasources.yml
```

### Starting the Monitoring Stack

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

### Access URLs

- Prometheus: http://your-server:9090
- Grafana: http://your-server:3003
- Alertmanager: http://your-server:9093

Default Grafana login is `admin / securepassword` (change this in the `.env` file)

## Integration with Asset Anchor Application

### Backend Metrics

The Prometheus configuration is set up to scrape metrics from the Asset Anchor backend at the `/api/metrics` endpoint.

To ensure metrics are correctly exposed:

1. Make sure the backend application has prometheus metrics middleware enabled
2. Verify the backend is accessible from the Prometheus container

### Infrastructure Metrics

Node Exporter collects system metrics from the host. These metrics include:

- CPU, memory, and disk usage
- Network traffic
- System load
- Filesystem stats

### Alert Rules

Alert rules are defined in the `monitoring/prometheus/rules/` directory:

- **alerts_slo.yml**: Service Level Objective alerts
- **recording_rules.yml**: Pre-calculated metrics for faster queries

## Maintenance

### Backing up Data

To backup Prometheus and Grafana data:

```bash
docker-compose -f docker-compose.monitoring.yml exec prometheus sh -c "cd /prometheus && tar czf - ." > prometheus_data_backup.tar.gz
docker-compose -f docker-compose.monitoring.yml exec grafana sh -c "cd /var/lib/grafana && tar czf - ." > grafana_data_backup.tar.gz
```

### Updating Components

To update the monitoring stack components:

```bash
docker-compose -f docker-compose.monitoring.yml pull
docker-compose -f docker-compose.monitoring.yml up -d
```

### Troubleshooting

- Check component status: `docker-compose -f docker-compose.monitoring.yml ps`
- View logs: `docker-compose -f docker-compose.monitoring.yml logs -f [service]`
- Restart a service: `docker-compose -f docker-compose.monitoring.yml restart [service]`

## Security Considerations

- Use secure passwords for Grafana and other services
- Configure HTTPS for all services in production
- Restrict access to monitoring services to trusted IPs
- Use role-based access control in Grafana

## Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/introduction/overview/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Alertmanager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)
