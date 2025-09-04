# Dependency Management

This directory contains the dependency configuration for the backend:

## Files

- `base.txt`: Core dependencies shared between dev and prod environments
- `dev.txt`: Development-specific dependencies (includes base)
- `prod.txt`: Production-specific dependencies (includes base)  
- `constraints.txt`: Pinned version constraints to ensure compatibility with Python 3.11

## Usage

### Installation

For development:
```bash
pip install -r requirements/dev.txt -c requirements/constraints.txt
```

For production:
```bash
pip install -r requirements/prod.txt -c requirements/constraints.txt
```

### Dependency Upgrade

#### Using pip-tools

1. Install pip-tools:
```bash
pip install pip-tools
```

2. Compile requirements files:
```bash
# Compile base requirements
pip-compile --output-file=requirements/base.txt requirements/base.in

# Compile prod requirements
pip-compile --output-file=requirements/prod.txt requirements/prod.in

# Compile dev requirements
pip-compile --output-file=requirements/dev.txt requirements/dev.in
```

3. Update all requirements:
```bash
pip-compile --upgrade requirements/base.txt
pip-compile --upgrade requirements/dev.txt
pip-compile --upgrade requirements/prod.txt
```

4. Check compatibility:
```bash
# After upgrading, always test that dependencies install correctly
pip install -r requirements/prod.txt -c requirements/constraints.txt
```

#### Using uv

1. Install uv:
```bash
pip install uv
```

2. Update dependencies:
```bash
# Update to latest compatible versions
uv pip compile --output-file requirements/base.txt requirements/base.in
uv pip compile --output-file requirements/prod.txt requirements/prod.in
uv pip compile --output-file requirements/dev.txt requirements/dev.in
```

3. Test compatibility:
```bash
uv pip install -r requirements/prod.txt -c requirements/constraints.txt
```

## Adding New Dependencies

1. Add the dependency to the appropriate .in file
2. Recompile using pip-tools or uv
3. Update constraints.txt if needed for version pinning
4. Test installation before committing changes
