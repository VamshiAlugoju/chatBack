import mongoose from "mongoose";

export default async function connectDb(): Promise<typeof mongoose> {
  try {
    let dbUrl = process.env.DBURL ? process.env.DBURL : "";
    dbUrl =
      "mongodb+srv://Vamshi:DLz5plnWeqccaqew@clustor0.c1fqxnd.mongodb.net/?retryWrites=true&w=majority&appName=clustor0";
    if (dbUrl === "") {
      return Promise.reject("please provide db url in env file");
    }
    const mongoClient = await mongoose.connect(dbUrl, { autoIndex: false });
    console.log("connected to database successfully");
    return Promise.resolve(mongoClient);
  } catch (err) {
    console.log(err);
    return Promise.reject(err);
  }
}
