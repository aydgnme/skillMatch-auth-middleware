import mongoose from "mongoose";

const roleModel = new mongoose.Schema({
  roleId: "string",
  name: "string",
});

const Role = mongoose.model("role", roleModel);
export default Role;
