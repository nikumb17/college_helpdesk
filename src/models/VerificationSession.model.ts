import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type VerificationSessionPurpose = "RAISE_QUERY" | "TRACK_TICKET";

export interface IVerificationSession extends Document {
    tokenHash: string;
    studentId: Types.ObjectId;
    helpdeskProfileId: Types.ObjectId;
    purpose: VerificationSessionPurpose;
    expiresAt: Date;
    revokedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const verificationSessionSchema = new Schema<IVerificationSession>({
    tokenHash: {
        type: String,
        required: true,
        unique: true,
        immutable: true,
    },

    studentId: {
        type: Schema.Types.ObjectId,
        ref: "Student",
        required: true,
        index: true,
        immutable: true,
    },

    helpdeskProfileId: {
        type: Schema.Types.ObjectId,
        ref: "Pass",
        required: true,
        index: true,
        immutable: true,
    },

    purpose: {
        type: String,
        enum: ["RAISE_QUERY", "TRACK_TICKET"],
        required: true,
        immutable: true,
    },

    expiresAt: {
        type: Date,
        required: true,
        index: true,
    },

    revokedAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

// Automatically remove expired sessions eventually.
// Application queries must still explicitly check expiresAt.
verificationSessionSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

const VerificationSession: Model<IVerificationSession> =
    (mongoose.models.VerificationSession as
        | Model<IVerificationSession>
        | undefined) ??
    mongoose.model<IVerificationSession>(
        "VerificationSession",
        verificationSessionSchema
    );

export default VerificationSession;