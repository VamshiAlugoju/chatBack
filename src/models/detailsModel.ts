import mongoose, { Schema } from "mongoose";
interface IDetails {
  objectId: string;
  chatId: string;
  lastRead: number;
  userId: string;
  workspaceId: string;
}

const detailsSchema = new Schema<IDetails>(
  {
    objectId: { type: String, required: true, unique: true, index: true },
    chatId: { type: String, required: true },
    lastRead: { type: Number, required: true, default: 0 },
    userId: { type: String, required: true },
    workspaceId: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IDetails>("details", detailsSchema);
