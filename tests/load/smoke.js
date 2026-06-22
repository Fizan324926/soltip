// k6 Smoke Test - Quick validation that API is functioning
// Usage: k6 run tests/load/smoke.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.API_URL || 'http://localhost:8080/api/v1';

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {
  // Health check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health: status 200': (r) => r.status === 200,
    'health: body contains ok': (r) => r.body.includes('ok'),
  });

  // List profiles
  const profilesRes = http.get(`${BASE_URL}/profiles`);
  check(profilesRes, {
    'profiles: status 200': (r) => r.status === 200,
    'profiles: is array': (r) => {
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data.items || data);
      } catch {
        return false;
      }
    },
  });

  // SOL price
  const priceRes = http.get(`${BASE_URL}/price/sol`);
  check(priceRes, {
    'price: status 200': (r) => r.status === 200,
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify(data, null, 2),
  };
}
