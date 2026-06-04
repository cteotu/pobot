import dotenv from 'dotenv';
dotenv.config();
import { initPolymarket, placeLimitOrder, getMarketPrices } from './services/polymarket';
import { WebSocketPriceFeed } from './services/websocketPriceFeed';
import { generateWeatherSignals } from './strategies/weatherStrategy';
import { generateLadderSignals } from './strategies/ladderingStrategy';
import { dynamicPositionSizing, applyStopLossTakeProfit } from './risk/riskManager';
import { scanCrossPlatformArbitrage } from './arbitrage/arbitrageScanner';
import { logger } from './utils/logger';

const CONFIG = {
  locations: [
    { lat: 40.7128, lon: -74.0060, icao: 'KNYC', name: 'NewYork', key: 'NewYork_NY' }
  ],
  tokenIdMap: new Map<string, string>([  // bucket -> tokenId
    ['73-74°F', '0x123...'],
    ['74-75°F', '0x456...'],
    ['75-76°F', '0x789...']
  ])
};

const run = async () => {
  await initPolymarket();
  const wsFeed = new WebSocketPriceFeed(Array.from(CONFIG.tokenIdMap.values()));
  wsFeed.connect();
  wsFeed.onPrice((price) => {
    logger.debug(`Fiyat güncellemesi: ${price.tokenId} ask=${price.ask}`);
  });

  setInterval(async () => {
    for (const loc of CONFIG.locations) {
      // 1. Sinyal üret
      const signals = await generateWeatherSignals(loc.lat, loc.lon, loc.icao, loc.key, CONFIG.tokenIdMap);
      // 2. Ladder sinyalleri ekle (opsiyonel)
      // const ladderSignals = generateLadderSignals(...);
      // 3. Pozisyon büyüklüğü
      const equity = 1000; // sabit örnek, gerçek cüzdan bakiyesi okunmalı
      for (const signal of signals) {
        const size = dynamicPositionSizing(signal, equity);
        if (size > 0) {
          const marketPrice = (await getMarketPrices(signal.tokenId)).ask;
          const limitPrice = marketPrice * 0.99; // spread avantajı
          await placeLimitOrder(signal.tokenId, 'BUY', limitPrice, size);
        }
      }
      // 4. Arbitraj tara
      // const opps = await scanCrossPlatformArbitrage(polyPrices, kalshiPrices);
      // 5. Risk yönetimi
      const positions = []; // gerçek pozisyonları al
      applyStopLossTakeProfit(positions, new Map());
    }
  }, 60_000); // her dakika
};

run().catch(err => logger.error(`Bot hatası: ${err}`));
