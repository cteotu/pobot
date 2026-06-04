import { Position, TradeSignal } from '../types';
import { logger } from '../utils/logger';
import { kellyFraction } from './kellyCalculator';

export const applyStopLossTakeProfit = (positions: Position[], currentPrices: Map<string,number>) => {
  for (const pos of positions) {
    const curr = currentPrices.get(pos.tokenId);
    if (!curr) continue;
    const unrealizedPnl = (curr - pos.entryPrice) * pos.size;
    if (pos.stopLoss && curr <= pos.stopLoss) {
      logger.warn(`Stop-loss tetiklendi: ${pos.tokenId} PnL=${unrealizedPnl}`);
      // SATIŞ emri gönder
    }
    if (pos.takeProfit && curr >= pos.takeProfit) {
      logger.info(`Take-profit tetiklendi: ${pos.tokenId} PnL=${unrealizedPnl}`);
      // SATIŞ emri gönder
    }
  }
};

export const dynamicPositionSizing = (signal: TradeSignal, totalEquity: number, maxPct: number = 0.10): number => {
  const baseSize = signal.suggestedSize;
  const kellySize = kellyFraction(signal.confidence, signal.expectedValue + 0.5, maxPct);
  const finalPct = Math.min(kellySize, maxPct);
  const usdAmount = totalEquity * finalPct;
  // Polymarket'te 1 hisse = $0.01 (varsayalım)
  const shares = Math.floor(usdAmount / 0.01);
  logger.info(`Kelly: ${kellySize.toFixed(2)} -> ${finalPct.toFixed(2)} of equity = ${shares} shares`);
  return shares;
};
