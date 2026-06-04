import { ClobClient, Side, OrderType, Chain } from '@polymarket/clob-client-v2';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { polygon } from 'viem/chains';
import { PriceData, Position } from '../types';
import { logger } from '../utils/logger';

let client: ClobClient;

export const initPolymarket = async () => {
  const host = 'https://clob.polymarket.com';
  const chainId = Chain.POLYGON;
  const account = privateKeyToAccount(`0x${process.env.WALLET_PRIVATE_KEY}`);
  const walletClient = createWalletClient({
    account,
    chain: polygon,
    transport: http()
  });

  // Önce geçici bir client ile API key'leri al
  const tempClient = new ClobClient({ host, chain: chainId, signer: walletClient });
  const creds = await tempClient.createOrDeriveApiKey();
  logger.info('API key oluşturuldu/derived edildi');

  // Asıl client'ı API key'ler ile oluştur
  client = new ClobClient({
    host,
    chain: chainId,
    signer: walletClient,
    creds: {
      key: creds.key,
      secret: creds.secret,
      passphrase: creds.passphrase
    }
  });
  logger.info('Polymarket v2 bağlantısı kuruldu');
};

export const getMarketPrices = async (tokenId: string): Promise<PriceData> => {
  try {
    const orderBook = await client.getOrderBook(tokenId);
    const bids = orderBook.bids || [];
    const asks = orderBook.asks || [];
    const bestBid = bids.length > 0 ? Number(bids[0].price) : 0;
    const bestAsk = asks.length > 0 ? Number(asks[0].price) : 0;

    return {
      tokenId,
      bid: bestBid,
      ask: bestAsk,
      lastPrice: bestBid || bestAsk,
      volume: 0,
      timestamp: new Date()
    };
  } catch (error) {
    logger.error(`getMarketPrices hatası: ${error}`);
    return {
      tokenId,
      bid: 0,
      ask: 0,
      lastPrice: 0,
      volume: 0,
      timestamp: new Date()
    };
  }
};

export const checkLiquidity = async (tokenId: string, requiredSize: number): Promise<boolean> => {
  try {
    const orderBook = await client.getOrderBook(tokenId);
    const asks = orderBook.asks || [];
    const totalAskSize = asks.slice(0, 3).reduce((sum, ask) => sum + Number(ask.size), 0);
    return totalAskSize >= requiredSize;
  } catch (error) {
    logger.warn(`Likidite kontrolü başarısız: ${error}`);
    return false;
  }
};

export const placeLimitOrder = async (tokenId: string, side: Side, price: number, size: number): Promise<string> => {
  if (!await checkLiquidity(tokenId, size)) {
    logger.warn(`Yetersiz likidite: ${tokenId} için ${size} lot`);
    return '';
  }

  try {
    const response = await client.createAndPostOrder(
      {
        tokenID: tokenId,
        side: side,
        price: price,
        size: size
      },
      { tickSize: "0.01" },
      OrderType.GTC
    );
    logger.info(`Emir gönderildi: ${side} ${size} adet @ ${price} - ${response.orderID}`);
    return response.orderID;
  } catch (error) {
    logger.error(`Emir gönderme hatası: ${error}`);
    return '';
  }
};

export const getCurrentPositions = async (): Promise<Position[]> => {
  // Gerçek implementasyon - wallet token bakiyelerinden alınmalı
  return [];
};
