# SolTip Load Tests

Performance and load testing using [k6](https://k6.io/).

## Installation

```bash
# macOS
brew install k6

# Ubuntu/Debian
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Docker
docker pull grafana/k6
```

## Test Types

### Smoke Test (smoke.js)
Quick validation that API is functioning correctly.
- Duration: 30 seconds
- Users: 1
- Purpose: CI/CD sanity check

```bash
k6 run tests/load/smoke.js
```

### Stress Test (stress.js)
Find the breaking point by gradually increasing load.
- Duration: ~19 minutes
- Users: 10 → 50 → 100 → 200 → 0
- Purpose: Capacity planning

```bash
k6 run tests/load/stress.js
```

### Soak Test (soak.js)
Sustained load to find memory leaks and degradation.
- Duration: ~4 hours
- Users: 50 constant
- Purpose: Reliability testing

```bash
k6 run tests/load/soak.js
```

### Spike Test (spike.js)
Sudden traffic surge to test auto-scaling.
- Duration: ~7 minutes
- Users: 10 → 500 → 10 → 0
- Purpose: Resilience testing

```bash
k6 run tests/load/spike.js
```

## Configuration

Set the API URL via environment variable:

```bash
# Local development
k6 run -e API_URL=http://localhost:8080/api/v1 tests/load/smoke.js

# Production
k6 run -e API_URL=https://api.soltip.io/api/v1 tests/load/smoke.js
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run smoke test
  uses: grafana/k6-action@v0.3.1
  with:
    filename: tests/load/smoke.js
    flags: -e API_URL=${{ env.API_URL }}
```

### Threshold Failures

Tests will fail (exit code 99) if thresholds are not met:

| Test | Metric | Threshold |
|------|--------|-----------|
| All | Error rate | <1-10% |
| Smoke | P95 latency | <500ms |
| Stress | P95 latency | <2000ms |
| Soak | P99 latency | <2000ms |
| Spike | P95 latency | <5000ms |

## Output & Results

Results are saved to `tests/load/results/`:

```bash
mkdir -p tests/load/results
k6 run --out json=tests/load/results/output.json tests/load/stress.js
```

### Grafana Cloud Integration

```bash
k6 run --out cloud tests/load/stress.js
```

## Interpreting Results

### Key Metrics

- **http_reqs**: Total requests sent
- **http_req_duration**: Request latency
- **http_req_failed**: Failed request rate
- **vus**: Virtual users
- **iterations**: Completed test iterations

### Good Results

```
✓ http_req_duration....: avg=45ms min=10ms med=40ms max=200ms p(95)=100ms
✓ http_req_failed......: 0.00% ✓ 0 ✗ 5000
```

### Concerning Results

```
✗ http_req_duration....: avg=2500ms min=50ms med=2000ms max=30000ms p(95)=5000ms
✗ http_req_failed......: 15.00% ✓ 750 ✗ 4250
```

## Troubleshooting

### "connection refused"

Ensure the API is running:
```bash
curl http://localhost:8080/api/v1/health
```

### "too many open files"

Increase file descriptor limit:
```bash
ulimit -n 10000
```

### Rate limiting (429)

The API has a 60 req/min/IP limit. For load testing:
1. Test from multiple IPs
2. Or temporarily increase the limit in development
