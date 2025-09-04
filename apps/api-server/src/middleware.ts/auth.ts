import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export default async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers.cookie?.split("AuthToken=")[1];
    
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    if (!decoded || typeof decoded !== "object") {
      return res.status(401).json({ error: "Unauthorized" });
    }
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ error: "Internal server error" });
  }
}
