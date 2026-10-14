import mongoose, { Schema, Types } from "mongoose";

export type ResponseActorType = "STUDENT" | "STAFF";

export type ResponseVisibility = "STUDENT" | "STAFF";

export interface ITicketResponse {
    ticketObjectId: Types.ObjectId;
    actorType: ResponseActorType;
    actorId: Types.ObjectId;
    message: string;
    visibility: ResponseVisibility;
    attachments?: {
        name: string;
        url: string;
        mimeType?: string;
        size?: number;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const ticketResponseSchema = new Schema<ITicketResponse>(
    {
        ticketObjectId: {
            type: Schema.Types.ObjectId,
            ref: "Ticket",
            required: true,
            index: true,
        },

        actorType: {
            type: String,
            enum: ["STUDENT", "STAFF"],
            required: true,
        },

        actorId: {
            type: Schema.Types.ObjectId,
            required: true,
        },

        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 5000,
        },

        visibility: {
            type: String,
            enum: ["STUDENT", "STAFF"],
            required: true,
            default: "STUDENT",
        },

        attachments: [
            {
                name: {
                    type: String,
                    required: true,
                },
                url: {
                    type: String,
                    required: true,
                },
                mimeType: String,
                size: {
                    type: Number,
                    min: 0,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

ticketResponseSchema.index({
    ticketObjectId: 1,
    createdAt: 1,
});

const TicketResponse =
    mongoose.models.TicketResponse ||
    mongoose.model<ITicketResponse>(
        "TicketResponse",
        ticketResponseSchema
    );

export default TicketResponse;