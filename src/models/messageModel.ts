import mongoose, { Schema } from "mongoose";

interface IMessage {
  objectId: string;
  chatId: string;
  chatType: string;
  counter: number;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileURL: string;
  isDeleted: boolean;
  isEdited: boolean;
  mediaDuration: number;
  mediaHeight: number;
  mediaWidth: number;
  senderId: string;
  sticker: string;
  text: string;
  type: string;
  thumbnailURL: string;
  workspaceId: string;
}

const messageSchema = new Schema<IMessage>(
  {
    objectId: { type: String, required: true, unique: true, index: true },
    chatId: { type: String, required: true },
    chatType: { type: String, required: true },
    counter: { type: Number, required: true, default: 0 },
    fileName: String,
    fileSize: Number,
    fileType: String,
    fileURL: String,
    isDeleted: { type: Boolean, required: true, default: false },
    isEdited: { type: Boolean, required: true, default: false },
    mediaDuration: Number,
    mediaHeight: Number,
    mediaWidth: Number,
    senderId: { type: String, required: true },
    sticker: String,
    text: String,
    type: { type: String, required: true },
    thumbnailURL: String,
    workspaceId: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IMessage>("messages", messageSchema);
