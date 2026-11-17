import mongoose from "mongoose";
import { SPECIALIZATIONS } from "../constants.js";
const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 120,
    },
    specialization: {
        type: String,
        required: true,
        enum: SPECIALIZATIONS,
        trim: true,
    },
    hospital: {
        type: String,
        required: true,
        trim: true,
        maxlength: 160,
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        maxlength: 24,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 160,
    },
}, { timestamps: true });
// Unique email prevents duplicate doctor records.
doctorSchema.index({ email: 1 }, { unique: true });
// Filter + sort indexes used by the doctors list.
doctorSchema.index({ createdAt: -1 });
doctorSchema.index({ specialization: 1, createdAt: -1 });
doctorSchema.index({ hospital: 1, createdAt: -1 });
// Supports name-prefix searches without scanning the whole collection.
doctorSchema.index({ name: 1 });
export const Doctor = mongoose.models.Doctor ??
    mongoose.model("Doctor", doctorSchema);
//# sourceMappingURL=doctor.js.map