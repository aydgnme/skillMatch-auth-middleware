import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  userId: "string",
  name: "string",
  email: "string",
  password: { type: "string", default: null },
  organizationName: { type: "string", required: true },
  headquartersAddress: { type: "string", required: true },
  // Role == accountType
  accountType: { type: "string", default: "worker" },
});

const User = mongoose.model("user", userSchema);
export default User;
