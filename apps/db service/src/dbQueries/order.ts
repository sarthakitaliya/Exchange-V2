import { prisma } from "@ex/db";

export async function insertClosedOrder(data: Record<string, string>) {
    try {
        const asset = await prisma.asset.findUnique({
            where: { symbol: data.asset },
        })
        if (!asset) throw new Error("Asset not found");
        await prisma.closedOrder.create({
            data:{
               userId: data.userId,
               type: data.type as "BUY" | "SELL",
               quantity: parseFloat(data.quantity),
               leverage: parseFloat(data.leverage),
               entryPrice: parseFloat(data.openPrice),
               exitPrice: parseFloat(data.price),
               pnl: parseFloat(data.pnl),
               assetId: asset?.id,
               openedAt: data.openedAt
            }
        })
    } catch (error) {
        console.error("Error inserting closed order:", error);
        throw error;
    }
}