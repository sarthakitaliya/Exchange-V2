import { REDIS, redis } from "@ex/shared";
import { userManager } from "./classes/UserManager";
import { tradeMagenr } from "./classes/TradeManager";
import { v4 as uuid } from "uuid";
import { op, type openOrder } from "./classes";
import getOrderData from "./utils/getOrderData";
import { liquidation } from "./classes/Liquidation";


async function startEngine() {
  try {
    // await redis.xgroup("CREATE", REDIS.price, REDIS.grp, "0", "MKSTREAM");
    // await redis.xgroup("CREATE", REDIS.request, REDIS.grp, "0", "MKSTREAM");
    const latestPrices: Record<string, number> = {};
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
            console.log(data);
            if (stream === REDIS.price) {
              latestPrices[data.asset] = Number(data.price);
              await redis.xack(stream, REDIS.grp, id);
              op[1].forEach((o) => {
                const isLiquidated = liquidation.checkLiquidation(latestPrices[data.asset], o.orderId);
                if (isLiquidated) {
                  console.log("liquidated", o.orderId);
                  tradeMagenr.closeOrder(o.userId, latestPrices[data.asset], o.orderId);
                  const closedOrder = getOrderData(o, latestPrices[data.asset]);
                  redis.xadd(
                    REDIS.closed,
                    "*",
                    ...closedOrder
                  );
                }
              });
              continue;
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
                  

                  tradeMagenr.createOrder(
                    uuid(),
                    data.asset,
                    data.type as "buy" | "sell",
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
                const order = op[data.userId].find((o) => o.orderId === data.orderId);
                const price = latestPrices[order?.asset || ''];
                if (!order || !price) {
                  console.log("no order or price found", data.orderId);
                } else {
                  tradeMagenr.closeOrder(
                    data.userId,
                    price,
                    data.orderId,
                  );
                  const closedOrder = getOrderData(order, price);
                  await redis.xadd(
                    REDIS.closed,
                    "*",
                    ...closedOrder
                  );
                }
              }
            }
            await redis.xack(stream, REDIS.grp, id);
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
