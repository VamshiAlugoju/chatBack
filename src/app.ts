import express, { Request, Response, Express, Router, NextFunction } from "express";
import cors from "cors";
import connectDb from "./config/dbConfig";
import * as userController from "./controllers/userController";
import { authMiddleware } from "./middleware/authMiddleware";
import * as channels from "./controllers/channelController";
import * as messages from "./controllers/messageController";
import * as workspaceControler from "./controllers/workSpaceController";
const app = express();

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());
app.use(cors());

app.use((req :Request , res:Response , next : NextFunction)=>{

  console.log( req.originalUrl , `method : ${req.method}`)
  return next()
})

const channelsRouter = express.Router();
channelsRouter.use(authMiddleware);
channelsRouter.get("/:workspace_id", channels.getAllChanells);
channelsRouter.post("/", channels.createChannel);
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
workspacesRouter.get("/", workspaceControler.getAllWorkspaces);
// workspacesRouter.post("/:id", workspaces.updateWorkspace);
// workspacesRouter.delete("/:id", workspaces.deleteWorkspace);
// workspacesRouter.post("/:id/members", workspaces.addTeammate);
// workspacesRouter.delete("/:id/members/:userId", workspaces.deleteTeammate);

const messagesRouter = express.Router();
// messagesRouter.use(authMiddleware);
messagesRouter.post("/", messages.createMessage);
// messagesRouter.post("/:id", messages.editMessage);
// messagesRouter.delete("/:id", messages.deleteMessage);
// messagesRouter.post("/:id/reactions", messages.editMessageReaction);

const usersRouter = express.Router();
usersRouter.post("/signup", userController.signup);
usersRouter.post("/login", userController.signin);
// usersRouter.use(authMiddleware);
usersRouter.use("/token", authMiddleware, userController.getUserByToken);
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
      console.log("server is running on port 5000");
    });
  } catch (err) {
    console.log(err);
  }
}

startSever();

app.use("/test", (req : Request, res : Response) => {
  return res.send("hello");
});
