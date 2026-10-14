import connectDb from "@/db/ConfigDb";
import { NextRequest, NextResponse } from "next/server";
import { isStaffValid } from "./auth.controller";
import { ApiError } from "@/utils/ApiError.util";
import User from "@/models/User.model";
import Ticket from "@/models/Ticket.model";
import TicketResponse from "@/models/TicketResponse.model";
import TicketActivity from "@/models/TicketActivity.model";
import mongoose from "mongoose";

type ResponseVisibility = "STUDENT" | "STAFF";

// POST /api/v1/helpdesk/staff/tickets/info/response/create?ticketId=<ticketId>
export const addStaffTicketResponse = async (
    request: NextRequest
) => {
    await connectDb();

    const user = await isStaffValid(request);

    const activeStaff = await User.findOne({
        _id: user._id,
        role: "STAFF",
        isActive: true,
    }).select("_id departmentId");

    if (!activeStaff) {
        throw new ApiError("UNAUTHORIZED");
    }

    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get("ticketId")?.trim();

    if (!ticketId) {
        throw new ApiError("MISSING_REQUIRED_FIELDS");
    }

    const body = await request.json();

    const message =
        typeof body.message === "string" ? body.message.trim() : "";

    const visibility = body.visibility;

    if (!message || message.length > 5000) {
        throw new ApiError("MISSING_REQUIRED_FIELDS");
    }

    if (
        visibility !== "STUDENT" &&
        visibility !== "STAFF"
    ) {
        throw new ApiError("MISSING_REQUIRED_FIELDS");
    }

    let createdResponse: any = null;

    // Staff can respond only to tickets assigned to them.
    const ticket = await Ticket.findOne({
        ticketId,
        assignedTo: activeStaff._id,
        ...(activeStaff.departmentId
            ? {
                assignedDepartment:
                    activeStaff.departmentId,
            }
            : {}),
    });

    if (!ticket) {
        throw new ApiError("TICKET_NOT_FOUND");
    }

    if (
        ticket.status === "CLOSED" ||
        ticket.status === "REJECTED"
    ) {
        throw new ApiError("INVALID_TICKET_STATUS");
    }

    const [response] = await TicketResponse.create(
        [
            {
                ticketObjectId: ticket._id,
                actorType: "STAFF",
                actorId: activeStaff._id,
                message,
                visibility,
            },
        ],
    );

    await TicketActivity.create(
        [
            {
                ticketObjectId: ticket._id,
                activityType: "RESPONSE_ADDED",
                actorType: "STAFF",
                actorId: activeStaff._id,
                message:
                    visibility === "STAFF"
                        ? "An internal note was added."
                        : "A reply was sent to the student.",
                visibility: "STAFF",
            },
        ],
    );

    createdResponse = response;

    return NextResponse.json(
        {
            success: true,
            message:
                visibility === "STAFF"
                    ? "Internal note added successfully."
                    : "Reply sent successfully.",
            response: {
                _id: createdResponse._id,
                ticketObjectId:
                    createdResponse.ticketObjectId,
                actorType: createdResponse.actorType,
                actorId: createdResponse.actorId,
                message: createdResponse.message,
                visibility: createdResponse.visibility,
                attachments: createdResponse.attachments,
                createdAt: createdResponse.createdAt,
            },
        },
        { status: 201 }
    );
};

// POST /api/v1/helpdesk/staff/tickets/info/resolve?ticketId=<ticketId>
export const resolveStaffTicket = async (
    request: NextRequest
) => {
    const user = await isStaffValid(request);

    const activeStaff = await User.findOne({
        _id: user._id,
        role: "STAFF",
        isActive: true,
    }).select("_id departmentId");

    if (!activeStaff) {
        throw new ApiError("UNAUTHORIZED");
    }

    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get("ticketId")?.trim();

    if (!ticketId) {
        throw new ApiError("MISSING_REQUIRED_FIELDS");
    }

    const body = await request.json();

    const resolution =
        typeof body.resolution === "string"
            ? body.resolution.trim()
            : "";

    if (!resolution || resolution.length > 5000) {
        throw new ApiError("MISSING_REQUIRED_FIELDS");
    }

    let resolvedTicket: {
        _id: mongoose.Types.ObjectId;
        ticketId: string;
        status: string;
        updatedAt?: Date;
    } | null = null;

    let finalResponse: any = null;

    const ticket = await Ticket.findOne({
        ticketId,
        assignedTo: activeStaff._id,
        ...(activeStaff.departmentId
            ? {
                assignedDepartment:
                    activeStaff.departmentId,
            }
            : {}),
    });

    if (!ticket) {
        throw new ApiError("TICKET_NOT_FOUND");
    }

    if (ticket.status !== "IN_PROGRESS") {
        throw new ApiError("INVALID_TICKET_STATUS");
    }

    const previousStatus = ticket.status;

    // Save the final resolution as a ticket response.
    const [response] = await TicketResponse.create(
        [
            {
                ticketObjectId: ticket._id,
                actorType: "STAFF",
                actorId: activeStaff._id,
                message: resolution,
                visibility: "STUDENT",
            },
        ],
    );

    // Update the ticket workflow state.
    ticket.status = "RESOLVED";
    await ticket.save();

    // Record the status transition in the audit timeline.
    await TicketActivity.create(
        [
            {
                ticketObjectId: ticket._id,
                activityType: "STATUS_CHANGED",
                actorType: "STAFF",
                actorId: activeStaff._id,
                previousStatus,
                newStatus: "RESOLVED",
                message: "Ticket resolved.",
                visibility: "STUDENT",
            },
        ],
    );

    finalResponse = {
        _id: response._id,
        ticketObjectId: response.ticketObjectId,
        actorType: response.actorType,
        actorId: response.actorId,
        message: response.message,
        visibility: response.visibility,
        createdAt: response.createdAt,
    };

    resolvedTicket = {
        _id: ticket._id,
        ticketId: ticket.ticketId,
        status: ticket.status,
        updatedAt: ticket.updatedAt,
    };

    return NextResponse.json(
        {
            success: true,
            message: "Ticket resolved successfully.",
            ticket: resolvedTicket,
            response: finalResponse,
        },
        { status: 200 }
    );
};