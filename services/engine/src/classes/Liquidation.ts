import { op } from "../store/store";

class Liquidation {
  checkLiquidation(currentPrice: number, order_id: string) {
    const userOrders = op[order_id];
     if (!userOrders || userOrders.length === 0) {
      return false;
    }
    const order = userOrders.find((o) => o.orderId == order_id);
    if (!order) throw new Error("Order not found");
    let pnl = 0;
    if (order.type == "BUY") {
      pnl = (currentPrice - order.price) * order.quantity;
    } else {
      pnl = (order.price - currentPrice) * order.quantity;
    }

    if (pnl <= -order.margin) {
      return true;
    }
    return false;
  }
}

export const liquidation = new Liquidation();
