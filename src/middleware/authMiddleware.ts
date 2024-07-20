import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import usermodel from "../models/usermodel";
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers.authorization;
    if (!token || token === "") {
      return res
        .status(400)
        .json({ message: "invalid token sent please check" });
    }
    const secretKey = process.env.JWTSECRETKEY
      ? process.env.JWTSECRETKEY
      : "secret";
    const jwtRes = jwt.verify(token, secretKey);
    if (typeof jwtRes !== "string") {
      const user = jwtRes;
      console.log(user.sub, "?>>>>>>>>>>>>....");
      const userDoc = await usermodel.findOne({ _id: user.sub }, { role: 1 });
      if (userDoc) {
        res.locals.uid = userDoc._id;
        return next();
      }
      return res
        .status(500)
        .json({ message: "user not found , please check the token" });
    }
  } catch (err) {
    return res.status(500).json({ err });
  }
}
