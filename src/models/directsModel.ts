import mongoose, { Schema } from "mongoose";

type IDirect = {
  objectId: string;
  active: string[];
  lastMessageCounter: number;
  lastMessageText: string;
  lastTypingReset: Date;
  members: string[];
  typing: string[];
  workspaceId: string;
};

const directsSchema = new Schema<IDirect>(
  {
    objectId: { type: String, required: true, unique: true, index: true },
    active: [{ type: String, required: true }],
    lastMessageCounter: { type: Number, required: true, default: 0 },
    lastMessageText: { type: String },
    lastTypingReset: { type: Date, required: true, default: Date.now },
    members: { type: [String], required: true },
    typing: [{ type: String }],
    workspaceId: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IDirect>("directs", directsSchema);
