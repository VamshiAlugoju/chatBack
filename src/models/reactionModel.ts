import mongoose, { Schema } from "mongoose";

interface IReaction extends mongoose.Document {
  objectId: string;
  chatId: string;
  messageId: string;
  userId: string;
  workspaceId: string;
  reaction: string;
}

const reactionSchema = new Schema<IReaction>(
  {
    objectId: { type: String, required: true, unique: true, index: true },
    chatId: { type: String, required: true },
    messageId: { type: String, required: true },
    userId: { type: String, required: true },
    workspaceId: { type: String, required: true },
    reaction: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IReaction>("reactions", reactionSchema);
