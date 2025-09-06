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

export interface closeOrder extends openOrder {
  pnl: number;
}

export interface User {
  email: string;
}

export interface Balance {
  balance: number;
  tokens: {
    [key: string]: number;
  };
}