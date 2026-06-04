import { TradeSignal } from '../types';
import { getEnsembleForecast } from '../services/forecastAggregator';
import { getMarketPrices } from '../services/polymarket';
import { calculateExpectedValue } from '../utils/helpers';
import { kellyFraction } from '../risk/kellyCalculator';
import { logger } from '../utils/logger';

export const generateWeatherSignals = async (
  lat: number,
  lon: number,
  icao: string,
  locationKey: string,
  tokenIdMap: Map<string, string>
): Promise<TradeSignal[]> => {
  const ensemble = await getEnsembleForecast(lat, lon, icao, locationKey);
  const signals: TradeSignal[] = [];

  for (const [bucket, prob] of ensemble.probabilities.entries()) {
    const tokenId = tokenIdMap.get(bucket);
    if (!tokenId) continue;

    const market = await getMarketPrices(tokenId);
    const marketPrice = market.ask;
    if (marketPrice <= 0 || marketPrice >= 1) continue;

    const ev = calculateExpectedValue(prob, marketPrice);
    if (ev > 0.02) {
      const kelly = kellyFraction(prob, marketPrice);
      const suggestedSize = Math.floor(kelly * 1000);
      signals.push({
        tokenId,
        action: 'BUY',
        confidence: prob,
        expectedValue: ev,
        suggestedSize,
        reason: `EV=${ev.toFixed(3)} | Prob=${prob.toFixed(2)} vs Market=${marketPrice}`
      });
    }
  }

  logger.info(`Üretilen sinyal sayısı: ${signals.length}`);
  return signals;
};
