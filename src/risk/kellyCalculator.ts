export const kellyFraction = (winProb: number, marketPrice: number, maxBetFraction: number = 0.25): number => {
  // winProb: modelin o sepetin gerçekleşme ihtimali (0-1)
  // marketPrice: YES token fiyatı (0-1)
  const b = (1 - marketPrice) / marketPrice;  // kazanma oranı (odds)
  const p = winProb;
  const q = 1 - p;
  const kelly = (p * b - q) / b;
  if (kelly <= 0) return 0;
  return Math.min(kelly, maxBetFraction);
};
