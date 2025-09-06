import { co, op, } from "../store/store";
import { userManager } from "../classes/UserManager";
import { v4 as uuid } from "uuid";
import type { openOrder } from "@ex/shared";

class TradeManager {
  createOrder(
    userId: string,
    asset: string,
    type: "BUY" | "SELL",
    margin: number,
    leverage: number,
    price: number
  ) {
    const bal = userManager.getBalance(userId);

    if (bal.balance < margin) throw new Error("Insufficient balance");

    userManager.updateBalance(userId, -margin);

    const order: openOrder = {
      orderId: uuid(),
      userId,
      asset,
      type,
      margin,
      leverage,
      price,
      quantity: (margin * leverage) / price,
      timestamp: Date.now(),
    };

    if (!op[userId]) op[userId] = [];

    op[userId].push(order);

    return order;
  }

  closeOrder(userId: string, closePrice: number, orderId: string) {
    const orders = op[userId];
    const order = orders.find((o) => o.orderId == orderId);
    if (!order) throw new Error("Order not found");

    let pnl = 0;
    if (order.type == "BUY") {
      pnl = (closePrice - order.price) * order.quantity;
    } else {
      pnl = (order.price - closePrice) * order.quantity;
    }

    userManager.updateBalance(userId, order.margin + pnl);
    op[userId] = op[userId].filter((o) => o.orderId != orderId);
    co[userId].push({ ...order, pnl });
  }

  getOpAndClData() {
    return { op: { ...op }, co: { ...co } };
  }

  restore(obj: any) {
    if (!obj) return;
    for (const k of Object.keys(op)) delete op[k];
    for (const k of Object.keys(co)) delete co[k];
    if (obj.op) Object.assign(op, obj.op);
    if (obj.co) Object.assign(co, obj.co);
  }
}

export const tradeManager = new TradeManager();
