import { Request, Response } from "express";
import channelModel from "../models/channelModel";
import { v4 as uuid } from "uuid";
import workspaceModel from "../models/workspaceModel";
import detailsModel from "../models/detailsModel";
import usermodel from "../models/usermodel";
import timeDiff from "../config/libs/userlibs";

export const createChannel = async (req: Request, res: Response) => {
  try {
    const { name, details, workspaceId } = req.body;
    const { uid } = res.locals;

    const workspace = await workspaceModel.findOne({
      objectId: workspaceId,
      members: uid,
    });
    if (!workspace) throw new Error("The user is not in the workspace.");

    const channel = await channelModel.findOne({
      name: name.replace("#", ""),
      workspaceId,
    });
    if (channel) throw new Error("channel already exists.");

    const channelId = uuid();

    const createdChannel = await channelModel.create({
      objectId: channelId,
      name: "#" + name,
      members: [uid],
      typing: [],
      workspaceId,
      createdBy: uid,
      topic: "",
      details: details || "",
      lastMessageText: "",
    });

    const detail = await detailsModel.create({
      objectId: uuid(),
      chatId: channelId,
      userId: uid,
      workspaceId,
    });

    res.status(201).json({ channelId });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

export async function getAllChanells(req: Request, res: Response) {
  try {
    const { workspace_id } = req.params;
    const channels = await channelModel.find({ workspaceId: workspace_id });
    return res.json({ channels });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
}

export const updateChannel = async (req: Request, res: Response) => {
  try {
    const { id: channelId } = req.params;
    const { uid } = res.locals;
    const { topic, details, name } = req.body;

    if (name != null && (name.trim() === "" || name.trim() === "#"))
      throw new Error("Channel name must be provided.");

    const channel = await channelModel.findOne({
      _id: channelId,
      members: uid,
    });

    if (name) {
      const existingChannel = await channelModel.findOne({
        name: name.replace("#", ""),
        workspaceId: channel?.workspaceId,
      });
      if (existingChannel) throw new Error("Channel name is already taken.");
    }

    const updatedChannel = await channelModel.findOneAndUpdate(
      { _id: channelId },
      {
        ...(topic != null && { topic }),
        ...(details != null && { details }),
        ...(name && { name: name.replace("#", "") }),
      },
      { new: true }
    );

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

export const deleteChannel = async (req: Request, res: Response) => {
  try {
    const { id: channelId } = req.params;
    const { uid } = res.locals;

    const channel = await channelModel.findOne({
      _id: channelId,
      members: uid,
    });
    if (!channel) throw new Error("The user is not in the channel.");

    await channelModel.findOneAndUpdate(
      { _id: channelId },
      { isDeleted: true },
      { new: true }
    );

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

export const archiveChannel = async (req: Request, res: Response) => {
  try {
    const { id: channelId } = req.params;
    const { uid } = res.locals;

    const channel = await channelModel.findOne({
      _id: channelId,
      members: uid,
    });
    if (!channel) throw new Error("The user is not in the channel.");

    await channelModel.findOneAndUpdate(
      { _id: channelId },
      { isArchived: true },
      { new: true }
    );

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

export const unarchiveChannel = async (req: Request, res: Response) => {
  try {
    const { id: channelId } = req.params;
    const { uid } = res.locals;

    const channel = await channelModel.findOne({
      _id: channelId,
      members: uid,
    });
    const workspace = await workspaceModel.findOne({
      _id: channel?.workspaceId,
      members: uid,
    });
    if (!workspace) throw new Error("The user is not in the workspace.");

    await channelModel.findOneAndUpdate(
      { _id: channelId },
      {
        $addToSet: {
          members: uid,
        },
        isArchived: false,
      },
      { new: true }
    );

    await detailsModel.create({
      objectId: uuid(),
      chatId: channelId,
      userId: uid,
      workspaceId: channel?.workspaceId,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

export const addMember = async (req: Request, res: Response) => {
  try {
    const { id: channelId } = req.params;
    const { email } = req.body;
    const { uid } = res.locals;

    const user = await usermodel.findOne({
      email,
    });
    if (!user) throw new Error("user not found");

    const channel = await channelModel.findOne({
      _id: channelId,
      members: uid,
    });
    const workspace = await workspaceModel.findOne({
      _id: channel?.workspaceId,
      members: uid,
    });

    if (!workspace) throw new Error("you are not in this workspace.");

    if (!workspace.members.includes(user.objectId))
      throw new Error("The user is not in this workspace.");

    await channelModel.findOneAndUpdate(
      { _id: channelId },
      { $addToSet: { members: user._id } },
      { new: true }
    );

    await detailsModel.create({
      objectId: uuid(),
      chatId: channelId,
      userId: user._id,
      workspaceId: channel?.workspaceId,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

export const deleteMember = async (req: Request, res: Response) => {
  try {
    const { id: channelId, userId } = req.params;
    const { uid } = res.locals;

    const channel = await channelModel.findOne({
      _id: channelId,
      members: uid,
    });
    if (!channel) throw new Error("The user is not in the channel.");

    await channelModel.findOneAndUpdate(
      { _id: channelId },
      { $pull: { members: userId } },
      { new: true }
    );

    await detailsModel.deleteMany({ chatId: channelId, userId });

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

export const typingIndicator = async (req: Request, res: Response) => {
  try {
    const { id: channelId } = req.params;
    const { isTyping } = req.body;
    const { uid } = res.locals;

    const channel = await channelModel.findOne({
      _id: channelId,
    });
    if (!channel) throw new Error("channel not found");
    if (!channel.members.includes(uid))
      throw new Error("The user is not in the channel.");

    if (
      (isTyping && !channel.typing.includes(uid)) ||
      (!isTyping && channel.typing.includes(uid))
    ) {
      await channelModel.findOneAndUpdate(
        { _id: channelId },
        {
          $addToSet: {
            typing: isTyping ? uid : { $each: [] },
          },
          $pull: {
            typing: isTyping ? { $nin: [uid] } : uid,
          },
        },
        { new: true }
      );
    }

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

export const resetTyping = async (req: Request, res: Response) => {
  try {
    const { id: channelId } = req.params;
    const { uid } = res.locals;

    const channel = await channelModel.findOne({
      _id: channelId,
    });

    if (!channel) throw new Error("channel not found");
    if (!channel.members.includes(uid))
      throw new Error("The user is not in the channel.");

    if (
      timeDiff(new Date(channel.lastTypingReset), Date.now()) >= 30 &&
      channel.typing.length > 0
    ) {
      await channelModel.findOneAndUpdate(
        { _id: channelId },
        {
          typing: [],
          lastTypingReset: new Date().toISOString(),
        },
        { new: true }
      );
    }

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
