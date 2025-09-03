import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { user } from "../store/user";
import { sendEmail } from "../lib/mail";

export function signin(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).jsonp({ error: "both field is required" });
    }
    const token = jwt.sign(email, process.env.JWT_SECRET!);
    if (user[token]) {
      sendEmail(email, token);
      res.status(200).json({ message: "please verify your email" });
    } else {
      res.status(400).json({ error: "User don't exist" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server erro" });
  }
}

export function signup(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).jsonp({ error: "both field is required" });
    }
    
    const token = jwt.sign(email, process.env.JWT_SECRET!);
    if (user[token]) {
      res.status(400).json({ error: "User already exists" });
    }

    user[token] = email;
    sendEmail(email, token);
    res.status(200).json({ message: "please verify your email" });
  } catch (error) {
    res.status(500).json({ error: "Internal server erro" });
  }
}

export function verify(req: Request, res: Response) {
  try {
    const { token } = req.query;
    console.log(token);

    res.cookie("token", token, {
      httpOnly: true,
    });
    res.send(token);
  } catch (error) {
    res.status(400).json({ error: "Something went wrong" });
  }
}
