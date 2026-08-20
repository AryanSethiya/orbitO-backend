export type ProximityTier =
  | 'CENTER'
  | 'BURNING'
  | 'VERY_HOT'
  | 'HOT'
  | 'WARM'
  | 'COOL'
  | 'COLD'
  | 'DEEP_SPACE';

export interface ProximitySignal {
  tier: ProximityTier;
  label: string;
  emoji: string;
  rank: number;
}

/**
 * Classifies rank into intuitive proximity signals.
 */
export function getProximitySignal(rank: number): ProximitySignal {
  if (rank === 1) {
    return {
      tier: 'CENTER',
      label: 'You found the Center!',
      emoji: '🎯',
      rank,
    };
  }

  if (rank <= 10) {
    return {
      tier: 'BURNING',
      label: 'Burning Hot',
      emoji: '🔥🔥🔥',
      rank,
    };
  }

  if (rank <= 50) {
    return {
      tier: 'VERY_HOT',
      label: 'Very Hot',
      emoji: '🔥🔥',
      rank,
    };
  }

  if (rank <= 200) {
    return {
      tier: 'HOT',
      label: 'Hot',
      emoji: '🔥',
      rank,
    };
  }

  if (rank <= 1000) {
    return {
      tier: 'WARM',
      label: 'Warm',
      emoji: '🌡️',
      rank,
    };
  }

  if (rank <= 5000) {
    return {
      tier: 'COOL',
      label: 'Cool',
      emoji: '❄️',
      rank,
    };
  }

  if (rank <= 15000) {
    return {
      tier: 'COLD',
      label: 'Cold',
      emoji: '🧊',
      rank,
    };
  }

  return {
    tier: 'DEEP_SPACE',
    label: 'Deep Space',
    emoji: '🌌',
    rank,
  };
}
