export interface HintValidationResult {
  isValid: boolean;
  violations: string[];
}

/**
 * Pure domain service to validate generated hints before publication.
 * Enforces anti-leakage rules:
 * 1. Target word cannot appear in any hint text.
 * 2. Words closely matching the target stem are rejected.
 * 3. Hints cannot be empty or excessively long.
 */
export function validateHints(
  targetWord: string,
  hints: [string, string, string]
): HintValidationResult {
  const violations: string[] = [];
  const normalizedTarget = targetWord.toLowerCase().trim();

  hints.forEach((hint, index) => {
    const hintNum = index + 1;
    const normalizedHint = hint.toLowerCase();

    if (!hint || hint.trim().length === 0) {
      violations.push(`Hint ${hintNum} cannot be empty.`);
      return;
    }

    if (hint.length > 200) {
      violations.push(`Hint ${hintNum} exceeds maximum length of 200 characters.`);
    }

    // 1. Direct target word check (word boundary or substring)
    if (normalizedHint.includes(normalizedTarget)) {
      violations.push(`Hint ${hintNum} accidentally contains the target word "${targetWord}".`);
    }

    // 2. Simple stem/compound check (for words >= 5 letters, check 4-letter root)
    if (normalizedTarget.length >= 6) {
      const rootPrefix = normalizedTarget.slice(0, 4);
      const wordsInHint = normalizedHint.split(/\W+/);
      for (const word of wordsInHint) {
        if (word.length >= 4 && word.startsWith(rootPrefix) && word !== normalizedTarget) {
          violations.push(`Hint ${hintNum} contains a root word "${word}" that might leak "${targetWord}".`);
        }
      }
    }
  });

  return {
    isValid: violations.length === 0,
    violations,
  };
}
