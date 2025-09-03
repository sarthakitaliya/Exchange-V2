import express from "express";
import { signin, signup, verify } from "../controllers/user.controller";

const router = express.Router();

router.post("/signin", signin);

router.post("/signup", signup);

router.get("/post", verify)

export default router;
