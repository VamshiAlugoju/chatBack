import jwt from "jsonwebtoken";

export const generateJwtToken = (userId: string) => {
  const secret = process.env.JWTTOKEN || "secret";
  const payload = {
    sub: userId,
  };
  return jwt.sign(payload, secret);
};

export default function timeDiff(date1: Date, date2: number) {
  return Math.abs(date1.getTime() - date2) / 1000;
}
