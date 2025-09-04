import { z } from "zod";

export const openOrderSchema = z.object({
    asset: z.string(),
    type: z.enum(["buy", "sell"]),
    margin: z.number(),
    leverage: z.number()
})

export const closeOrderSchema = z.object({
    orderId: z.string()
})
