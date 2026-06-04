import { Forecast } from '../types';

// Konum bazlı bias tablosu (manuel veya zamanla öğrenilebilir)
const BIAS_DB: Record<string, number> = {
  'Miami_FL': -3.0,    // NWS Miami'yi fazla gösterir
  'NewYork_NY': +1.2,
  'LosAngeles_CA': -0.5
};

export const applyBiasCorrection = (forecast: Forecast, locationKey: string): Forecast => {
  const bias = BIAS_DB[locationKey] || 0;
  const correctedTemp = forecast.temperature + bias;
  return {
    ...forecast,
    temperature: correctedTemp,
    bias: bias
  };
};
