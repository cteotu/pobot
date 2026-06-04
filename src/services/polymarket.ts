import { ClobClient } from '@polymarket/clob-client';
import { PriceData, Position } from '../types';
import { logger } from '../utils/logger';

let clob: ClobClient;

export const initPolymarket = async () => {
  clob = new ClobClient({
    apiKey: process.env.CLOB_API_KEY!,
    secret: process.env.CLOB_SECRET!,
    passphrase: process.env.CLOB_PASSPHRASE!,
    network: 'polygon',
    host: 'https://clob.polymarket.com'
  });
  await clob.deriveApiKey();
  logger.info('Polymarket bağlantısı kuruldu');
};

export const getMarketPrices = async (tokenId: string): Promise<PriceData> => {
  const orderBook = await clob.getOrderBook(tokenId);
  const bestBid = orderBook.bids[0]?.price || 0;
  const bestAsk = orderBook.asks[0]?.price || 0;
  const lastPrice = orderBook.bids[0]?.price || bestAsk;
  return {
    tokenId,
    bid: bestBid,
    ask: bestAsk,
    lastPrice,
    volume: 0,
    timestamp: new Date()
  };
};

export const checkLiquidity = async (tokenId: string, requiredSize: number): Promise<boolean> => {
  const orderBook = await clob.getOrderBook(tokenId);
  const totalAskSize = orderBook.asks.slice(0,3).reduce((sum, ask) => sum + parseFloat(ask.size), 0);
  return totalAskSize >= requiredSize;
};

export const placeLimitOrder = async (tokenId: string, side: 'BUY' | 'SELL', price: number, size: number): Promise<string> => {
  if (!await checkLiquidity(tokenId, size)) {
    logger.warn(`Yetersiz likidite: ${tokenId} için ${size} lot`);
    return '';
  }
  const order = await clob.createOrder({
    tokenId,
    side,
    price,
    size,
    orderType: 'GTC'
  });
  const resp = await clob.postOrder(order);
  logger.info(`Emir gönderildi: ${side} ${size} adet @ ${price} - ${resp.orderID}`);
  return resp.orderID;
};

export const getCurrentPositions = async (): Promise<Position[]> => {
  // Gerçekte wallet'dan token bakiyeleri çekilmeli
  return [];
};
