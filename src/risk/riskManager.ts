import { Position, TradeSignal } from '../types';
import { logger } from '../utils/logger';
import { kellyFraction } from './kellyCalculator';

export const applyStopLossTakeProfit = (positions: Position[], currentPrices: Map<string, number>) => {
  for (const pos of positions) {
    const curr = currentPrices.get(pos.tokenId);
    if (!curr) continue;
    if (pos.stopLoss && curr <= pos.stopLoss) {
      logger.warn(`Stop-loss tetiklendi: ${pos.tokenId}`);
    }
    if (pos.takeProfit && curr >= pos.takeProfit) {
      logger.info(`Take-profit tetiklendi: ${pos.tokenId}`);
    }
  }
};

export const dynamicPositionSizing = (signal: TradeSignal, totalEquity: number, maxPct: number = 0.10): number => {
  const kelly = kellyFraction(signal.confidence, signal.expectedValue + 0.5, maxPct);
  // Polymarket'te 1 hisse yaklaşık $0.01 varsayımı
  const shares = Math.floor((totalEquity * kelly) / 0.01);
  return Math.max(0, shares);
};
