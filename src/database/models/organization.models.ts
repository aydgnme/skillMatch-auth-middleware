import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema({
  organizationId: "string",
  organizationName: { type: String, required: true }, 
  headquartersAddress: { type: String, required: true }
});

const Organization = mongoose.model("organization", organizationSchema);
export default Organization;
