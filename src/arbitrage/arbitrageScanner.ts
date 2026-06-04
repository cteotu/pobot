import { ArbitrageOpportunity, PriceData } from '../types';
import { logger } from '../utils/logger';

export const scanCrossPlatformArbitrage = async (polyPrices: Map<string, PriceData>, kalshiPrices: Map<string, PriceData>): Promise<ArbitrageOpportunity[]> => {
  const opps: ArbitrageOpportunity[] = [];
  for (const [tokenId, poly] of polyPrices.entries()) {
    const kalshi = kalshiPrices.get(tokenId);
    if (!kalshi) continue;
    const profit = Math.abs(poly.bid - kalshi.ask);
    if (profit / poly.bid > 0.02) {
      opps.push({
        type: 'cross-platform',
        buyMarket: poly.bid < kalshi.ask ? 'Polymarket' : 'Kalshi',
        sellMarket: poly.bid < kalshi.ask ? 'Kalshi' : 'Polymarket',
        buyPrice: Math.min(poly.bid, kalshi.ask),
        sellPrice: Math.max(poly.ask, kalshi.bid),
        profitPct: profit,
        tokenIdBuy: tokenId,
        tokenIdSell: tokenId
      });
    }
  }
  logger.info(`${opps.length} arbitraj fırsatı bulundu`);
  return opps;
};
