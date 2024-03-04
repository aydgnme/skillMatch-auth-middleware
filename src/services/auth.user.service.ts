import bcrypt from "bcrypt";
import jwt from "./jwt.service";
import { logger } from "@utils";

class AuthUser {
    functionName: string = "";
    async authPassword(password: string, hashedPassword: string, user: any) {
        this.functionName = "authPassword";
        let validPassword = await bcrypt.compare(password, hashedPassword);
        if (validPassword) {
            try {
                const accessToken = jwt.generateAccessJWT(user);
                const refreshToken = jwt.generateRefreshJWT(user);
                return { accessToken, refreshToken };
            } catch (e: any) {
                logger.logError(this.functionName, e);
                return { status: 500, message: "Internal server error" };
            }
        } else {
            return { status: 401, message: "Incorrect password" };
        }
    }
}

export default new AuthUser();