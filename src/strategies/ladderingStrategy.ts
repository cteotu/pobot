import { TradeSignal } from '../types';
import { logger } from '../utils/logger';

export const generateLadderSignals = (centerTemp: number, probs: Map<string, number>, totalBudgetShares: number): TradeSignal[] => {
  const signals: TradeSignal[] = [];
  const buckets = Array.from(probs.keys()).sort();
  // En yüksek olasılıklı 3 sepete yay
  const sortedBuckets = buckets.map(b => ({ bucket: b, prob: probs.get(b)! })).sort((a,b)=>b.prob-a.prob);
  const top3 = sortedBuckets.slice(0,3);
  const sharePerBucket = Math.floor(totalBudgetShares / top3.length);
  for (const { bucket, prob } of top3) {
    signals.push({
      tokenId: bucket, // gerçek tokenId mapping gerekli
      action: 'LADDER_BUY',
      confidence: prob,
      expectedValue: prob - 0.5, // varsayılan piyasa fiyatı 0.5
      suggestedSize: sharePerBucket,
      reason: `Ladder ${bucket} prob=${prob}`
    });
  }
  logger.info(`${signals.length} adet ladder sinyali oluşturuldu`);
  return signals;
};
