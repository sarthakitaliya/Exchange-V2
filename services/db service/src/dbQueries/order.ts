import { prisma } from "@ex/db";

export async function insertClosedOrder(data: Record<string, string>) {
    try {
        await prisma.closedOrder.create({
            data:{
               userId: data.userId,
               symbol: data.asset,
               type: data.type as "BUY" | "SELL",
               quantity: parseFloat(data.quantity),
               entryPrice: parseFloat(data.openPrice),
               exitPrice: parseFloat(data.price),
               pnl: parseFloat(data.pnl),
               openedAt: data.openedAt
            }
        })
    } catch (error) {
        
    }
}