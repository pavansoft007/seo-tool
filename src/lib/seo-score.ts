export interface CategoryScores {
  metadata: number;
  images: number;
  links: number;
  performance: number;
  accessibility: number;
  security: number;
}

const WEIGHTS: Record<keyof CategoryScores, number> = {
  metadata: 20,
  images: 15,
  links: 15,
  performance: 20,
  accessibility: 15,
  security: 15,
};

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function calculateSeoScore(scores: CategoryScores): number {
  const total = (Object.keys(WEIGHTS) as Array<keyof CategoryScores>).reduce(
    (sum, category) => sum + (clampScore(scores[category]) * WEIGHTS[category]) / 100,
    0
  );

  return Math.round(total);
}
