import WebSocket from "ws";
import { REDIS, redis } from "@ex/shared";

const ws = new WebSocket("wss://ws.backpack.exchange/");

const markets = ["SOL_USDC_PERP", "BTC_USDC_PERP", "ETH_USDC_PERP"];
for (const m of markets) {
  ws.on("open", () => {
    ws.send(
      JSON.stringify({ id: 1, method: "SUBSCRIBE", params: [`trade.${m}`] })
    );
  });
}

type Tick = { asset: string; price: string; decimal: number };
const latest: Record<string, Tick> = Object.create(null);

ws.on("message", (raw: any) => {
  const msg = JSON.parse(raw);
  const sym = msg?.data?.s;
  const ask = msg?.data?.a;
  if (!sym || !ask) return;
  console.log(msg);
  
  const asset = sym.split("_")[0];
  const decimal = asset === "BTC" ? 4 : 6;

  latest[asset] = { asset, price: ask, decimal };
});

setInterval(async () => {
  const batch = Object.values(latest);
  console.log("batch", batch);

  if (!batch.length) return;

  for (const k in latest) delete latest[k];

  await Promise.all(
    batch.map((p) =>
      redis.xadd(
        REDIS.price,
        "*",
        "asset",
        p.asset,
        "price",
        p.price,
        "decimal",
        String(p.decimal)
      )
    )
  ).catch((e) => console.log(e));
}, 200);
