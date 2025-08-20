test:
	pytest -q

perf-smoke:
	k6 run perf/k6/smoke.js

perf-load:
	k6 run perf/k6/load.js

# Run perf test against a specific API URL
# Usage: make perf-smoke-api API_URL=https://api.assetanchor.io
perf-smoke-api:
	k6 run -e API_URL=$(API_URL) perf/k6/smoke.js

perf-load-api:
	k6 run -e API_URL=$(API_URL) perf/k6/load.js
