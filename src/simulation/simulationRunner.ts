import dotenv from 'dotenv';
dotenv.config();
import { initPolymarket, getMarketPrices } from '../services/polymarket';
import { generateWeatherSignals } from '../strategies/weatherStrategy';
import { dynamicPositionSizing } from '../risk/riskManager';
import { logger } from '../utils/logger';
import { PaperTrader } from './paperTrader';
import { sleep } from '../utils/helpers';

const CONFIG = {
  locations: [
    { lat: 40.7128, lon: -74.0060, icao: 'KNYC', name: 'NewYork', key: 'NewYork_NY' }
  ],
  tokenIdMap: new Map<string, string>([
    ['73-74°F', '0x123...'],
    ['74-75°F', '0x456...'],
    ['75-76°F', '0x789...']
  ]),
  simulationDays: 7,        // 1 hafta
  checkIntervalMs: 60000    // her dakika kontrol
};

const runSimulation = async () => {
  await initPolymarket();
  const paperTrader = new PaperTrader(1000); // 1000$ sanal bakiye

  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + CONFIG.simulationDays * 24 * 60 * 60 * 1000);
  logger.info(`Simülasyon başladı: ${startTime} - ${endTime}`);

  let iteration = 0;
  while (new Date() < endTime) {
    iteration++;
    logger.info(`--- Iterasyon ${iteration} ---`);

    for (const loc of CONFIG.locations) {
      // 1. Sinyal üret
      const signals = await generateWeatherSignals(loc.lat, loc.lon, loc.icao, loc.key, CONFIG.tokenIdMap);
      if (signals.length === 0) {
        logger.info('Bugün için uygun sinyal yok');
        continue;
      }

      // 2. Her sinyal için gerçek piyasa fiyatını al ve simüle et
      for (const signal of signals) {
        const marketPriceData = await getMarketPrices(signal.tokenId);
        const currentPrice = marketPriceData.ask;
        if (currentPrice <= 0) continue;

        // Dinamik pozisyon büyüklüğü (sanal bakiye üzerinden)
        const equity = paperTrader['account'].totalEquity; // geçici
        const size = dynamicPositionSizing(signal, equity);
        if (size > 0) {
          const simulatedSignal = { ...signal, suggestedSize: size };
          paperTrader.executeSignal(simulatedSignal, currentPrice);
        }
      }

      // 3. Güncel fiyatlarla özkaynak güncelle
      const priceMap = new Map<string, number>();
      for (const tokenId of CONFIG.tokenIdMap.values()) {
        const price = (await getMarketPrices(tokenId)).ask;
        priceMap.set(tokenId, price);
      }
      paperTrader.updateEquity(priceMap);
      logger.info(paperTrader.getSummary());
    }

    // Bir sonraki kontrole kadar bekle
    await sleep(CONFIG.checkIntervalMs);
  }

  logger.info('Simülasyon tamamlandı!');
  logger.info(paperTrader.getSummary());
  process.exit(0);
};

runSimulation().catch(err => {
  logger.error(`Simülasyon hatası: ${err}`);
  process.exit(1);
});
