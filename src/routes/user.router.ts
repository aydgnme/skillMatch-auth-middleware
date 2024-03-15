import { Router, Request, Response } from "express";
import { config } from "@config";
import { userController } from "@controllers";
import { authToken } from "middleware";
import bodyParser from "body-parser"; // Import body-parser

// initialize user router
let userRouter = Router();

// Use body-parser middleware
userRouter.use(bodyParser.json());

// endpoint to Create Organization Administrator
userRouter.post(
  "/createOrganizationAdministrator",
  (req: Request, res: Response) =>
    userController.createOrganizationAdministrator(req, res)
);

// endpoint to Create Organization Employee SignUp URL
userRouter.post(
  "/createEmployeeSignUpURL",
  (req: Request, res: Response) =>
    userController.createOrganizationEmployeeSignUpURL(req, res)
);

userRouter.post("/register/:signUpURL", (req, res) =>
  userController.createEmployeeWithSignUpURL(req, res, req.params.signUpURL)
);

// endpoint to login user
userRouter.post("/login", (req: Request, res: Response) =>
  userController.loginUser(req, res)
);

// endpoint to get user data as admin
userRouter.get("/:userId", (req: Request, res: Response) =>
  userController.getUserData(req, res)
);

// endpoint to get user data. needs access token in header
userRouter.get("/", authToken, (req: Request, res: Response) =>
  userController.getUserData(req, res)
);

// update to update user data as admin.
userRouter.put("/:userId", (req: Request, res: Response) =>
  userController.updateUserData(req, res)
);

//  update user data.
userRouter.put("/", (req: Request, res: Response) =>
  userController.updateUserData(req, res)
);

// endpoint for admin to delete user. userId of user to delete is passed as parameter.
userRouter.delete("/:userId", (req: Request, res: Response) =>
  userController.deleteUser(req, res)
);

// endpoint to delte user. called by user with authentification token. check token and get user Id and delete user.
userRouter.delete("/delete", authToken, (req: Request, res: Response) =>
  userController.deleteUser(req, res)
);

// endpoint to get user data as admin
userRouter.get("/:userId", (req: Request, res: Response) =>
  userController.getUserData(req, res)
);

//  update user data.
userRouter.put("/", (req: Request, res: Response) =>
  userController.updateUserData(req, res)
);

// Forgot password
userRouter.post("/forgotPassword", (req: Request, res: Response) =>
  userController.forgotPassword(req, res)
);

userRouter.get("/hello", (req: Request, res: Response) =>
  userController.hello(req, res)
);

export default userRouter;
