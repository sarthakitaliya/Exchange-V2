import { REDIS, redis } from "@ex/shared";

async function startDbService() {
  try {
    while (true) {
      const r = await redis.xread(
        "BLOCK",
        10000,
        "STREAMS",
        REDIS.request,
        "$"
      );
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
            if (data.action == "signup") {
              //Todo: add logic
            } else if (data.action == "signin") {
              //Todo: add logic
            }
          }
          const status = "success";
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
  } catch (error) {
    console.log("DB service", error);
  }
}
