import { config } from "@config";
import { logger, responseSender } from "@utils";
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { Organization, User, refreshToken, Url, passwordResetToken } from "@models";
import { authUserService, hash } from "@services";
import { updateUserSchema, UserSchema, UserType } from "@types";
import crypto from "crypto";

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

      //check if organization exist. return error if so.
      let organization = req.body;
      let allready = await Organization.findOne({
        organizationName: organization.organizationName,
      });
      if (allready) {
        return responseSender.sendErrorResponse(
          res,
          409,
          "Organization already exists"
        );
      }
      // Create Organization
      let organizationId = uuidv4(); // Generate unique organizationId
      let organizationData = {
        organizationId: organizationId,
        organizationName: user.organizationName, // Use organization name from request
        headquartersAddress: user.headquartersAddress, // Use headquarters address from request
      };
      let newOrganization = new Organization(organizationData);
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

      // Save the new refresh token
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

  // Create Organization Employee Sign-Up URL Endpoint
  async createOrganizationEmployeeSignUpURL(req: Request, res: Response) {
    this.functionName = "createOrganizationEmployeeSignUpURL";
    try {
      let organization: any = req.body;
      let foundOrganization = await Organization.findOne({
        organizationName: organization.organizationName,
      });
      if (!foundOrganization) {
        return responseSender.sendErrorResponse(
          res,
          404,
          "Organization not found"
        );
      }

      let url =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

      // Url modelini oluştururken organizationId ve url alanlarını belirtiyoruz
      await Url.create({
        organizationId: foundOrganization.organizationId,
        url,
        used: false,
      });

      //url = `${url}
      return res.send({
        url,
      });
    } catch (e: any) {
      logger.logError(this.functionName, e);
      console.log(req.body);
      return responseSender.sendErrorResponse(res, 500, this.internalError);
    }
  }

  // Create Organization Employee Sign-Up Endpoint
  async createEmployeeWithSignUpURL(
    req: Request,
    res: Response,
    signUpURL: string
  ) {
    this.functionName = "createEmployeeWithSignUpURL";
    try {
      // Extract employee information from request body
      const { name, email, password, organizationId } = req.body;

      // Check if organizationId is provided
      if (!organizationId) {
        return responseSender.sendErrorResponse(
          res,
          400,
          "Organization ID is required"
        );
      }

      // Check if the organization exists
      let organization = await Organization.findOne({ organizationId });
      if (!organization) {
        return responseSender.sendErrorResponse(
          res,
          404,
          "Organization not found"
        );
      }

      let user: any = req.body;
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
      // Create new User instance (assuming User model represents employees)
      hashedPassword = await hash(user.password);
      tokens = await authUserService.authPassword(
        user.password + String(process.env.SALT_PASSWORD),
        hashedPassword,
        user
      );

      user.password = hashedPassword;
      user.accountType = config.roles.employee;
      user.userId = uuidv4();
      user.organizationId = organizationId;
      user.headquartersAddress = organization.headquartersAddress;
      user.organizationName = organization.organizationName;
      newUser = new User(user);
      await newUser.save();

      let newRefreshToken = new refreshToken({
        refreshToken: tokens.refreshToken,
        userId: newUser.userId,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      });

      // Mark the URL as used in the database
      await Url.findOneAndUpdate({ url: signUpURL }, { used: true });

      // Return success response
      return res.status(201).send({
        status: 201,
        message: "Employee signed up successfully",
        employee: newUser,
      });
    } catch (error: any) {
      logger.logError(this.functionName, error);
      return responseSender.sendErrorResponse(
        res,
        500,
        "Error signing up employee"
      );
    }
  }

  // Get User Data Endpoint
  async getUserData(req: Request, res: Response) {
    this.functionName = "getUserData";
    try {
      let userId = req.params.userId || req.body.user.userId;
      let user: any = await User.findOne({ userId: userId }).select(
        "-password"
      );
      if (!user) {
        return responseSender.sendErrorResponse(res, 404, "User not found");
      }
      let response = {
        status: 200,
        message: "User data retrieved",
        data: user,
      };
      return responseSender.sendSuccessResponse(res, response);
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

  // Delete User Endpoint
  async deleteUser(req: Request, res: Response) {
    this.functionName = "deleteUser";
    try {
      let userId = req.params.userId || req.body.user.userId;
      let result = await User.findOneAndDelete({ userId: userId });
      if (!result) {
        return responseSender.sendErrorResponse(res, 404, "User not found");
      }
      //delete all refresh tokens for user
      try {
        let refreshTokens = await refreshToken.deleteMany({ userId: userId });
        if (!refreshTokens)
          console.error(`Error deleting refresh token for user ${userId}`);
      } catch (e: any) {
        logger.logError(this.functionName, e);
        console.error(e);
      }
      return responseSender.sendSuccessResponse(
        res,
        "",
        "User deleted successfully"
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

  // update user data
  async updateUserData(req: Request, res: Response) {
    this.functionName = "updateUserData";
    try {
      let userId = req.params.userId; // Extract the userId from the URL parameters
      let updateData = req.body; // Get the update data from the request body

      // Update the user data based on userId
      let updatedUser: any = await User.findOneAndUpdate(
        { userId: userId }, // Find the user by userId
        { $set: updateData }, // Set the update data
        { new: true } // Return the updated document
      );

      if (!updatedUser) {
        return responseSender.sendErrorResponse(res, 404, "User not found");
      }

      // Validate the updated data if needed
      let validation = updateUserSchema.safeParse(updateData);
      if (!validation.success) {
        return responseSender.sendErrorResponse(
          res,
          400,
          validation.error.message
        );
      }

      // Return success response with the updated user data
      return res.status(200).json(updatedUser);
    } catch (e: any) {
      logger.logError(this.functionName, e);
      return responseSender.sendErrorResponse(res, 500, this.internalError);
    }
  }

  // forgotPassword
  async forgotPassword(req: Request, res: Response) {
    this.functionName = "forgotPassword";
    try {
      let email = req.body.email;
      let user = await User.findOne({ email: email });

      if (!user) {
        return responseSender.sendErrorResponse(res, 404, "User not found");
      }

      let token = crypto.randomBytes(20).toString("hex");
      let expires = new Date(Date.now() + 3600000); // Token expires in 1 hour

      // Save the token to the database
      const resetToken = new passwordResetToken({
        token,
        userId: user._id,
        expires,
      });
      await resetToken.save();

      res
        .status(200)
        .json({ message: "Password reset instructions sent to your email" });
    } catch (error) {
      console.error("Error requesting password reset:", error);
      res.status(500).json({ message: "Error requesting password reset" });
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
