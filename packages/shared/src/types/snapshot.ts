import type { openOrder, closeOrder } from "./engineStore";


export interface snapshot {
    ts: number;
    engine: {
        latestPrices: Record<string, number>;
        userManager: {
            balance: Record<string, { balance: number; tokens: Record<string, number> }>;
        };
        tradeManager: {
            op: Record<string, openOrder[]>;
            co: Record<string, closeOrder[]>;
        };
    };
    offset: Record<string, string>;
}

