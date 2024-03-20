import mongoose, {Schema} from "mongoose";


const urlSchema = new mongoose.Schema({
    organizationId: { type: Schema.Types.String, ref: 'Organizations', required: true },
    url: { type: String, required: true },
    used: { type: Boolean, required: true}
});

const Url = mongoose.model("Url", urlSchema);
export default Url;
