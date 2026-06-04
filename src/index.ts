import dotenv from 'dotenv';
dotenv.config();
import { initPolymarket, placeLimitOrder, getMarketPrices } from './services/polymarket';
import { WebSocketPriceFeed } from './services/websocketPriceFeed';
import { generateWeatherSignals } from './strategies/weatherStrategy';
import { dynamicPositionSizing, applyStopLossTakeProfit } from './risk/riskManager';
import { logger } from './utils/logger';
import { Side } from '@polymarket/clob-client-v2';

const CONFIG = {
  locations: [
    { lat: 40.7128, lon: -74.0060, icao: 'KNYC', name: 'NewYork', key: 'NewYork_NY' }
  ],
  tokenIdMap: new Map<string, string>([
    ['73-74°F', '0x123...'],
    ['74-75°F', '0x456...'],
    ['75-76°F', '0x789...']
  ])
};

const run = async () => {
  await initPolymarket();

  // WebSocket bağlantısı (opsiyonel, v2'de farklılık gösterebilir)
  // const wsFeed = new WebSocketPriceFeed(Array.from(CONFIG.tokenIdMap.values()));
  // wsFeed.connect();

  setInterval(async () => {
    for (const loc of CONFIG.locations) {
      const signals = await generateWeatherSignals(loc.lat, loc.lon, loc.icao, loc.key, CONFIG.tokenIdMap);
      const equity = 1000; // sabit örnek, gerçek cüzdan bakiyesi okunmalı

      for (const signal of signals) {
        const size = dynamicPositionSizing(signal, equity);
        if (size > 0) {
          const marketPrice = (await getMarketPrices(signal.tokenId)).ask;
          if (marketPrice > 0) {
            const limitPrice = marketPrice * 0.99;
            // Side.BUY enum olarak kullanılıyor
            await placeLimitOrder(signal.tokenId, Side.BUY, limitPrice, size);
          }
        }
      }

      // Risk yönetimi için boş pozisyon listesi
      const positions: any[] = [];
      applyStopLossTakeProfit(positions, new Map());
    }
  }, 60000);
};

run().catch(err => logger.error(`Bot hatası: ${err}`));
