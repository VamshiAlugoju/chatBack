import express, { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import workspaceModel from "../models/workspaceModel";
import directsModel from "../models/directsModel";
import detailsModel from "../models/detailsModel";
import { sha256 } from "../utils";
import { arrayRemove, arrayUnion } from "../utils/array-helpers";
import timeDiff from "../config/libs/userlibs";
export const createDirect = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const { userId, workspaceId } = req.body;
    const { uid } = res.locals;

    const isMe = userId === uid;

    const workspace = await workspaceModel.findOne({ objectId: workspaceId });
    if (!workspace?.members.includes(uid))
      throw new Error("The user is not a member of this workspace");

    const dms = await directsModel.find({
      workspaceId,
      members: { $in: [uid] },
    });

    const activeArray = [uid];

    if (isMe) {
      let currentDm = dms.find((dm: any) => dm.members.length === 1);
      let directMessageId = currentDm ? currentDm.objectId : uuid();
      if (currentDm) {
        // Activate the existing direct (a self direct has already been created in the past)

        await directsModel.findOneAndUpdate(
          { objectId: currentDm.objectId },
          { active: activeArray }
        );
      } else {
        // Create a new direct (no self direct in this workspace before)
        currentDm = await directsModel.create({
          objectId: directMessageId,
          members: [uid],
          typing: [],
          active: activeArray,
          workspaceId,
          lastMessageText: "",
        });

        const detailDmId = sha256(`${uid}#${directMessageId}`);
        await detailsModel.create({
          objectId: detailDmId,
          chatId: directMessageId,
          userId: uid,
          workspaceId,
        });
      }
      res.locals.data = {
        directId: directMessageId,
      };
      return next();
    }

    // uid wants to send a message to another user than him
    let currentDm = dms.find((dm: any) => dm.members.includes(userId));

    // Activate the existing direct (a direct between uid and teammateId has been open in the past)
    if (currentDm) {
      await directsModel.findOneAndUpdate(
        { objectId: currentDm.objectId },
        { active: arrayUnion(currentDm.active, uid) }
      );

      res.locals.data = {
        directId: currentDm.objectId,
      };
      return next();
    }

    // Create a new direct (no direct between these users in this workspace before)
    const promises = [];
    const directMessageId = uuid();
    promises.push(
      directsModel.create({
        objectId: directMessageId,
        members: [uid, userId],
        typing: [],
        active: activeArray,
        workspaceId,
      })
    );

    const d1 = sha256(`${uid}#${directMessageId}`);
    promises.push(
      detailsModel.create({
        objectId: d1,
        chatId: directMessageId,
        userId: uid,
        workspaceId,
      })
    );

    const d2 = sha256(`${userId}#${directMessageId}`);
    promises.push(
      detailsModel.create({
        objectId: d2,
        chatId: directMessageId,
        userId: userId,
        workspaceId,
      })
    );

    res.locals.data = {
      directId: directMessageId,
    };
    return next();
  } catch (err) {
    return next(err);
  }
};

export const closeDirect = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const { id } = req.params;
    const { uid } = res.locals;

    const direct = await directsModel.findOne({ objectId: id });
    if (!direct?.members.includes(uid))
      throw new Error("The user is not a member of this Direct");

    await directsModel.findOneAndUpdate(
      { objectId: id },
      { active: arrayRemove(direct.active, uid) }
    );
    res.locals.data = {
      success: true,
    };
    return next();
  } catch (err) {
    return next(err);
  }
};

export async function getAllDirects(req: Request, res: Response) {
  try {
    const { workspace_id } = req.params;
    const directs = await directsModel.find({ workspaceId: workspace_id });
    res.status(200).json(directs);
  } catch (err) {
    res.status(500).json(err);
  }
}

export const typingIndicator = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const { id: dmId } = req.params;
    const { isTyping } = req.body;
    const { uid } = res.locals;

    const direct = await directsModel.findOne({ objectId: dmId });

    if (!direct?.members.includes(uid))
      throw new Error("The user is not in the Direct.");

    if (
      (isTyping && !direct.typing.includes(uid)) ||
      (!isTyping && direct.typing.includes(uid))
    ) {
      await directsModel.findOneAndUpdate(
        { objectId: dmId },
        {
          typing: isTyping
            ? arrayUnion(direct.typing, uid)
            : arrayRemove(direct.typing, uid),
        }
      );
    }

    res.locals.data = {
      success: true,
    };
    return next();
  } catch (err) {
    return next(err);
  }
};

export const resetTyping = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const { id: dmId } = req.params;
    const { uid } = res.locals;

    const direct = await directsModel.findOne({ objectId: dmId });

    if (!direct?.members.includes(uid))
      throw new Error("The user is not in the Direct.");

    if (
      timeDiff(new Date(direct.lastTypingReset), Date.now()) >= 30 &&
      direct.typing.length > 0
    ) {
      await directsModel.findOneAndUpdate(
        { objectId: dmId },
        { typing: [], lastTypingReset: new Date().toISOString() }
      );
    }

    res.locals.data = {
      success: true,
    };
    return next();
  } catch (err) {
    return next(err);
  }
};
