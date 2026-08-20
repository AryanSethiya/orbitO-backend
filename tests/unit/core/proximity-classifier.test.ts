import { describe, it, expect } from 'vitest';
import { getProximitySignal } from '../../../src/core/services/proximity-classifier.js';

describe('Domain: Proximity Classifier', () => {
  it('should classify Rank #1 as CENTER', () => {
    const signal = getProximitySignal(1);
    expect(signal.tier).toBe('CENTER');
    expect(signal.emoji).toBe('🎯');
  });

  it('should classify Rank 2-10 as BURNING', () => {
    expect(getProximitySignal(2).tier).toBe('BURNING');
    expect(getProximitySignal(10).tier).toBe('BURNING');
  });

  it('should classify Rank 11-50 as VERY_HOT', () => {
    expect(getProximitySignal(11).tier).toBe('VERY_HOT');
    expect(getProximitySignal(50).tier).toBe('VERY_HOT');
  });

  it('should classify Rank 51-200 as HOT', () => {
    expect(getProximitySignal(51).tier).toBe('HOT');
    expect(getProximitySignal(200).tier).toBe('HOT');
  });

  it('should classify Rank 201-1000 as WARM', () => {
    expect(getProximitySignal(201).tier).toBe('WARM');
    expect(getProximitySignal(1000).tier).toBe('WARM');
  });

  it('should classify distant ranks as DEEP_SPACE', () => {
    expect(getProximitySignal(20000).tier).toBe('DEEP_SPACE');
    expect(getProximitySignal(50000).tier).toBe('DEEP_SPACE');
  });
});
