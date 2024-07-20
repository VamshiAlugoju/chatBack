import mongoose, { Schema } from "mongoose";

export interface IUser {
  objectId: string;
  displayName: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  photoURL: string;
  password: string;
  theme: string;
  thumbnailURL: string;
  lastSeen: Date;
  title: string;
  workspaces: string[];
}

const userSchema = new Schema<IUser>(
  {
    objectId: { type: String, required: true, unique: true, index: true },
    displayName: String,
    email: { type: String, required: true, unique: true },
    fullName: String,
    phoneNumber: String,
    photoURL: String,
    theme: String,
    thumbnailURL: String,
    title: String,
    lastSeen: {
      type: Date,
      default: new Date(),
      required: true,
    },
    password: String,
    workspaces: [String],
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("users", userSchema);
