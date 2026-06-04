import { Forecast, EnsembleForecast } from '../types';
import { logger } from '../utils/logger';
import { fetchNWSForecast } from './nws';
import { fetchECMWFForecast } from './ecmwf';
import { fetchMETARObservation } from './metar';

export const getEnsembleForecast = async (lat: number, lon: number, icao: string, locationKey: string): Promise<EnsembleForecast> => {
  const forecasts: Forecast[] = [];
  const nws = await fetchNWSForecast(lat, lon, locationKey);
  if (nws) forecasts.push(nws);
  const ecmwf = await fetchECMWFForecast(lat, lon);
  if (ecmwf) forecasts.push(ecmwf);
  const metar = await fetchMETARObservation(icao);
  if (metar) forecasts.push(metar);
  
  if (forecasts.length === 0) throw new Error('Hiçbir hava durumu kaynağı çalışmıyor');
  
  const temps = forecasts.map(f => f.temperature);
  const mean = temps.reduce((a,b) => a+b,0)/temps.length;
  const stdDev = Math.sqrt(temps.map(t => Math.pow(t-mean,2)).reduce((a,b)=>a+b,0)/temps.length);
  
  // Basit bucket olasılıkları (normal dağılım varsayarak)
  const probabilities = new Map<string, number>();
  const bucketSize = 1;
  const possibleTemps = [mean-2*stdDev, mean-stdDev, mean, mean+stdDev, mean+2*stdDev];
  possibleTemps.forEach(t => {
    const bucket = `${Math.floor(t/bucketSize)*bucketSize}-${Math.floor(t/bucketSize)*bucketSize+bucketSize}°F`;
    const prob = Math.exp(-0.5*Math.pow((t-mean)/stdDev,2)) / (stdDev*Math.sqrt(2*Math.PI));
    probabilities.set(bucket, (probabilities.get(bucket)||0) + prob);
  });
  
  logger.info(`Ensemble: ortalama=${mean}°F, std=${stdDev}°F`);
  return { mean, stdDev, probabilities };
};
