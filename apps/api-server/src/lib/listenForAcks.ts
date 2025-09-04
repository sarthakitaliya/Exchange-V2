import { REDIS, redis } from "@ex/shared";

export default async function listenForAcks(id: string): Promise<boolean> {
  try {
    console.log("listening for acks");
    
    let res: Record<string, string> = {};
    const r = await redis.xread("BLOCK", 10000, "STREAMS", REDIS.ack, "$");
    if (r) {
      for (const [stream, messages] of r) {
        for (const [id, fields] of messages) {
            for(let i = 0; i < r.length;i+=2){
                res[fields[i]] = fields[i+1];
            }
        }
      }
    }
    if(res["ack_id"] == id){
        return true;
    }else{
        return false;
    }
    
  } catch (error) {
    console.log(error);
    return false;
  }
}
