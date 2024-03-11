import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  userId: { type: String },
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, default: null },
  organizationName: { type: String, required: true },
  headquartersAddress: { type: String, required: true },
  accountType: { type: String, default: "employee" },
  employeeSkillsId: { type: String },
});

const User = mongoose.model("User", userSchema);
export default User;
