import mongoose, { Schema } from "mongoose";

interface IChannel {
  objectId: string;
  createdBy: string;
  details: string;
  isArchived: boolean;
  lastMessageCounter: number;
  lastMessageText: string;
  lastTypingReset: Date;
  members: string[];
  name: string;
  topic: string;
  typing: string[];
  workspaceId: string;
  isDeleted: boolean;
}

const channelSchema = new Schema<IChannel>(
  {
    objectId: { type: String, required: true, unique: true, index: true },
    createdBy: { type: String, required: true },
    details: String,
    isArchived: { type: Boolean, required: true, default: false },
    lastMessageCounter: { type: Number, required: true, default: 0 },
    lastMessageText: String,
    lastTypingReset: { type: Date, required: true, default: Date.now },
    members: { type: [String], required: true },
    name: { type: String, required: true },
    topic: String,
    typing: [{ type: String }],
    workspaceId: { type: String, required: true },
    isDeleted: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IChannel>("channels", channelSchema);
