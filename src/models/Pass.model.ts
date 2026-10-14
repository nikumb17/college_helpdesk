import mongoose, { Schema, Types, Model } from "mongoose";
import { generatePublicId } from "../utils/generatePublicId";

export type PassStatus =
    | "ACTIVE"
    | "SUSPENDED"
    | "REVOKED";

export interface IPass {
    helpdeskId: string;
    studentId: Types.ObjectId;
    status: PassStatus;
    issuedAt: Date;
    lastVerifiedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const passSchema = new Schema<IPass>({
    helpdeskId: {
        type: String,
        required: true,
        unique: true,
        immutable: true,
        default: () => generatePublicId("HDS"),
        index: true,
    },

    studentId: {
        type: Schema.Types.ObjectId,
        ref: "Student", // Replace with your actual student model
        required: true,
        unique: true,
        immutable: true,
        index: true,
    },

    status: {
        type: String,
        enum: ["ACTIVE", "SUSPENDED", "REVOKED"],
        default: "ACTIVE",
        required: true,
    },

    issuedAt: {
        type: Date,
        default: Date.now,
        immutable: true,
    },

    lastVerifiedAt: {
        type: Date,
    },
}, { timestamps: true });

const Pass: Model<IPass> = mongoose.models.Pass || mongoose.model<IPass>("Pass", passSchema);
export default Pass;