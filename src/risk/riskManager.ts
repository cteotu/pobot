import { Position, TradeSignal } from '../types';
import { logger } from '../utils/logger';
import { kellyFraction } from './kellyCalculator';

export const applyStopLossTakeProfit = (positions: Position[], currentPrices: Map<string, number>) => {
  for (const pos of positions) {
    const curr = currentPrices.get(pos.tokenId);
    if (!curr) continue;

    const unrealizedPnl = (curr - pos.entryPrice) * pos.size;
    if (pos.stopLoss && curr <= pos.stopLoss) {
      logger.warn(`Stop-loss tetiklendi: ${pos.tokenId} PnL=${unrealizedPnl}`);
    }
    if (pos.takeProfit && curr >= pos.takeProfit) {
      logger.info(`Take-profit tetiklendi: ${pos.tokenId} PnL=${unrealizedPnl}`);
    }
  }
};

export const dynamicPositionSizing = (signal: TradeSignal, totalEquity: number, maxPct: number = 0.10): number => {
  const expectedWinProb = signal.confidence;
  const oddsRatio = (1 - (signal.expectedValue + 0.5)) / (signal.expectedValue + 0.5);
  const kelly = kellyFraction(expectedWinProb, signal.expectedValue + 0.5, maxPct);
  const shares = Math.floor((totalEquity * kelly) / 0.01);
  return Math.max(0, shares);
};
