// k6 Soak Test - Sustained load over time to find memory leaks
// Usage: k6 run tests/load/soak.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.API_URL || 'http://localhost:8080/api/v1';

export const options = {
  stages: [
    { duration: '5m', target: 50 },    // Ramp up
    { duration: '4h', target: 50 },    // Sustained load for 4 hours
    { duration: '5m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],     // <1% errors over time
    http_req_duration: ['p(95)<1000'],  // 95% < 1s
    http_req_duration: ['p(99)<2000'],  // 99% < 2s
  },
};

const PROFILE_ADDRS = [
  '11111111111111111111111111111111',
  '22222222222222222222222222222222',
  '33333333333333333333333333333333',
];

export default function () {
  // Mix of operations
  const ops = [
    () => http.get(`${BASE_URL}/health`),
    () => http.get(`${BASE_URL}/profiles`),
    () => http.get(`${BASE_URL}/profiles?page=1&page_size=10`),
    () => http.get(`${BASE_URL}/price/sol`),
  ];

  const op = ops[Math.floor(Math.random() * ops.length)];
  const res = op();

  check(res, {
    'status is 200 or 404': (r) => r.status === 200 || r.status === 404,
  });

  sleep(1 + Math.random());
}

export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    test: 'soak',
    duration: data.state.testRunDurationMs,
    totalRequests: data.metrics.http_reqs.values.count,
    failedRequests: data.metrics.http_req_failed.values.passes,
    avgDuration: data.metrics.http_req_duration.values.avg,
    p95Duration: data.metrics.http_req_duration.values['p(95)'],
    p99Duration: data.metrics.http_req_duration.values['p(99)'],
  };

  return {
    'tests/load/results/soak.json': JSON.stringify(summary, null, 2),
  };
}
