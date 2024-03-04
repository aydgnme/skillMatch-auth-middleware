import { Router } from "express";
import { config } from "@config";
import { userController } from "@controllers"
import { authToken } from "middleware";


// initialize user router
let userRouter = Router();


// endpoint to create new user
userRouter.post("/register", (req, res) => userController.createUser(req, res));

// endpoint to login user
userRouter.post("/login", (req, res) => userController.loginUser(req, res));

// endpoint to create new worker
userRouter.post("/Register-worker/:organizationLink", (req, res) => userController.registrationWorker(req, res));


// endpoint to get user data. needs access token in header
userRouter.get("/:userId", (req, res) => userController.getUserData(req, res));

// update to update user data as admin.
userRouter.put("/:userId", (req, res) => userController.updateUserData(req, res));

//  update user data.
userRouter.put("/", (req, res) => userController.updateUserData(req, res));

// endpoint to delete role.
//userRouter.delete("/deleteRole/:userId", (req, res) => userController.deleteRole(req, res));


/*
// endpoint to get user data as admin
userRouter.get("/:userId", (req, res) => userController.getUserData(req, res));

//  update user data.
userRouter.put("/", (req, res) => userController.updateUserData(req, res));



// endpoint to delte user. called by user with authentification token. check token and get user Id and delete user.
userRouter.delete("/delete", (req, res) => userController.deleteUser(req, res));
*/

userRouter.get('/hello', (req, res) => 
    userController.hello(req, res)
);

export default userRouter;