import { REDIS, redis } from "@ex/shared";

async function startEngine() {
  try {
    // await redis.xgroup("CREATE", REDIS.price, REDIS.grp, "0", "MKSTREAM");
    // await redis.xgroup("CREATE", REDIS.request, REDIS.grp, "0", "MKSTREAM");

    while (true) {
      const res = await redis.xreadgroup(
        "GROUP",
        REDIS.grp,
        "engine-1",
        "BLOCK",
        5000,
        "STREAMS",
        REDIS.request,
        REDIS.price,
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
            console.log(fields);
            console.log(fields[1]);
            
            if (fields[1] == "create") {
              for (let i = 0; i < fields.length; i += 2) {
                data[fields[i]] = fields[i + 1];
              }
              console.log(data);
            } else if (fields[1] == "balance") {
              console.log("price");
              console.log(fields);
            }
            await redis.xack(stream, REDIS.grp, id);
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
  } catch (error: any) {
    if (error.message.includes("BUSYGROUP")) {
      console.log("grp already exist");
    } else {
      console.log(error);
    }
  }
}

startEngine();
