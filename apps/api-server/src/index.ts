import express from "express";
import tradeRoute from "./routes/trade.route";
import userRoute from "./routes/user.route";
import balanceRoute from "./routes/balance.route";
import dotenv from "dotenv";
import { redis, REDIS } from "@ex/shared";
import generateId from "./lib/generateId";
import listenForAcks from "./lib/listenForAcks";

dotenv.config();

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello from API server!");
});

app.use("/api/v1/user", userRoute);
app.use("/api/v1/trade", tradeRoute);
app.use("/api/v1/balance", balanceRoute);

app.get("/try", async (req, res) => {
  try {
    const id = generateId();
    await redis.xadd(
      REDIS.request,
      "*",
      "action",
      "create",
      "name",
      "sarthak",
      "ack_id",
      id
    );
    const ack = await listenForAcks(id);
    if (ack) {
      res.json({ message: "suuu", ack });
    } else {
      res.status(400).json({ error: "something went wrong" });
    }
  } catch (error) {
    console.log(error);

    res.json({ error });
  }
});

app.listen(3030, () => {
  console.log("API server is running on http://localhost:3030");
});
