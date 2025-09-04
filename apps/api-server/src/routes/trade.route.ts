import express from "express";
import { openOrder, closeOrder, getOpenOrder, getClosedOrders } from "../controllers/trade.controller";
import authMiddleware from "../middleware.ts/auth";

const router = express.Router();

router.get("/", authMiddleware, getOpenOrder)

router.get("/closed", authMiddleware, getClosedOrders)

router.post("/create", authMiddleware, openOrder);

router.post("/close", authMiddleware, closeOrder);

export default router;
