/**
 * Computes dot product of two vectors of identical dimensions.
 */
export function dotProduct(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

/**
 * Computes Euclidean magnitude (L2 norm) of a vector.
 */
export function vectorMagnitude(a: number[]): number {
  let sumSq = 0;
  for (let i = 0; i < a.length; i++) {
    sumSq += a[i] * a[i];
  }
  return Math.sqrt(sumSq);
}

/**
 * Computes Cosine Similarity between two vectors:
 * (a . b) / (||a|| * ||b||)
 * Returns a value between -1.0 and 1.0 (or 0.0 for zero vectors).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }

  const magA = vectorMagnitude(a);
  const magB = vectorMagnitude(b);

  if (magA === 0 || magB === 0) {
    return 0;
  }

  const dot = dotProduct(a, b);
  const similarity = dot / (magA * magB);

  // Clamp floating point inaccuracies to [-1.0, 1.0]
  return Math.max(-1.0, Math.min(1.0, similarity));
}

/**
 * Normalizes a vector to unit length (L2 norm = 1).
 */
export function normalizeVector(a: number[]): number[] {
  const mag = vectorMagnitude(a);
  if (mag === 0) {
    return a.slice();
  }
  return a.map((val) => val / mag);
}
