import { cl, op, type openOrder } from "../store/store";
import { userManager } from "../classes/UserManager";
import { v4 as uuid } from "uuid";

class TradeMagenr {
  createOrder(
    userId: string,
    asset: string,
    type: "buy" | "sell",
    margin: number,
    leverage: number,
    price: number
  ) {
    const bal = userManager.getBalance(userId);

    if (bal < margin) throw new Error("Insufficient balance");

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
    if (order.type == "buy") {
      pnl = (closePrice - order.price) * order.quantity;
    } else {
      pnl = (order.price - closePrice) * order.quantity;
    }

    userManager.updateBalance(userId, order.margin + pnl);
    op[userId] = op[userId].filter((o) => o.orderId != orderId);
    cl[userId].push({ ...order, pnl });
  }
}

export const tradeMagenr = new TradeMagenr();