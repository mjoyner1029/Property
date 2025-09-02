# Backend Development

The backend-specific Makefile has been consolidated with the root Makefile for simplicity and maintainability.

## Available Commands

All backend-related commands are now available from the project root:

```bash
# Run backend tests
make test-backend
make test-backend-verbose

# Run backend with coverage
make test-coverage

# Development server
make run
make dev-server

# Database operations
make migrate
make upgrade
make init-db

# Code quality and inspection
make format
make lint
make list-routes
make check-security

# Cleanup
make backend-clean
```

Run `make help` from the project root for a complete list of available commands.
