import jsonwebtoken from "jsonwebtoken";
import { config } from "@config";
import { logger } from "@utils";

// Generate access token for 1 dat

class JWT {
    internelError = {
        status: 500,
        message: "Internal server error",
    };
    functionName: string = "";
    generateAccessJWT(user:any | { name : string }) {
        this.functionName = "generateAccessJWT";
        try {
            let userToGenerateAccessToken = {
                userId: user.userId,
                email: user.email,
                role: user.role,
            };
            const accessToken = jsonwebtoken.sign(
                {
                    user: userToGenerateAccessToken,
                    tokenType: config.tokenTypes.access,
                },
                String(process.env.ACCESS_TOKEN_SECRET),
                {
                    expiresIn: config.tokenExpirations.access,
                }
            );
            return accessToken;
        } catch (e: any) {
            logger.logError(this.functionName, e);
            return this.internelError;
        }
    }

    // gerate refresh token for 14 days

    generateRefreshJWT(user: any | { name: string }) {
        this.functionName = "generateRefreshJWT";
        try {
            // use only necessary data to generate refresh token
            let userToGenerateRefreshToken = {
                userId: user.userId,
                email: user.email,
                role: user.role,
            };
            const refreshToken = jsonwebtoken.sign(
                {
                    user: userToGenerateRefreshToken,
                    tokenType: config.tokenTypes.refresh,
                },
                String(process.env.REFRESH_TOKEN_SECRET),
                {expiresIn: config.tokenExpirations.refresh}
            );
            return refreshToken;
        } catch (e: any) {
            logger.logError(this.functionName, e);
            return this.internelError;
        }
    }
}

export default new JWT();