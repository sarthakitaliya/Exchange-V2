import { REDIS, redis } from "@ex/shared";
import { insertClosedOrder } from "./dbQueries/order";

async function startDbService() {
  try {
    while (true) {
      const r = await redis.xread("BLOCK", 10000, "STREAMS", REDIS.closed, "$");
      if (r) {
        let data: Record<string, string> = {};
        for (const [streams, messages] of r as [
          string,
          [string, string[]][],
        ][]) {
          for (const [id, fields] of messages) {
            for (let i = 0; i < fields.length; i += 2) {
              data[fields[i]] = fields[i + 1];
            }
            await insertClosedOrder(data);
            await redis.xadd(REDIS.ack, "*", "order_id", data.order_id);
            await redis.xack(streams, REDIS.grp, id);
          }
        }
      }
    }
  } catch (error) {
    console.log("DB service", error);
  }
}

startDbService();
