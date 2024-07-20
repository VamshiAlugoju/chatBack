import mongoose, { Schema } from "mongoose";

interface IWorkspace {
  objectId: string;
  channelId: string;
  details: string;
  isDeleted: boolean;
  members: string[];
  name: string;
  ownerId: string;
  photoURL: string;
  thumbnailURL: string;
}

const workspaceSchema = new Schema<IWorkspace>(
  {
    objectId: { type: String, required: true, unique: true, index: true },
    channelId: { type: String, required: true },
    details: String,
    isDeleted: { type: Boolean, required: true, default: false },
    members: [String],
    name: { type: String, required: true },
    ownerId: { type: String, required: true },
    photoURL: String,
    thumbnailURL: String,
  },
  { timestamps: true }
);

export default mongoose.model<IWorkspace>("workspaces", workspaceSchema);
