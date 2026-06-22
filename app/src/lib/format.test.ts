import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  formatCompact,
  formatPercent,
  formatBps,
  lamportsToSol,
  solToLamports,
  formatUsd,
  formatSol,
  shortAddress,
  formatRelativeTime,
  formatDate,
  formatDuration,
  truncate,
  pluralize,
  formatCount,
} from './format';

describe('Number Formatting', () => {
  describe('formatNumber', () => {
    it('formats integers', () => {
      expect(formatNumber(1234)).toBe('1,234');
      expect(formatNumber(1000000)).toBe('1,000,000');
    });

    it('formats with decimals', () => {
      expect(formatNumber(1234.567, 2)).toBe('1,234.57');
      expect(formatNumber(1000, 3)).toBe('1,000.000');
    });

    it('handles BigInt', () => {
      expect(formatNumber(1234n)).toBe('1,234');
    });
  });

  describe('formatCompact', () => {
    it('formats thousands', () => {
      expect(formatCompact(1500)).toBe('1.5K');
      expect(formatCompact(25000)).toBe('25.0K');
    });

    it('formats millions', () => {
      expect(formatCompact(1500000)).toBe('1.5M');
      expect(formatCompact(25000000)).toBe('25.0M');
    });

    it('returns normal for small numbers', () => {
      expect(formatCompact(500)).toBe('500');
    });
  });

  describe('formatPercent', () => {
    it('formats percentages', () => {
      expect(formatPercent(50)).toBe('50%');
      expect(formatPercent(33.333, 1)).toBe('33.3%');
    });
  });

  describe('formatBps', () => {
    it('converts basis points to percentage', () => {
      expect(formatBps(250)).toBe('2.50%');
      expect(formatBps(10000)).toBe('100.00%');
      expect(formatBps(50)).toBe('0.50%');
    });
  });
});

describe('Currency Formatting', () => {
  describe('lamportsToSol', () => {
    it('converts lamports to SOL', () => {
      expect(lamportsToSol(1000000000n)).toBe('1.000');
      expect(lamportsToSol(500000000n)).toBe('0.5000');
      expect(lamportsToSol(100000000000n)).toBe('100.00');
    });

    it('handles small amounts', () => {
      expect(lamportsToSol(100000n)).toBe('0.0001');
    });

    it('handles numbers', () => {
      expect(lamportsToSol(1000000000)).toBe('1.000');
    });
  });

  describe('solToLamports', () => {
    it('converts SOL to lamports', () => {
      expect(solToLamports(1)).toBe(1000000000n);
      expect(solToLamports(0.5)).toBe(500000000n);
      expect(solToLamports(0.001)).toBe(1000000n);
    });
  });

  describe('formatUsd', () => {
    it('formats USD amounts', () => {
      expect(formatUsd(99.99)).toBe('$99.99');
      expect(formatUsd(1234.5)).toBe('$1,234.50');
    });
  });

  describe('formatSol', () => {
    it('formats SOL with symbol', () => {
      expect(formatSol(1000000000n)).toBe('1.000 SOL');
    });
  });
});

describe('Address Formatting', () => {
  describe('shortAddress', () => {
    it('shortens long addresses', () => {
      const addr = 'ABC123DEF456GHI789JKL012MNO345PQR678';
      expect(shortAddress(addr)).toBe('ABC1...R678');
    });

    it('handles custom length', () => {
      const addr = 'ABC123DEF456GHI789JKL012MNO345PQR678';
      expect(shortAddress(addr, 6)).toBe('ABC123...PQR678');
    });

    it('returns short addresses unchanged', () => {
      expect(shortAddress('ABC')).toBe('ABC');
    });
  });
});

describe('Date/Time Formatting', () => {
  describe('formatDuration', () => {
    it('formats seconds', () => {
      expect(formatDuration(30)).toBe('30s');
    });

    it('formats minutes', () => {
      expect(formatDuration(90)).toBe('1m');
      expect(formatDuration(3599)).toBe('59m');
    });

    it('formats hours', () => {
      expect(formatDuration(3600)).toBe('1h');
      expect(formatDuration(7200)).toBe('2h');
    });

    it('formats days', () => {
      expect(formatDuration(86400)).toBe('1d');
      expect(formatDuration(172800)).toBe('2d');
    });
  });

  describe('formatDate', () => {
    it('formats dates', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(formatDate(date)).toBe('Jan 15, 2024');
    });

    it('accepts custom format', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(formatDate(date, 'YYYY-MM-DD')).toBe('2024-01-15');
    });
  });

  describe('formatRelativeTime', () => {
    it('formats relative time', () => {
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;
      expect(formatRelativeTime(fiveMinutesAgo)).toMatch(/minutes? ago/);
    });
  });
});

describe('Text Formatting', () => {
  describe('truncate', () => {
    it('truncates long text', () => {
      expect(truncate('Hello World', 8)).toBe('Hello W…');
    });

    it('returns short text unchanged', () => {
      expect(truncate('Hi', 10)).toBe('Hi');
    });
  });

  describe('pluralize', () => {
    it('returns singular for 1', () => {
      expect(pluralize(1, 'tip')).toBe('tip');
    });

    it('returns plural for other counts', () => {
      expect(pluralize(0, 'tip')).toBe('tips');
      expect(pluralize(5, 'tip')).toBe('tips');
    });

    it('uses custom plural', () => {
      expect(pluralize(2, 'person', 'people')).toBe('people');
    });
  });

  describe('formatCount', () => {
    it('formats count with label', () => {
      expect(formatCount(5, 'tip')).toBe('5 tips');
      expect(formatCount(1, 'tip')).toBe('1 tip');
    });
  });
});
