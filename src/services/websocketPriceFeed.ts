import WebSocket from 'ws';
import { PriceData } from '../types';
import { logger } from '../utils/logger';

type PriceCallback = (price: PriceData) => void;

export class WebSocketPriceFeed {
  private ws: WebSocket | null = null;
  private callbacks: PriceCallback[] = [];
  private tokenIds: string[];

  constructor(tokenIds: string[]) {
    this.tokenIds = tokenIds;
  }

  connect() {
    this.ws = new WebSocket('wss://ws.polymarket.com/ws');
    this.ws.on('open', () => {
      logger.info('WebSocket bağlandı, abonelik gönderiliyor');
      this.ws?.send(JSON.stringify({ type: 'subscribe', channels: ['ticker'], tokens: this.tokenIds }));
    });
    this.ws.on('message', (data: string) => {
      const parsed = JSON.parse(data);
      if (parsed.type === 'ticker') {
        const priceData: PriceData = {
          tokenId: parsed.token_id,
          bid: parsed.bid,
          ask: parsed.ask,
          lastPrice: parsed.last_price,
          volume: parsed.volume,
          timestamp: new Date()
        };
        this.callbacks.forEach(cb => cb(priceData));
      }
    });
    this.ws.on('error', (err) => logger.error(`WebSocket hatası: ${err}`));
  }

  onPrice(cb: PriceCallback) {
    this.callbacks.push(cb);
  }
}
