import axios from 'axios';
import { Forecast } from '../types';
import { logger } from '../utils/logger';
import { applyBiasCorrection } from '../utils/biasCorrector';

export const fetchNWSForecast = async (lat: number, lon: number, locationKey: string): Promise<Forecast | null> => {
  try {
    const pointsUrl = `https://api.weather.gov/points/${lat},${lon}`;
    const pointsRes = await axios.get(pointsUrl);
    const forecastUrl = pointsRes.data.properties.forecastHourly;
    const forecastRes = await axios.get(forecastUrl);
    const periods = forecastRes.data.properties.periods;
    // Günün maksimum sıcaklığını bul (00-23 UTC)
    const todayMax = Math.max(...periods.map((p: any) => p.temperature));
    let rawForecast: Forecast = {
      temperature: todayMax,
      probability: 0.7, // NWS deterministik, güven katsayısı düşük
      source: 'NWS',
      timestamp: new Date()
    };
    rawForecast = applyBiasCorrection(rawForecast, locationKey);
    logger.info(`NWS tahmini: ${rawForecast.temperature}°F (bias düzeltildi)`);
    return rawForecast;
  } catch (err) {
    logger.error(`NWS hatası: ${err}`);
    return null;
  }
};
