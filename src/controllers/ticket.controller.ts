import connectDb from "@/db/ConfigDb";
import Pass from "@/models/Pass.model";
import Ticket, { TicketStatus } from "@/models/Ticket.model";
import TicketActivity from "@/models/TicketActivity.model";
import TicketCategory from "@/models/TicketCategory.model";
import VerificationSession from "@/models/VerificationSession.model";
import { ApiError } from "@/utils/ApiError.util";
import { generatePublicId } from "@/utils/generatePublicId";
import { generateOtp, hashOtp, hashSessionToken, MAX_OTP_ATTEMPTS, OTP_EXPIRY_MINUTES, safeCompare, SESSION_EXPIRY_MINUTES } from "@/utils/Hashing.util";
import { NextRequest, NextResponse } from "next/server";
import { isAdminValid, isDepartmentValid, isStaffValid, isUserValid } from "./auth.controller";
import mongoose from "mongoose";
import User from "@/models/User.model";
import TicketResponse from "@/models/TicketResponse.model";
import Student from "@/models/Student.model";
import VerificationChallenge from "@/models/VerificationChallenge.model";
import { sendMail } from "@/utils/MailManager.util";
import { randomBytes } from "crypto";
import Department from "@/models/Department.model";

const TICKET_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

const statusMap: Record<string, string> = {
    SUBMITTED: "open",
    UNDER_REVIEW: "pending",
    IN_PROGRESS: "in_progress",
    WAITING_FOR_STUDENT: "waiting_for_student",
    RESOLVED: "resolved",
    CLOSED: "closed",
    REJECTED: "rejected",
};

const STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
    SUBMITTED: ["UNDER_REVIEW"],
    UNDER_REVIEW: ["IN_PROGRESS", "REJECTED"],
    IN_PROGRESS: ["WAITING_FOR_STUDENT", "RESOLVED"],
    WAITING_FOR_STUDENT: ["IN_PROGRESS"],
    RESOLVED: ["CLOSED"],
    CLOSED: [],
    REJECTED: [],
};

// POST /api/v1/helpdesk/tickets
async function createTicket(request: NextRequest) {
    await connectDb();

    const sessionToken = request.cookies.get("helpdesk_verification")?.value;
    if (!sessionToken) {
        throw new ApiError("AUTHENTICATION_REQUIRED");
    }

    const tokenHash = hashSessionToken(sessionToken);
    const verificationSession = await VerificationSession.findOne({
        tokenHash,
        purpose: "RAISE_QUERY",
        expiresAt: { $gt: new Date() },
    }).select("studentId helpdeskProfileId");

    if (!verificationSession) {
        throw new ApiError("INVALID_SESSION");
    }

    const body = await request.json().catch(() => {
        throw new ApiError("INVALID_REQUEST_BODY");
    });

    const categoryValue =
        typeof body.category === "string"
            ? body.category.trim()
            : "";

    const subject =
        typeof body.subject === "string"
            ? body.subject.trim()
            : "";

    const description =
        typeof body.description === "string"
            ? body.description.trim()
            : "";

    const priority =
        typeof body.priority === "string"
            ? body.priority.trim()
            : "";

    if (!categoryValue || !subject || !description || !priority) {
        throw new ApiError("MISSING_REQUIRED_FIELDS");
    }

    const ticketCategory = await TicketCategory.findOne({ value: categoryValue }).lean();
    if (!ticketCategory) {
        throw new ApiError("INVALID_QUERY_CATEGORY");
    }

    if (
        !(TICKET_PRIORITIES as readonly string[]).includes(priority)
    ) {
        throw new ApiError("INVALID_QUERY_PRIORITY");
    }

    if (subject.length < 5 || subject.length > 120) {
        throw new ApiError("VALIDATION_ERROR");
    }

    if (description.length < 20) {
        throw new ApiError("QUERY_DESCRIPTION_TOO_SHORT");
    }

    if (description.length > 3000) {
        throw new ApiError("QUERY_DESCRIPTION_TOO_LONG");
    }

    const profile = await Pass.findOne({
        _id: verificationSession.helpdeskProfileId,
        studentId: verificationSession.studentId,
    }).select("_id");

    if (!profile) {
        throw new ApiError("STUDENT_PROFILE_NOT_FOUND");
    }

    let createdTicket: {
        ticketId: string;
        _id: unknown;
    } | null = null;

    const MAX_ID_GENERATION_ATTEMPTS = 5;

    for (
        let attempt = 0;
        attempt < MAX_ID_GENERATION_ATTEMPTS;
        attempt++
    ) {
        const ticketId = generatePublicId("TKT");

        try {
            const ticket = await Ticket.create({
                ticketId,
                helpdeskProfileId: profile._id,
                category: ticketCategory._id,
                subject,
                description,
                priority,
                status: "SUBMITTED",
            });

            // Log ticket creation in the same transaction.
            await TicketActivity.create([{
                ticketObjectId: ticket._id,
                activityType: "TICKET_CREATED",
                actorType: "STUDENT",
                actorId: verificationSession.studentId,
                newStatus: ticket.status,
                message: "Ticket created successfully.",
                visibility: "STUDENT",
            }]);

            createdTicket = {
                ticketId: ticket.ticketId,
                _id: ticket._id,
            };

            break;
        } catch (error: unknown) {
            // Retry only if the generated Ticket ID collided.
            const isDuplicateKey =
                typeof error === "object" &&
                error !== null &&
                "code" in error &&
                error.code === 11000;

            const duplicateKey = isDuplicateKey
                ? error as { keyPattern?: Record<string, number> }
                : null;

            if (
                duplicateKey?.keyPattern?.ticketId &&
                attempt < MAX_ID_GENERATION_ATTEMPTS - 1
            ) {
                continue;
            }

            if (isDuplicateKey) {
                throw new ApiError("TICKET_ALREADY_EXISTS");
            }

            throw error;
        }
    }

    if (!createdTicket) {
        throw new ApiError("TICKET_ID_GENERATION_FAILED");
    }

    return NextResponse.json({
        success: true,
        message: "Your query has been submitted successfully.",
        ticketId: createdTicket.ticketId,
    }, { status: 201 });
};

// GET /api/v1/helpdesk/department/tickets
async function getDepartmentTickets(request: NextRequest) {
    const user = await isDepartmentValid(request);
    if (!user.departmentId) {
        throw new ApiError("RECORD_NOT_FOUND");
    }
    if (!mongoose.Types.ObjectId.isValid(user.departmentId)) {
        throw new ApiError("RECORD_NOT_FOUND");
    }

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = Math.max(
        1,
        Number.parseInt(searchParams.get("page") ?? "1", 10) || 1
    );

    const limit = Math.min(
        50,
        Math.max(
            1,
            Number.parseInt(searchParams.get("limit") ?? "10", 10) || 10
        )
    );

    const skip = (page - 1) * limit;

    // Optional filters
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const assignment = searchParams.get("assignment");
    const search = searchParams.get("search")?.trim();

    const allowedStatuses = [
        "SUBMITTED",
        "UNDER_REVIEW",
        "IN_PROGRESS",
        "WAITING_FOR_STUDENT",
        "RESOLVED",
        "CLOSED",
        "REJECTED",
    ];

    const allowedPriorities = ["LOW", "MEDIUM", "HIGH"];

    if (status && !allowedStatuses.includes(status)) {
        throw new ApiError("VALIDATION_ERROR");
    }

    if (priority && !allowedPriorities.includes(priority)) {
        throw new ApiError("VALIDATION_ERROR");
    }

    if (
        assignment &&
        !["ASSIGNED", "UNASSIGNED"].includes(assignment)
    ) {
        throw new ApiError("VALIDATION_ERROR");
    }

    // Always scope the query to the authenticated department.
    const filter: Record<string, unknown> = {
        assignedDepartment: user.departmentId,
    };

    if (status) {
        filter.status = status;
    }

    if (priority) {
        filter.priority = priority;
    }

    if (category) {
        filter.category = category;
    }

    if (assignment === "ASSIGNED") {
        filter.assignedTo = { $ne: null };
    } else if (assignment === "UNASSIGNED") {
        filter.$or = [
            { assignedTo: null },
            { assignedTo: { $exists: false } },
        ];
    }

    if (search) {
        const escapedSearch = search.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

        const searchRegex = new RegExp(escapedSearch, "i");

        const searchConditions = [
            { ticketId: searchRegex },
            { subject: searchRegex },
            { category: searchRegex },
        ];

        if (filter.$or) {
            // Preserve the existing unassigned condition.
            filter.$and = [
                { $or: filter.$or },
                { $or: searchConditions },
            ];
            delete filter.$or;
        } else {
            filter.$or = searchConditions;
        }
    }

    const [tickets, total] = await Promise.all([
        Ticket.aggregate([
            // Filter tickets first.
            {
                $match: filter,
            },

            // Sort by creation date.
            {
                $sort: {
                    createdAt: -1,
                },
            },

            // Join HelpdeskProfile.
            {
                $lookup: {
                    from: "passes",
                    localField: "helpdeskProfileId",
                    foreignField: "_id",
                    as: "pass",
                },
            },
            {
                $unwind: {
                    path: "$pass",
                    preserveNullAndEmptyArrays: true,
                },
            },

            // Join Member through Pass.studentId.
            {
                $lookup: {
                    from: "students",
                    localField: "pass.studentId",
                    foreignField: "_id",
                    as: "student",
                },
            },
            {
                $unwind: {
                    path: "$student",
                    preserveNullAndEmptyArrays: true,
                },
            },

            // Join assigned staff.
            {
                $lookup: {
                    from: "users",
                    localField: "assignedTo",
                    foreignField: "_id",
                    as: "assignedStaff",
                },
            },
            {
                $unwind: {
                    path: "$assignedStaff",
                    preserveNullAndEmptyArrays: true,
                },
            },

            // Apply pagination.
            {
                $skip: skip,
            },
            {
                $limit: limit,
            },

            // Return only fields required by the frontend.
            {
                $project: {
                    _id: 1,
                    ticketId: 1,
                    subject: 1,
                    description: 1,
                    category: 1,
                    priority: 1,
                    status: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    departmentId: 1,

                    student: {
                        $cond: [
                            { $ifNull: ["$student._id", false] },
                            {
                                name: {
                                    $trim: {
                                        input: {
                                            $concat: [
                                                {
                                                    $ifNull: [
                                                        "$student.firstName",
                                                        "",
                                                    ],
                                                },
                                                " ",
                                                {
                                                    $ifNull: [
                                                        "$student.lastName",
                                                        "",
                                                    ],
                                                },
                                            ],
                                        },
                                    },
                                },
                                enrollmentNumber:
                                    "$student.enrollmentNumber",
                            },
                            null,
                        ],
                    },

                    assignedTo: {
                        $cond: [
                            {
                                $ifNull: [
                                    "$assignedStaff._id",
                                    false,
                                ],
                            },
                            {
                                _id: "$assignedStaff._id",
                                name: "$assignedStaff.name",
                                email: "$assignedStaff.email",
                            },
                            null,
                        ],
                    },
                },
            },
        ]),

        Ticket.countDocuments(filter),
    ]);

    const formattedTickets = tickets;

    return NextResponse.json(
        {
            success: true,
            message: "Department tickets fetched successfully.",
            payload: {
                tickets: formattedTickets,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: page * limit < total,
                    hasPreviousPage: page > 1,
                },
            },
        },
        { status: 200 }
    );
};

// POST /api/v1/helpdesk/department/tickets/assignment?ticketId="..."
async function assignTicket(request: NextRequest) {
    const departmentHead = await isDepartmentValid(request);

    const searchParams = request.nextUrl.searchParams;
    const ticketId = searchParams?.get("ticketId");

    if (!departmentHead.departmentId) {
        throw new ApiError("RECORD_NOT_FOUND");
    }

    if (!ticketId?.trim()) {
        throw new ApiError("INVALID_REQUEST_BODY");
    }

    const { assignedTo } = await request.json();

    if (
        typeof assignedTo !== "string" ||
        !mongoose.isValidObjectId(assignedTo)
    ) {
        throw new ApiError("INVALID_REQUEST_BODY");
    }

    let updatedTicket: any = null;

    // Only allow assignment of tickets belonging to this department.
    const ticket = await Ticket.findOne({
        ticketId,
        assignedDepartment: departmentHead.departmentId,
    });

    if (!ticket) {
        throw new ApiError("TICKET_NOT_FOUND");
    }

    if (["CLOSED", "REJECTED"].includes(ticket.status)) {
        throw new ApiError("INVALID_TICKET_STATUS");
    }

    // The selected staff member must be active and belong
    // to the same department as the department head.
    const staff = await User.findOne({
        _id: assignedTo,
        role: "STAFF",
        departmentId: departmentHead.departmentId,
        isActive: true,
    })
        .select("_id name email");

    if (!staff) {
        throw new ApiError("RECORD_NOT_FOUND");
    }

    const previousAssignedTo = ticket.assignedTo
        ? ticket.assignedTo.toString()
        : null;

    // Avoid creating duplicate activity for the same assignment.
    if (previousAssignedTo === staff._id.toString()) {
        updatedTicket = ticket;
        return;
    }

    ticket.assignedTo = staff._id;
    ticket.assignedAt = new Date();

    await ticket.save();

    await TicketActivity.create(
        [
            {
                ticketObjectId: ticket._id,
                activityType: previousAssignedTo
                    ? "REASSIGNED"
                    : "ASSIGNED",
                actorType: "STAFF",
                actorId: departmentHead._id,
                message: previousAssignedTo
                    ? `Ticket reassigned to ${staff.name} by the department head.`
                    : `Ticket assigned to ${staff.name} by the department head.`,
                visibility: "STAFF",
            },
        ],
    );

    updatedTicket = ticket;

    const populatedTicket = await Ticket.findById(
        updatedTicket._id
    ).populate({
        path: "assignedTo",
        select: "_id name email",
    });

    return NextResponse.json(
        {
            success: true,
            message: "Ticket assignment updated successfully.",
            ticket: populatedTicket,
        },
        { status: 200 }
    );
};

// GET /api/v1/helpdesk/staff/tickets
async function getStaffTickets(request: NextRequest) {
    const activeStaff = await isUserValid(request);

    // Only staff members can access this endpoint.
    if (activeStaff.role !== "STAFF") {
        throw new ApiError("FORBIDDEN");
    }

    if (!activeStaff) {
        throw new ApiError("UNAUTHORIZED");
    }

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() ?? "";
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");

    const page = Math.max(
        1,
        Number.parseInt(searchParams.get("page") ?? "1", 10) || 1
    );

    const limit = Math.min(
        100,
        Math.max(
            1,
            Number.parseInt(searchParams.get("limit") ?? "10", 10) || 10
        )
    );

    const filter: Record<string, any> = {
        assignedTo: activeStaff._id,
    };

    if (activeStaff.departmentId) {
        filter.assignedDepartment = activeStaff.departmentId;
    }

    const allowedStatuses = [
        "SUBMITTED",
        "UNDER_REVIEW",
        "IN_PROGRESS",
        "WAITING_FOR_STUDENT",
        "RESOLVED",
        "CLOSED",
        "REJECTED",
    ];

    const allowedPriorities = ["LOW", "MEDIUM", "HIGH"];

    if (status && status !== "ALL") {
        if (!allowedStatuses.includes(status)) {
            throw new ApiError("INVALID_REQUEST_BODY");
        }

        filter.status = status;
    }

    if (priority && priority !== "ALL") {
        if (!allowedPriorities.includes(priority)) {
            throw new ApiError("INVALID_REQUEST_BODY");
        }

        filter.priority = priority;
    }

    if (category && category !== "ALL") {
        filter.category = category;
    }

    if (search) {
        const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const searchRegex = new RegExp(escapedSearch, "i");

        filter.$or = [
            { ticketId: searchRegex },
            { subject: searchRegex },
            { category: searchRegex },
        ];
    }

    const skip = (page - 1) * limit;

    const [tickets, totalTickets] = await Promise.all([
        Ticket.aggregate([
            // Apply ticket filters first for better performance.
            {
                $match: filter,
            },

            {
                $sort: {
                    updatedAt: -1,
                    createdAt: -1,
                },
            },

            // Join HelpdeskProfile.
            {
                $lookup: {
                    from: "passes",
                    localField: "helpdeskProfileId",
                    foreignField: "_id",
                    as: "pass",
                },
            },
            {
                $unwind: {
                    path: "$pass",
                    preserveNullAndEmptyArrays: true,
                },
            },

            // Join Member through Pass.studentId.
            {
                $lookup: {
                    from: "students",
                    localField: "pass.studentId",
                    foreignField: "_id",
                    as: "student",
                },
            },
            {
                $unwind: {
                    path: "$student",
                    preserveNullAndEmptyArrays: true,
                },
            },

            // Join assigned staff.
            {
                $lookup: {
                    from: "users",
                    localField: "assignedTo",
                    foreignField: "_id",
                    as: "assignedStaff",
                },
            },
            {
                $unwind: {
                    path: "$assignedStaff",
                    preserveNullAndEmptyArrays: true,
                },
            },

            // Pagination after sorting and joins.
            {
                $skip: skip,
            },
            {
                $limit: limit,
            },

            // Return only the required fields.
            {
                $project: {
                    _id: 1,
                    ticketId: 1,
                    subject: 1,
                    description: 1,
                    category: 1,
                    priority: 1,
                    status: 1,
                    createdAt: 1,
                    updatedAt: 1,

                    assignedTo: {
                        $cond: [
                            { $ifNull: ["$assignedStaff._id", false] },
                            {
                                _id: "$assignedStaff._id",
                                name: "$assignedStaff.name",
                                email: "$assignedStaff.email",
                            },
                            null,
                        ],
                    },

                    student: {
                        $cond: [
                            { $ifNull: ["$student._id", false] },
                            {
                                _id: "$student._id",
                                name: {
                                    $trim: {
                                        input: {
                                            $concat: [
                                                { $ifNull: ["$student.firstName", ""] },
                                                " ",
                                                { $ifNull: ["$student.lastName", ""] },
                                            ],
                                        },
                                    },
                                },
                                enrollmentNumber: "$student.enrollmentNumber",
                                email: "$student.email",
                            },
                            null,
                        ],
                    },
                },
            },
        ]),

        Ticket.countDocuments(filter),
    ]);

    const formattedTickets = tickets;

    return NextResponse.json(
        {
            success: true,
            message: "Staff tickets fetched successfully.",
            payload: {
                tickets: formattedTickets,
                pagination: {
                    page,
                    limit,
                    totalTickets,
                    totalPages: Math.ceil(totalTickets / limit),
                    hasNextPage: page * limit < totalTickets,
                    hasPrevPage: page > 1,
                },
            },
        },
        { status: 200 }
    );
};

// GET /api/v1/helpdesk/staff/tickets/info?ticketId="..."
async function getStaffTicket(request: NextRequest) {
    const user = await isUserValid(request);

    const searchParams = request.nextUrl.searchParams;
    const ticketId = searchParams?.get("ticketId");

    if (user.role !== "STAFF") {
        throw new ApiError("FORBIDDEN");
    }

    const activeStaff = await User.findOne({
        _id: user._id,
        role: "STAFF",
        isActive: true,
    }).select("_id departmentId");

    if (!activeStaff) {
        throw new ApiError("UNAUTHORIZED");
    }

    if (!ticketId?.trim()) {
        throw new ApiError("INVALID_REQUEST_BODY");
    }

    const tickets = await Ticket.aggregate([
        {
            $match: {
                ticketId,
                assignedTo: activeStaff._id,
                ...(activeStaff.departmentId
                    ? { assignedDepartment: activeStaff.departmentId }
                    : {}),
            },
        },

        // Fetch the helpdesk profile associated with the ticket.
        {
            $lookup: {
                from: "passes",
                localField: "helpdeskProfileId",
                foreignField: "_id",
                as: "pass",
            },
        },
        {
            $unwind: {
                path: "$pass",
                preserveNullAndEmptyArrays: true,
            },
        },

        // Fetch the student referenced by the pass.
        {
            $lookup: {
                from: "students",
                localField: "pass.studentId",
                foreignField: "_id",
                as: "student",
            },
        },
        {
            $unwind: {
                path: "$student",
                preserveNullAndEmptyArrays: true,
            },
        },

        // Fetch the assigned staff member.
        {
            $lookup: {
                from: "users",
                localField: "assignedTo",
                foreignField: "_id",
                as: "assignedTo",
            },
        },
        {
            $unwind: {
                path: "$assignedTo",
                preserveNullAndEmptyArrays: true,
            },
        },

        // Return only the fields required by the staff ticket page.
        {
            $project: {
                _id: 1,
                ticketId: 1,
                subject: 1,
                description: 1,
                category: 1,
                priority: 1,
                status: 1,
                attachments: 1,
                resolution: 1,
                createdAt: 1,
                updatedAt: 1,

                assignedTo: {
                    _id: "$assignedTo._id",
                    name: "$assignedTo.name",
                    email: "$assignedTo.email",
                },

                student: {
                    _id: "$student._id",
                    firstName: "$student.firstName",
                    lastName: "$student.lastName",
                    enrollmentNumber: "$student.enrollmentNumber",
                    email: "$student.email",
                    contactNo: "$student.contactNo",
                    department: "$student.department",
                    year: "$student.year",
                    institution: "$student.institution",
                },
            },
        },

        { $limit: 1 },
    ]);

    const ticket = tickets[0];

    if (!ticket) {
        throw new ApiError("TICKET_NOT_FOUND");
    }

    // Fetch the audit/activity history for this ticket.
    const [activities, responses] = await Promise.all([
        TicketActivity.find({
            ticketObjectId: ticket._id,
            visibility: { $in: ["STAFF", "STUDENT"] },
        })
            .sort({ createdAt: 1 })
            .lean(),

        TicketResponse.find({
            ticketObjectId: ticket._id,
        })
            .sort({ createdAt: 1 })
            .lean(),
    ]);

    return NextResponse.json(
        {
            success: true,
            message: "Ticket details fetched successfully.",
            data: {
                ticket,
                activities,
                responses,
            },
        },
        { status: 200 }
    );
};

// POST /api/v1/helpdesk/staff/tickets/info/status?ticketId="..."
async function updateStaffTicketStatus(
    request: NextRequest
) {
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

    const { status, reason } = await request.json();
    const normalizedReason =
        typeof reason === "string" ? reason.trim() : "";

    const validStatuses: TicketStatus[] = [
        "SUBMITTED",
        "UNDER_REVIEW",
        "IN_PROGRESS",
        "WAITING_FOR_STUDENT",
        "RESOLVED",
        "CLOSED",
        "REJECTED",
    ];

    if (!status || !validStatuses.includes(status)) {
        throw new ApiError("INVALID_REQUEST_BODY");
    }

    if (status === "REJECTED" && !normalizedReason) {
        throw new ApiError("INVALID_REQUEST_BODY");
    }

    let updatedTicket: any = null;

    // Staff can modify only tickets assigned to them.
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

    const currentStatus = ticket.status as TicketStatus;

    if (
        !STATUS_TRANSITIONS[currentStatus] ||
        !STATUS_TRANSITIONS[currentStatus].includes(status)
    ) {
        throw new ApiError("INVALID_TICKET_STATUS");
    }

    const previousStatus = currentStatus;

    ticket.status = status;

    // Save the resolution explanation when provided,
    // if your Ticket schema supports a resolution field.
    if (status === "RESOLVED" && normalizedReason) {
        // ticket.resolution = normalizedReason;

    }

    await ticket.save();

    await TicketActivity.create(
        [
            {
                ticketObjectId: ticket._id,
                activityType:
                    status === "CLOSED"
                        ? "TICKET_CLOSED"
                        : "STATUS_CHANGED",
                actorType: "STAFF",
                actorId: activeStaff._id,
                previousStatus,
                newStatus: status,
                message: normalizedReason || undefined,
                visibility: "STAFF",
            },
        ],
    );

    updatedTicket = {
        _id: ticket._id,
        ticketId: ticket.ticketId,
        status: ticket.status,
        previousStatus,
        updatedAt: ticket.updatedAt,
    };

    return NextResponse.json(
        {
            success: true,
            message: "Ticket status updated successfully.",
            ticket: updatedTicket,
        },
        { status: 200 }
    );
};

// POST /api/v1/helpdesk/tickets/track/start
async function startTicketTracking(request: NextRequest) {
    await connectDb();
    const body = await request.json();

    const ticketId = body.ticketId?.trim().toUpperCase();

    if (!ticketId || !/^TKT-\d{2}-\d{6}$/.test(ticketId)) {
        throw new ApiError("INVALID_REQUEST_BODY");
    }

    const ticket = await Ticket.findOne({ ticketId })
        .select("helpdeskProfileId")
        .lean();
    if (!ticket) {
        throw new ApiError("TICKET_NOT_FOUND");
    }

    const pass = await Pass.findById(
        ticket.helpdeskProfileId
    )
        .select("studentId")
        .lean();

    if (!pass) {
        throw new ApiError("STUDENT_PROFILE_NOT_FOUND");
    }

    const student = await Student.findById(pass.studentId)
        .select("email")
        .lean();

    const email = student?.email?.trim().toLowerCase();

    const now = new Date();
    const rateWindowStart = new Date(
        now.getTime() - 15 * 60 * 1000
    );

    const recentRequests = await VerificationChallenge.countDocuments({
        studentId: student._id,
        purpose: "TRACK_TICKET",
        createdAt: { $gte: rateWindowStart },
    });

    if (recentRequests >= MAX_OTP_ATTEMPTS) {
        throw new ApiError("OTP_RATE_LIMIT_EXCEEDED");
    }

    const otp = generateOtp();

    const challengeId = crypto.randomUUID();

    const expiresAt = new Date(
        now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000
    );

    const challenge = await VerificationChallenge.create({
        challengeId,
        studentId: pass.studentId,
        channel: "EMAIL",
        purpose: "TRACK_TICKET",
        codeHash: hashOtp(challengeId, otp),
        expiresAt,
        attemptCount: 0,
    });

    // await sendOtpEmail(email, otp);

    await VerificationChallenge.updateMany(
        {
            studentId: student._id,
            purpose: "TRACK_TICKET",
            _id: { $ne: challenge._id },
            consumedAt: null,
        },
        {
            $set: { consumedAt: new Date() },
        }
    );

    const mail = await sendMail({
        type: "code",
        email: email,
        otp,
    });

    if (!mail || !mail?.mailInfo) {

        // Do not leave an active challenge if delivery fails.
        await VerificationChallenge.deleteOne({
            _id: challenge._id,
        });

        throw new ApiError("OTP_DELIVERY_FAILED");
    }

    return NextResponse.json(
        {
            success: true,
            message: "OTP sent to your registered email address.",
            data: {
                challengeId,
                maskedDestination: email,
                expiresIn: OTP_EXPIRY_MINUTES * 60,
            },
        },
        { status: 200 }
    );
};

// const ticketId = body.ticketId?.trim().toUpperCase();
async function confirmTicketTracking(
    request: NextRequest
) {
    await connectDb();

    const body = await request.json().catch(() => {
        throw new ApiError("INVALID_REQUEST_BODY");
    });

    const ticketId = body.ticketId?.trim().toUpperCase();

    const challengeId =
        typeof body.challengeId === "string"
            ? body.challengeId.trim()
            : "";

    const otp =
        typeof body.otp === "string"
            ? body.otp.trim()
            : "";

    if (!challengeId || !otp) {
        throw new ApiError("MISSING_REQUIRED_FIELDS");
    }

    if (!/^\d{6}$/.test(otp)) {
        throw new ApiError("INVALID_OTP");
    }

    const challenge = await VerificationChallenge.findOne({
        challengeId,
        purpose: "TRACK_TICKET",
    }).select(
        "_id challengeId studentId helpdeskProfileId codeHash expiresAt attemptCount consumedAt"
    );

    if (!challenge) {
        throw new ApiError("VERIFICATION_CHALLENGE_NOT_FOUND");
    }

    if (challenge.consumedAt) {
        throw new ApiError("VERIFICATION_CHALLENGE_ALREADY_USED");
    }

    if (challenge.expiresAt <= new Date()) {
        throw new ApiError("VERIFICATION_CHALLENGE_EXPIRED");
    }

    const maxAttempts = MAX_OTP_ATTEMPTS;

    if (challenge.attemptCount >= MAX_OTP_ATTEMPTS) {
        throw new ApiError("OTP_ATTEMPTS_EXCEEDED");
    }

    const submittedHash = hashOtp(challengeId, otp);

    if (!safeCompare(challenge.codeHash, submittedHash)) {
        // Atomically increment attempts only if the challenge
        // remains active and below its attempt limit.
        const updatedChallenge = await VerificationChallenge.findOneAndUpdate(
            {
                _id: challenge._id,
                purpose: "TRACK_TICKET",
                consumedAt: null,
                expiresAt: { $gt: new Date() },
                attemptCount: { $lt: MAX_OTP_ATTEMPTS },
            },
            {
                $inc: { attemptCount: 1 },
            },
            { new: true }
        ).select("attemptCount");

        if (!updatedChallenge) {
            throw new ApiError(
                "VERIFICATION_CHALLENGE_EXPIRED"
            );
        }

        if (
            updatedChallenge.attemptCount >= MAX_OTP_ATTEMPTS
        ) {
            throw new ApiError("OTP_ATTEMPTS_EXCEEDED");
        }

        throw new ApiError("INVALID_OTP");
    }

    const sessionToken = randomBytes(32).toString("hex");
    const tokenHash = hashSessionToken(sessionToken);

    const expiresAt = new Date(
        Date.now() + SESSION_EXPIRY_MINUTES * 60 * 1000
    );

    // Consume the challenge exactly once. Concurrent
    // confirmation requests cannot reuse the same OTP.
    const consumedChallenge = await VerificationChallenge.findOneAndUpdate(
        {
            _id: challenge._id,
            purpose: "TRACK_TICKET",
            codeHash: submittedHash,
            consumedAt: null,
            expiresAt: { $gt: new Date() },
            attemptCount: { $lt: maxAttempts },
        },
        {
            $set: { consumedAt: new Date() },
        },
        {
            new: true,
        }
    );

    if (!consumedChallenge) {
        throw new ApiError(
            "VERIFICATION_CHALLENGE_ALREADY_USED"
        );
    }

    // Confirm that the associated Helpdesk pass still exists.
    const pass = await Pass.findOne({
        studentId: consumedChallenge.studentId,
    }).select("_id helpdeskId")

    if (!pass) {
        throw new ApiError(
            "STUDENT_PROFILE_NOT_FOUND"
        );
    }

    const ticket = await Ticket.findOne({
        ticketId,
        helpdeskProfileId: pass._id,
    }).lean();

    if (!ticket) {
        throw new ApiError("TICKET_NOT_FOUND");
    }

    const existingSession = await VerificationSession.findOne({
        studentId: consumedChallenge.studentId,
        helpdeskProfileId: pass._id,
        expiresAt: { $gt: new Date() },
    });

    if (existingSession) {
        existingSession.tokenHash = tokenHash;
        existingSession.purpose = "TRACK_TICKET";
        existingSession.expiresAt = expiresAt;
        existingSession.revokedAt = new Date();
        await existingSession.save();
    } else {
        await VerificationSession.create(
            [
                {
                    tokenHash,
                    studentId: consumedChallenge.studentId,
                    helpdeskProfileId: pass._id,
                    purpose: "TRACK_TICKET",
                    expiresAt,
                    revokedAt: new Date(),
                },
            ],
        );
    }

    const response = NextResponse.json(
        {
            success: true,
            verified: true,
            message: "OTP verified successfully.",
            expiresIn: SESSION_EXPIRY_MINUTES * 60,
        },
        { status: 200 }
    );

    response.cookies.set({
        name: "helpdesk_session",
        value: sessionToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        // sameSite: "strict",
        // path: "/api/v1/helpdesk",
        expires: expiresAt,
    });

    return response;
};

// POST /api/v1/helpdesk/tickets/track
async function trackTicket(request: NextRequest) {
    await connectDb();

    const sessionToken = request.cookies.get("helpdesk_session")?.value;

    if (!sessionToken) {
        throw new ApiError("UNAUTHORIZED");
    }

    // 2. Hash the cookie token before querying the database.
    const tokenHash = hashSessionToken(sessionToken);

    const session = await VerificationSession.findOne({
        tokenHash,
        purpose: "TRACK_TICKET",
        expiresAt: { $gt: new Date() },
    })
        .select("helpdeskProfileId")
        .lean();

    if (!session) {
        throw new ApiError("UNAUTHORIZED");
    }

    // 3. Parse and validate the requested Ticket ID.
    const body = await request.json();

    const ticketId = body.ticketId?.trim().toUpperCase();

    if (!ticketId || !/^TKT-\d{2}-\d{6}$/.test(ticketId)) {
        throw new ApiError("MISSING_REQUIRED_FIELDS");
    }

    const pass = await Pass.findById(session.helpdeskProfileId)
        .select("_id")
        .lean();

    if (!pass) {
        throw new ApiError("HELPDESK_ID_NOT_FOUND");
    }

    const ticket = await Ticket.findOne({
        ticketId,
        helpdeskProfileId: session.helpdeskProfileId,
    })
        .select(
            "ticketId subject description category priority status createdAt updatedAt attachments"
        )
        .lean();

    if (!ticket) {
        throw new ApiError("TICKET_NOT_FOUND");
    }

    // 4. Fetch only student-visible responses and activities.
    const [responses, activities] = await Promise.all([
        TicketResponse.find({
            ticketObjectId: ticket._id,
            visibility: "STUDENT",
        })
            .select(
                "actorType message visibility attachments createdAt"
            )
            .sort({ createdAt: 1 })
            .lean(),

        TicketActivity.find({
            ticketObjectId: ticket._id,
            visibility: "STUDENT",
        })
            .select(
                "activityType actorType previousStatus newStatus message createdAt"
            )
            .sort({ createdAt: 1 })
            .lean(),
    ]);

    // 5. Return the complete student-safe tracking view.
    return NextResponse.json(
        {
            success: true,
            message: "Detailed ticket information fetched successfully.",
            ticket: {
                ticketId: ticket.ticketId,
                subject: ticket.subject,
                description: ticket.description,
                category: ticket.category,
                priority: ticket.priority,
                status: ticket.status,
                createdAt: ticket.createdAt,
                updatedAt: ticket.updatedAt,
                attachments: ticket.attachments ?? [],
            },
            responses,
            activities,
        },
        { status: 200 }
    );
};

// POST /api/v1/helpdesk/tickets/track
async function shortTrackTicket(request: NextRequest) {
    await connectDb();

    const body = await request.json();

    const ticketId = body.ticketId?.trim().toUpperCase();

    if (!ticketId || !/^TKT-\d{2}-\d{6}$/.test(ticketId)) {
        throw new ApiError("MISSING_REQUIRED_FIELDS");
    }

    const ticket = await Ticket.findOne({
        ticketId,
    })
        .select("ticketId status createdAt updatedAt")
        .lean();

    if (!ticket) {
        throw new ApiError("TICKET_NOT_FOUND");
    }

    const rawStatus = String(ticket.status).toUpperCase();

    const normalizedStatus = statusMap[rawStatus] ?? String(ticket.status).toLowerCase();

    // 6. Return only the fields required by the tracking component.
    return NextResponse.json(
        {
            success: true,
            message: "Ticket status fetched successfully.",
            ticket: {
                ticketId: ticket.ticketId,
                status: normalizedStatus,
                createdAt: ticket.createdAt,
                updatedAt: ticket.updatedAt,
            },
        },
        { status: 200 }
    );
};

const escapeRegex = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/v1/helpdesk/admin/tickets
async function getAdminTickets(request: NextRequest) {
    const user = await isAdminValid(request);

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = Math.max(
        1,
        Number.parseInt(searchParams.get("page") || "1", 10) || 1
    );

    const requestedLimit =
        Number.parseInt(searchParams.get("limit") || "10", 10) || 10;

    const limit = Math.min(100, Math.max(1, requestedLimit));
    const skip = (page - 1) * limit;

    // Filters
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const priority = searchParams.get("priority")?.trim() || "";

    const allowedStatuses = [
        "SUBMITTED",
        "UNDER_REVIEW",
        "IN_PROGRESS",
        "WAITING_FOR_STUDENT",
        "RESOLVED",
        "CLOSED",
        "REJECTED",
    ];

    // Validate supplied filters rather than silently accepting invalid values.
    if (status && !allowedStatuses.includes(status)) {
        throw new ApiError("MISSING_REQUIRED_FIELDS");
    }

    // Keep these values consistent with your Ticket schema.
    const allowedPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

    if (priority && !allowedPriorities.includes(priority)) {
        throw new ApiError("MISSING_REQUIRED_FIELDS");
    }

    // Construct the MongoDB query.
    const filter: Record<string, unknown> = {};

    if (status) {
        filter.status = status;
    }

    if (priority) {
        filter.priority = priority;
    }

    if (search) {
        const searchRegex = new RegExp(escapeRegex(search), "i");

        filter.$or = [
            { ticketId: searchRegex },
            { subject: searchRegex },
            { description: searchRegex },
            { category: searchRegex },
        ];
    }

    await Department.countDocuments();

    // Fetch the tickets and count in parallel.
    const [tickets, total] = await Promise.all([
        Ticket.find(filter)
            .select(
                "ticketId subject description category priority status " +
                "createdAt updatedAt helpdeskProfileId assignedDepartment assignedTo"
            )
            .populate({
                path: "assignedDepartment",
                select: "name code isActive",
            })
            .populate({
                path: "helpdeskProfileId",
                select: "studentId",
                populate: {
                    path: "studentId",
                    select:
                        "firstName lastName email contactNo department year institution",
                },
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),

        Ticket.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
        {
            success: true,
            message: "Admin tickets fetched successfully.",
            data: {
                tickets,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                },
            },
        },
        { status: 200 }
    );
};

// POST /api/v1/helpdesk/admin/tickets/department?ticketId="..."
async function assignTicketDepartment(request: NextRequest) {
    // 1. Authenticate and authorize the admin.
    const user = await isAdminValid(request);

    // 2. Read and validate the ticket ID from the query string.
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get("ticketId")?.trim();

    if (!ticketId) {
        throw new ApiError("MISSING_REQUIRED_FIELDS");
    }

    // 3. Read and validate the department ID from the request body.
    const body = await request.json().catch(() => null);
    const departmentId = body?.departmentId;

    if (
        typeof departmentId !== "string" ||
        !mongoose.Types.ObjectId.isValid(departmentId)
    ) {
        throw new ApiError("MISSING_REQUIRED_FIELDS");
    }

    // 4. Verify that the target department exists and is active.
    const department = await Department.findOne({
        _id: departmentId,
        isActive: true,
    })
        .select("_id name code")
        .lean();

    if (!department) {
        throw new ApiError("NOT_FOUND");
    }

    // 5. Find the ticket.
    const ticket = await Ticket.findOne({ ticketId })
        .select("_id ticketId status assignedDepartment")
        .lean();

    if (!ticket) {
        throw new ApiError("NOT_FOUND");
    }

    // Do not reassign tickets that are already finalized.
    if (["CLOSED", "REJECTED"].includes(ticket.status)) {
        throw new ApiError("MISSING_REQUIRED_FIELDS");
    }

    const previousDepartmentId = ticket.assignedDepartment
        ? String(ticket.assignedDepartment)
        : null;

    // Avoid unnecessary updates and duplicate activity entries.
    if (previousDepartmentId === String(department._id)) {
        return NextResponse.json(
            {
                success: true,
                message: "Ticket is already assigned to this department.",
                data: {
                    ticketId: ticket.ticketId,
                    assignedDepartment: department,
                },
            },
            { status: 200 }
        );
    }

    const activityType = previousDepartmentId
        ? "REASSIGNED"
        : "ASSIGNED";

    // Recheck the ticket inside the transaction to avoid
    // overwriting a concurrent assignment.
    const currentTicket = await Ticket.findOne({
        _id: ticket._id,
    });

    if (!currentTicket) {
        throw new ApiError("NOT_FOUND");
    }

    if (
        ["CLOSED", "REJECTED"].includes(currentTicket.status)
    ) {
        throw new ApiError("MISSING_REQUIRED_FIELDS");
    }

    const currentDepartmentId =
        currentTicket.assignedDepartment
            ? String(currentTicket.assignedDepartment)
            : null;

    if (
        currentDepartmentId === String(department._id)
    ) {
        return;
    }

    currentTicket.assignedDepartment = department._id;

    // A new department assignment should normally return the
    // ticket to its department's review queue.
    if (currentTicket.status === "SUBMITTED") {
        currentTicket.status = "UNDER_REVIEW";
    }

    await currentTicket.save();

    await TicketActivity.create({
        ticketObjectId: currentTicket._id,
        activityType: currentDepartmentId
            ? "REASSIGNED"
            : "ASSIGNED",
        actorType: "ADMIN",
        actorId: user._id,
        previousStatus: ticket.status,
        newStatus: currentTicket.status,
        message: currentDepartmentId
            ? `Ticket reassigned to ${department.name}.`
            : `Ticket assigned to ${department.name}.`,
        visibility: "STAFF",
    });

    // 7. Return the updated assignment.
    const updatedTicket = await Ticket.findOne({ ticketId })
        .select("ticketId status assignedDepartment")
        .populate({
            path: "assignedDepartment",
            select: "name code isActive",
        })
        .lean();

    return NextResponse.json(
        {
            success: true,
            message: "Ticket department assigned successfully.",
            data: {
                ticket: updatedTicket,
            },
        },
        { status: 200 }
    );
};

export {
    createTicket,
    getDepartmentTickets,
    assignTicket,
    getStaffTickets,
    updateStaffTicketStatus,
    shortTrackTicket,
    startTicketTracking,
    confirmTicketTracking,
    trackTicket,
    getStaffTicket,
    getAdminTickets,
    assignTicketDepartment,
};