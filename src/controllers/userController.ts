import { Request, Response } from "express";
import { generateJwtToken } from "../config/libs/userlibs";
import usermodel from "../models/usermodel";
import { v4 as uuid } from "uuid";

export const signin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "email and password fields are required" });
    }
    const user = await usermodel.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid Credentials" });
    }
    const isMatch = user.password === password;
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid Credentials" });
    }
    const token = generateJwtToken(user._id.toString());
    return res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body;
    const objectId = uuid();
    const user = new usermodel({ objectId, email, password, fullName });
    await user.save();
    const token = generateJwtToken(user._id.toString());
    return res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await usermodel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateLastPresence = async (req: Request, res: Response) => {
  try {
    const user = await usermodel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.lastSeen = new Date();
    await user.save();
    return res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
