import { Response } from "express";

class ResponseHandler {
    sendSuccessResponse(res: Response, data?: any, message?: string) {
        return res.status(200).send({
            status: 200,
            message,
            ...data,
        });
    }
    sendErrorResponse(res: Response, status: number, message: string) {
        return res.status(status).send({
            status: status,
            message: message,
        });
    }
}

export default new ResponseHandler();