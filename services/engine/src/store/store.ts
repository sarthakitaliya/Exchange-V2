export interface openOrder {
  orderId: string;
  userId: string;
  asset: string;
  type: "buy" | "sell";
  margin: number;
  leverage: number;
  price: number;
  quantity: number;
  timestamp: number;
}

interface closeOrder extends openOrder{
  pnl: number;
}

interface User {
  email: string;
}

export const balance: Record<string, number> = {};
export const op: Record<string, openOrder[]> = {};
export const cl: Record<string, closeOrder[]> = {};
export const user: Record<string, User> = {};

