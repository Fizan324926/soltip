// k6 Stress Test - Find breaking point
// Usage: k6 run tests/load/stress.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.API_URL || 'http://localhost:8080/api/v1';

// Custom metrics
const errorRate = new Rate('errors');
const profileLatency = new Trend('profile_latency');
const searchLatency = new Trend('search_latency');

export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Warm up
    { duration: '5m', target: 50 },   // Ramp to moderate load
    { duration: '5m', target: 100 },  // Ramp to high load
    { duration: '5m', target: 200 },  // Stress test
    { duration: '2m', target: 0 },    // Cool down
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],          // <5% errors
    http_req_duration: ['p(95)<2000'],       // 95% < 2s
    'profile_latency': ['p(95)<1000'],       // Profile endpoint
    'search_latency': ['p(95)<1500'],        // Search endpoint
  },
};

const ENDPOINTS = [
  { method: 'GET', url: '/health', weight: 1 },
  { method: 'GET', url: '/profiles', weight: 3 },
  { method: 'GET', url: '/profiles?search=test', weight: 2 },
  { method: 'GET', url: '/price/sol', weight: 2 },
];

function weightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  return items[items.length - 1];
}

export default function () {
  const endpoint = weightedRandom(ENDPOINTS);
  const url = `${BASE_URL}${endpoint.url}`;

  const start = Date.now();
  const res = http.get(url);
  const duration = Date.now() - start;

  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000,
  });

  errorRate.add(!success);

  // Track specific endpoints
  if (endpoint.url.includes('/profiles') && !endpoint.url.includes('search')) {
    profileLatency.add(duration);
  } else if (endpoint.url.includes('search')) {
    searchLatency.add(duration);
  }

  sleep(Math.random() * 2);
}

export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    totalRequests: data.metrics.http_reqs.values.count,
    failedRequests: data.metrics.http_req_failed.values.passes,
    avgDuration: data.metrics.http_req_duration.values.avg,
    p95Duration: data.metrics.http_req_duration.values['p(95)'],
    maxDuration: data.metrics.http_req_duration.values.max,
    requestsPerSec: data.metrics.http_reqs.values.rate,
  };

  console.log('\n=== Stress Test Summary ===');
  console.log(`Total Requests: ${summary.totalRequests}`);
  console.log(`Failed: ${summary.failedRequests}`);
  console.log(`Avg Duration: ${summary.avgDuration.toFixed(2)}ms`);
  console.log(`P95 Duration: ${summary.p95Duration.toFixed(2)}ms`);
  console.log(`Max Duration: ${summary.maxDuration.toFixed(2)}ms`);
  console.log(`Requests/sec: ${summary.requestsPerSec.toFixed(2)}`);

  return {
    'tests/load/results/stress.json': JSON.stringify(summary, null, 2),
  };
}
