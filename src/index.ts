import dotenv from 'dotenv';
dotenv.config();
import { initPolymarket, placeLimitOrder, getMarketPrices, getCurrentPositions } from './services/polymarket';
import { WebSocketPriceFeed } from './services/websocketPriceFeed';
import { generateWeatherSignals } from './strategies/weatherStrategy';
import { dynamicPositionSizing, applyStopLossTakeProfit } from './risk/riskManager';
import { logger } from './utils/logger';
import { Side } from '@polymarket/clob-client';

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
  const wsFeed = new WebSocketPriceFeed(Array.from(CONFIG.tokenIdMap.values()));
  wsFeed.connect();
  wsFeed.onPrice((price) => {
    logger.debug(`Fiyat güncellemesi: ${price.tokenId} ask=${price.ask}`);
  });

  setInterval(async () => {
    for (const loc of CONFIG.locations) {
      const signals = await generateWeatherSignals(loc.lat, loc.lon, loc.icao, loc.key, CONFIG.tokenIdMap);
      const equity = 1000; // Örnek, gerçek cüzdan bakiyesi ile değiştirilmeli
      for (const signal of signals) {
        const size = dynamicPositionSizing(signal, equity);
        if (size > 0) {
          const marketPrice = (await getMarketPrices(signal.tokenId)).ask;
          const limitPrice = marketPrice * 0.99;
          // Side enum kullan
          const side = signal.action === 'BUY' ? Side.BUY : Side.SELL;
          await placeLimitOrder(signal.tokenId, side, limitPrice, size);
        }
      }

      // Risk yönetimi - gerçek pozisyonları al
      const positions = await getCurrentPositions();
      const currentPricesMap = new Map<string, number>();
      for (const pos of positions) {
        const priceData = await getMarketPrices(pos.tokenId);
        currentPricesMap.set(pos.tokenId, priceData.lastPrice);
      }
      applyStopLossTakeProfit(positions, currentPricesMap);
    }
  }, 60_000); // her dakika
};

run().catch(err => logger.error(`Bot hatası: ${err}`));
