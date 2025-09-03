import WebSocket from "ws";
import { REDIS, redis } from "@ex/shared";

const ws = new WebSocket("wss://ws.backpack.exchange/");

const SOL = {
  id: 1,
  method: "SUBSCRIBE",
  params: ["bookTicker.SOL_USDC_PERP"],
};

const BTC = {
  id: 1,
  method: "SUBSCRIBE",
  params: ["bookTicker.BTC_USDC_PERP"],
};
const ETH = {
  id: 1,
  method: "SUBSCRIBE",
  params: ["bookTicker.ETH_USDC_PERP"],
};
interface pu {
  asset: string;
  price: string;
  decimal: number;
}

let priceData: pu[] = [];

ws.on("open", () => {
  ws.send(JSON.stringify(SOL));
  ws.send(JSON.stringify(BTC));
  ws.send(JSON.stringify(ETH));
});

ws.on("message", (data: any) => {
  const d = JSON.parse(data);
  // console.log(d);

  const a = d.data.s.split("_")[0];
  let decimal = 6;
  if (a === "BTC") decimal = 4;
  if (a === "SOL") decimal = 6;
  if (a === "ETH") decimal = 6;
  priceData.push({
    asset: a,
    price: d.data.a,
    decimal: decimal,
  });

    // console.log(priceData);
  setInterval(async () => {
    if (priceData.length > 0) {
      for (const p of priceData) {
        await redis.xadd(
          REDIS.price,
          "*",
          "asset",
          p.asset,
          "price",
          p.price,
          "decimal",
          p.decimal
        );
        // await redis.xadd(REDIS.price, "*", JSON.stringify(priceData));
        console.log("--");
      }
    }
  }, 1000);
});
