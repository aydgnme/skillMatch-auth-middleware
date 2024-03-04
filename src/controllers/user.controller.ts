import { config } from "@config";
import { logger, responseSender } from "@utils";
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { User, refreshToken } from "@models";
import { hash } from "@services";
import { authUserService } from "@services";
import { updateUserSchema } from "@types";

class UserController {
  internalError: string = "Internal server error";
  functionName: string = "";

  //hello world
  async hello(req: Request, res: Response) {
    this.functionName = "hello";
    res.send("hello");
  }

  // create user
  async createUser(req: Request, res: Response) {
    this.functionName = "createUser";
    if (
      !req.body.email ||
      !req.body.password ||
      !req.body.organizationName ||
      !req.body.headquartersAddress
    )
      return responseSender.sendErrorResponse(
        res,
        400,
        "All information is required."
      );
    try {
      let user: any = req.body;
      //check if user exist. return error if so.
      let alreadyExist = await User.findOne({ email: user.email });
      if (alreadyExist) {
        return responseSender.sendErrorResponse(
          res,
          409,
          "User allready exists"
        );
      }

      let hashedPassword: string;
      let tokens: any;
      let newUser: any;

      hashedPassword = await hash(user.password);
      tokens = await authUserService.authPassword(
        user.password + String(process.env.SALT_PASSWORD),
        hashedPassword,
        user
      );
      user.password = hashedPassword;
      user.accountType = config.roles.admin;
      newUser = new User(user);
      await newUser.save();

      // save reflesh token to db. calculate expiry date that is 8 days from now
      let newRefreshToken = new refreshToken({
        refreshToken: tokens.refreshToken,
        userId: newUser.userId,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      });
      await newRefreshToken.save();

      return responseSender.sendSuccessResponse(
        res,
        tokens,
        "User created successfully and verification email sent"
      );
    } catch (e: any) {
      logger.logError(this.functionName, e);
      return responseSender.sendErrorResponse(res, 500, this.internalError);
    }
  }

  // create worker
  async registrationWorker(req: Request, res: Response) {
    this.functionName = "createWorker";
    if (!req.body.email || !req.body.password || !req.body.name)
      return responseSender.sendErrorResponse(
        res,
        400,
        "All information is required."
      );
    try {
      let user: any = req.body;

      //check if user exist. return error if so.
      let alreadyExist = await User.findOne({ email: user.email });
      if (alreadyExist) {
        return responseSender.sendErrorResponse(
          res,
          409,
          "User allready exists"
        );
      }

      let hashedPassword: string;
      let tokens: any;
      let newUser: any;

      hashedPassword = await hash(user.password);
      tokens = await authUserService.authPassword(
        user.password + String(process.env.SALT_PASSWORD),
        hashedPassword,
        user
      );
      user.password = hashedPassword;
      user.accountType = config.roles.worker;
      newUser = new User(user);
      await newUser.save();

      // save reflesh token to db. calculate expiry date that is 8 days from now
      let newRefreshToken = new refreshToken({
        refreshToken: tokens.refreshToken,
        userId: newUser.userId,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      });
      await newRefreshToken.save();

      return responseSender.sendSuccessResponse(
        res,
        "User created successfully and verification email sent"
      );
    } catch (e: any) {
      logger.logError(this.functionName, e);
      return responseSender.sendErrorResponse(res, 500, this.internalError);
    }
  }

  // login user
  async loginUser(req: Request, res: Response) {
    this.functionName = "LoginUser";
    if (!req.body.email || !req.body.password)
      return responseSender.sendErrorResponse(
        res,
        400,
        "Email and password are required"
      );

    try {
      // check if user exists. if not, return error
      let user = req.body;
      const existingUser: any = await User.findOne({ email: user.email });
      if (!existingUser) {
        return responseSender.sendErrorResponse(res, 404, "User not found");
      }
      let tokens: any;
      // check if user is created via firebase. if so, hash uid else hash password
      if (
        existingUser.registrationMethod !== config.registrationMethods.email &&
        user.firebaseId
      ) {
        let password = user.firebaseId + String(process.env.SALT_PASSWORD);
        tokens = await authUserService.authPassword(
          password,
          existingUser.password,
          existingUser
        );
      } else {
        tokens = await authUserService.authPassword(
          user.password + String(process.env.SALT_PASSWORD),
          existingUser.password,
          existingUser
        );
      }
      return responseSender.sendSuccessResponse(
        res,
        tokens,
        "Login successful"
      );
    } catch (e: any) {
      logger.logError(this.functionName, e);
      return responseSender.sendErrorResponse(res, 500, this.internalError);
    }
  }

  // get user data
  async getUserData(req: Request, res: Response) {
    this.functionName = "getUserData";
    try {
      let userId = req.params.userId || req.body.userId;
      let user: any = await User.findOne({ userId: userId }).select(
        "-password -__v"
      );
      if (!user)
        return responseSender.sendErrorResponse(res, 404, "User not found");
      let response = { satatus: 200, data: user };
      return responseSender.sendSuccessResponse(res, response);
    } catch (e: any) {
      logger.logError(this.functionName, e);
      return responseSender.sendErrorResponse(res, 500, this.internalError);
    }
  }

  // update user data
  async updateUserData(req: Request, res: Response) {
    this.functionName = "updateUserData";
    try {
      let data = req.body;
      const { user, ...updateData } = data;
      const updatedUser: any = await User.findOneAndUpdate(
        { userId: data.user.userId },
        { $set: updateData },
        { new: true }
      );
      if (!updatedUser) {
        return responseSender.sendErrorResponse(res, 404, "User not found");
      }

      let validation = updateUserSchema.safeParse(updateData);
      if (!validation.success) {
        return responseSender.sendErrorResponse(
          res,
          400,
          validation.error.message
        );
      }
    } catch (e: any) {
      logger.logError(this.functionName, e);
      return responseSender.sendErrorResponse(res, 500, this.internalError);
    }
  }

  // delete user
  async deleteUser(req: Request, res: Response) {
    this.functionName = "deleteUser";
    try {
      let userId = req.body.user.userId || req.params.userId;
      let result = await User.findOneAndDelete({ userId: userId });
      if (!result) {
        return responseSender.sendErrorResponse(res, 404, "User not found");
      }
      // delete refresh token
      try {
        let refleshTokens = await refreshToken.deleteMany({ userId: userId });
        if (!refleshTokens)
          console.error(`Error deleting refresh token for user ${userId}`);
      } catch (e: any) {
        console.error(e);
      }
      return responseSender.sendSuccessResponse(
        res,
        "User deleted successfully"
      );
    } catch (e: any) {
      logger.logError(this.functionName, e);
      return responseSender.sendErrorResponse(res, 500, this.internalError);
    }
  }

  // logout user
  async logoutUser(req: Request, res: Response) {
    this.functionName = "logoutUser";
    try {
      let userId = req.body.user.userId || req.params.userId;
      let result = await refreshToken.deleteMany({ userId: userId });
      if (!result) {
        return responseSender.sendErrorResponse(res, 404, "User not found");
      }
      return responseSender.sendSuccessResponse(
        res,
        "User logged out successfully"
      );
    } catch (e: any) {
      logger.logError(this.functionName, e);
      return responseSender.sendErrorResponse(res, 500, this.internalError);
    }
  }

}

export default new UserController();
