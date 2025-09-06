import type { Request, Response } from "express";
import stream from "../lib/queue";
import { REDIS, openOrderSchema, redis } from "@ex/shared";
import generateId from "../lib/generateId";
import listenForAcks from "../lib/listenForAcks";
import { prisma } from "@ex/db";

export async function getClosedOrders(req: Request, res: Response) {
  try {
    const closedOrders = await prisma.closedOrder.findMany({
      where: { userId: req.user.id },
      orderBy: { openedAt: "desc" },
    });
    res.json({ closedOrders });
  } catch (error) {
    res.status(500).json({ error: "internal server error" });
  }
}
export async function getOpenOrder(req: Request, res: Response) {
  try {
    stream(REDIS.request, { action: "get_open_order", userId: req.user.id });
    const r = await redis.xread("BLOCK", 10000, "STREAMS", REDIS.response, "$");
    let orders: Record<string, string> = {};
    for (const [stream, messages] of r as [string, [string, string[]][]][]) {
      for (const [id, fields] of messages) {
        for (let i = 0; i < fields.length; i += 2) {
          orders[fields[i]] = fields[i + 1];
        }
      }
    }
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: "internal server error" });
  }
}

export async function openOrder(req: Request, res: Response) {
  try {
    const { asset, type, margin, leverage } = req.body;
    const { success } = openOrderSchema.safeParse(req.body);
    if (!success) {
      res.status(400).json({ error: "please provide valid fields" });
      return;
    }
    const id = generateId();
    const order = {
      action: "open_order",
      userId: req.user.id,
      asset,
      type,
      margin,
      leverage,
      ack_id: id,
    };
    await stream(REDIS.request, order);
    const ack = await listenForAcks(id);

    if (ack) {
      res.status(200).json({ message: "order placed successfully" });
    } else {
      res.status(500).json({ error: "could not place order" });
    }
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ error: "internal server error" });
  }
}

export async function closeOrder(req: Request, res: Response) {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      res.status(400).json({ error: "please provide valid data" });
      return;
    }
    const id = generateId();
    const order = {
      action: "close_order",
      userId: req.user.id,
      orderId,
      ack_id: id,
    };
    await stream(REDIS.request, order);
    const ack = await listenForAcks(id);

    if (ack) {
      res.status(200).json({ message: "order closed successfully" });
    } else {
      res.status(500).json({ error: "could not close order" });
    }
  } catch (error) {
    res.status(500).json({ error: "internal server error" });
  }
}
