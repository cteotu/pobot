import { TradeSignal } from '../types';
import { logger } from '../utils/logger';

export interface PaperAccount {
  balance: number;        // USD cinsinden kalan bakiye
  positions: Map<string, { size: number; entryPrice: number; tokenId: string }>;
  totalEquity: number;    // balance + pozisyon değeri
  history: Array<{
    timestamp: Date;
    action: string;
    tokenId: string;
    price: number;
    size: number;
    pnl?: number;
  }>;
}

export class PaperTrader {
  private account: PaperAccount;
  private initialBalance: number;

  constructor(initialBalance: number = 1000) {
    this.initialBalance = initialBalance;
    this.account = {
      balance: initialBalance,
      positions: new Map(),
      totalEquity: initialBalance,
      history: []
    };
    logger.info(`PaperTrader başlatıldı. Başlangıç bakiyesi: $${initialBalance}`);
  }

  // Emir simülasyonu (market order varsayalım, slippage yok)
  executeSignal(signal: TradeSignal, currentPrice: number): boolean {
    if (signal.action === 'BUY') {
      const cost = signal.suggestedSize * currentPrice * 0.01; // Polymarket'te 1 hisse = $0.01
      if (this.account.balance >= cost) {
        const existing = this.account.positions.get(signal.tokenId);
        const newSize = (existing?.size || 0) + signal.suggestedSize;
        const newEntryPrice = existing
          ? (existing.entryPrice * existing.size + currentPrice * signal.suggestedSize) / newSize
          : currentPrice;
        this.account.positions.set(signal.tokenId, { size: newSize, entryPrice: newEntryPrice, tokenId: signal.tokenId });
        this.account.balance -= cost;
        this.account.history.push({
          timestamp: new Date(),
          action: 'BUY',
          tokenId: signal.tokenId,
          price: currentPrice,
          size: signal.suggestedSize
        });
        logger.info(`[PAPER] ALIM: ${signal.suggestedSize} adet ${signal.tokenId} @ $${currentPrice} | Maliyet: $${cost.toFixed(2)} | Kalan bakiye: $${this.account.balance.toFixed(2)}`);
        return true;
      } else {
        logger.warn(`[PAPER] Yetersiz bakiye: ihtiyaç $${cost.toFixed(2)}, mevcut $${this.account.balance.toFixed(2)}`);
        return false;
      }
    } else if (signal.action === 'SELL') {
      const pos = this.account.positions.get(signal.tokenId);
      if (pos && pos.size >= signal.suggestedSize) {
        const revenue = signal.suggestedSize * currentPrice * 0.01;
        const pnl = revenue - (signal.suggestedSize * pos.entryPrice * 0.01);
        this.account.balance += revenue;
        const newSize = pos.size - signal.suggestedSize;
        if (newSize === 0) {
          this.account.positions.delete(signal.tokenId);
        } else {
          this.account.positions.set(signal.tokenId, { ...pos, size: newSize });
        }
        this.account.history.push({
          timestamp: new Date(),
          action: 'SELL',
          tokenId: signal.tokenId,
          price: currentPrice,
          size: signal.suggestedSize,
          pnl
        });
        logger.info(`[PAPER] SATIŞ: ${signal.suggestedSize} adet ${signal.tokenId} @ $${currentPrice} | Gelir: $${revenue.toFixed(2)} | PnL: $${pnl.toFixed(2)} | Bakiye: $${this.account.balance.toFixed(2)}`);
        return true;
      } else {
        logger.warn(`[PAPER] Yetersiz pozisyon: ${signal.tokenId} için ${signal.suggestedSize} adet yok`);
        return false;
      }
    }
    return false;
  }

  // Tüm pozisyonları güncel fiyatlarla değerle
  updateEquity(currentPrices: Map<string, number>): number {
    let positionsValue = 0;
    for (const [tokenId, pos] of this.account.positions.entries()) {
      const price = currentPrices.get(tokenId) || pos.entryPrice;
      positionsValue += pos.size * price * 0.01;
    }
    this.account.totalEquity = this.account.balance + positionsValue;
    return this.account.totalEquity;
  }

  getSummary(): string {
    let positionsStr = '';
    for (const [tokenId, pos] of this.account.positions.entries()) {
      positionsStr += `${tokenId}: ${pos.size} adet (entry $${pos.entryPrice})\n`;
    }
    const totalTrades = this.account.history.length;
    const winningTrades = this.account.history.filter(h => h.pnl && h.pnl > 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const totalPnl = this.account.history.reduce((sum, h) => sum + (h.pnl || 0), 0);
    return `
========== SIMULATION REPORT ==========
Başlangıç bakiyesi: $${this.initialBalance}
Güncel bakiye: $${this.account.balance.toFixed(2)}
Pozisyon değeri: $${(this.account.totalEquity - this.account.balance).toFixed(2)}
Toplam özkaynak: $${this.account.totalEquity.toFixed(2)}
Toplam PnL: $${totalPnl.toFixed(2)}
Toplam işlem: ${totalTrades}
Kazanma oranı: ${winRate.toFixed(2)}%
Aktif pozisyonlar:
${positionsStr || 'Yok'}
=======================================
    `;
  }
}
