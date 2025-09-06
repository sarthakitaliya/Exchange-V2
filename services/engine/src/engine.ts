import { REDIS, redis, type openOrder } from "@ex/shared";
import { userManager } from "./classes/UserManager";
import { tradeManager } from "./classes/TradeManager";
import { v4 as uuid } from "uuid";
import { balance, op } from "./classes";
import getOrderData from "./utils/getOrderData";
import { liquidation } from "./classes/Liquidation";
import { SnapshotManager } from "./classes/SnapshotManager";
import { getSnapshotObject, restoreFromSnapshot } from "./utils/helper";

async function startEngine() {
  try {
    // await redis.xgroup("CREATE", REDIS.price, REDIS.grp, "0", "MKSTREAM");
    // await redis.xgroup("CREATE", REDIS.request, REDIS.grp, "0", "MKSTREAM");
    const latestPrices: Record<string, number> = {};
    const offset: Record<string, string> = {};

    const snapMgr = new SnapshotManager(
      `snapshot/${process.env.NODE_ENV ?? "dev"}`,
      process.env.SNAPSHOT_BUCKET!
    );

    const snap = await snapMgr.load();
    if (snap) {
      console.log("Loaded snapshot:", snap);
      restoreFromSnapshot(snap, latestPrices, offset);
      console.log("balances:", balance);
      console.log("open orders:", op);
      console.log("latest prices:", latestPrices);
      console.log("offsets:", offset);
      if (snap.offset) {
        for (const [stream, id] of Object.entries(snap.offset)) {
          try {
            await redis.xgroup("SETID", stream, REDIS.grp, id);
          } catch (error) {
            console.log(`could not setid for ${stream}`, error);
          }
        }
      }
    }

    snapMgr.startAutoSave(() => getSnapshotObject(latestPrices, offset), 10000);

    while (true) {
      const res = await redis.xreadgroup(
        "GROUP",
        REDIS.grp,
        "engine-1",
        "BLOCK",
        5000,
        "STREAMS",
        REDIS.price,
        REDIS.request,
        ">",
        ">"
      );

      if (res) {
        //[[stream, [[id, fields], ...]], ...] or null
        let data: Record<string, string> = {};
        for (const [stream, messages] of res as [
          string,
          [string, string[]][],
        ][]) {
          for (const [id, fields] of messages) {
            for (let i = 0; i < fields.length; i += 2) {
              data[fields[i]] = fields[i + 1];
            }
            // console.log(data);

            if (stream === REDIS.price) {
              latestPrices[data.asset] = Number(data.price);
              await redis.xack(stream, REDIS.grp, id);
              if (Object.entries(op).length === 0) continue;
              Object.entries(op).forEach(([key, values]) => {
                values.forEach((o: openOrder) => {
                  const isLiquidated = liquidation.checkLiquidation(
                    latestPrices[data.asset],
                    o.orderId
                  );
                  if (isLiquidated) {
                    // console.log("liquidated", o.orderId);
                    tradeManager.closeOrder(
                      o.userId,
                      latestPrices[data.asset],
                      o.orderId
                    );
                    const closedOrder = getOrderData(
                      o,
                      latestPrices[data.asset]
                    );
                    redis.xadd(REDIS.closed, "*", ...closedOrder);
                  }
                });
              });
            }
            if (stream === REDIS.request) {
              if (data.action == "signup") {
                userManager.createUser(data.userId);
                console.log(userManager.getBalance(data.userId));
              } else if (data.action == "open_order") {
                const orderId = uuid();
                const price = latestPrices[data.asset];
                if (!price) {
                  console.log("no price for ", data.asset);
                } else {
                  console.log("price", price);

                  tradeManager.createOrder(
                    data.userId,
                    data.asset,
                    data.type as "BUY" | "SELL",
                    Number(data.margin),
                    Number(data.leverage),
                    price
                  );
                }
              }
            } else if (data.action == "close_order") {
              const price = latestPrices[data.asset];
              if (!price) {
                console.log("no price for ", data.asset);
              } else {
                const order = op[data.userId].find(
                  (o) => o.orderId === data.orderId
                );
                const price = latestPrices[order?.asset || ""];
                if (!order || !price) {
                  console.log("no order or price found", data.orderId);
                } else {
                  tradeManager.closeOrder(data.userId, price, data.orderId);
                  const closedOrder = getOrderData(order, price);
                  await redis.xadd(REDIS.closed, "*", ...closedOrder);
                }
              }
            }
            await redis.xack(stream, REDIS.grp, id);
            offset[stream] = id;
          }
          const status = "success";
          if (data.ack_id) {
            await redis.xadd(
              REDIS.ack,
              "*",
              "ack_id",
              data.ack_id,
              "status",
              status
            );
          }
        }
      }
    }
  } catch (error: any) {
    if (error.message.includes("BUSYGROUP")) {
      console.log("grp already exist");
    } else {
      console.log(error);
    }
  }
}

startEngine();
