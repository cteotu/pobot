export interface Forecast {
  temperature: number;     // °F
  probability: number;     // 0-1 arası, deterministik için 1
  source: string;
  timestamp: Date;
  bias?: number;
}

export interface EnsembleForecast {
  mean: number;
  stdDev: number;
  probabilities: Map<string, number>; // bucket -> probability
}

export interface PriceData {
  tokenId: string;
  bid: number;
  ask: number;
  lastPrice: number;
  volume: number;
  timestamp: Date;
}

export interface ArbitrageOpportunity {
  type: 'cross-platform' | 'intra-market';
  buyMarket: string;
  sellMarket: string;
  buyPrice: number;
  sellPrice: number;
  profitPct: number;
  tokenIdBuy: string;
  tokenIdSell: string;
}

export interface Position {
  tokenId: string;
  size: number;          // hisse adedi
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface TradeSignal {
  tokenId: string;
  action: 'BUY' | 'SELL' | 'LADDER_BUY' | 'LADDER_SELL';
  confidence: number;    // 0-1
  expectedValue: number;
  suggestedSize: number; // hisse adedi
  reason: string;
}
