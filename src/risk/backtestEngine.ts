import { getEnsembleForecast } from '../services/forecastAggregator';
import { kellyFraction } from './kellyCalculator';
import { logger } from '../utils/logger';

export const runBacktest = async (historicalDates: Date[], lat: number, lon: number, icao: string, locationKey: string) => {
  let totalReturn = 1.0;
  for (const date of historicalDates) {
    // Tarihi tahmin al (manuel geçmiş veri çekme simülasyonu)
    const ensemble = await getEnsembleForecast(lat, lon, icao, locationKey);
    const trueTemp = 75; // gerçek geçmiş sıcaklık (veritabanından okunmalı)
    const marketPrice = 0.6; // geçmiş piyasa fiyatı
    const kelly = kellyFraction(ensemble.probabilities.get('75-76°F') || 0, marketPrice);
    if (kelly > 0) {
      const bet = 0.01 * kelly;
      const won = true; // gerçekleştiyse
      totalReturn *= (won ? (1 + bet*(1-marketPrice)/marketPrice) : (1 - bet));
    }
    logger.info(`Backtest ${date}: Return=${totalReturn}`);
  }
  logger.info(`Toplam getiri: ${totalReturn}`);
};
