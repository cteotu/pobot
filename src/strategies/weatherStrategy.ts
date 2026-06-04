export interface TradeSignal {
  tokenId: string;
  action: 'BUY' | 'SELL' | 'LADDER_BUY' | 'LADDER_SELL';  // BUY/SELL string olarak kalabilir, index.ts'de Side enum'a map'liyoruz
  confidence: number;
  expectedValue: number;
  suggestedSize: number;
  reason: string;
}
