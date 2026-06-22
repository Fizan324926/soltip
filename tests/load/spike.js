// k6 Spike Test - Sudden traffic surge
// Usage: k6 run tests/load/spike.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.API_URL || 'http://localhost:8080/api/v1';

export const options = {
  stages: [
    { duration: '1m', target: 10 },    // Normal load
    { duration: '10s', target: 500 },  // Spike to 500 users
    { duration: '3m', target: 500 },   // Stay at spike
    { duration: '10s', target: 10 },   // Scale down
    { duration: '2m', target: 10 },    // Recovery
    { duration: '10s', target: 0 },    // End
  ],
  thresholds: {
    http_req_failed: ['rate<0.10'],      // <10% during spike
    http_req_duration: ['p(95)<5000'],   // 95% < 5s (relaxed)
  },
};

export default function () {
  const endpoints = [
    '/health',
    '/profiles',
    '/price/sol',
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.get(`${BASE_URL}${endpoint}`);

  check(res, {
    'status is 2xx or 429': (r) => r.status >= 200 && r.status < 300 || r.status === 429,
  });

  sleep(0.1 + Math.random() * 0.4);
}

export function handleSummary(data) {
  console.log('\n=== Spike Test Summary ===');
  console.log(`Total Requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`Error Rate: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%`);
  console.log(`P95 Duration: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);

  return {
    'tests/load/results/spike.json': JSON.stringify({
      timestamp: new Date().toISOString(),
      test: 'spike',
      totalRequests: data.metrics.http_reqs.values.count,
      errorRate: data.metrics.http_req_failed.values.rate,
      p95Duration: data.metrics.http_req_duration.values['p(95)'],
    }, null, 2),
  };
}
