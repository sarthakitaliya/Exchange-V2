export interface openOrder {
  orderId: string;
  userId: string;
  asset: string;
  type: "BUY" | "SELL";
  margin: number;
  leverage: number;
  price: number;
  quantity: number;
  timestamp: number;
}

interface closeOrder extends openOrder {
  pnl: number;
}

interface User {
  email: string;
}

interface Balance {
  balance: number;
  tokens: {
    [key: string]: number;
  };
}

export const balance: Record<string, Balance> = {};
export const op: Record<string, openOrder[]> = {};
export const cl: Record<string, closeOrder[]> = {};
export const user: Record<string, User> = {};
