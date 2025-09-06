import { redis } from "@ex/shared";

export default async function stream(
  channel: string,
  data: Record<string, string | number>
) {
  const fields: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    fields.push(key, value == null ? "" : String(value));
  }
  await redis.xadd(channel, "*", ...fields);
}
