import { EnsembleForecast, TradeSignal } from '../types';
import { getEnsembleForecast } from '../services/forecastAggregator';
import { getMarketPrices } from '../services/polymarket';
import { calculateExpectedValue } from '../utils/helpers';
import { kellyFraction } from '../risk/kellyCalculator';
import { logger } from '../utils/logger';

export const generateWeatherSignals = async (lat: number, lon: number, icao: string, locationKey: string, tokenIdMap: Map<string, string>): Promise<TradeSignal[]> => {
  const ensemble: EnsembleForecast = await getEnsembleForecast(lat, lon, icao, locationKey);
  const signals: TradeSignal[] = [];
  
  for (const [bucket, prob] of ensemble.probabilities.entries()) {
    const tokenId = tokenIdMap.get(bucket);
    if (!tokenId) continue;
    const market = await getMarketPrices(tokenId);
    const ev = calculateExpectedValue(prob, market.ask);
    if (ev > 0.02) {  // %2 üzeri EV
      const kellySize = kellyFraction(prob, market.ask);
      signals.push({
        tokenId,
        action: 'BUY',
        confidence: prob,
        expectedValue: ev,
        suggestedSize: Math.floor(kellySize * 1000), // 1000 share base
        reason: `EV=${ev.toFixed(3)} | Prob=${prob.toFixed(2)} vs Market=${market.ask}`
      });
    }
  }
  logger.info(`Üretilen sinyal sayısı: ${signals.length}`);
  return signals;
};
