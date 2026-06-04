import axios from 'axios';
import { Forecast } from '../types';
import { logger } from '../utils/logger';

export const fetchMETARObservation = async (icao: string): Promise<Forecast | null> => {
  try {
    const url = `https://aviationweather.gov/api/data/metar?ids=${icao}&format=json`;
    const res = await axios.get(url);
    const metar = res.data[0];
    if (!metar) return null;
    // Sıcaklık Celsius -> Fahrenheit
    const tempC = metar.temp;
    const tempF = tempC * 9/5 + 32;
    return {
      temperature: tempF,
      probability: 1.0,
      source: 'METAR',
      timestamp: new Date()
    };
  } catch (err) {
    logger.error(`METAR hatası: ${err}`);
    return null;
  }
};
