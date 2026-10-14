import mongoose, { Schema, Types, Model } from "mongoose";

export type TicketActorType = "STUDENT" | "STAFF" | "ADMIN";

export type TicketActivityType =
    | "TICKET_CREATED"
    | "STATUS_CHANGED"
    | "ASSIGNED"
    | "REASSIGNED"
    | "RESPONSE_ADDED"
    | "ATTACHMENT_ADDED"
    | "TICKET_CLOSED"
    | "TICKET_REOPENED";

export type ActivityVisibility = "STUDENT" | "STAFF";

export interface ITicketActivity {
    ticketObjectId: Types.ObjectId;
    activityType: TicketActivityType;
    actorType: TicketActorType;
    actorId?: Types.ObjectId;
    previousStatus?: string;
    newStatus?: string;
    message?: string;
    visibility: ActivityVisibility;
    createdAt: Date;
}

const ticketActivitySchema = new Schema<ITicketActivity>({
    ticketObjectId: {
        type: Schema.Types.ObjectId,
        ref: "Ticket",
        required: true,
        immutable: true,
    },

    activityType: {
        type: String,
        enum: [
            "TICKET_CREATED",
            "STATUS_CHANGED",
            "ASSIGNED",
            "REASSIGNED",
            "RESPONSE_ADDED",
            "ATTACHMENT_ADDED",
            "TICKET_CLOSED",
            "TICKET_REOPENED",
        ],
        required: true,
    },

    actorType: {
        type: String,
        enum: ["STUDENT", "STAFF", "ADMIN"],
        required: true,
    },

    actorId: {
        type: Schema.Types.ObjectId,
        default: null,
    },

    previousStatus: {
        type: String,
        default: null,
    },

    newStatus: {
        type: String,
        default: null,
    },

    message: {
        type: String,
        maxlength: 5000,
    },

    visibility: {
        type: String,
        enum: ["STUDENT", "STAFF"],
        default: "STAFF",
        required: true,
    },
}, { timestamps: true });

ticketActivitySchema.index({
    ticketObjectId: 1,
    createdAt: 1,
});

const TicketActivity: Model<ITicketActivity> = mongoose.models.TicketActivity || mongoose.model<ITicketActivity>(
    "TicketActivity",
    ticketActivitySchema
);

export default TicketActivity;