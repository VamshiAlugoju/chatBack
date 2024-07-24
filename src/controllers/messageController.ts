import express, { Request, Response } from "express";
import { getFileMetadata, saveImageThumbnail } from "../utils/storage";
import { MESSAGE_THUMBNAIL_WIDTH } from "../config";
import directsModel from "../models/directsModel";
import channelModel from "../models/channelModel";
import { getMessageType, lastMessageTextGenerator, sha256 } from "../utils";
import detailsModel from "../models/detailsModel";
import messageModel from "../models/messageModel";
import { v4 as uuid } from "uuid";
import { arrayRemove } from "../utils/array-helpers";
import reactionModel from "../models/reactionModel";

export const createMessage = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const {
      text,
      chatId,
      workspaceId,
      chatType,
      filePath,
      sticker,
      fileName,
      objectId: customObjectId,
    } = req.body;
    const { uid } = res.locals;

    if (!chatId || !workspaceId || !chatType) {
      throw new Error("Arguments are missing.");
    }

    let chat;
    if (chatType === "Direct") {
      chat = await directsModel.findOne({ _id: chatId });
    } else {
      chat = await channelModel.findOne({ _id: chatId });
    }

    if (!chat?.members.includes(uid))
      throw new Error("The user is not authorized to create a message.");

    const lastMessageCounter = chat.lastMessageCounter || 0;

    const detailId = sha256(`${uid}#${chatId}`);
    const chatDetails = await detailsModel.findOne({ _id: detailId });

    const path = filePath
      ? decodeURIComponent(
          filePath.split("/storage/b/messenger/o/")[1].split("?token=")[0]
        )
      : "";

    const fileDetails = await getFileMetadata(path);

    const [thumbnailURL, fileMetadata] = (await saveImageThumbnail({
      filePath: path,
      width: MESSAGE_THUMBNAIL_WIDTH,
      metadata: fileDetails,
      allowAudio: true,
      allowVideo: true,
      authToken: res.locals.token,
    })) as any;

    const messageId = customObjectId || uuid();
    await messageModel.create({
      objectId: messageId,
      text: text || "",
      mediaWidth: fileMetadata?.width || null,
      mediaHeight: fileMetadata?.height || null,
      mediaDuration:
        (fileMetadata?.duration && Math.floor(fileMetadata.duration)) || null,
      thumbnailURL,
      fileSize: fileDetails ? fileDetails.ContentLength : null,
      fileType: fileDetails ? fileDetails.ContentType : null,
      fileURL: filePath,
      fileName: fileName || null,
      sticker: sticker || null,
      senderId: uid,
      workspaceId,
      chatId,
      chatType,
      type: getMessageType({
        text,
        sticker,
        fileType: fileDetails?.ContentType,
      }),
      counter: lastMessageCounter + 1,
      isDeleted: false,
      isEdited: false,
    });

    const lastMessageText = lastMessageTextGenerator({
      text,
      sticker,
      fileType: fileDetails?.ContentType,
    });

    if (chatType === "Channel") {
      await channelModel.updateOne(
        { objectId: chatId },
        {
          lastMessageText,
          lastMessageCounter: chat.lastMessageCounter + 1,
          typing: arrayRemove(chat.typing, uid),
        }
      );
    } else {
      await directsModel.updateOne(
        { objectId: chatId },
        {
          lastMessageText,
          lastMessageCounter: chat.lastMessageCounter + 1,
          active: chat.members,
          typing: arrayRemove(chat.typing, uid),
        }
      );
    }

    if (chatDetails) {
      await detailsModel.updateOne(
        { objectId: detailId },
        {
          lastRead: lastMessageCounter + 1,
        }
      );
    } else {
      await detailsModel.create({
        chatId,
        objectId: detailId,
        userId: uid,
        workspaceId,
        lastRead: lastMessageCounter + 1,
      });
    }

    res.send({ success: true });
  } catch (err) {
    res.status(500).send(err);
  }
};

// export const editMessage = async (
//   req: express.Request,
//   res: express.Response
// ) => {
//   try {
//     const { text } = req.body;
//     const { id } = req.params;
//     const { uid } = res.locals;

//     const message = await getMessage(res.locals.token, id);

//     let chat;
//     if (message.chatType === "Direct") {
//       chat = await getDirect(res.locals.token, message.chatId);
//     } else {
//       chat = await getChannel(res.locals.token, message.chatId);
//     }

//     if (!chat.members.includes(uid)) {
//       throw new Error("The user is not authorized to edit this message.");
//     }
//     if (message.senderId !== uid) {
//       throw new Error("The user is not authorized to edit this message.");
//     }

//     await updateMessageMutation(res.locals.token, id, {
//       text,
//       isEdited: true,
//     });

//     const lastMessages = await listMessages(res.locals.token, message.chatId);
//     const lastMessage = lastMessages[0];

//     if (lastMessage.counter === message.counter) {
//       if (message.chatType === "Channel") {
//         await updateChannelMutation(res.locals.token, message.chatId, {
//           lastMessageText: text,
//         });
//       } else {
//         await updateDirectMutation(res.locals.token, message.chatId, {
//           lastMessageText: text,
//         });
//       }
//     }

//     res.send({ success: true });
//   } catch (err) {
//     res.status(500).send({ error: err.message });
//   }
// };

export const createOrUpdateReaction = async (req: Request, res: Response) => {
  const { uid, messageId, reaction, chat } = req.body;
  const reactionId = sha256(`${uid}#${chat.objectId}#${messageId}`);
  try {
    const reactionDetails = await reactionModel.findOne({
      objectId: reactionId,
    });

    if (reactionDetails) {
      // reaction already exists, so update it
      await reactionDetails.updateOne({
        reaction,
      });
    } else {
      // reaction does not exist, so create it
      await reactionModel.create({
        reactionId,
        chatId: chat.objectId,
        messageId,
        userId: uid,
        workspaceId: chat.workspaceId,
        reaction,
      });
    }

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json(err);
  }
};

// export const editMessageReaction = async (
//   req: express.Request,
//   res: express.Response
// ) => {
//   try {
//     const { reaction } = req.body;
//     const { id: messageId } = req.params;
//     const { uid } = res.locals;

//     const message = await getMessage(res.locals.token, messageId);

//     let chat;
//     if (message.chatType === "Direct") {
//       chat = await getDirect(res.locals.token, message.chatId);
//     } else {
//       chat = await getChannel(res.locals.token, message.chatId);
//     }

//     if (!chat.members.includes(uid)) {
//       throw new Error("The user is not authorized to do this action.");
//     }

//     await createOrUpdateReaction({
//       token: res.locals.token,
//       messageId,
//       reaction,
//       chat,
//       uid,
//     });

//     res.send({ success: true });
//   } catch (err) {
//     res.status(500).send({ error: err.message });
//   }
// };

// export const deleteMessage = async (req: express.Request, res: express.Response) => {
//   try {
//     const { id } = req.params;
//     const { uid } = res.locals;

//     const message = await getMessage(res.locals.token, id);

//     let chat;
//     if (message.chatType === "Direct") {
//       chat = await getDirect(res.locals.token, message.chatId);
//     } else {
//       chat = await getChannel(res.locals.token, message.chatId);
//     }

//     if (!chat.members.includes(uid)) {
//       throw new Error("The user is not authorized to delete this message.");
//     }
//     if (message.senderId !== uid) {
//       throw new Error("The user is not authorized to delete this message.");
//     }

//     await updateMessageMutation(res.locals.token, id, {
//       isDeleted: true,
//     });

//     const lastMessages = await listMessages(res.locals.token, message.chatId);
//     const lastMessage = lastMessages[0];

//     const lastMessageText = lastMessageTextGenerator({
//       text: lastMessage?.text,
//       sticker: lastMessage?.sticker,
//       fileType: lastMessage?.fileType,
//     });

//     if (message.chatType === "Channel") {
//       await updateChannelMutation(res.locals.token, message.chatId, {
//         lastMessageText,
//       });
//     } else {
//       await updateDirectMutation(res.locals.token, message.chatId, {
//         lastMessageText,
//       });
//     }

//     res.send({ success: true });
//   } catch (err) {
//     res.status(500).send({ error: err });
//   }
