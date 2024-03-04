import mongoose from "mongoose";

const passwordResetTokenSchema = new mongoose.Schema({
  token: "string",
  userId: "string",
  expires: "date",
});

const passwordResetToken = mongoose.model(
  "passwordResetToken",
  passwordResetTokenSchema
);

export default passwordResetToken;