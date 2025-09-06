import type { openOrder } from "@ex/shared";
import { op } from "../store/store";

class Liquidation {
  DEFAULT_MMR = 0.005;
  checkLiquidation(
    order: openOrder,
    currentPrice: number,
    mmr = this.DEFAULT_MMR
  ): boolean {
    if(!order) return false;
    if (!order.leverage || order.leverage <= 1) return false;

    const notional = order.price * order.quantity; 
    const pnl =
      order.type === "BUY"
        ? (currentPrice - order.price) * order.quantity
        : (order.price - currentPrice) * order.quantity;

    const equity = order.margin + pnl;
    const maintenance = notional * mmr;

    return equity <= maintenance;
  }
}

export const liquidation = new Liquidation();
