import axios from 'axios';
import { Forecast } from '../types';
import { logger } from '../utils/logger';

export const fetchECMWFForecast = async (lat: number, lon: number): Promise<Forecast | null> => {
  try {
    const apiKey = process.env.ECMWF_API_KEY;
    // Örnek ECMWF API endpoint (gerçekte farklı olabilir)
    const url = `https://api.ecmwf.int/v1/forecast/${lat}/${lon}?key=${apiKey}`;
    const res = await axios.get(url);
    const temp = res.data.daily.temperature_2m_max[0];
    return {
      temperature: temp,
      probability: 0.85, // ECMWF genelde daha güvenilir
      source: 'ECMWF',
      timestamp: new Date()
    };
  } catch (err) {
    logger.error(`ECMWF hatası: ${err}`);
    return null;
  }
};
