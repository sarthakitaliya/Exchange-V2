import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { sendEmail } from "../lib/mail";
import stream from "../lib/queue";
import { REDIS } from "@ex/shared";
import { prisma } from "@ex/db";
import generateId from "../lib/generateId";
import listenForAcks from "../lib/listenForAcks";
import { v4 as uuidv4 } from "uuid";

export async function signin(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).jsonp({ error: "both field is required" });
    }
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      res.status(400).json({ error: "User does not exist" });
      return;
    }
    const token = uuidv4();
    await prisma.magicLinkToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    });
    sendEmail(email, token);
    res.status(200).json({ message: "please verify your email" });
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ error: "Internal server erro" });
  }
}

export async function signup(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).jsonp({ error: "both field is required" });
    }
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      res.status(400).json({ error: "User already exists" });
      return;
    }

    const newUser = await prisma.user.create({
      data: { email },
    });

    const token = uuidv4();
    await prisma.magicLinkToken.create({
      data: {
        userId: newUser.id,
        token,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    });
    const id = generateId();
    const resss = await stream(REDIS.request, {
      action: "signup",
      userId: newUser.id,
      ack_id: id,
    });
    const ack = await listenForAcks(id);
    if (!ack) {
      res.status(500).json({ error: "Something went wrong" });
      return;
    }

    sendEmail(email, token);
    res.status(200).json({ message: "please verify your email" });
  } catch (error) {
    res.status(500).json({ error: "Internal server erro" });
  }
}

export async function verify(req: Request, res: Response) {
  try {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      res.status(400).json({ error: "Token is required" });
      return;
    }

    const tokenRecord = await prisma.magicLinkToken.findUnique({
      where: {
        token,
      },
    });

    if (
      !tokenRecord ||
      tokenRecord.used ||
      tokenRecord.expiresAt < new Date()
    ) {
      res.status(400).json({ error: "Invalid or expired token" });
      return;
    }

    await prisma.magicLinkToken.update({
      where: {
        id: tokenRecord.id,
      },
      data: {
        used: true,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: tokenRecord.userId },
    });
    if (!user) {
      res.status(400).json({ error: "User not found" });
      return;
    }

    const jwtToken = jwt.sign({ email: user.email, id: user.id }, process.env.JWT_SECRET!, {expiresIn: '7d'});
    res.cookie("AuthToken", jwtToken, {
      httpOnly: true,
      secure: true,
    });
    res.json({ message: "User verified successfully" });
  } catch (error) {
    res.status(400).json({ error: "Something went wrong" });
  }
}
