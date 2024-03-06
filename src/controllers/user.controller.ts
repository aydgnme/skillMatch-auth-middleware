import { config } from "@config";
import { logger, responseSender } from "@utils";
import e, { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { Organization, User, refreshToken } from "@models";
import { hash } from "@services";
import { authUserService } from "@services";
import { updateUserSchema } from "@types";

class UserController {
  internalError: string = "Internal server error";
  functionName: string = "";

  // Create Organization Administrator Sign-Up Endpoint
  async createOrganizationAdministrator(req: Request, res: Response) {
    this.functionName = "createOrganizationAdministrator";
    if (
      !req.body.email ||
      !req.body.password ||
      !req.body.organizationName || // Adjusted to match casing in the schema
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
          "User already exists"
        );
      }

      let hashedPassword: string;
      let tokens: any;
      let newUser: any;

      // Create Organization
      const organizationId = uuidv4(); // Generate unique organizationId
      const organizationData = {
        organizationId: organizationId,
        organizationName: user.organizationName, // Use organization name from request
        headquartersAddress: user.headquartersAddress, // Use headquarters address from request
      };
      const newOrganization = new Organization(organizationData);
      await newOrganization.save();

      hashedPassword = await hash(user.password);
      tokens = await authUserService.authPassword(
        user.password + String(process.env.SALT_PASSWORD),
        hashedPassword,
        user
      );
      user.password = hashedPassword;
      user.accountType = config.roles.admin;
      user.userId = uuidv4();
      user.organizationId = organizationId; // Assign organizationId to the user
      newUser = new User(user);
      await newUser.save();

      let newRefreshToken = new refreshToken({
        refreshToken: tokens.refreshToken,
        userId: newUser.userId,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      });

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

  // Create Organization Employee Sign-Up URL Endpoint
  async createOrganizationEmployeeSignUpURL(req: Request, res: Response) {
    this.functionName = "createOrganizationEmployeeSignUpURL";
    // Logic to generate unique sign-up URL for each organization's employees
    // Implementation based on the provided progress update
    try {
      let organizationId = req.params.organizationId;
      console.log("oID: ", organizationId);
      let employeeSignUpURL = `https://localhost:8080/signup?org=${organizationId}`;
      return res.status(200).send({
        status: 200,
        message: "Employee sign-up URL generated successfully",
        url: "<b>https://localhost:8080/signup?org=undefined</b>",
      });
    } catch (e: any) {
      logger.logError(this.functionName, e);
      return responseSender.sendErrorResponse(res, 500, this.internalError);
    }
  }

  // Implement Employee Sign-Up Endpoint
  async createEmployee(req: Request, res: Response) {
    this.functionName = "createEmployee";
    // Logic to handle employee sign-up requests
    // Implementation based on the provided progress update

    let organizationId = req.query.org;
    if (!req.body.name || !req.body.email || !req.body.password) {
      return responseSender.sendErrorResponse(
        res,
        400,
        "All information is required."
      );
    }
    try {
      // Check if organization exists
      let organization = await Organization.findOne({ _id: organizationId });
      if (!organization)
        return responseSender.sendErrorResponse(
          res,
          404,
          "Organization not found"
        );

      // Check if user exists
      let user: any = req.body;
      let alreadyExist = await User.findOne({ email: user.email });
      if (alreadyExist)
        return responseSender.sendErrorResponse(
          res,
          409,
          "User allready exists"
        );

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
      user.accountType = config.roles.employee;
      user.userId = uuidv4();
      newUser = new User(user);
      await newUser.save();

      let newRefreshToken = new refreshToken({
        refreshToken: tokens.refreshToken,
        userId: newUser.userId,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      });

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

  // Login User Endpoint
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




  
  //hello world
  async hello(req: Request, res: Response) {
    this.functionName = "hello";
    res.send("hello");
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
