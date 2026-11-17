import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 120,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        maxlength: 160,
    },
    passwordHash: {
        type: String,
        required: true,
        select: false,
    },
    role: {
        type: String,
        enum: ["admin"],
        default: "admin",
    },
}, { timestamps: true });
export const User = mongoose.models.User ??
    mongoose.model("User", userSchema);
//# sourceMappingURL=user.js.map