export default function getOrderData(order: any, price: number) {
  if (!order || !price) throw new Error("Invalid order or price");
  return JSON.stringify({
    userId: order.userId,
    asset: order.asset,
    type: order.type,
    margin: order.margin,
    leverage: order.leverage,
    openPrice: order.price,
    quantity: order.quantity,
    pnl: (order.type == "buy"
      ? (price - order.price) * order.quantity
      : (order.price - price) * order.quantity
    ).toFixed(2),
    closePrice: price,
    openedAt: order.timestamp,
  });
}
