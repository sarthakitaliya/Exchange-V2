import express from "express";
import tradeRoute from "./routes/trade.route";
import userRoute from "./routes/user.route";
import balanceRoute from "./routes/balance.route";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello from API server!");
});

app.use("/api/v1/user", userRoute);
app.use("/api/v1/trade", tradeRoute);
app.use("/api/v1/balance", balanceRoute);

app.listen(3030, () => {
  console.log("API server is running on http://localhost:3030");
});
