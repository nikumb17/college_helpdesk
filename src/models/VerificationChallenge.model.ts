import mongoose, { Schema, Types, Model } from "mongoose";
import { generatePublicId } from "../utils/generatePublicId";

export type VerificationChallengePurpose =
    | "VERIFY_HELPDESK_ID"
    | "RECOVER_HELPDESK_ID"
    | "GENERATE_HELPDESK_ID"
    | "TRACK_TICKET"
    | "SUBMIT_QUERY";

export type VerificationChallengeChannel = "EMAIL" | "SMS";

export interface IVerificationChallenge {
    _id: Types.ObjectId;
    challengeId: string;
    studentId?: Types.ObjectId;
    purpose: VerificationChallengePurpose;
    channel: VerificationChallengeChannel;
    codeHash: string;
    expiresAt: Date;
    attemptCount: number;
    consumedAt?: Date;
    createdAt: Date;
}

const verificationChallengeSchema = new Schema<IVerificationChallenge>({
    challengeId: {
        type: String,
        default: () => generatePublicId("HDC"),
        required: true,
        unique: true,
    },

    studentId: {
        type: Schema.Types.ObjectId,
        ref: "Student",
        index: true,
    },

    purpose: {
        type: String,
        enum: [
            "VERIFY_HELPDESK_ID",
            "RECOVER_HELPDESK_ID",
            "GENERATE_HELPDESK_ID",
            "TRACK_TICKET",
            "SUBMIT_QUERY",
        ],
        required: true,
    },

    channel: {
        type: String,
        enum: ["EMAIL", "SMS"],
        required: true,
    },

    codeHash: {
        type: String,
        required: true,
        select: false,
    },

    expiresAt: {
        type: Date,
        required: true,
        index: true,
    },

    attemptCount: {
        type: Number,
        default: 0,
        min: 0,
    },

    consumedAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

// Expired records may be deleted asynchronously.
// Expiry must also be checked in application logic.
verificationChallengeSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

const VerificationChallenge: Model<IVerificationChallenge> = mongoose.models.VerificationChallenge || mongoose.model<IVerificationChallenge>(
    "VerificationChallenge",
    verificationChallengeSchema
);
export default VerificationChallenge;