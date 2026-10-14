import mongoose, { Schema, Types, Model } from "mongoose";
import { generatePublicId } from "../utils/generatePublicId";

export type TicketStatus =
    | "SUBMITTED"
    | "UNDER_REVIEW"
    | "IN_PROGRESS"
    | "WAITING_FOR_STUDENT"
    | "RESOLVED"
    | "CLOSED"
    | "REJECTED";

export interface ITicketAttachment {
    fileName: string;
    storageKey: string;
    mimeType: string;
    size: number;
}

export interface ITicket {
    ticketId: string;
    helpdeskProfileId: Types.ObjectId;
    category: Types.ObjectId;
    subject: string;
    description: string;
    status: TicketStatus;
    priority: "LOW" | "MEDIUM" | "HIGH";
    assignedDepartment?: Types.ObjectId;
    assignedTo?: Types.ObjectId;
    assignedAt?: Date;
    attachments: ITicketAttachment[];
    submittedAt: Date;
    resolvedAt?: Date;
    closedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ticketAttachmentSchema = new Schema<ITicketAttachment>({
    fileName: {
        type: String,
        required: true,
        maxlength: 255,
    },
    storageKey: {
        type: String,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true,
        min: 1
    },
}, { _id: false });

const ticketSchema = new Schema<ITicket>({
    ticketId: {
        type: String,
        required: true,
        unique: true,
        immutable: true,
        default: () => generatePublicId("TKT"),
        index: true,
    },

    helpdeskProfileId: {
        type: Schema.Types.ObjectId,
        ref: "Pass",
        required: true,
        immutable: true,
        index: true,
    },

    category: {
        type: Schema.Types.ObjectId,
        ref: "TicketCategory",
        required: true,
    },

    subject: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 150,
    },

    description: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 10000,
    },

    status: {
        type: String,
        enum: [
            "SUBMITTED",
            "UNDER_REVIEW",
            "IN_PROGRESS",
            "WAITING_FOR_STUDENT",
            "RESOLVED",
            "CLOSED",
            "REJECTED",
        ],
        default: "SUBMITTED",
        required: true,
    },

    priority: {
        type: String,
        enum: [
            "LOW",
            "MEDIUM",
            "HIGH"
        ],
        default: "MEDIUM",
        required: true,
    },

    assignedDepartment: {
        type: Schema.Types.ObjectId,
        ref: "Department",
        default: null,
    },

    assignedTo: {
        type: Schema.Types.ObjectId,
        ref: "User", // Replace with your staff model if different
        default: null,
    },

    assignedAt: {
        type: Date,
        default: null,
    },

    attachments: {
        type: [ticketAttachmentSchema],
        default: [],
        validate: {
            validator: (items: ITicketAttachment[]) => items.length <= 5,
            message: "A maximum of 5 attachments is allowed.",
        },
    },

    submittedAt: {
        type: Date,
        default: Date.now,
        immutable: true,
    },

    resolvedAt: {
        type: Date,
        default: null,
    },

    closedAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

ticketSchema.index({
    helpdeskProfileId: 1,
    createdAt: -1,
});

ticketSchema.index({
    status: 1,
    createdAt: -1,
});

ticketSchema.index({
    assignedDepartment: 1,
    status: 1,
});

const Ticket: Model<ITicket> =
    mongoose.models.Ticket ||
    mongoose.model<ITicket>(
        "Ticket",
        ticketSchema
    );

export default Ticket;