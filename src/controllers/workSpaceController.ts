import { Request, Response } from "express";
import channelModel from "../models/channelModel";
import usermodel from "../models/usermodel";
import directsModel from "../models/directsModel";
import { v4 as uuid } from "uuid";
import detailsModel from "../models/detailsModel";
import workspaceModel from "../models/workspaceModel";
//createWorkspace

export async function createWorkSpace(req: Request, res: Response) {
  try {
    const { name } = req.body;
    const { uid } = res.locals;
    const workSpaceId = uuid();
    const channelId = uuid();
    const promises =  [];
    promises.push(
      channelModel.create({
        objectId: channelId,
        name: "#general",
        createdBy: uid,
        details: "",
        lastMessageText: "",
        members: [uid],
        topic: "",
        typing: [],
        workspaceId: workSpaceId,
      }),
      directsModel.create({
        objectId: uuid(),
        active: [uid],
        lastMessageText: "",
        lastTypingReset: new Date(),
        members: [uid],
        typing: [],
        workspaceId: workSpaceId,
      })
    );
    const [channel, direct] = await Promise.all(promises);
    const channelDetail = await detailsModel.create({
      objectId: uuid(),
      chatId: channel.id,
      lastRead: 0,
      userId: uid,
      workspaceId: workSpaceId,
    });
    const chatDetail = await detailsModel.create({
      objectId: uuid(),
      chatId: direct.objectId,
      lastRead: 0,
      userId: uid,
      workspaceId: workSpaceId,
    });
    const user = await usermodel.findOne({ _id: uid });
    user?.workspaces.push(workSpaceId);
    const workSpace = await workspaceModel.create({
      objectId: workSpaceId,
      channelId: channel.id,
      details: "",
      members: [uid],
      name: name,
      ownerId: uid,
      photoURL: "",
      thumbnailURL: "",
    });
    await user?.save();
    return res.json({
      workSpaceId,
      channelId :channel.id,
      channelDetail,
      chatDetail,
    });
  } catch (err) {
    return res.status(500).json({ err });
  }
}

export const getWorkspace = async (req: Request, res: Response) => {
  try {
    const { id: workspaceId } = req.params;
    const { uid } = res.locals;
    const workspace = await workspaceModel.findOne({
      where: {
        objectId: workspaceId,
      },
    });
    if (!workspace) throw new Error("workspace not found");
    if (!workspace.members.includes(uid))
      throw new Error("The user is not a member of the workspace.");
    return res.json({ workspace });
  } catch (err) {
    return res.status(500).json({ error: err });
  }
};

export async function getAllWorkspaces(req: Request, res: Response) {
  try {
    const workspaces = await workspaceModel.find();
    return res.json({ workspaces });
  } catch (err) {
    return res.status(500).json({ error: err });
  }
}

// export const updateWorkspace = async (req: Request, res: Response) => {
//   try {
//     const { id: workspaceId } = req.params;
//     const { uid } = res.locals;
//     const { photoPath, name, details } = req.body;

//     if (name === "") throw new Error("Name must be provided.");

//     const workspace = await workspaceModel.findOne({
//       where: {
//         objectId: workspaceId,
//       },
//     });
//       if(!workspace) throw new Error("workspace not found")
//     if (name && workspace.ownerId !== uid)
//       throw new Error("The workspace name can only be renamed by the owner.");

//     if (!workspace.members.includes(uid))
//       throw new Error("The user is not a member of the workspace.");

//     const path = photoPath
//       ? decodeURIComponent(
//           photoPath.split("/storage/b/messenger/o/")[1].split("?token=")[0]
//         )
//       : "";
//     // const metadata = await getFileMetadata(path);/
//     const metadata = '';
//     const [thumbnailURL, , photoResizedURL] = await saveImageThumbnail({
//       filePath: path,
//       width: WORKSPACE_THUMBNAIL_WIDTH,
//       height: WORKSPACE_THUMBNAIL_WIDTH,
//       metadata,
//       resizeOriginalSize: WORKSPACE_PHOTO_MAX_WIDTH,
//     });

//     await workspaceModel.updateOne(
//       {
//         photoURL: photoResizedURL || photoPath,
//         thumbnailURL,
//         ...(details != null && { details }),
//         ...(name && { name }),
//       },
//       {
//         where: {
//           objectId: workspaceId,
//         },
//       }
//     );

//     res.status(200).json({ success: true });
//   } catch (err) {
//     res.status(500).json({ error: err });
//   }
// };

export const deleteWorkspace = async (req: Request, res: Response) => {
  try {
    const { id: workspaceId } = req.params;
    const { uid } = res.locals;

    const workspace = await workspaceModel.findOne({
      where: {
        objectId: workspaceId,
      },
    });
    if (!workspace) throw new Error("workspace not found");
    if (!workspace.members.includes(uid))
      throw new Error("The user is not a member of the workspace.");

    await workspaceModel.updateOne(
      {
        isDeleted: true,
        members: [],
      },
      {
        where: {
          objectId: workspaceId,
        },
      }
    );

    const channels = await channelModel.find({
      where: {
        workspaceId,
      },
    });

    await Promise.all(
      channels.map(async (channel) => {
        await channel.updateOne(
          {
            isDeleted: true,
          },
          {
            where: {
              objectId: channel.objectId,
            },
          }
        );
      })
    );

    const users = await usermodel.find({
      where: {
        workspaces: workspaceId,
      },
    });

    await Promise.all(
      users.map(async (user) => {
        await user.updateOne(
          {
            workspaces: user.workspaces.filter((w) => w !== workspaceId),
          },
          {
            where: {
              objectId: user.objectId,
            },
          }
        );
      })
    );

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

export const addTeammate = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const { id: workspaceId } = req.params;
    const { uid } = res.locals;

    const user = await usermodel.findOne({
      where: {
        email,
      },
    });

    if (!user) throw new Error("user not found");
    if (user?.workspaces.includes(workspaceId))
      throw new Error("user already in workspace");

    const workspace = await workspaceModel.findOne({
      where: {
        objectId: workspaceId,
      },
    });

    if (!workspace) throw new Error("workspace not found");
    workspace.members.push(user?.objectId);
    await workspace.save();
    const channel = await channelModel.findOne({
      where: {
        workspaceId,
        name: "#general",
      },
    });

    channel?.members.push(user.objectId);
    await channel?.save();
    const directMessageId = uuid();

    await detailsModel.create({
      objectId: directMessageId,
      members: [uid, user.objectId],
      active: [uid],
      typing: [],
      lastTypingReset: new Date().toISOString(),
      workspaceId,
      lastMessageCounter: 0,
      lastMessageText: "",
    });

    await detailsModel.insertMany([
      {
        objectId: uuid(),
        chatId: directMessageId,
        userId: uid,
        lastRead: 0,
        workspaceId,
      },
      {
        objectId: uuid(),
        chatId: directMessageId,
        userId: user.objectId,
        lastRead: 0,
        workspaceId,
      },
    ]);

    const selfDirectMessageId = uuid();

    await detailsModel.create({
      objectId: selfDirectMessageId,
      members: [user.objectId],
      active: [user.objectId],
      typing: [],
      lastTypingReset: new Date().toISOString(),
      workspaceId,
      lastMessageCounter: 0,
      lastMessageText: "",
    });

    await detailsModel.create({
      objectId: uuid(),
      chatId: selfDirectMessageId,
      userId: user.objectId,
      lastRead: 0,
      workspaceId,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

export const deleteTeammate = async (req: Request, res: Response) => {
  try {
    const { id: workspaceId, userId } = req.params;
    const { uid } = res.locals;

    const workspace = await workspaceModel.findOne({
      where: {
        objectId: workspaceId,
      },
    });

    const user = await usermodel.find({
      where: {
        objectId: userId,
      },
    });

    if (!workspace) throw new Error("workspace not found");
    if (!workspace.members.includes(uid))
      throw new Error("The user is not a member of the workspace.");

    // await workspace.removeUser(user);
    workspace.members.filter((u) => u !== userId);
    await workspace.save();
    const channel = await channelModel.findOne({
      where: {
        workspaceId,
      },
    });

    // await channel?.removeUser(user);

    const dms = await detailsModel.find({
      where: {
        members: userId,
        workspaceId,
      },
    });

    await Promise.all(
      dms.map(async (dm: any) => {
        await dm.updateOne(
          {
            members: [],
            active: [],
          },
          {
            where: {
              objectId: dm.objectId,
            },
          }
        );
      })
    );

    const channels = await channelModel.find({
      where: {
        members: userId,
        workspaceId,
      },
    });

    await Promise.all(
      channels.map(async (channel) => {
        await channel.updateOne(
          {
            members: channel.members.filter((u) => u !== userId),
          },
          {
            where: {
              objectId: channel.objectId,
            },
          }
        );
      })
    );

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
