import express, { Request, Response, Express, Router } from "express";
import cors from "cors";
import connectDb from "./config/dbConfig";
import * as userController from "./controllers/userController";
import { authMiddleware } from "./middleware/authMiddleware";
import * as workspaceControler from "./controllers/workSpaceController";
const app = express();

app.use(express.json());
app.use(cors());

const channelsRouter = express.Router();
// channelsRouter.use(authMiddleware);
// channelsRouter.post("/", channels.createChannel);
// channelsRouter.post("/:id", channels.updateChannel);
// channelsRouter.post("/:id/members", channels.addMember);
// channelsRouter.delete("/:id/members/:userId", channels.deleteMember);
// channelsRouter.delete("/:id", channels.deleteChannel);
// channelsRouter.post("/:id/archive", channels.archiveChannel);
// channelsRouter.post("/:id/unarchive", channels.unarchiveChannel);
// channelsRouter.post("/:id/typing_indicator", channels.typingIndicator);
// channelsRouter.post("/:id/reset_typing", channels.resetTyping);

const directsRouter = express.Router();
// directsRouter.use(authMiddleware);
// directsRouter.post("/", directs.createDirect);
// directsRouter.post("/:id/close", directs.closeDirect);
// directsRouter.post("/:id/typing_indicator", directs.typingIndicator);
// directsRouter.post("/:id/reset_typing", directs.resetTyping);

const workspacesRouter = express.Router();
workspacesRouter.use(authMiddleware);
workspacesRouter.post("/", workspaceControler.createWorkSpace);
// workspacesRouter.post("/:id", workspaces.updateWorkspace);
// workspacesRouter.delete("/:id", workspaces.deleteWorkspace);
// workspacesRouter.post("/:id/members", workspaces.addTeammate);
// workspacesRouter.delete("/:id/members/:userId", workspaces.deleteTeammate);

const messagesRouter = express.Router();
// messagesRouter.use(authMiddleware);
// messagesRouter.post("/", messages.createMessage);
// messagesRouter.post("/:id", messages.editMessage);
// messagesRouter.delete("/:id", messages.deleteMessage);
// messagesRouter.post("/:id/reactions", messages.editMessageReaction);

const usersRouter = express.Router();
// usersRouter.use(authMiddleware);
usersRouter.post("/signup", userController.signup);
usersRouter.post("/login", userController.signin);
// usersRouter.post("/:id", authMiddleware, users.updateUser);
usersRouter.post("/:id/presence", userController.updateLastPresence);
// usersRouter.post("/:id/read", authMiddleware, users.read);

app.use("/users", usersRouter);
app.use("/messages", messagesRouter);
app.use("/channels", channelsRouter);
app.use("/workspaces", workspacesRouter);
app.use("/directs", directsRouter);

async function startSever() {
  try {
    const mongoClient = await connectDb();
    app.listen(5000, () => {
      console.log("server is running on port 3000");
    });
  } catch (err) {
    console.log(err);
  }
}

startSever();
