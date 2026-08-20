import { describe, it, expect } from 'vitest';
import { validateHints } from '../../../src/core/services/hint-validator.js';

describe('Domain: Hint Anti-Leakage Validator', () => {
  it('should accept valid progressive hints without leaks', () => {
    const hints: [string, string, string] = [
      'Associated with international voyages.',
      'A massive transport complex for travelers.',
      'Planes depart and arrive here on runways.',
    ];

    const result = validateHints('airport', hints);
    expect(result.isValid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should reject hints that explicitly contain the target word', () => {
    const hints: [string, string, string] = [
      'A travel facility.',
      'People go to the airport before flying.',
      'Has baggage reclaim belts.',
    ];

    const result = validateHints('airport', hints);
    expect(result.isValid).toBe(false);
    expect(result.violations[0]).toContain('accidentally contains the target word "airport"');
  });

  it('should reject hints with dangerous root stems', () => {
    const hints: [string, string, string] = [
      'A place with airplanes.',
      'Has security checks.',
      'Has jet bridges.',
    ];

    const result = validateHints('airplane', hints);
    expect(result.isValid).toBe(false);
  });

  it('should reject empty hints', () => {
    const hints: [string, string, string] = [
      '',
      'A place to sleep.',
      'Has many rooms.',
    ];

    const result = validateHints('hotel', hints);
    expect(result.isValid).toBe(false);
    expect(result.violations[0]).toContain('Hint 1 cannot be empty');
  });
});
